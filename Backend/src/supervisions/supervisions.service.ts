import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  PlacementStatus,
  Role,
  SupervisionStatus,
  NotificationAction,
  NotificationType,
} from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../auth/types/auth-user.type';
import { CreateSupervisionDto } from './dto/create-supervision.dto';
import { ListLecturerOptionsQueryDto } from './dto/list-lecturer-options-query.dto';
import { ListSupervisionsQueryDto } from './dto/list-supervisions-query.dto';
import { UpdateSupervisionDto } from './dto/update-supervision.dto';
import { NotificationsService } from '../notifications/notifications.service';

const supervisionSelect = {
  id: true,
  placementId: true,
  lecturerId: true,
  assignedById: true,
  status: true,
  assignedAt: true,
  completedAt: true,
  placement: {
    select: {
      id: true,
      status: true,
      student: {
        select: { id: true, userId: true, studentCode: true, fullName: true, major: true },
      },
      company: { select: { id: true, userId: true, companyName: true, logo: true } },
      internship: {
        select: { id: true, title: true, location: true, workType: true },
      },
      semester: {
        select: { id: true, name: true, startDate: true, endDate: true },
      },
      _count: { select: { reports: true, evaluations: true } },
    },
  },
  lecturer: {
    select: {
      id: true,
      userId: true,
      fullName: true,
      department: true,
      title: true,
    },
  },
} satisfies Prisma.SupervisionSelect;

type SupervisionRecord = Prisma.SupervisionGetPayload<{
  select: typeof supervisionSelect;
}>;

