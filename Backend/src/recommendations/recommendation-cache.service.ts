import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'node:crypto';
import { Prisma, RecommendationSource } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CachedRecommendationResult,
  RecommendationCandidate,
  RecommendationStudent,
} from './types/recommendation.types';

const SCORING_VERSION = 'recommendation-scoring-v1';
const PROMPT_VERSION = 'recommendation-explanation-v1';

@Injectable()
export class RecommendationCacheService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  createFingerprint(
    student: RecommendationStudent,
    candidates: readonly RecommendationCandidate[],
  ) {
    const payload = {
      scoringVersion: SCORING_VERSION,
      promptVersion: PROMPT_VERSION,
      ai: { enabled: this.isAiEnabled(), model: this.getModel() },
      student: {
        major: student.major,
        summary: student.summary?.trim() ?? null,
        skills: [...student.skills]
          .sort(by('skillId'))
          .map(({ skillId, level }) => ({ skillId, level })),
        projects: [...student.projects].sort(by('id')).map((project) => ({
          id: project.id,
          title: project.title,
          description: project.description,
          updatedAt: project.updatedAt.toISOString(),
        })),
        preferences: {
          desiredRoles: normalized(student.preferences.desiredRoles),
          preferredLocations: normalized(
            student.preferences.preferredLocations,
          ),
          preferredWorkTypes: normalized(
            student.preferences.preferredWorkTypes,
          ),
        },
      },
      candidates: [...candidates].sort(by('id')).map((internship) => ({
        id: internship.id,
        status: internship.status,
        title: internship.title,
        department: internship.department,
        location: internship.location,
        workType: internship.workType,
        description: internship.description,
        requirements: internship.requirements,
        slots: internship.slots,
        filledSlots: internship.filledSlots,
        deadline: internship.deadline?.toISOString() ?? null,
        updatedAt: internship.updatedAt.toISOString(),
        skills: [...internship.skills].sort(by('skillId')).map((skill) => ({
          skillId: skill.skillId,
          name: skill.name,
          isRequired: skill.isRequired,
          weight: skill.weight,
        })),
      })),
    };
    return createHash('sha256')
      .update(JSON.stringify(canonicalize(payload)))
      .digest('hex');
  }

  async findValid(studentId: string, fingerprint: string) {
    const cache = await this.prisma.internshipRecommendationCache.findUnique({
      where: { studentId },
    });
    if (
      !cache ||
      cache.fingerprint !== fingerprint ||
      cache.expiresAt <= new Date()
    )
      return null;
    const result = parseCacheResult(cache.result);
    return result ? { ...cache, result } : null;
  }

  findExisting(studentId: string) {
    return this.prisma.internshipRecommendationCache.findUnique({
      where: { studentId },
    });
  }

  async upsert(input: {
    studentId: string;
    fingerprint: string;
    result: CachedRecommendationResult;
    source: RecommendationSource;
  }) {
    const generatedAt = new Date();
    const ttlMinutes =
      input.source === RecommendationSource.DETERMINISTIC_FALLBACK
        ? 15
        : this.config.getOrThrow<number>('AI_RECOMMENDATION_CACHE_TTL_MINUTES');
    const expiresAt = new Date(generatedAt.getTime() + ttlMinutes * 60_000);
    return this.prisma.internshipRecommendationCache.upsert({
      where: { studentId: input.studentId },
      create: {
        ...input,
        result: input.result,
        model:
          input.source === RecommendationSource.AI_ENHANCED
            ? this.getModel()
            : null,
        generatedAt,
        expiresAt,
      },
      update: {
        fingerprint: input.fingerprint,
        result: input.result,
        source: input.source,
        model:
          input.source === RecommendationSource.AI_ENHANCED
            ? this.getModel()
            : null,
        generatedAt,
        expiresAt,
      },
    });
  }

  isAiEnabled() {
    return this.config.getOrThrow<boolean>('AI_RECOMMENDATIONS_ENABLED');
  }
  getModel() {
    return this.config.getOrThrow<string>('AI_RECOMMENDATION_MODEL');
  }
}

function normalized(values: readonly string[]) {
  return values.map((value) => value.trim().toLocaleLowerCase()).sort();
}
function by<TKey extends string>(key: TKey) {
  return <T extends Record<TKey, string>>(left: T, right: T) =>
    left[key].localeCompare(right[key]);
}
function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, canonicalize(item)]),
    );
  return value;
}
function parseCacheResult(
  value: Prisma.JsonValue,
): CachedRecommendationResult | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const result = value as unknown as {
    version?: unknown;
    emptyReason?: unknown;
    items?: unknown;
  };
  if (
    result.version !== 1 ||
    !Array.isArray(result.items) ||
    !(typeof result.emptyReason === 'string' || result.emptyReason === null)
  )
    return null;
  if (
    !result.items.every(
      (item) =>
        item &&
        typeof item === 'object' &&
        !Array.isArray(item) &&
        typeof (item as { internshipId?: unknown }).internshipId === 'string',
    )
  )
    return null;
  return result as CachedRecommendationResult;
}
