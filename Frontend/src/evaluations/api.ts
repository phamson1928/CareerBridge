import { api } from '../auth/api';
import type { ApiSuccess } from '../auth/auth.types';

export type EvaluationType = 'COMPANY' | 'LECTURER';

export interface EvaluationCriteria {
  // Company criteria
  attitudeScore?: number;
  technicalScore?: number;
  resultScore?: number;
  // Lecturer criteria
  processScore?: number;
  finalReportScore?: number;
  complianceScore?: number;
}

export type EvaluationRecord = {
  id: string;
  placementId: string;
  evaluatorId: string;
  type: EvaluationType;
  score: number;
  criteria?: EvaluationCriteria | null;
  comment: string | null;
  certificateFileId?: string | null;
  certificateFile?: {
    id: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    createdAt: string;
  } | null;
  submittedAt: string;
  updatedAt: string;
  evaluator: { id: string; email: string; role: string };
  placement: {
    id: string;
    status: string;
    academicStatus?: string;
    startDate?: string | null;
    endDate?: string | null;
    semester?: {
      id: string;
      name?: string;
      status: string;
      startDate: string;
      endDate: string;
    };
    student: {
      id: string;
      userId: string;
      studentCode: string;
      fullName: string;
      major: string;
    };
    company: {
      id: string;
      userId: string;
      companyName: string;
      address?: string | null;
      contactPersonName?: string | null;
    };
    internship: {
      id: string;
      title: string;
      department?: string | null;
      location?: string | null;
    };
    supervision: {
      status: string;
      lecturer: {
        id: string;
        userId: string;
        fullName: string;
        department?: string;
        title?: string | null;
      };
    } | null;
  };
};

export type EvaluationsPage = {
  items: EvaluationRecord[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};
type ListParams = {
  page?: number;
  limit?: number;
  placementId?: string;
  type?: EvaluationType;
};

export interface CreateEvaluationInput {
  placementId: string;
  score: number;
  criteria?: EvaluationCriteria;
  comment?: string;
  certificateFileId?: string;
}

export interface UpdateEvaluationInput {
  score?: number;
  criteria?: EvaluationCriteria;
  comment?: string;
  certificateFileId?: string | null;
}

export const evaluationsApi = {
  listMine: (params: ListParams = {}) =>
    api
      .get<ApiSuccess<EvaluationsPage>>('/evaluations/me', { params })
      .then((r) => r.data.data),
  create: (body: CreateEvaluationInput) =>
    api
      .post<ApiSuccess<EvaluationRecord>>('/evaluations', body)
      .then((r) => r.data.data),
  update: (id: string, body: UpdateEvaluationInput) =>
    api
      .patch<ApiSuccess<EvaluationRecord>>(`/evaluations/${id}`, body)
      .then((r) => r.data.data),
  remove: (id: string) =>
    api
      .delete<ApiSuccess<{ id: string; deleted: boolean }>>(`/evaluations/${id}`)
      .then((r) => r.data.data),
};
