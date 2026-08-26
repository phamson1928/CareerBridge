import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { auditLogSelect, mapAuditLog } from './audit-log.mapper';
import { ListAuditLogsQueryDto } from './dto/list-audit-logs-query.dto';

@Injectable()
export class AuditLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListAuditLogsQueryDto) {
    const createdAt = this.buildDateRange(query.from, query.to);
    const where: Prisma.AuditLogWhereInput = {
      ...(query.action
        ? { action: { equals: query.action, mode: 'insensitive' } }
        : {}),
      ...(query.entity
        ? { entity: { equals: query.entity, mode: 'insensitive' } }
        : {}),
      ...(query.entityId ? { entityId: query.entityId } : {}),
      ...(query.userId ? { userId: query.userId } : {}),
      ...(createdAt ? { createdAt } : {}),
      ...(query.search
        ? {
            OR: [
              {
                action: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              {
                entity: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              { entityId: { contains: query.search } },
              {
                user: {
                  email: {
                    contains: query.search,
                    mode: 'insensitive',
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        select: auditLogSelect,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      items: rows.map(mapAuditLog),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async findOne(id: string) {
    const row = await this.prisma.auditLog.findUnique({
      where: { id },
      select: auditLogSelect,
    });
    if (!row) {
      throw new NotFoundException({
        code: 'AUDIT_LOG_NOT_FOUND',
        message: 'Audit log not found',
      });
    }
    return mapAuditLog(row);
  }

  private buildDateRange(
    fromValue?: string,
    toValue?: string,
  ): Prisma.DateTimeFilter | undefined {
    if (!fromValue && !toValue) return undefined;

    const from = fromValue
      ? this.parseDateBoundary(fromValue, 'start')
      : undefined;
    const to = toValue ? this.parseDateBoundary(toValue, 'end') : undefined;
    if (from && to && to < from) {
      throw new BadRequestException({
        code: 'INVALID_AUDIT_DATE_RANGE',
        message:
          'Audit log date range must have to greater than or equal to from',
      });
    }
    return {
      ...(from ? { gte: from } : {}),
      ...(to ? { lte: to } : {}),
    };
  }

  private parseDateBoundary(value: string, boundary: 'start' | 'end') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return new Date(
        `${value}T${boundary === 'start' ? '00:00:00.000' : '23:59:59.999'}Z`,
      );
    }
    return new Date(value);
  }
}
