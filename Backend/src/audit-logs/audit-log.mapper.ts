import { Prisma } from '../generated/prisma/client';
import { AuditLogRecord } from './audit-log.types';

export const auditLogSelect = {
  id: true,
  action: true,
  entity: true,
  entityId: true,
  metadata: true,
  ipAddress: true,
  createdAt: true,
  user: {
    select: {
      id: true,
      email: true,
      role: true,
    },
  },
} satisfies Prisma.AuditLogSelect;

export type AuditLogRow = Prisma.AuditLogGetPayload<{
  select: typeof auditLogSelect;
}>;

const sensitiveMetadataKeys = new Set([
  'password',
  'passwordhash',
  'accesstoken',
  'refreshtoken',
  'tokenhash',
  'authorization',
  'cookie',
  'setcookie',
  'jwt',
  'secret',
  'servicekey',
  'supabaseservicekey',
  'signedurl',
  'uploadurl',
  'downloadurl',
]);

export function mapAuditLog(row: AuditLogRow): AuditLogRecord {
  return {
    id: row.id,
    action: row.action,
    entity: row.entity,
    entityId: row.entityId,
    metadata: sanitizeAuditMetadata(row.metadata),
    ipAddress: row.ipAddress,
    createdAt: row.createdAt,
    actor: row.user,
  };
}

export function sanitizeAuditMetadata(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeAuditMetadata(item));
  }
  if (!value || typeof value !== 'object') {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      isSensitiveMetadataKey(key)
        ? '[REDACTED]'
        : sanitizeAuditMetadata(item),
    ]),
  );
}

function isSensitiveMetadataKey(key: string): boolean {
  return sensitiveMetadataKeys.has(key.toLowerCase().replace(/[^a-z0-9]/g, ''));
}
