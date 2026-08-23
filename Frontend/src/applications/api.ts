import { api } from '../auth/api';
import type { ApiSuccess } from '../auth/auth.types';

export type ApplicationStatus =
  | 'PENDING'
  | 'REVIEWING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'WITHDRAWN';

export interface ApplicationRecord {
  id: string;
  studentId: string;
  internshipId: string;
  coverLetter: string | null;
  cvFileId: string | null;
  matchScore: number | null;
  status: ApplicationStatus;
  companyFeedback: string | null;
  appliedAt: string;
  acceptedAt: string | null;
  rejectedAt: string | null;
  withdrawnAt: string | null;
  updatedAt: string;
  student: {
    id: string;
    userId: string;
    studentCode: string;
    fullName: string;
    major: string;
  };
  internship: {
    id: string;
    title: string;
    company: { id: string; companyName: string; userId: string };
  };
  placement: { id: string; status: string } | null;
}

export interface ApplicationsPage {
  items: ApplicationRecord[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

type ListParams = { page?: number; limit?: number; status?: ApplicationStatus };

export const applicationsApi = {
  list: async (params?: ListParams) =>
    (await api.get<ApiSuccess<ApplicationsPage>>('/applications', { params })).data.data,
  listMine: async (params?: ListParams) =>
    (await api.get<ApiSuccess<ApplicationsPage>>('/applications/me', { params })).data.data,
  create: async (input: {
    internshipId: string;
    coverLetter: string;
    cvFileId: string;
  }) => (await api.post<ApiSuccess<ApplicationRecord>>('/applications', input)).data.data,
  updateStatus: async (
    id: string,
    input: { status: ApplicationStatus; companyFeedback?: string },
  ) =>
    (await api.patch<ApiSuccess<ApplicationRecord>>(`/applications/${id}/status`, input))
      .data.data,
};
