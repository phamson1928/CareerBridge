import { api } from '../auth/api';
import type { ApiSuccess } from '../auth/auth.types';
import type {
  FacultyInput,
  FacultyOption,
  FacultyRecord,
  MajorInput,
  MajorOption,
  MajorRecord,
  PaginatedResult,
} from './types';

export const facultiesApi = {
  async list(params?: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
  }) {
    const response = await api.get<ApiSuccess<PaginatedResult<FacultyRecord>>>(
      '/faculties',
      { params },
    );
    return response.data.data;
  },

  async listOptions(params?: { search?: string; includeInactive?: boolean }) {
    const response = await api.get<ApiSuccess<{ items: FacultyOption[] }>>(
      '/faculties/options',
      { params },
    );
    return response.data.data;
  },

  async getById(id: string) {
    const response = await api.get<ApiSuccess<FacultyRecord>>(
      `/faculties/${id}`,
    );
    return response.data.data;
  },

  async create(input: FacultyInput) {
    const response = await api.post<ApiSuccess<FacultyRecord>>(
      '/faculties',
      input,
    );
    return response.data.data;
  },

  async update(id: string, input: Partial<FacultyInput>) {
    const response = await api.patch<ApiSuccess<FacultyRecord>>(
      `/faculties/${id}`,
      input,
    );
    return response.data.data;
  },

  async updateActive(id: string, isActive: boolean) {
    const response = await api.patch<ApiSuccess<FacultyRecord>>(
      `/faculties/${id}/active`,
      { isActive },
    );
    return response.data.data;
  },

  async remove(id: string) {
    const response = await api.delete<
      ApiSuccess<{ deleted: boolean; id: string }>
    >(`/faculties/${id}`);
    return response.data.data;
  },
};

export const majorsApi = {
  async list(params?: {
    page?: number;
    limit?: number;
    search?: string;
    facultyId?: string;
    isActive?: boolean;
  }) {
    const response = await api.get<ApiSuccess<PaginatedResult<MajorRecord>>>(
      '/majors',
      { params },
    );
    return response.data.data;
  },

  async listOptions(params?: {
    facultyId?: string;
    search?: string;
    includeInactive?: boolean;
  }) {
    const response = await api.get<ApiSuccess<{ items: MajorOption[] }>>(
      '/majors/options',
      { params },
    );
    return response.data.data;
  },

  async getById(id: string) {
    const response = await api.get<ApiSuccess<MajorRecord>>(`/majors/${id}`);
    return response.data.data;
  },

  async create(input: MajorInput) {
    const response = await api.post<ApiSuccess<MajorRecord>>('/majors', input);
    return response.data.data;
  },

  async update(id: string, input: Partial<MajorInput>) {
    const response = await api.patch<ApiSuccess<MajorRecord>>(
      `/majors/${id}`,
      input,
    );
    return response.data.data;
  },

  async updateActive(id: string, isActive: boolean) {
    const response = await api.patch<ApiSuccess<MajorRecord>>(
      `/majors/${id}/active`,
      { isActive },
    );
    return response.data.data;
  },

  async remove(id: string) {
    const response = await api.delete<
      ApiSuccess<{ deleted: boolean; id: string }>
    >(`/majors/${id}`);
    return response.data.data;
  },
};
