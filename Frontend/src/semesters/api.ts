import { api } from '../auth/api';
import type { ApiSuccess } from '../auth/auth.types';
import type {
  ListSemestersParams,
  SemesterInput,
  SemesterPage,
  SemesterRecord,
  SemesterStatus,
} from './types';

export const semestersApi = {
  async list(params?: ListSemestersParams) {
    const response = await api.get<ApiSuccess<SemesterPage>>('/semesters', {
      params,
    });
    return response.data.data;
  },

  async getById(id: string) {
    const response = await api.get<ApiSuccess<SemesterRecord>>(
      `/semesters/${id}`,
    );
    return response.data.data;
  },

  async create(input: SemesterInput) {
    const response = await api.post<ApiSuccess<SemesterRecord>>(
      '/semesters',
      input,
    );
    return response.data.data;
  },

  async update(id: string, input: Partial<SemesterInput>) {
    const response = await api.patch<ApiSuccess<SemesterRecord>>(
      `/semesters/${id}`,
      input,
    );
    return response.data.data;
  },

  async updateStatus(id: string, status: SemesterStatus) {
    const response = await api.patch<ApiSuccess<SemesterRecord>>(
      `/semesters/${id}/status`,
      { status },
    );
    return response.data.data;
  },

  async remove(id: string) {
    const response = await api.delete<ApiSuccess<{ deleted: boolean; id: string }>>(
      `/semesters/${id}`,
    );
    return response.data.data;
  },
};
