import { api } from '../auth/api';
import type { ApiSuccess } from '../auth/auth.types';
import type {
  SupportRequestRecord,
  SupportRequestsPage,
  SupportRequestStatus,
} from './types';

type ListParams = {
  page?: number;
  limit?: number;
  status?: SupportRequestStatus;
  search?: string;
};

export const supportRequestsApi = {
  create: (body: { title: string; content: string }) =>
    api
      .post<ApiSuccess<SupportRequestRecord>>('/support-requests', body)
      .then((r) => r.data.data),

  mine: (params: ListParams = {}) =>
    api
      .get<ApiSuccess<SupportRequestsPage>>('/support-requests/me', { params })
      .then((r) => r.data.data),

  listAll: (params: ListParams = {}) =>
    api
      .get<ApiSuccess<SupportRequestsPage>>('/support-requests', { params })
      .then((r) => r.data.data),

  reply: (id: string, body: { adminReply: string }) =>
    api
      .post<ApiSuccess<SupportRequestRecord>>(
        `/support-requests/${id}/reply`,
        body,
      )
      .then((r) => r.data.data),
};
