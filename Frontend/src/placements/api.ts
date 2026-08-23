import { api } from "../auth/api";
import type {
  PlacementPage,
  PlacementRecord,
  PlacementStatus,
  ReportStatus,
} from "./types";

export interface PlacementListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: PlacementStatus;
  semesterId?: string;
  companyId?: string;
  lecturerId?: string;
  assignmentStatus?: "ASSIGNED" | "UNASSIGNED";
  reportStatus?: ReportStatus;
}

export const placementsApi = {
  async list(params: PlacementListParams = {}) {
    const response = await api.get<{ data: PlacementPage }>("/placements", {
      params,
    });
    return response.data.data;
  },
  async listMine() {
    const response = await api.get<{ data: { items: PlacementRecord[] } }>(
      "/placements/me",
    );
    return response.data.data;
  },
  async findById(id: string) {
    const response = await api.get<{ data: PlacementRecord }>(
      `/placements/${id}`,
    );
    return response.data.data;
  },
  async update(id: string, input: { startDate?: string; endDate?: string }) {
    const response = await api.patch<{ data: PlacementRecord }>(
      `/placements/${id}`,
      input,
    );
    return response.data.data;
  },
  async updateStatus(
    id: string,
    status: Extract<PlacementStatus, "COMPLETED" | "CANCELLED">,
    note?: string,
  ) {
    const response = await api.patch<{ data: PlacementRecord }>(
      `/placements/${id}/status`,
      { status, note },
    );
    return response.data.data;
  },
};
