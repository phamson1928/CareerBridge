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
} from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../auth/types/auth-user.type';
import {
  ListPlacementsQueryDto,
  PlacementAssignmentStatus,
} from './dto/list-placements-query.dto';
import {
  PublicPlacementStatus,
  UpdatePlacementStatusDto,
} from './dto/update-placement-status.dto';

export interface AcceptedApplicationSnapshot {
  applicationId: string;
  studentId: string;
  companyId: string;
  internshipId: string;
  semesterId: string;
  startDate: Date | null;
  endDate: Date | null;
}

const placementSelect = {
  id: true,
  applicationId: true,
  studentId: true,
  companyId: true,
  internshipId: true,
  semesterId: true,
  status: true,
  startDate: true,
  endDate: true,
  createdAt: true,
  updatedAt: true,
  application: {
    select: { id: true, status: true, acceptedAt: true },
  },
  student: {
    select: {
      id: true,
      userId: true,
      studentCode: true,
      fullName: true,
      major: true,
    },
  },
  company: {
    select: { id: true, userId: true, companyName: true, logo: true },
  },
  internship: {
    select: {
      id: true,
      title: true,
      department: true,
      location: true,
      workType: true,
    },
  },
  semester: {
    select: {
      id: true,
      name: true,
      status: true,
      startDate: true,
      endDate: true,
    },
  },
  supervision: {
    select: {
      id: true,
      lecturerId: true,
      status: true,
      assignedAt: true,
      completedAt: true,
      lecturer: {
        select: {
          id: true,
          userId: true,
          fullName: true,
          department: true,
          title: true,
        },
      },
    },
  },
} satisfies Prisma.InternshipPlacementSelect;

export type PlacementRecord = Prisma.InternshipPlacementGetPayload<{
  select: typeof placementSelect;
}>;

