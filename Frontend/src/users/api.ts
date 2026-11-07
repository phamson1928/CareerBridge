import { api } from "../auth/api";
import type { ApiSuccess, AuthRole } from "../auth/auth.types";

export type UserStatus = "ACTIVE" | "INACTIVE" | "BANNED";

export interface ManagedUser {
  id: string;
  email: string;
  role: AuthRole;
  status: UserStatus;
  isSuperAdmin?: boolean;
  permissions?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UserListResponse {
  items: ManagedUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ListUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: AuthRole;
  status?: UserStatus;
}

export interface CreateUserInput {
  email: string;
  password: string;
  role: AuthRole;
  status?: UserStatus;
  isSuperAdmin?: boolean;
  permissions?: string[];
}

export interface UpdateUserInput {
  email?: string;
  password?: string;
  role?: AuthRole;
  status?: UserStatus;
  isSuperAdmin?: boolean;
  permissions?: string[];
}

export const ADMIN_PERMISSION_OPTIONS = [
  { id: 'DASHBOARD', label: 'Thống kê hệ thống', description: 'Xem tổng quan và các chỉ số thống kê toàn trường' },
  { id: 'COMPANIES', label: 'Quản lý Doanh nghiệp', description: 'Xét duyệt hồ sơ, đình chỉ và quản lý thông tin đối tác DN' },
  { id: 'INTERNSHIPS', label: 'Tin tuyển dụng & Kỹ năng', description: 'Kiểm duyệt tin đăng tuyển, báo cáo vi phạm và danh mục kỹ năng' },
  { id: 'PLACEMENTS', label: 'Thực tập & Giảng viên', description: 'Quản lý tiến độ thực tập, phân công GV hướng dẫn và nghiệm thu' },
  { id: 'SEMESTERS', label: 'Kỳ thực tập', description: 'Tạo và quản lý các đợt thực tập học vụ' },
  { id: 'SUPPORT', label: 'Hỗ trợ sinh viên', description: 'Tiếp nhận và phản hồi các yêu cầu hỗ trợ, khiếu nại' },
] as const;

export const usersApi = {
  list: async (params: ListUsersParams) => {
    const response = await api.get<ApiSuccess<UserListResponse>>("/users", {
      params,
    });
    return response.data.data;
  },
  create: async (input: CreateUserInput) => {
    const response = await api.post<ApiSuccess<ManagedUser>>("/users", input);
    return response.data.data;
  },
  update: async (id: string, input: UpdateUserInput) => {
    const response = await api.patch<ApiSuccess<ManagedUser>>(
      `/users/${id}`,
      input,
    );
    return response.data.data;
  },
  remove: async (id: string) => {
    const response = await api.delete<ApiSuccess<{ id: string; deleted: boolean }>>(
      `/users/${id}`,
    );
    return response.data.data;
  },
};
