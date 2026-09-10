import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { RecommendationSource } from '../generated/prisma/client';
import { AiRecommendationService } from './ai-recommendation.service';
import { ProfileReadinessService } from './profile-readiness.service';
import { RecommendationCacheService } from './recommendation-cache.service';
import { RecommendationCandidatesService } from './recommendation-candidates.service';
import { RecommendationScorerService } from './recommendation-scorer.service';
import {
  CachedRecommendationResult,
  ExplanationStatus,
  ProfileReadiness,
  RecommendationExplanation,
  RecommendationResponseItem,
  ScoredRecommendation,
} from './types/recommendation.types';

const MAX_RECOMMENDATIONS = 10;
const AI_CANDIDATE_LIMIT = 3;
const FORCE_REFRESH_COOLDOWN_MS = 10 * 60_000;

@Injectable()
export class RecommendationsService {
  private readonly inFlight = new Map<string, Promise<unknown>>();

  constructor(
    private readonly candidates: RecommendationCandidatesService,
    private readonly scorer: RecommendationScorerService,
    private readonly readiness: ProfileReadinessService,
    private readonly cache: RecommendationCacheService,
    private readonly ai: AiRecommendationService,
  ) {}

  async getCurrent(userId: string) {
    const prepared = await this.prepare(userId);
    const cached = await this.cache.findValid(
      prepared.studentId,
      prepared.fingerprint,
    );
    if (!cached) {
      return {
        hasRecommendation: false,
        generatedAt: null,
        source: null,
        cacheHit: false,
        profileReadiness: prepared.profileReadiness,
        recommendations: [],
        emptyReason: null,
      };
    }
    const response = this.hydrate(cached.result, prepared.scored);
    if (!response) {
      return {
        hasRecommendation: false,
        generatedAt: null,
        source: null,
        cacheHit: false,
        profileReadiness: prepared.profileReadiness,
        recommendations: [],
        emptyReason: null,
      };
    }
    return {
      hasRecommendation: true,
      generatedAt: cached.generatedAt,
      source: cached.source,
      cacheHit: true,
      profileReadiness: prepared.profileReadiness,
      recommendations: response.items,
      emptyReason: response.emptyReason,
    };
  }

  generate(userId: string, force: boolean) {
    const existing = this.inFlight.get(userId);
    if (existing) return existing;
    const pending = this.generateOnce(userId, force).finally(() =>
      this.inFlight.delete(userId),
    );
    this.inFlight.set(userId, pending);
    return pending;
  }

  private async generateOnce(userId: string, force: boolean) {
    const prepared = await this.prepare(userId);
    const cached = await this.cache.findValid(
      prepared.studentId,
      prepared.fingerprint,
    );
    if (cached && !force) {
      const response = this.hydrate(cached.result, prepared.scored);
      if (response)
        return this.response(
          cached.generatedAt,
          cached.source,
          true,
          prepared.profileReadiness,
          response,
        );
    }
    if (force) await this.assertForceRefreshAllowed(prepared.studentId);

    const top = prepared.scored;
    let source: RecommendationSource = RecommendationSource.DETERMINISTIC_ONLY;
    let explanationStatus: ExplanationStatus = this.cache.isAiEnabled()
      ? 'INSUFFICIENT_PROFILE'
      : 'AI_DISABLED';
    let explanations = new Map<string, RecommendationExplanation>();
    if (
      top.length &&
      this.cache.isAiEnabled() &&
      prepared.profileReadiness.canUseAiExplanation
    ) {
      const aiExplanations = await this.ai.explainTopCandidates(
        prepared.student,
        top.slice(0, AI_CANDIDATE_LIMIT),
      );
      if (aiExplanations) {
        source = RecommendationSource.AI_ENHANCED;
        explanationStatus = 'AI';
        explanations = aiExplanations;
      } else {
        source = RecommendationSource.DETERMINISTIC_FALLBACK;
        explanationStatus = 'FALLBACK';
      }
    }

    const result = this.toCacheResult(top, explanationStatus, explanations);
    const stored = await this.cache.upsert({
      studentId: prepared.studentId,
      fingerprint: prepared.fingerprint,
      result,
      source,
    });
    return this.response(
      stored.generatedAt,
      source,
      false,
      prepared.profileReadiness,
      this.hydrate(result, top)!,
    );
  }

  private async prepare(userId: string) {
    const { student, candidates } = await this.candidates.loadForUser(userId);
    const scored = this.scorer
      .scoreAll(student, candidates)
      .slice(0, MAX_RECOMMENDATIONS);
    return {
      studentId: student.id,
      student,
      scored,
      profileReadiness: this.readiness.calculate(student),
      fingerprint: this.cache.createFingerprint(student, candidates),
    };
  }

  private async assertForceRefreshAllowed(studentId: string) {
    const existing = await this.cache.findExisting(studentId);
    if (
      existing &&
      Date.now() - existing.generatedAt.getTime() < FORCE_REFRESH_COOLDOWN_MS
    ) {
      throw new HttpException(
        {
          code: 'RECOMMENDATION_REFRESH_COOLDOWN',
          message: 'Please wait before refreshing recommendations again',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private toCacheResult(
    scored: readonly ScoredRecommendation[],
    topStatus: ExplanationStatus,
    explanations: ReadonlyMap<string, RecommendationExplanation>,
  ): CachedRecommendationResult {
    return {
      version: 1,
      emptyReason: scored.length ? null : 'NO_ELIGIBLE_INTERNSHIPS',
      items: scored.map((item, index) => ({
        rank: index + 1,
        internshipId: item.internshipId,
        overallScore: item.overallScore,
        skillScore: item.skillScore,
        meetsRequiredSkills: item.meetsRequiredSkills,
        matchedSkills: item.matchedSkills,
        missingRequiredSkills: item.missingRequiredSkills,
        scoreBreakdown: item.scoreBreakdown,
        confidence: item.confidence,
        flags: item.flags,
        matchSummary: item.matchSummary,
        explanationStatus:
          index < AI_CANDIDATE_LIMIT ? topStatus : 'NOT_REQUESTED',
        aiExplanation:
          index < AI_CANDIDATE_LIMIT
            ? (explanations.get(item.internshipId) ?? null)
            : null,
      })),
    };
  }

  private hydrate(
    result: CachedRecommendationResult,
    scored: readonly ScoredRecommendation[],
  ) {
    if (result.items.length !== scored.length) return null;
    const internships = new Map(
      scored.map((item) => [item.internshipId, item.internship]),
    );
    const items: RecommendationResponseItem[] = [];
    for (const item of result.items) {
      const internship = internships.get(item.internshipId);
      if (!internship) return null;
      items.push({ ...item, internship });
    }
    return { items, emptyReason: result.emptyReason };
  }

  private response(
    generatedAt: Date,
    source: RecommendationSource,
    cacheHit: boolean,
    profileReadiness: ProfileReadiness,
    result: { items: RecommendationResponseItem[]; emptyReason: string | null },
  ) {
    return {
      hasRecommendation: true,
      generatedAt,
      source,
      cacheHit,
      profileReadiness,
      recommendations: result.items,
      emptyReason: result.emptyReason,
    };
  }
}