@Injectable()
export class PlacementsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListPlacementsQueryDto) {
    const search = query.search?.trim();
    const supervisionWhere: Prisma.SupervisionWhereInput = {
      ...(query.lecturerId ? { lecturerId: query.lecturerId } : {}),
    };
    const supervisionFilter: Prisma.InternshipPlacementWhereInput =
      query.assignmentStatus === PlacementAssignmentStatus.UNASSIGNED
        ? { supervision: { is: null } }
        : query.assignmentStatus === PlacementAssignmentStatus.ASSIGNED ||
            query.lecturerId
          ? { supervision: { is: supervisionWhere } }
          : {};
    const where: Prisma.InternshipPlacementWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.semesterId ? { semesterId: query.semesterId } : {}),
      ...(query.companyId ? { companyId: query.companyId } : {}),
      ...supervisionFilter,
      ...(search
        ? {
            OR: [
              {
                student: {
                  fullName: { contains: search, mode: 'insensitive' },
                },
              },
              {
                student: {
                  studentCode: { contains: search, mode: 'insensitive' },
                },
              },
              {
                company: {
                  companyName: { contains: search, mode: 'insensitive' },
                },
              },
              {
                internship: {
                  title: { contains: search, mode: 'insensitive' },
                },
              },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.internshipPlacement.findMany({
        where,
        select: placementSelect,
        orderBy: [{ createdAt: 'desc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.internshipPlacement.count({ where }),
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
    const where = await this.scopeForUser(user);
    const items = await this.prisma.internshipPlacement.findMany({
      where,
      select: placementSelect,
      orderBy: [{ createdAt: 'desc' }],
    });
    return { items: items.map((item) => this.toRecord(item)) };
  }

  async findById(id: string, user: AuthUser) {
    const placement = await this.prisma.internshipPlacement.findUnique({
      where: { id },
      select: placementSelect,
    });
    if (!placement) throw this.notFound();
    await this.assertCanRead(placement, user);
    return this.toRecord(placement);
  }

  async updateStatus(
    id: string,
    dto: UpdatePlacementStatusDto,
    actorId: string,
  ) {
    try {
      return await this.prisma.$transaction(
        async (tx) => {
          const current = await tx.internshipPlacement.findUnique({
            where: { id },
            select: {
              id: true,
              internshipId: true,
              status: true,
              supervision: { select: { id: true, status: true } },
            },
          });
          if (!current) throw this.notFound();
          if (
            (current.status !== PlacementStatus.ACTIVE &&
              dto.status === PublicPlacementStatus.COMPLETED) ||
            current.status === PlacementStatus.COMPLETED ||
            current.status === PlacementStatus.CANCELLED
          ) {
            throw new ConflictException({
              code: 'INVALID_PLACEMENT_TRANSITION',
              message: `Cannot change placement status from ${current.status} to ${dto.status}`,
            });
          }
          if (
            dto.status === PublicPlacementStatus.CANCELLED &&
            current.status === PlacementStatus.PENDING
          ) {
            // PENDING placements have no supervision but still release their reserved slot.
          }

          const placement = await tx.internshipPlacement.update({
            where: { id },
            data: { status: dto.status },
            select: placementSelect,
          });

          if (current.supervision?.status === SupervisionStatus.ACTIVE) {
            await tx.supervision.update({
              where: { id: current.supervision.id },
              data: {
                status:
                  dto.status === PublicPlacementStatus.COMPLETED
                    ? SupervisionStatus.COMPLETED
                    : SupervisionStatus.CANCELLED,
                completedAt: new Date(),
              },
            });
          }

          if (dto.status === PublicPlacementStatus.CANCELLED) {
            await tx.internship.updateMany({
              where: { id: current.internshipId, filledSlots: { gt: 0 } },
              data: { filledSlots: { decrement: 1 } },
            });
          }

          await tx.auditLog.create({
            data: {
              userId: actorId,
              action: 'PLACEMENT_STATUS_CHANGED',
              entity: 'InternshipPlacement',
              entityId: id,
              metadata: { from: current.status, to: dto.status },
            },
          });
          if (
            dto.status === PublicPlacementStatus.COMPLETED &&
            current.supervision?.status === SupervisionStatus.ACTIVE
          ) {
            await tx.auditLog.create({
              data: {
                userId: actorId,
                action: 'SUPERVISION_COMPLETED',
                entity: 'Supervision',
                entityId: current.supervision.id,
                metadata: { placementId: id },
              },
            });
          }
          return this.toRecord(placement);
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error: unknown) {
      this.rethrowKnownDatabaseError(error);
    }
  }

  async createPendingFromAcceptedApplication(
    tx: Prisma.TransactionClient,
    snapshot: AcceptedApplicationSnapshot,
    actorId: string,
  ): Promise<PlacementRecord> {
    const existing = await tx.internshipPlacement.findUnique({
      where: { applicationId: snapshot.applicationId },
      select: placementSelect,
    });
    if (existing) {
      if (
        existing.studentId !== snapshot.studentId ||
        existing.internshipId !== snapshot.internshipId ||
        existing.semesterId !== snapshot.semesterId
      ) {
        throw new ConflictException({
          code: 'PLACEMENT_ALREADY_EXISTS',
          message: 'Application is linked to a different placement',
        });
      }
      return existing;
    }

    const conflict = await tx.internshipPlacement.findFirst({
      where: {
        studentId: snapshot.studentId,
        semesterId: snapshot.semesterId,
        status: { in: [PlacementStatus.PENDING, PlacementStatus.ACTIVE] },
      },
      select: { id: true },
    });
    if (conflict) {
      throw new ConflictException({
        code: 'STUDENT_ALREADY_PLACED_IN_SEMESTER',
        message:
          'Student already has an active or pending placement in this semester',
      });
    }

    try {
      const placement = await tx.internshipPlacement.create({
        data: {
          applicationId: snapshot.applicationId,
          studentId: snapshot.studentId,
          companyId: snapshot.companyId,
          internshipId: snapshot.internshipId,
          semesterId: snapshot.semesterId,
          status: PlacementStatus.PENDING,
          startDate: snapshot.startDate,
          endDate: snapshot.endDate,
        },
        select: placementSelect,
      });
      await tx.auditLog.create({
        data: {
          userId: actorId,
          action: 'PLACEMENT_CREATED',
          entity: 'InternshipPlacement',
          entityId: placement.id,
          metadata: {
            applicationId: snapshot.applicationId,
            status: PlacementStatus.PENDING,
          },
        },
      });
      return placement;
    } catch (error: unknown) {
      this.rethrowKnownDatabaseError(error);
    }
  }

  async getPlacementForMutation(id: string) {
    const placement = await this.prisma.internshipPlacement.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        semesterId: true,
        studentId: true,
        supervision: { select: { id: true } },
      },
    });
    if (!placement) throw this.notFound();
    return placement;
  }

  private async scopeForUser(
    user: AuthUser,
  ): Promise<Prisma.InternshipPlacementWhereInput> {
    if (user.role === Role.ADMIN) return {};
    if (user.role === Role.STUDENT) {
      const profile = await this.prisma.studentProfile.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });
      if (!profile)
        throw new NotFoundException({
          code: 'STUDENT_PROFILE_NOT_FOUND',
          message: 'Student profile not found',
        });
      return { studentId: profile.id };
    }
    if (user.role === Role.COMPANY) {
      const profile = await this.prisma.companyProfile.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });
      if (!profile)
        throw new NotFoundException({
          code: 'COMPANY_PROFILE_NOT_FOUND',
          message: 'Company profile not found',
        });
      return { companyId: profile.id };
    }
    if (user.role === Role.LECTURER) {
      const profile = await this.prisma.lecturerProfile.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });
      if (!profile)
        throw new NotFoundException({
          code: 'LECTURER_PROFILE_NOT_FOUND',
          message: 'Lecturer profile not found',
        });
      return { supervision: { lecturerId: profile.id } };
    }
    throw new ForbiddenException({
      code: 'FORBIDDEN_ROLE',
      message: 'This role cannot read placements',
    });
  }

  private async assertCanRead(placement: PlacementRecord, user: AuthUser) {
    if (user.role === Role.ADMIN) return;
    const where = await this.scopeForUser(user);
    const allowed = await this.prisma.internshipPlacement.findFirst({
      where: { AND: [{ id: placement.id }, where] },
      select: { id: true },
    });
    if (!allowed)
      throw new ForbiddenException({
        code: 'PLACEMENT_NOT_ACCESSIBLE',
        message: 'Placement is not accessible',
      });
  }

  private toRecord(item: PlacementRecord) {
    return item;
  }

  private notFound() {
    return new NotFoundException({
      code: 'PLACEMENT_NOT_FOUND',
      message: 'Placement not found',
    });
  }

  private rethrowKnownDatabaseError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002')
        throw new ConflictException({
          code: 'PLACEMENT_ALREADY_EXISTS',
          message: 'Placement already exists',
        });
      if (error.code === 'P2025') throw this.notFound();
    }
    throw error;
  }
}
