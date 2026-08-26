import { api } from "../auth/api";
import type { ApiSuccess } from "../auth/auth.types";

export interface AuditActor {
  id: string;
  email: string;
  role: string;
}

export interface AuditLogRecord {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  metadata: unknown;
  ipAddress: string | null;
  createdAt: string;
  actor: AuditActor | null;
}

export interface AuditLogListResponse {
  items: AuditLogRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ListAuditLogsParams {
  page?: number;
  limit?: number;
  action?: string;
  entity?: string;
  entityId?: string;
  userId?: string;
  from?: string;
  to?: string;
  search?: string;
}

export const auditLogsApi = {
  list: async (params: ListAuditLogsParams) => {
    const response = await api.get<ApiSuccess<AuditLogListResponse>>(
      "/audit-logs",
      { params },
    );
    return response.data.data;
  },
  getById: async (id: string) => {
    const response = await api.get<ApiSuccess<AuditLogRecord>>(
      `/audit-logs/${id}`,
    );
    return response.data.data;
  },
};