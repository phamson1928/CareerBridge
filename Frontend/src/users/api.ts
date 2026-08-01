import { api } from "../auth/api";
import type { ApiSuccess, AuthRole } from "../auth/auth.types";

export type UserStatus = "ACTIVE" | "INACTIVE" | "BANNED";

export interface ManagedUser {
  id: string;
  email: string;
  role: AuthRole;
  status: UserStatus;
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
}

export interface UpdateUserInput {
  email?: string;
  password?: string;
  role?: AuthRole;
  status?: UserStatus;
}

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
    await api.delete(`/users/${id}`);
  },
};
