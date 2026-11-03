export type AiScanStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'SKIPPED';

export type AiCandidateRecommendation =
  | 'STRONG_HIRE'
  | 'HIRE'
  | 'POTENTIAL'
  | 'NOT_RECOMMENDED';

export interface AiScanJobRecord {
  id: string;
  status: AiScanStatus;
  aiScore: number | null;
  recommendation: AiCandidateRecommendation | null;
  experienceYears: number | null;
  extractedSkills: string[];
  matchedSkills: string[];
  missingSkills: string[];
  strengths: string[];
  weaknesses: string[];
  summary: string | null;
  attempts: number;
  maxAttempts: number;
  errorDetails: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface CompanyWorkerItem {
  id: string;
  name: string;
  modelName: string | null;
  isActive: boolean;
  lastSeenAt: string | null;
  isOnline: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyWorkerDashboardData {
  autoAiScanEnabled: boolean;
  workers: CompanyWorkerItem[];
  stats: {
    pendingJobs: number;
    completedJobs: number;
    failedJobs: number;
  };
}

export interface CreateWorkerResponse {
  worker: {
    id: string;
    name: string;
    modelName: string | null;
    isActive: boolean;
    createdAt: string;
  };
  token: string;
  message: string;
}
