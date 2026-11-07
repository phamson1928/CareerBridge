export type AuthRole = 'ADMIN' | 'STUDENT' | 'LECTURER' | 'COMPANY';

export interface AuthUser {
  id: string;
  email: string;
  role: AuthRole;
  status: 'ACTIVE';
  isSuperAdmin?: boolean;
  permissions?: string[];
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  expiresIn: number;
}

export interface RegisterResult {
  email: string;
  verificationExpiresAt: string;
}

export interface RefreshSession {
  accessToken: string;
  expiresIn: number;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  timestamp: string;
}

export interface ApiErrorBody {
  success: false;
  statusCode: number;
  code: string;
  message: string[];
  timestamp: string;
  path: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  role: 'STUDENT' | 'COMPANY';
}
