import { Role } from '../generated/prisma/client';

export interface AuditActor {
  id: string;
  email: string;
  role: Role;
}

export interface AuditLogRecord {
  id: string;
  action: string;
  entity: string | null;
  entityId: string | null;
  metadata: unknown;
  ipAddress: string | null;
  createdAt: Date;
  actor: AuditActor | null;
}
