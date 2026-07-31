import { Role, UserStatus } from '../../generated/prisma/client';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}

export interface PublicUser extends AuthUser {
  status: UserStatus;
}
