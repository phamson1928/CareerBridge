import { api } from '../auth/api';
import type { ApiSuccess } from '../auth/auth.types';
import type { ReportRecord, ReportsPage, ReportStatus } from './types';

type ListParams = { page?: number; limit?: number; status?: ReportStatus; placementId?: string };
export const reportsApi = {
  create: (body: { placementId: string; week: number; content: string; title?: string; fileId?: string }) => api.post<ApiSuccess<ReportRecord>>('/reports', body).then(r => r.data.data),
  mine: (params: ListParams = {}) => api.get<ApiSuccess<ReportsPage>>('/reports/me', { params }).then(r => r.data.data),
  supervised: (params: ListParams = {}) => api.get<ApiSuccess<ReportsPage>>('/reports/supervised', { params }).then(r => r.data.data),
  update: (id: string, body: { title?: string; content?: string; fileId?: string | null }) => api.patch<ApiSuccess<ReportRecord>>(`/reports/${id}`, body).then(r => r.data.data),
  submit: (id: string) => api.post<ApiSuccess<ReportRecord>>(`/reports/${id}/submit`).then(r => r.data.data),
  review: (id: string, body: { status: 'APPROVED' | 'REJECTED'; feedback?: string }) => api.post<ApiSuccess<ReportRecord>>(`/reports/${id}/review`, body).then(r => r.data.data),
  downloadUrl: (fileId: string) => api.get<ApiSuccess<{ downloadUrl: string }>>(`/files/${fileId}/download-url`).then(r => r.data.data.downloadUrl),
};
