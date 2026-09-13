import { api } from '../auth/api';
import type { ApiSuccess } from '../auth/auth.types';
import type { InternshipCampaignPhase, SemesterStatus } from '../semesters/types';

export type InternshipStatus = 'DRAFT' | 'OPEN' | 'CLOSED' | 'CANCELLED';

export interface InternshipSkillRecord {
  skillId: string;
  name: string;
  isRequired: boolean;
  weight: number;
}

export interface InternshipRecord {
  id: string;
  companyId: string;
  semesterId: string;
  title: string;
  department: string | null;
  location: string | null;
  workType: string | null;
  stipend: string | null;
  description: string;
  requirements: string | null;
  slots: number;
  filledSlots: number;
  deadline: string | null;
  startDate: string | null;
  endDate: string | null;
  status: InternshipStatus;
  recruitmentStart: string;
  campaignPhase: InternshipCampaignPhase;
  createdAt: string;
  updatedAt: string;
  company: { id: string; companyName: string; logo: string | null; status: string };
  semester: { id: string; name: string; startDate: string; endDate: string; status: SemesterStatus };
  skills: InternshipSkillRecord[];
}

export interface InternshipInput {
  semesterId?: string;
  title: string;
  description: string;
  slots: number;
  department?: string | null;
  location?: string | null;
  workType?: string | null;
  stipend?: string | null;
  requirements?: string | null;
  deadline?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status?: InternshipStatus;
}

export interface InternshipsPage {
  items: InternshipRecord[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export type ListInternshipsParams = { page?: number; limit?: number; search?: string; semesterId?: string; skillId?: string; skillIds?: string[]; status?: InternshipStatus };

const serializeListParams = (params?: ListInternshipsParams) => {
  if (!params) return undefined;
  const { skillIds, ...rest } = params;
  return {
    ...rest,
    ...(skillIds?.length ? { skillIds: skillIds.join(',') } : {}),
  };
};

export const internshipsApi = {
  list: async (params?: ListInternshipsParams) =>
    (await api.get<ApiSuccess<InternshipsPage>>('/internships', { params: serializeListParams(params) })).data.data,
  listMine: async (params?: ListInternshipsParams) =>
    (await api.get<ApiSuccess<InternshipsPage>>('/internships/me', { params: serializeListParams(params) })).data.data,
  get: async (id: string) =>
    (await api.get<ApiSuccess<InternshipRecord>>(`/internships/${id}`)).data.data,
  create: async (input: InternshipInput) =>
    (await api.post<ApiSuccess<InternshipRecord>>('/internships', input)).data.data,
  update: async (id: string, input: Partial<InternshipInput>) =>
    (await api.patch<ApiSuccess<InternshipRecord>>(`/internships/${id}`, input)).data.data,
  remove: async (id: string) =>
    (await api.delete<ApiSuccess<{ deleted: boolean; id: string }>>(`/internships/${id}`)).data.data,
};
