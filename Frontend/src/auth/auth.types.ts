export type AuthRole = 'ADMIN' | 'STUDENT' | 'LECTURER' | 'COMPANY';

export interface AuthUser {
  id: string;
  email: string;
  role: AuthRole;
  status: 'ACTIVE';
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  expiresIn: number;
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

export interface RegisterInput extends LoginInput {
  role: 'STUDENT' | 'COMPANY';
}
