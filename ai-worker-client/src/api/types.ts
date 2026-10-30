export type AiCandidateRecommendation =
  | 'STRONG_HIRE'
  | 'HIRE'
  | 'POTENTIAL'
  | 'NOT_RECOMMENDED';

export interface RequiredSkill {
  name: string;
  isRequired: boolean;
  weight: number;
}

export interface InternshipJobInfo {
  id: string;
  title: string;
  department: string | null;
  description: string;
  requirements: string | null;
  workType: string | null;
  requiredSkills: RequiredSkill[];
}

export interface AvailableJob {
  jobId: string;
  applicationId: string;
  attempts: number;
  internship: InternshipJobInfo;
  cvDownloadUrl: string;
  cvFileName: string;
  mimeType: string;
}

export type PollJobResponse =
  | { hasJob: false }
  | {
      hasJob: true;
      job: AvailableJob;
    };

export interface CompleteJobPayload {
  aiScore: number;
  recommendation: AiCandidateRecommendation;
  experienceYears?: number;
  extractedSkills?: string[];
  matchedSkills?: string[];
  missingSkills?: string[];
  strengths?: string[];
  weaknesses?: string[];
  summary?: string;
  modelUsed?: string;
  rawAnalysis?: Record<string, unknown>;
}

export interface FailJobPayload {
  errorMessage: string;
}

export interface HeartbeatPayload {
  modelName?: string;
}
