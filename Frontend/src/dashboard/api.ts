import { api } from "../auth/api";
import type { ApiSuccess } from "../auth/auth.types";
import type {
  AdminDashboardData,
  CompanyDashboardData,
  CompanyInternshipStatsData,
} from "./types";

export interface AdminDashboardParams {
  semesterId?: string;
  months?: 3 | 6 | 9 | 12;
}

export interface CompanyDashboardParams {
  semesterId?: string;
  page?: number;
  limit?: number;
}

export const dashboardApi = {
  async getAdmin(params: AdminDashboardParams = {}) {
    const response = await api.get<ApiSuccess<AdminDashboardData>>(
      "/dashboard/admin",
      { params },
    );
    return response.data.data;
  },
  async getCompany(params: CompanyDashboardParams = {}) {
    const response = await api.get<ApiSuccess<CompanyDashboardData>>(
      "/dashboard/company",
      { params },
    );
    return response.data.data;
  },
  async getCompanyInternshipStats(id: string) {
    const response = await api.get<ApiSuccess<CompanyInternshipStatsData>>(
      `/dashboard/company/internships/${id}`,
    );
    return response.data.data;
  },
};

