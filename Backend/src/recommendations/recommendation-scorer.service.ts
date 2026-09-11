import { Injectable } from '@nestjs/common';
import { calculateSkillMatch } from '../skills/skill-match.calculator';
import {
  RecommendationCandidate,
  RecommendationScoreComponent,
  RecommendationStudent,
  ScoredRecommendation,
} from './types/recommendation.types';

const STOP_WORDS = new Set([
  'va',
  'và',
  'la',
  'là',
  'cho',
  'voi',
  'với',
  'cua',
  'của',
  'trong',
  'tai',
  'tại',
  'the',
  'and',
  'for',
  'with',
  'from',
  'intern',
  'thuc',
  'tap',
  'thực',
  'tập',
  'developer',
  'nhan',
  'vien',
  'nhân',
  'viên',
  'cong',
  'ty',
  'công',
  'ty',
]);

@Injectable()
export class RecommendationScorerService {
  scoreAll(
    student: RecommendationStudent,
    candidates: readonly RecommendationCandidate[],
  ): ScoredRecommendation[] {
    return candidates
      .map((candidate) => this.score(student, candidate))
      .sort(stableSort);
  }

  private score(
    student: RecommendationStudent,
    internship: RecommendationCandidate,
  ): ScoredRecommendation {
    const skillMatch = calculateSkillMatch(student.skills, internship.skills);
    const skillScore = skillMatch.percentage ?? 50;
    const hasRequirements = skillMatch.hasRequirements;
    const jobText = [
      internship.title,
      internship.department,
      internship.description,
      internship.requirements,
      ...internship.skills.map((skill) => skill.name),
    ]
      .filter(Boolean)
      .join(' ');
    const roleText = [internship.title, internship.department]
      .filter(Boolean)
      .join(' ');
    const desiredRoleApplied = student.preferences.desiredRoles.length > 0;
    const locationApplied = Boolean(
      student.preferences.preferredLocations.length && internship.location,
    );
    const workTypeApplied = Boolean(
      student.preferences.preferredWorkTypes.length && internship.workType,
    );
    const usableProjects = student.projects.filter((project) =>
      Boolean(normalizeText(`${project.title} ${project.description ?? ''}`)),
    );
    const projectApplied = usableProjects.length > 0;

    const components = {
      skills: component(skillScore, 60, true),
      desiredRole: component(
        maxTokenOverlap(student.preferences.desiredRoles, roleText),
        12,
        desiredRoleApplied,
      ),
      major: component(tokenOverlap(student.major, jobText), 8, true),
      location: component(
        preferenceMatch(
          student.preferences.preferredLocations,
          internship.location,
        ),
        7.5,
        locationApplied,
      ),
      workType: component(
        preferenceMatch(
          student.preferences.preferredWorkTypes,
          internship.workType,
        ),
        7.5,
        workTypeApplied,
      ),
      projects: component(
        maxProjectOverlap(usableProjects, jobText),
        5,
        projectApplied,
      ),
    };
    const availableWeight = Object.values(components)
      .filter((item) => item.applied)
      .reduce((sum, item) => sum + item.weight, 0);
    const weightedScore = Object.values(components)
      .filter((item) => item.applied)
      .reduce((sum, item) => sum + item.score * item.weight, 0);
    const requiredSkills = skillMatch.skills.filter(
      (skill) => skill.isRequired,
    );
    const missingRequiredWeight = requiredSkills
      .filter((skill) => !skill.matched)
      .reduce((sum, skill) => sum + skill.weight, 0);
    const totalRequiredWeight = requiredSkills.reduce(
      (sum, skill) => sum + skill.weight,
      0,
    );
    const requiredSkillPenalty = totalRequiredWeight
      ? (missingRequiredWeight / totalRequiredWeight) * 20
      : 0;
    const overallScore = clamp(
      Math.round(weightedScore / availableWeight - requiredSkillPenalty),
    );
    const confidenceScore = Math.round(availableWeight);
    const flags = hasRequirements ? [] : ['LOW_REQUIREMENT_DATA'];

    return {
      internshipId: internship.id,
      overallScore,
      skillScore,
      meetsRequiredSkills: skillMatch.meetsRequiredSkills,
      matchedSkills: skillMatch.skills
        .filter((skill) => skill.matched && skill.studentLevel)
        .map((skill) => ({
          skillId: skill.skillId,
          name: skill.name,
          level: skill.studentLevel!,
        })),
      missingRequiredSkills: skillMatch.missingRequiredSkills,
      scoreBreakdown: {
        ...components,
        requiredSkillPenalty: round(requiredSkillPenalty),
      },
      confidence: {
        score: confidenceScore,
        level: confidenceLevel(confidenceScore),
      },
      flags,
      matchSummary: buildSummary(skillMatch, components, flags),
      internship,
    };
  }
}

