import { api } from "../auth/api";
import type { ApiSuccess } from "../auth/auth.types";

export type CompanyProfileStatus =
  | "DRAFT"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "SUSPENDED";

export interface CompanyProfileRecord {
  id: string;
  userId: string;
  companyName: string;
  businessRegistrationNumber: string | null;
  contactPersonName: string | null;
  contactPhone: string | null;
  tagline: string | null;
  description: string | null;
  industry: string | null;
  website: string | null;
  address: string | null;
  logo: string | null;
  contactEmail: string | null;
  registrationDocumentFileId: string | null;
  status: CompanyProfileStatus;
  rejectionReason: string | null;
  reviewedAt: string | null;
  submittedAt: string | null;
  suspensionReason: string | null;
  suspendedAt: string | null;
  createdAt: string;
  updatedAt: string;
  user?: { email: string; emailVerifiedAt: string | null };
  reviewedBy?: { email: string } | null;
  registrationDocument?: {
    id: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    createdAt: string;
  } | null;
}

export interface CompanyProfileInput {
  companyName: string;
  businessRegistrationNumber?: string | null;
  contactPersonName?: string | null;
  contactPhone?: string | null;
  tagline?: string | null;
  description?: string | null;
  industry?: string | null;
  website?: string | null;
  address?: string | null;
  logo?: string | null;
  contactEmail?: string | null;
  registrationDocumentFileId?: string | null;
}

export interface CompanyProfilesPage {
  items: CompanyProfileRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const companiesApi = {
  getMine: async () => {
    const response =
      await api.get<ApiSuccess<CompanyProfileRecord>>("/companies/me");
    return response.data.data;
  },
  createMine: async (input: CompanyProfileInput) => {
    const response = await api.post<ApiSuccess<CompanyProfileRecord>>(
      "/companies/me",
      input,
    );
    return response.data.data;
  },
  updateMine: async (input: CompanyProfileInput) => {
    const response = await api.patch<ApiSuccess<CompanyProfileRecord>>(
      "/companies/me",
      input,
    );
    return response.data.data;
  },
  submitVerification: async () => {
    const response = await api.post<ApiSuccess<CompanyProfileRecord>>(
      "/companies/me/submit-verification",
    );
    return response.data.data;
  },
  list: async (
    status?: CompanyProfileStatus,
    search?: string,
  ) => {
    const response = await api.get<ApiSuccess<CompanyProfilesPage>>(
      "/companies",
      {
        params: { status, search: search || undefined, page: 1, limit: 50 },
      },
    );
    return response.data.data;
  },
  getById: async (id: string) => {
    const response = await api.get<ApiSuccess<CompanyProfileRecord>>(
      `/companies/${id}`,
    );
    return response.data.data;
  },
  approve: async (id: string) => {
    const response = await api.post<ApiSuccess<CompanyProfileRecord>>(
      `/companies/${id}/approve`,
    );
    return response.data.data;
  },
  reject: async (id: string, reason: string) => {
    const response = await api.post<ApiSuccess<CompanyProfileRecord>>(
      `/companies/${id}/reject`,
      { reason },
    );
    return response.data.data;
  },
  suspend: async (id: string, reason: string) => {
    const response = await api.post<ApiSuccess<CompanyProfileRecord>>(
      `/companies/${id}/suspend`,
      { reason },
    );
    return response.data.data;
  },
};
