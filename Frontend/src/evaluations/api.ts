import { api } from '../auth/api';
import type { ApiSuccess } from '../auth/auth.types';

export type EvaluationType = 'COMPANY' | 'LECTURER';

export type EvaluationRecord = {
  id: string; placementId: string; evaluatorId: string; type: EvaluationType; score: number; comment: string | null; submittedAt: string; updatedAt: string;
  evaluator: { id: string; email: string; role: string };
  placement: {
    id: string; status: string;
    student: { id: string; userId: string; studentCode: string; fullName: string; major: string };
    company: { id: string; userId: string; companyName: string };
    internship: { id: string; title: string };
    supervision: { status: string; lecturer: { id: string; userId: string; fullName: string } } | null;
  };
};

export type EvaluationsPage = { items: EvaluationRecord[]; pagination: { page: number; limit: number; total: number; totalPages: number } };
type ListParams = { page?: number; limit?: number; placementId?: string; type?: EvaluationType };

export const evaluationsApi = {
  listMine: (params: ListParams = {}) => api.get<ApiSuccess<EvaluationsPage>>('/evaluations/me', { params }).then((r) => r.data.data),
  create: (body: { placementId: string; score: number; comment?: string }) => api.post<ApiSuccess<EvaluationRecord>>('/evaluations', body).then((r) => r.data.data),
  update: (id: string, body: { score?: number; comment?: string }) => api.patch<ApiSuccess<EvaluationRecord>>(`/evaluations/${id}`, body).then((r) => r.data.data),
  remove: (id: string) => api.delete<ApiSuccess<{ id: string; deleted: boolean }>>(`/evaluations/${id}`).then((r) => r.data.data),
};
