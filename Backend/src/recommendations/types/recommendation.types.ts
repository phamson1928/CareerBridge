import {
  CompanyStatus,
  InternshipStatus,
  SemesterStatus,
  SkillLevel,
} from '../../generated/prisma/client';
import { InternshipSkillForMatch } from '../../skills/skill-match.calculator';

export type RecommendationStudent = {
  id: string;
  major: string;
  summary: string | null;
  skills: Array<{ skillId: string; level: SkillLevel; name: string }>;
  projects: Array<{
    id: string;
    title: string;
    description: string | null;
    updatedAt: Date;
  }>;
  preferences: {
    desiredRoles: string[];
    preferredLocations: string[];
    preferredWorkTypes: string[];
  };
};

export type RecommendationCandidate = {
  id: string;
  companyId: string;
  semesterId: string;
  title: string;
  department: string | null;
  location: string | null;
  workType: string | null;
  stipend: string | null;
  description: string;
  requirements: string | null;
  deadline: Date | null;
  startDate: Date | null;
  endDate: Date | null;
  slots: number;
  filledSlots: number;
  status: InternshipStatus;
  createdAt: Date;
  updatedAt: Date;
  skills: InternshipSkillForMatch[];
  company: {
    id: string;
    companyName: string;
    logo: string | null;
    status: CompanyStatus;
  };
  semester: {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
    status: SemesterStatus;
  };
};

export type RecommendationScoreComponent = {
  score: number;
  weight: number;
  applied: boolean;
};

export type ScoredRecommendation = {
  internshipId: string;
  overallScore: number;
  skillScore: number;
  meetsRequiredSkills: boolean;
  matchedSkills: Array<{ skillId: string; name: string; level: SkillLevel }>;
  missingRequiredSkills: Array<{ skillId: string; name: string }>;
  scoreBreakdown: {
    skills: RecommendationScoreComponent;
    desiredRole: RecommendationScoreComponent;
    major: RecommendationScoreComponent;
    location: RecommendationScoreComponent;
    workType: RecommendationScoreComponent;
    projects: RecommendationScoreComponent;
    requiredSkillPenalty: number;
  };
  confidence: { score: number; level: 'LOW' | 'MEDIUM' | 'HIGH' };
  flags: string[];
  matchSummary: { matchedSignals: string[]; missingSignals: string[] };
  internship: RecommendationCandidate;
};

export type RecommendationExplanation = {
  reason: string;
  strengths: string[];
  skillGaps: string[];
  nextSteps: string[];
};

export type ExplanationStatus =
  'AI' | 'FALLBACK' | 'INSUFFICIENT_PROFILE' | 'AI_DISABLED' | 'NOT_REQUESTED';

export type ProfileReadiness = {
  score: number;
  level: 'LOW' | 'MEDIUM' | 'HIGH';
  missingFields: Array<
    | 'SUMMARY'
    | 'SKILLS'
    | 'PROJECTS'
    | 'DESIRED_ROLES'
    | 'LOCATIONS'
    | 'WORK_TYPES'
  >;
  canUseAiExplanation: boolean;
};

export type RecommendationResponseItem = Omit<
  ScoredRecommendation,
  'internship'
> & {
  rank: number;
  internship: RecommendationCandidate;
  explanationStatus: ExplanationStatus;
  aiExplanation: RecommendationExplanation | null;
};

export type CachedRecommendationResult = {
  version: 1;
  emptyReason: string | null;
  items: Array<Omit<RecommendationResponseItem, 'internship'>>;
};
