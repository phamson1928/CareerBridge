import { api } from "../auth/api";
import type { ApiSuccess } from "../auth/auth.types";

export interface LecturerFacultyRef {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
}

export interface LecturerProfileRecord {
  id: string;
  userId: string;
  fullName: string;
  department: string;
  facultyId: string | null;
  faculty?: LecturerFacultyRef | null;
  title: string | null;
  avatarFileId: string | null;
  createdAt: string;
  updatedAt: string;
  avatarFile: {
    id: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    createdAt: string;
  } | null;
}

export interface LecturerProfileInput {
  fullName: string;
  facultyId?: string;
  department?: string;
  title?: string | null;
  avatarFileId?: string | null;
}

export const lecturersApi = {
  getMine: async () => {
    const response =
      await api.get<ApiSuccess<LecturerProfileRecord>>("/lecturers/me");
    return response.data.data;
  },
  createMine: async (input: LecturerProfileInput) => {
    const response = await api.post<ApiSuccess<LecturerProfileRecord>>(
      "/lecturers/me",
      input,
    );
    return response.data.data;
  },
  updateMine: async (input: Partial<LecturerProfileInput>) => {
    const response = await api.patch<ApiSuccess<LecturerProfileRecord>>(
      "/lecturers/me",
      input,
    );
    return response.data.data;
  },
  removeMine: async () => {
    await api.delete("/lecturers/me");
  },
};
