import { api } from '../auth/api';
import type { LecturerOption, SupervisionPage, SupervisionRecord } from './types';

export interface SupervisionListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  lecturerId?: string;
  placementStatus?: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  facultyId?: string;
  majorId?: string;
}

export const supervisionsApi = {
  async list(params: SupervisionListParams = {}) {
    const response = await api.get<{ data: SupervisionPage }>('/supervisions', { params });
    return response.data.data;
  },
  async listMine() {
    const response = await api.get<{ data: { items: SupervisionRecord[] } }>('/supervisions/me');
    return response.data.data;
  },
  async lecturerOptions(params?: string | { search?: string; facultyId?: string }) {
    const query =
      typeof params === 'string'
        ? params
          ? { search: params }
          : undefined
        : params;
    const response = await api.get<{ data: LecturerOption[] }>('/supervisions/lecturer-options', {
      params: query,
    });
    return response.data.data;
  },
  async assign(placementId: string, lecturerId: string) {
    const response = await api.post<{ data: SupervisionRecord }>('/supervisions', { placementId, lecturerId });
    return response.data.data;
  },
  async reassign(id: string, lecturerId: string) {
    const response = await api.patch<{ data: SupervisionRecord }>(`/supervisions/${id}`, { lecturerId });
    return response.data.data;
  },
  async cancel(id: string) {
    const response = await api.patch<{ data: SupervisionRecord }>(`/supervisions/${id}/status`, { status: 'CANCELLED' });
    return response.data.data;
  },
};
