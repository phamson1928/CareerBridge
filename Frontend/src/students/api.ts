import { api } from "../auth/api";
import type { ApiSuccess } from "../auth/auth.types";
import type { JobPreferences } from "../recommendations/types";

export interface StudentProfileRecord {
  id: string;
  userId: string;
  studentCode: string;
  fullName: string;
  major: string;
  phone: string | null;
  summary: string | null;
  gpa: number | null;
  cvFileId: string | null;
  createdAt: string;
  updatedAt: string;
  user: { email: string };
  cvFile: {
    id: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    createdAt: string;
  } | null;
  skills: {
    skillId: string;
    name: string;
    level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";
  }[];
  projects: StudentProjectRecord[];
}

export interface StudentProjectRecord {
  id: string;
  studentId: string;
  title: string;
  description: string | null;
  repositoryUrl: string | null;
  demoUrl: string | null;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StudentProjectInput {
  title: string;
  description?: string | null;
  repositoryUrl?: string | null;
  demoUrl?: string | null;
  startedAt?: string | null;
  endedAt?: string | null;
}

export interface StudentProfileInput {
  studentCode: string;
  fullName: string;
  major: string;
  phone?: string | null;
  summary?: string | null;
  gpa?: number | null;
  cvFileId?: string | null;
}

export const studentsApi = {
  getMine: async () => {
    const response =
      await api.get<ApiSuccess<StudentProfileRecord>>("/students/me");
    return response.data.data;
  },
  createMine: async (input: StudentProfileInput) => {
    const response = await api.post<ApiSuccess<StudentProfileRecord>>(
      "/students/me",
      input,
    );
    return response.data.data;
  },
  updateMine: async (input: Partial<StudentProfileInput>) => {
    const response = await api.patch<ApiSuccess<StudentProfileRecord>>(
      "/students/me",
      input,
    );
    return response.data.data;
  },
  removeMine: async () => {
    await api.delete("/students/me");
  },
  getJobPreferences: async () => {
    const response = await api.get<ApiSuccess<JobPreferences>>(
      "/students/me/job-preferences",
    );
    return response.data.data;
  },
  updateJobPreferences: async (input: Pick<JobPreferences, "desiredRoles" | "preferredLocations" | "preferredWorkTypes">) => {
    const response = await api.put<ApiSuccess<JobPreferences>>(
      "/students/me/job-preferences",
      input,
    );
    return response.data.data;
  },
  createProject: async (input: StudentProjectInput) => {
    const response = await api.post<ApiSuccess<StudentProjectRecord>>(
      "/students/me/projects",
      input,
    );
    return response.data.data;
  },
  updateProject: async (id: string, input: Partial<StudentProjectInput>) => {
    const response = await api.patch<ApiSuccess<StudentProjectRecord>>(
      `/students/me/projects/${id}`,
      input,
    );
    return response.data.data;
  },
  removeProject: async (id: string) => {
    await api.delete(`/students/me/projects/${id}`);
  },
};
