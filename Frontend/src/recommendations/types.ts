import type { InternshipRecord } from '../internships/api';

export type RecommendationSource =
  | 'AI_ENHANCED'
  | 'DETERMINISTIC_FALLBACK'
  | 'DETERMINISTIC_ONLY';

export type ExplanationStatus =
  | 'AI'
  | 'FALLBACK'
  | 'INSUFFICIENT_PROFILE'
  | 'AI_DISABLED'
  | 'NOT_REQUESTED';

export type ReadinessMissingField =
  | 'SUMMARY'
  | 'SKILLS'
  | 'PROJECTS'
  | 'DESIRED_ROLES'
  | 'LOCATIONS'
  | 'WORK_TYPES';

export interface ProfileReadiness {
  score: number;
  level: 'LOW' | 'MEDIUM' | 'HIGH';
  missingFields: ReadinessMissingField[];
  canUseAiExplanation: boolean;
}

export interface ScoreComponent {
  score: number;
  weight: number;
  applied: boolean;
}

export interface RecommendationExplanation {
  reason: string;
  strengths: string[];
  skillGaps: string[];
  nextSteps: string[];
}

export interface RecommendationItem {
  rank: number;
  internshipId: string;
  overallScore: number;
  skillScore: number;
  meetsRequiredSkills: boolean;
  matchedSkills: Array<{ skillId: string; name: string; level: string }>;
  missingRequiredSkills: Array<{ skillId: string; name: string }>;
  scoreBreakdown: {
    skills: ScoreComponent;
    desiredRole: ScoreComponent;
    major: ScoreComponent;
    location: ScoreComponent;
    workType: ScoreComponent;
    projects: ScoreComponent;
    requiredSkillPenalty: number;
  };
  confidence: { score: number; level: 'LOW' | 'MEDIUM' | 'HIGH' };
  flags: string[];
  matchSummary: { matchedSignals: string[]; missingSignals: string[] };
  internship: InternshipRecord;
  explanationStatus: ExplanationStatus;
  aiExplanation: RecommendationExplanation | null;
}

export interface RecommendationResponse {
  hasRecommendation: boolean;
  generatedAt: string | null;
  source: RecommendationSource | null;
  cacheHit: boolean;
  profileReadiness: ProfileReadiness;
  recommendations: RecommendationItem[];
  emptyReason: string | null;
}

export interface JobPreferences {
  desiredRoles: string[];
  preferredLocations: string[];
  preferredWorkTypes: string[];
  createdAt: string | null;
  updatedAt: string | null;
}