@Injectable()
export class SupervisionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async list(query: ListSupervisionsQueryDto) {
    const search = query.search?.trim();
    const where: Prisma.SupervisionWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.lecturerId ? { lecturerId: query.lecturerId } : {}),
      ...(query.placementStatus
        ? { placement: { status: query.placementStatus } }
        : {}),
      ...(search
        ? {
            OR: [
              {
                placement: {
                  student: {
                    fullName: { contains: search, mode: 'insensitive' },
                  },
                },
              },
              {
                placement: {
                  student: {
                    studentCode: { contains: search, mode: 'insensitive' },
                  },
                },
              },
              {
                placement: {
                  internship: {
                    title: { contains: search, mode: 'insensitive' },
                  },
                },
              },
              {
                lecturer: {
                  fullName: { contains: search, mode: 'insensitive' },
                },
              },
            ],
          }
        : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.supervision.findMany({
        where,
        select: supervisionSelect,
        orderBy: [{ assignedAt: 'desc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.supervision.count({ where }),
    ]);
    return {
      items: items.map((item) => this.toRecord(item)),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async listMine(user: AuthUser) {
    const lecturer = await this.prisma.lecturerProfile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (!lecturer) throw this.lecturerNotFound();
    const items = await this.prisma.supervision.findMany({
      where: { lecturerId: lecturer.id },
      select: supervisionSelect,
      orderBy: [{ assignedAt: 'desc' }],
    });
    return { items: items.map((item) => this.toRecord(item)) };
  }

  async lecturerOptions(query: ListLecturerOptionsQueryDto) {
    const search = query.search?.trim();
    const lecturers = await this.prisma.lecturerProfile.findMany({
      where: {
        user: { status: 'ACTIVE' },
        ...(search
          ? {
              OR: [
                { fullName: { contains: search, mode: 'insensitive' } },
                { department: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        userId: true,
        fullName: true,
        department: true,
        title: true,
        user: { select: { email: true } },
      },
      orderBy: { fullName: 'asc' },
    });
    const counts = await this.prisma.supervision.groupBy({
      by: ['lecturerId'],
      where: { status: SupervisionStatus.ACTIVE },
      _count: { lecturerId: true },
    });
    const countMap = new Map(
      counts.map((row) => [row.lecturerId, row._count.lecturerId]),
    );
    return lecturers.map((lecturer) => ({
      id: lecturer.id,
      userId: lecturer.userId,
      fullName: lecturer.fullName,
      department: lecturer.department,
      title: lecturer.title,
      email: lecturer.user.email,
      activeSupervisionCount: countMap.get(lecturer.id) ?? 0,
    }));
  }

  async findById(id: string, user: AuthUser) {
    const supervision = await this.prisma.supervision.findUnique({
      where: { id },
      select: supervisionSelect,
    });
    if (!supervision) throw this.notFound();
    if (user.role !== Role.ADMIN && supervision.lecturer.userId !== user.id) {
      throw new ForbiddenException({
        code: 'SUPERVISION_NOT_ACCESSIBLE',
        message: 'Supervision is not accessible',
      });
    }
    return this.toRecord(supervision);
  }

  async assign(dto: CreateSupervisionDto, actorId: string) {
    const result = await this.prisma.$transaction(
      async (tx) => {
        const placement = await tx.internshipPlacement.findUnique({
          where: { id: dto.placementId },
          select: {
            id: true,
            status: true,
            studentId: true,
            semesterId: true,
            supervision: { select: { id: true } },
          },
        });
        if (!placement)
          throw new NotFoundException({
            code: 'PLACEMENT_NOT_FOUND',
            message: 'Placement not found',
          });
        if (
          placement.status !== PlacementStatus.PENDING ||
          placement.supervision
        ) {
          throw new ConflictException({
            code: 'PLACEMENT_NOT_ASSIGNABLE',
            message: 'Placement is not available for first assignment',
          });
        }
        const lecturer = await this.getActiveLecturer(tx, dto.lecturerId);
        await this.assertNoOtherActivePlacement(
          tx,
          placement.studentId,
          placement.semesterId,
          placement.id,
        );
        const supervision = await tx.supervision.create({
          data: {
            placementId: placement.id,
            lecturerId: lecturer.id,
            assignedById: actorId,
            status: SupervisionStatus.ACTIVE,
          },
          select: supervisionSelect,
        });
        await tx.internshipPlacement.update({
          where: { id: placement.id },
          data: { status: PlacementStatus.ACTIVE },
        });
        await this.audit(tx, actorId, 'SUPERVISION_ASSIGNED', supervision.id, {
          placementId: placement.id,
          lecturerId: lecturer.id,
        });
        await this.audit(
          tx,
          actorId,
          'PLACEMENT_STATUS_CHANGED',
          placement.id,
          { from: PlacementStatus.PENDING, to: PlacementStatus.ACTIVE },
        );
        return this.toRecord(supervision);
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    const recipients = [result.lecturer.userId, result.placement.student.userId, result.placement.company.userId];
    for (const userId of [...new Set(recipients)]) {
      await this.notifications.create({
        userId,
        eventKey: `supervision:${result.id}:assigned:${userId}`,
        type: NotificationType.SUPERVISION,
        action: NotificationAction.OPEN_SUPERVISION,
        title: 'Đã phân công giảng viên hướng dẫn',
        content: 'Một supervision mới đã được phân công cho placement của bạn.',
        resourceId: result.id,
        metadata: { placementId: result.placementId },
      });
    }
    return result;
  }

  async update(id: string, dto: UpdateSupervisionDto, actorId: string) {
    return this.prisma.$transaction(
      async (tx) => {
        const current = await tx.supervision.findUnique({
          where: { id },
          select: {
            id: true,
            lecturerId: true,
            status: true,
            placement: {
              select: {
                id: true,
                status: true,
                studentId: true,
                semesterId: true,
              },
            },
          },
        });
        if (!current) throw this.notFound();
        if (
          current.placement.status === PlacementStatus.COMPLETED ||
          current.placement.status === PlacementStatus.CANCELLED
        ) {
          throw new ConflictException({
            code: 'INVALID_SUPERVISION_TRANSITION',
            message: 'Terminal placements cannot be reassigned',
          });
        }
        if (
          current.lecturerId === dto.lecturerId &&
          current.status === SupervisionStatus.ACTIVE
        ) {
          return this.findByIdInTransaction(tx, id);
        }
        const lecturer = await this.getActiveLecturer(tx, dto.lecturerId);
        if (current.placement.status === PlacementStatus.PENDING) {
          await this.assertNoOtherActivePlacement(
            tx,
            current.placement.studentId,
            current.placement.semesterId,
            current.placement.id,
          );
        }
        const supervision = await tx.supervision.update({
          where: { id },
          data: {
            lecturerId: lecturer.id,
            status: SupervisionStatus.ACTIVE,
            assignedById: actorId,
            assignedAt: new Date(),
            completedAt: null,
          },
          select: supervisionSelect,
        });
        if (current.placement.status === PlacementStatus.PENDING) {
          await tx.internshipPlacement.update({
            where: { id: current.placement.id },
            data: { status: PlacementStatus.ACTIVE },
          });
        }
        await this.audit(
          tx,
          actorId,
          current.status === SupervisionStatus.CANCELLED
            ? 'SUPERVISION_REACTIVATED'
            : 'SUPERVISION_REASSIGNED',
          id,
          {
            fromLecturerId: current.lecturerId,
            toLecturerId: lecturer.id,
            placementId: current.placement.id,
          },
        );
        return this.toRecord(supervision);
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async updateStatus(id: string, actorId: string) {
    const result = await this.prisma.$transaction(
      async (tx) => {
        const current = await tx.supervision.findUnique({
          where: { id },
          select: {
            id: true,
            status: true,
            placement: {
              select: {
                id: true,
                status: true,
                _count: { select: { reports: true, evaluations: true } },
              },
            },
          },
        });
        if (!current) throw this.notFound();
        if (
          current.status !== SupervisionStatus.ACTIVE ||
          current.placement.status !== PlacementStatus.ACTIVE
        ) {
          throw new ConflictException({
            code: 'INVALID_SUPERVISION_TRANSITION',
            message: 'Only an active supervision can be cancelled',
          });
        }
        if (
          current.placement._count.reports > 0 ||
          current.placement._count.evaluations > 0
        ) {
          throw new ConflictException({
            code: 'SUPERVISION_HAS_PROGRESS',
            message:
              'Supervision cannot be cancelled after reports or evaluations exist',
          });
        }
        const supervision = await tx.supervision.update({
          where: { id },
          data: {
            status: SupervisionStatus.CANCELLED,
            completedAt: new Date(),
          },
          select: supervisionSelect,
        });
        await tx.internshipPlacement.update({
          where: { id: current.placement.id },
          data: { status: PlacementStatus.PENDING },
        });
        await this.audit(tx, actorId, 'SUPERVISION_CANCELLED', id, {
          placementId: current.placement.id,
        });
        await this.audit(
          tx,
          actorId,
          'PLACEMENT_STATUS_CHANGED',
          current.placement.id,
          { from: PlacementStatus.ACTIVE, to: PlacementStatus.PENDING },
        );
        return this.toRecord(supervision);
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    const recipients = [result.lecturer.userId, result.placement.student.userId, result.placement.company.userId];
    for (const userId of [...new Set(recipients)]) {
      await this.notifications.create({
        userId,
        eventKey: `supervision:${result.id}:cancelled:${userId}`,
        type: NotificationType.SUPERVISION,
        action: NotificationAction.OPEN_SUPERVISION,
        title: 'Supervision đã bị hủy',
        content: 'Supervision của placement đã được hủy.',
        resourceId: result.id,
        metadata: { placementId: result.placementId },
      });
    }
    return result;
  }

  private async getActiveLecturer(tx: Prisma.TransactionClient, id: string) {
    const lecturer = await tx.lecturerProfile.findUnique({
      where: { id },
      select: { id: true, user: { select: { status: true } } },
    });
    if (!lecturer)
      throw new NotFoundException({
        code: 'LECTURER_PROFILE_NOT_FOUND',
        message: 'Lecturer profile not found',
      });
    if (lecturer.user.status !== 'ACTIVE')
      throw new ConflictException({
        code: 'LECTURER_ACCOUNT_INACTIVE',
        message: 'Lecturer account is not active',
      });
    return lecturer;
  }

  private async assertNoOtherActivePlacement(
    tx: Prisma.TransactionClient,
    studentId: string,
    semesterId: string,
    exceptId: string,
  ) {
    const conflict = await tx.internshipPlacement.findFirst({
      where: {
        studentId,
        semesterId,
        id: { not: exceptId },
        status: { in: [PlacementStatus.PENDING, PlacementStatus.ACTIVE] },
      },
      select: { id: true },
    });
    if (conflict)
      throw new ConflictException({
        code: 'STUDENT_ALREADY_PLACED_IN_SEMESTER',
        message: 'Student already has another placement in this semester',
      });
  }

  private async audit(
    tx: Prisma.TransactionClient,
    userId: string,
    action: string,
    entityId: string,
    metadata: Prisma.InputJsonValue,
  ) {
    await tx.auditLog.create({
      data: {
        userId,
        action,
        entity: action.startsWith('PLACEMENT')
          ? 'InternshipPlacement'
          : 'Supervision',
        entityId,
        metadata,
      },
    });
  }

  private async findByIdInTransaction(
    tx: Prisma.TransactionClient,
    id: string,
  ) {
    const record = await tx.supervision.findUnique({
      where: { id },
      select: supervisionSelect,
    });
    if (!record) throw this.notFound();
    return this.toRecord(record);
  }

  private toRecord(item: SupervisionRecord) {
    return item;
  }
  private notFound() {
    return new NotFoundException({
      code: 'SUPERVISION_NOT_FOUND',
      message: 'Supervision not found',
    });
  }
  private lecturerNotFound() {
    return new NotFoundException({
      code: 'LECTURER_PROFILE_NOT_FOUND',
      message: 'Lecturer profile not found',
    });
  }
}
