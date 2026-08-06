import { api } from "../auth/api";
import type { ApiSuccess } from "../auth/auth.types";

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
  cvFile: {
    id: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    createdAt: string;
  } | null;
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
};
