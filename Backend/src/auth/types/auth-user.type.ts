import { Role, UserStatus } from '../../generated/prisma/client';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  isSuperAdmin?: boolean;
  permissions?: string[];
}

export interface PublicUser extends AuthUser {
  status: UserStatus;
  isSuperAdmin: boolean;
  permissions: string[];
}
