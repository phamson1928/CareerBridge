import { api } from '../auth/api';
import type { ApiSuccess } from '../auth/auth.types';
import type { AiScanJobRecord } from '../ai-worker/types';
import type { Application } from '../types';

export type ApplicationStatus =
  | 'PENDING'
  | 'REVIEWING'
  | 'INTERVIEWING'
  | 'OFFERED'
  | 'ACCEPTED'
  | 'DECLINED'
  | 'EXPIRED'
  | 'REJECTED'
  | 'WITHDRAWN';

export type InterviewMode = 'ONLINE' | 'OFFLINE';

export interface ApplicationInterviewRecord {
  id: string;
  scheduledAt: string;
  mode: InterviewMode;
  meetingLink: string | null;
  location: string | null;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmailLogRecord {
  id: string;
  type: string;
  to: string;
  subject: string;
  status: 'SENT' | 'FAILED';
  error: string | null;
  sentAt: string;
}

export interface ApplicationRecord {
  id: string;
  studentId: string;
  internshipId: string;
  coverLetter: string | null;
  cvFileId: string | null;
  matchScore: number | null;
  aiScore: number | null;
  aiScanJob?: AiScanJobRecord | null;
  status: ApplicationStatus;
  companyFeedback: string | null;
  rejectionReason: string | null;
  offeredAt: string | null;
  offerExpiresAt: string | null;
  offerMessage: string | null;
  respondedAt: string | null;
  appliedAt: string;
  acceptedAt: string | null;
  rejectedAt: string | null;
  withdrawnAt: string | null;
  hiddenByStudentAt?: string | null;
  hiddenByCompanyAt?: string | null;
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
    semesterId?: string;
    semester?: { id: string; name: string; status?: string };
    startDate?: string | null;
    endDate?: string | null;
    company: {
      id: string;
      companyName: string;
      userId: string;
      contactEmail?: string | null;
      address?: string | null;
    };
  };
  placement: { id: string; status: string } | null;
  interview: ApplicationInterviewRecord | null;
  emailLogs?: EmailLogRecord[];
}

export interface ApplicationsPage {
  items: ApplicationRecord[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface ScheduleInterviewInput {
  scheduledAt: string;
  mode: InterviewMode;
  meetingLink?: string;
  location?: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  note?: string;
}

export interface SendOfferInput {
  expiresInDays?: number;
  offerMessage?: string;
}

export interface RejectApplicationInput {
  rejectionReason: string;
  companyFeedback?: string;
}

export interface EmailPreviewResult {
  subject: string;
  html: string;
  replyTo?: string;
  icsContent?: string;
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
  scheduleInterview: async (id: string, input: ScheduleInterviewInput) =>
    (await api.post<ApiSuccess<ApplicationRecord>>(`/applications/${id}/interview`, input))
      .data.data,
  sendOffer: async (id: string, input: SendOfferInput) =>
    (await api.post<ApiSuccess<ApplicationRecord>>(`/applications/${id}/offer`, input))
      .data.data,
  reject: async (id: string, input: RejectApplicationInput) =>
    (await api.post<ApiSuccess<ApplicationRecord>>(`/applications/${id}/reject`, input))
      .data.data,
  acceptOffer: async (id: string) =>
    (await api.post<ApiSuccess<ApplicationRecord>>(`/applications/${id}/offer/accept`))
      .data.data,
  declineOffer: async (id: string) =>
    (await api.post<ApiSuccess<ApplicationRecord>>(`/applications/${id}/offer/decline`))
      .data.data,
  previewEmail: async (
    id: string,
    params: {
      type: 'INTERVIEW' | 'OFFER' | 'REJECT';
      scheduledAt?: string;
      mode?: InterviewMode;
      meetingLink?: string;
      location?: string;
      contactName?: string;
      contactEmail?: string;
      contactPhone?: string;
      note?: string;
      expiresInDays?: number;
      offerMessage?: string;
      rejectionReason?: string;
      companyFeedback?: string;
    },
  ) =>
    (
      await api.get<ApiSuccess<EmailPreviewResult>>(`/applications/${id}/email-preview`, {
        params,
      })
    ).data.data,
  resendEmail: async (id: string, logId: string) =>
    (await api.post<ApiSuccess<ApplicationRecord>>(`/applications/${id}/emails/${logId}/resend`))
      .data.data,
  getById: async (id: string) =>
    (await api.get<ApiSuccess<ApplicationRecord>>(`/applications/${id}`)).data.data,
  remove: async (id: string) =>
    (await api.delete<ApiSuccess<{ id: string; deleted: boolean }>>(`/applications/${id}`))
      .data.data,
};

export function toLegacyApplication(record: ApplicationRecord): Application {
  return {
    id: record.id,
    studentId: record.studentId,
    studentName: record.student.fullName,
    studentMajor: record.student.major,
    studentSkills: [],
    internshipId: record.internshipId,
    internshipTitle: record.internship.title,
    semesterId: record.internship.semester?.id ?? record.internship.semesterId ?? null,
    semesterName: record.internship.semester?.name ?? null,
    internshipStartDate: record.internship.startDate ?? null,
    internshipEndDate: record.internship.endDate ?? null,
    companyId: record.internship.company.id,
    companyName: record.internship.company.companyName,
    companyContactEmail: record.internship.company.contactEmail ?? null,
    companyAddress: record.internship.company.address ?? null,
    cvUrl: '',
    cvFileId: record.cvFileId ?? undefined,
    cvName: (record as any).cvFile?.originalName ?? null,
    coverLetter: record.coverLetter ?? undefined,
    matchScore: record.matchScore,
    aiScore: record.aiScore ?? null,
    aiScanJob: record.aiScanJob ?? null,
    status: record.status,
    companyFeedback: record.companyFeedback ?? undefined,
    rejectionReason: record.rejectionReason ?? null,
    offeredAt: record.offeredAt ?? null,
    offerExpiresAt: record.offerExpiresAt ?? null,
    offerMessage: record.offerMessage ?? null,
    respondedAt: record.respondedAt ?? null,
    interview: record.interview ?? null,
    emailLogs: record.emailLogs ?? [],
    appliedAt: record.appliedAt,
    hiddenByStudentAt: record.hiddenByStudentAt ?? null,
    hiddenByCompanyAt: record.hiddenByCompanyAt ?? null,
    updatedAt: record.updatedAt,
  };
}
