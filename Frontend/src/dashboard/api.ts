import { api } from "../auth/api";
import type { ApiSuccess } from "../auth/auth.types";
import type { AdminDashboardData } from "./types";

export interface AdminDashboardParams {
  semesterId?: string;
  months?: 3 | 6 | 9 | 12;
}

export const dashboardApi = {
  async getAdmin(params: AdminDashboardParams = {}) {
    const response = await api.get<ApiSuccess<AdminDashboardData>>(
      "/dashboard/admin",
      { params },
    );
    return response.data.data;
  },
};
