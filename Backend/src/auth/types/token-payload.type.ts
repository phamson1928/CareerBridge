import { Role } from '../../generated/prisma/client';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: Role;
}
