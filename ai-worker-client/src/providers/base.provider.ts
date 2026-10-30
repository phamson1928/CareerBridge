import { AiCandidateRecommendation, InternshipJobInfo } from '../api/types';

export interface AiAnalysisResult {
  aiScore: number;
  recommendation: AiCandidateRecommendation;
  experienceYears?: number;
  extractedSkills: string[];
  matchedSkills: string[];
  missingSkills: string[];
  strengths: string[];
  weaknesses: string[];
  summary: string;
  modelUsed: string;
  rawAnalysis?: Record<string, unknown>;
}

export interface AiProvider {
  readonly name: string;
  readonly modelName: string;
  analyze(cvText: string, jobInfo: InternshipJobInfo): Promise<AiAnalysisResult>;
}
