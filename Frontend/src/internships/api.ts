import { api } from '../auth/api';
import type { ApiSuccess } from '../auth/auth.types';
import type { InternshipCampaignPhase, SemesterStatus } from '../semesters/types';

export type InternshipStatus = 'DRAFT' | 'OPEN' | 'CLOSED' | 'CANCELLED' | 'REJECTED';

export type InternshipModerationReasonCode =
  | 'POLICY_VIOLATION'
  | 'MISLEADING_INFO'
  | 'UNAUTHORIZED_FEE'
  | 'INAPPROPRIATE_CONTENT'
  | 'OUTSIDE_MAJOR_SCOPE'
  | 'OTHER';

export type InternshipReportReasonCode =
  | 'FRAUD_SCAM'
  | 'FEE_CHARGED'
  | 'MISLEADING_DESCRIPTION'
  | 'UNPROFESSIONAL_BEHAVIOR'
  | 'OTHER';

export type InternshipReportStatus = 'PENDING' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED';

export const MODERATION_REASON_LABELS: Record<InternshipModerationReasonCode, string> = {
  POLICY_VIOLATION: 'Vi phạm quy định / chính sách thực tập của Nhà trường',
  MISLEADING_INFO: 'Mô tả công việc không đúng thực tế, thông tin sai lệch',
  UNAUTHORIZED_FEE: 'Yêu cầu ứng viên nộp tiền cọc / thu phí trái quy định',
  INAPPROPRIATE_CONTENT: 'Nội dung phản cảm, mô hình đa cấp hoặc không phù hợp',
  OUTSIDE_MAJOR_SCOPE: 'Vị trí không thuộc phạm vi chuyên ngành đào tạo',
  OTHER: 'Lý do khác',
};

export const REPORT_REASON_LABELS: Record<InternshipReportReasonCode, string> = {
  FRAUD_SCAM: 'Dấu hiệu lừa đảo, đa cấp, giả mạo doanh nghiệp',
  FEE_CHARGED: 'Bị yêu cầu đóng tiền / đặt cọc / mua đồng phục, khóa học',
  MISLEADING_DESCRIPTION: 'Công việc thực tế khác xa mô tả trên bài đăng',
  UNPROFESSIONAL_BEHAVIOR: 'Người phỏng vấn / DN có hành vi xúc phạm, quấy rối',
  OTHER: 'Vấn đề vi phạm khác',
};

export const REPORT_STATUS_LABELS: Record<InternshipReportStatus, string> = {
  PENDING: 'Chờ xử lý',
  INVESTIGATING: 'Đang xác minh',
  RESOLVED: 'Đã giải quyết',
  DISMISSED: 'Bác bỏ / Không vi phạm',
};

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
  viewCount?: number;
  uniqueViewerCount?: number;
  sourceTemplateId?: string | null;
  sourceInternshipId?: string | null;
  deadline: string | null;
  startDate: string | null;
  endDate: string | null;
  status: InternshipStatus;
  moderationReasonCode?: InternshipModerationReasonCode | null;
  moderationReason?: string | null;
  moderatedById?: string | null;
  moderatedAt?: string | null;
  recruitmentStart: string;
  campaignPhase: InternshipCampaignPhase;
  createdAt: string;
  updatedAt: string;
  company: {
    id: string;
    companyName: string;
    logo: string | null;
    status: string;
    address?: string | null;
    contactEmail?: string | null;
    contactPhone?: string | null;
    taxCode?: string | null;
    website?: string | null;
  };
  semester: { id: string; name: string; startDate: string; endDate: string; status: SemesterStatus };
  skills: InternshipSkillRecord[];
  warnings?: string[];
  _count?: {
    applications: number;
    reports: number;
  };
  moderatedBy?: { id: string; email: string; fullName?: string } | null;
  reports?: InternshipReportRecord[];
}

export interface InternshipReportRecord {
  id: string;
  internshipId: string;
  studentId: string;
  reasonCode: InternshipReportReasonCode;
  reasonDetail: string | null;
  status: InternshipReportStatus;
  reviewedById: string | null;
  reviewedAt: string | null;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
  student?: {
    id: string;
    fullName: string;
    studentCode: string;
    major?: string;
    email?: string;
    phone?: string | null;
  };
  internship?: {
    id: string;
    title: string;
    status: InternshipStatus;
    company: { id: string; companyName: string; logo: string | null };
  };
  reviewedBy?: { id: string; email: string; fullName?: string } | null;
}

export type ModerationActionType = 'REJECT' | 'REQUEST_REVISION' | 'RESTORE';

export interface ModerateInternshipInput {
  action: ModerationActionType;
  reasonCode?: InternshipModerationReasonCode;
  reasonDetail: string;
  notifyApplicants?: boolean;
}

export interface CreateInternshipReportInput {
  reasonCode: InternshipReportReasonCode;
  reasonDetail?: string;
}

export interface ReviewInternshipReportInput {
  status: InternshipReportStatus;
  adminNotes?: string;
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

export interface RepostInternshipInput {
  semesterId: string;
  title?: string;
  department?: string | null;
  location?: string | null;
  workType?: string | null;
  stipend?: string | null;
  description?: string;
  requirements?: string | null;
  slots?: number;
  deadline?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status?: InternshipStatus;
  skills?: Array<{ skillId: string; isRequired?: boolean; weight?: number }>;
}

export interface InternshipsPage {
  items: InternshipRecord[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface InternshipReportsPage {
  items: InternshipReportRecord[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export type ListInternshipsParams = {
  page?: number;
  limit?: number;
  search?: string;
  semesterId?: string;
  companyId?: string;
  skillId?: string;
  skillIds?: string[];
  status?: InternshipStatus;
  hasReports?: boolean;
  moderationReasonCode?: string;
};

export type ListInternshipReportsParams = {
  page?: number;
  limit?: number;
  status?: InternshipReportStatus;
  reasonCode?: InternshipReportReasonCode;
  internshipId?: string;
};

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
  saveAsTemplate: async (id: string, name: string) =>
    (await api.post<ApiSuccess<any>>(`/internships/${id}/save-as-template`, { name })).data.data,
  repost: async (id: string, input: RepostInternshipInput) =>
    (await api.post<ApiSuccess<InternshipRecord>>(`/internships/${id}/repost`, input)).data.data,
  moderate: async (id: string, input: ModerateInternshipInput) =>
    (await api.patch<ApiSuccess<InternshipRecord>>(`/internships/${id}/moderate`, input)).data.data,
  report: async (id: string, input: CreateInternshipReportInput) =>
    (await api.post<ApiSuccess<InternshipReportRecord>>(`/internships/${id}/report`, input)).data.data,
  listReports: async (params?: ListInternshipReportsParams) =>
    (await api.get<ApiSuccess<InternshipReportsPage>>('/internships/reports/admin', { params })).data.data,
  reviewReport: async (reportId: string, input: ReviewInternshipReportInput) =>
    (await api.patch<ApiSuccess<InternshipReportRecord>>(`/internships/reports/${reportId}/review`, input)).data.data,
};
