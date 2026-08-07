import { api } from '../auth/api';
import type { ApiSuccess } from '../auth/auth.types';
import type { SkillLevel, SkillRecord, SkillsPage, StudentSkillRecord, InternshipSkillRecord, SkillMatchResult } from './types';

export const skillsApi = {
  list: async (params?: { page?: number; limit?: number; search?: string }) =>
    (await api.get<ApiSuccess<SkillsPage>>('/skills', { params })).data.data,
  create: async (name: string) =>
    (await api.post<ApiSuccess<SkillRecord>>('/skills', { name })).data.data,
  update: async (id: string, name: string) =>
    (await api.patch<ApiSuccess<SkillRecord>>(`/skills/${id}`, { name })).data.data,
  remove: async (id: string) =>
    (await api.delete<ApiSuccess<{ deleted: boolean; id: string }>>(`/skills/${id}`)).data.data,
  getStudentMine: async () =>
    (await api.get<ApiSuccess<StudentSkillRecord[]>>('/students/me/skills')).data.data,
  syncStudentMine: async (skills: Array<{ skillId: string; level: SkillLevel }>) =>
    (await api.put<ApiSuccess<StudentSkillRecord[]>>('/students/me/skills', { skills })).data.data,
  getInternship: async (id: string) =>
    (await api.get<ApiSuccess<InternshipSkillRecord[]>>(`/internships/${id}/skills`)).data.data,
  syncInternship: async (id: string, skills: Array<{ skillId: string; isRequired: boolean; weight: number }>) =>
    (await api.put<ApiSuccess<InternshipSkillRecord[]>>(`/internships/${id}/skills`, { skills })).data.data,
  matchMine: async (id: string) =>
    (await api.get<ApiSuccess<SkillMatchResult>>(`/internships/${id}/match/me`)).data.data,
};
