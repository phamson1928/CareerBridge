import { api } from "../auth/api";
import type { ApiSuccess } from "../auth/auth.types";

export type CompanyProfileStatus =
  | "DRAFT"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "SUSPENDED";

export type CompanyChecklistCode =
  | "LEGAL_NAME_MATCH"
  | "REGISTRATION_NUMBER_MATCH"
  | "ADDRESS_CONSISTENT"
  | "CONTACT_REACHABLE"
  | "DOCUMENT_READABLE"
  | "ACCOUNT_EMAIL_VERIFIED";

export const COMPANY_CHECKLIST_DEFINITIONS: Record<CompanyChecklistCode, string> = {
  LEGAL_NAME_MATCH: "Tên pháp lý khớp giấy ĐKDN",
  REGISTRATION_NUMBER_MATCH: "Mã số khớp giấy ĐKDN",
  ADDRESS_CONSISTENT: "Địa chỉ hợp lý / khớp tài liệu",
  CONTACT_REACHABLE: "Người liên hệ / SĐT / email hợp lệ",
  DOCUMENT_READABLE: "Giấy ĐKDN đọc được, đúng loại",
  ACCOUNT_EMAIL_VERIFIED: "Email tài khoản đã xác thực",
};

export const REQUIRED_CHECKLIST_CODES: CompanyChecklistCode[] = [
  "LEGAL_NAME_MATCH",
  "REGISTRATION_NUMBER_MATCH",
  "ADDRESS_CONSISTENT",
  "CONTACT_REACHABLE",
  "DOCUMENT_READABLE",
  "ACCOUNT_EMAIL_VERIFIED",
];

export type CompanyRejectionReasonCode =
  | "MISSING_DOCUMENT"
  | "DOCUMENT_UNCLEAR"
  | "NAME_MISMATCH"
  | "REGISTRATION_MISMATCH"
  | "ADDRESS_MISMATCH"
  | "CONTACT_INVALID"
  | "OTHER";

export const REJECTION_REASON_LABELS: Record<CompanyRejectionReasonCode, string> = {
  MISSING_DOCUMENT: "Thiếu tài liệu bắt buộc",
  DOCUMENT_UNCLEAR: "Tài liệu mờ hoặc không hợp lệ",
  NAME_MISMATCH: "Tên doanh nghiệp không khớp giấy phép",
  REGISTRATION_MISMATCH: "Mã số doanh nghiệp không khớp",
  ADDRESS_MISMATCH: "Địa chỉ hoạt động không xác thực",
  CONTACT_INVALID: "Thông tin người đại diện không hợp lệ",
  OTHER: "Lý do khác",
};

export type CompanySuspensionReasonCode =
  | "POLICY_VIOLATION"
  | "FAKE_INFORMATION"
  | "ABUSIVE_POSTING"
  | "LEGAL_COMPLAINT"
  | "OTHER";

export const SUSPENSION_REASON_LABELS: Record<CompanySuspensionReasonCode, string> = {
  POLICY_VIOLATION: "Vi phạm chính sách nền tảng",
  FAKE_INFORMATION: "Cung cấp thông tin giả mạo",
  ABUSIVE_POSTING: "Đăng tin sai quy định hoặc spam",
  LEGAL_COMPLAINT: "Có khiếu nại pháp lý hoặc tranh chấp",
  OTHER: "Lý do khác",
};

export interface CompanyChecklistItem {
  code: CompanyChecklistCode;
  checked: boolean;
}

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
  rejectionReasonCode: CompanyRejectionReasonCode | null;
  reviewedAt: string | null;
  submittedAt: string | null;
  reviewDueAt: string | null;
  reviewChecklist: CompanyChecklistItem[] | null;
  suspensionReason: string | null;
  suspensionReasonCode: CompanySuspensionReasonCode | null;
  suspendedAt: string | null;
  createdAt: string;
  updatedAt: string;
  isOverdue?: boolean;
  hoursRemaining?: number | null;
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
    page = 1,
    limit = 10,
  ) => {
    const response = await api.get<ApiSuccess<CompanyProfilesPage>>(
      "/companies",
      {
        params: { status, search: search || undefined, page, limit },
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
  approve: async (id: string, checklist: CompanyChecklistItem[]) => {
    const response = await api.post<ApiSuccess<CompanyProfileRecord>>(
      `/companies/${id}/approve`,
      { checklist },
    );
    return response.data.data;
  },
  reject: async (
    id: string,
    dto: { reasonCode: CompanyRejectionReasonCode; reasonDetail: string },
  ) => {
    const response = await api.post<ApiSuccess<CompanyProfileRecord>>(
      `/companies/${id}/reject`,
      dto,
    );
    return response.data.data;
  },
  suspend: async (
    id: string,
    dto: { reasonCode: CompanySuspensionReasonCode; reasonDetail: string },
  ) => {
    const response = await api.post<ApiSuccess<CompanyProfileRecord>>(
      `/companies/${id}/suspend`,
      dto,
    );
    return response.data.data;
  },
  unsuspend: async (id: string, reasonDetail: string) => {
    const response = await api.post<ApiSuccess<CompanyProfileRecord>>(
      `/companies/${id}/unsuspend`,
      { reasonDetail },
    );
    return response.data.data;
  },
};