function component(
  score: number,
  weight: number,
  applied: boolean,
): RecommendationScoreComponent {
  return { score: clamp(Math.round(score)), weight, applied };
}

function stableSort(left: ScoredRecommendation, right: ScoredRecommendation) {
  if (right.overallScore !== left.overallScore)
    return right.overallScore - left.overallScore;
  if (left.meetsRequiredSkills !== right.meetsRequiredSkills)
    return left.meetsRequiredSkills ? -1 : 1;
  const leftDeadline =
    left.internship.deadline?.getTime() ?? Number.POSITIVE_INFINITY;
  const rightDeadline =
    right.internship.deadline?.getTime() ?? Number.POSITIVE_INFINITY;
  if (leftDeadline !== rightDeadline) return leftDeadline - rightDeadline;
  if (
    right.internship.updatedAt.getTime() !== left.internship.updatedAt.getTime()
  ) {
    return (
      right.internship.updatedAt.getTime() - left.internship.updatedAt.getTime()
    );
  }
  return left.internship.id.localeCompare(right.internship.id);
}

function normalizeText(value: string): string {
  return value
    .toLocaleLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function tokens(value: string): Set<string> {
  return new Set(
    normalizeText(value)
      .split(' ')
      .filter((token) => token.length > 1 && !STOP_WORDS.has(token)),
  );
}

function tokenOverlap(source: string, target: string): number {
  const sourceTokens = tokens(source);
  const targetTokens = tokens(target);
  if (!sourceTokens.size || !targetTokens.size) return 0;
  const matched = [...sourceTokens].filter((token) =>
    targetTokens.has(token),
  ).length;
  return (matched / sourceTokens.size) * 100;
}

function maxTokenOverlap(values: readonly string[], target: string): number {
  return Math.max(0, ...values.map((value) => tokenOverlap(value, target)));
}

function preferenceMatch(
  preferences: readonly string[],
  value: string | null,
): number {
  if (!value) return 0;
  const target = normalizeText(value);
  return preferences.some((preference) => {
    const normalized = normalizeText(preference);
    return (
      normalized &&
      (target === normalized ||
        target.includes(normalized) ||
        normalized.includes(target))
    );
  })
    ? 100
    : 0;
}

function maxProjectOverlap(
  projects: readonly RecommendationStudent['projects'][number][],
  jobText: string,
): number {
  return Math.max(
    0,
    ...projects.map((project) =>
      tokenOverlap(`${project.title} ${project.description ?? ''}`, jobText),
    ),
  );
}

function buildSummary(
  skillMatch: ReturnType<typeof calculateSkillMatch>,
  components: Record<string, RecommendationScoreComponent>,
  flags: string[],
) {
  const matchedSignals: string[] = [];
  const missingSignals: string[] = [];
  if (
    skillMatch.hasRequirements &&
    skillMatch.skills.some((skill) => skill.matched)
  )
    matchedSignals.push('Có kỹ năng phù hợp với vị trí');
  if (components.desiredRole.applied && components.desiredRole.score > 0)
    matchedSignals.push('Phù hợp với vị trí mong muốn');
  if (components.major.score > 0)
    matchedSignals.push('Có liên quan đến ngành học');
  if (components.location.applied && components.location.score === 100)
    matchedSignals.push('Phù hợp địa điểm mong muốn');
  if (components.workType.applied && components.workType.score === 100)
    matchedSignals.push('Phù hợp hình thức làm việc mong muốn');
  if (components.projects.applied && components.projects.score > 0)
    matchedSignals.push('Dự án có tín hiệu liên quan');
  if (skillMatch.missingRequiredSkills.length)
    missingSignals.push(
      `Thiếu kỹ năng bắt buộc: ${skillMatch.missingRequiredSkills.map((skill) => skill.name).join(', ')}`,
    );
  if (flags.includes('LOW_REQUIREMENT_DATA'))
    missingSignals.push('Vị trí chưa cung cấp đủ yêu cầu kỹ năng');
  return { matchedSignals, missingSignals };
}

function confidenceLevel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' {
  if (score >= 80) return 'HIGH';
  if (score >= 65) return 'MEDIUM';
  return 'LOW';
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value));
}
function round(value: number): number {
  return Math.round(value * 100) / 100;
}
