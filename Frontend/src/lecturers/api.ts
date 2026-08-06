import { api } from "../auth/api";
import type { ApiSuccess } from "../auth/auth.types";

export interface LecturerProfileRecord {
  id: string;
  userId: string;
  fullName: string;
  department: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LecturerProfileInput {
  fullName: string;
  department: string;
  title?: string | null;
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
