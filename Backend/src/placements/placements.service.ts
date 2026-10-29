import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  PlacementStatus,
  ReportStatus,
  Role,
  SupervisionStatus,
  NotificationAction,
  NotificationType,
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
import { UpdatePlacementDto } from './dto/update-placement.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { SemesterLifecycleService } from '../semesters/semester-lifecycle.service';

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
  academicStatus: true,
  academicClosedAt: true,
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
      avatarFileId: true,
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
      assignedById: true,
      status: true,
      assignedAt: true,
      completedAt: true,
      assignedBy: { select: { id: true, email: true, role: true } },
      lecturer: {
        select: {
          id: true,
          userId: true,
          fullName: true,
          department: true,
          title: true,
          avatarFileId: true,
        },
      },
    },
  },
} satisfies Prisma.InternshipPlacementSelect;

export type PlacementRecord = Prisma.InternshipPlacementGetPayload<{
  select: typeof placementSelect;
}>;

export interface PlacementProgress {
  reportCount: number;
  weeklyReportCount: number;
  finalReportStatus: ReportStatus | null;
  draftReports: number;
  submittedReports: number;
  reportsAwaitingReview: number;
  approvedReports: number;
  rejectedReports: number;
  evaluationCount: number;
  hasCompanyEvaluation: boolean;
  hasLecturerEvaluation: boolean;
  companyScore: number | null;
  lecturerScore: number | null;
  finalScore: number | null;
  hasCompanyCertificate: boolean;
  lastReportAt: Date | null;
}

@Injectable()
export class PlacementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly lifecycle: SemesterLifecycleService,
  ) {}

  async list(query: ListPlacementsQueryDto) {
    await this.lifecycle.reconcile();
    const search = query.search?.trim();
    const activeSupervision: Prisma.SupervisionWhereInput = {
      status: SupervisionStatus.ACTIVE,
      ...(query.lecturerId ? { lecturerId: query.lecturerId } : {}),
    };
    const supervisionFilter: Prisma.InternshipPlacementWhereInput =
      query.assignmentStatus === PlacementAssignmentStatus.UNASSIGNED
        ? { NOT: { supervision: { is: { status: SupervisionStatus.ACTIVE } } } }
        : query.assignmentStatus === PlacementAssignmentStatus.ASSIGNED ||
            query.lecturerId
          ? { supervision: { is: activeSupervision } }
          : {};
    const where: Prisma.InternshipPlacementWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.semesterId ? { semesterId: query.semesterId } : {}),
      ...(query.companyId ? { companyId: query.companyId } : {}),
      ...supervisionFilter,
      ...(query.reportStatus
        ? { reports: { some: { status: query.reportStatus } } }
        : {}),
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

    const progress = await this.progressByPlacementIds(
      items.map((item) => item.id),
    );
    return {
      items: items.map((item) => this.toRecord(item, progress.get(item.id))),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async listMine(user: AuthUser) {
    await this.lifecycle.reconcile();
    const where = await this.scopeForUser(user);
    const items = await this.prisma.internshipPlacement.findMany({
      where,
      select: placementSelect,
      orderBy: [{ createdAt: 'desc' }],
    });
    const progress = await this.progressByPlacementIds(
      items.map((item) => item.id),
    );
    return {
      items: items.map((item) => this.toRecord(item, progress.get(item.id))),
    };
  }

  async findById(id: string, user: AuthUser) {
    await this.lifecycle.reconcile();
    const placement = await this.prisma.internshipPlacement.findUnique({
      where: { id },
      select: placementSelect,
    });
    if (!placement) throw this.notFound();
    await this.assertCanRead(placement, user);
    const progress = await this.progressByPlacementIds([placement.id]);
    return this.toRecord(placement, progress.get(placement.id), true);
  }

  async update(id: string, dto: UpdatePlacementDto, actorId: string) {
    if (dto.startDate === undefined && dto.endDate === undefined) {
      throw new BadRequestException({
        code: 'PLACEMENT_UPDATE_EMPTY',
        message: 'Provide startDate, endDate, or both',
      });
    }

    try {
      const placement = await this.runSerializable(async (tx) => {
        const current = await tx.internshipPlacement.findUnique({
          where: { id },
          select: {
            id: true,
            status: true,
            academicStatus: true,
            startDate: true,
            endDate: true,
            semester: {
              select: { startDate: true, endDate: true },
            },
          },
        });
        if (!current) throw this.notFound();
        if (current.academicStatus !== 'PENDING') {
          throw new ConflictException({
            code: 'PLACEMENT_IMMUTABLE',
            message:
              'Academic dates cannot be changed after monitoring has started or ended',
          });
        }

        const startDate =
          dto.startDate === undefined
            ? current.startDate
            : new Date(dto.startDate);
        const endDate =
          dto.endDate === undefined ? current.endDate : new Date(dto.endDate);
        if (!startDate || !endDate) {
          throw new BadRequestException({
            code: 'PLACEMENT_DATES_INCOMPLETE',
            message: 'Both startDate and endDate are required',
          });
        }
        if (startDate >= endDate) {
          throw new BadRequestException({
            code: 'INVALID_PLACEMENT_DATE_RANGE',
            message: 'startDate must be before endDate',
          });
        }
        if (
          startDate < current.semester.startDate ||
          endDate > current.semester.endDate
        ) {
          throw new BadRequestException({
            code: 'PLACEMENT_DATES_OUTSIDE_CAMPAIGN',
            message:
              'Placement academic dates must stay within the campaign monitoring window',
          });
        }
        const update = await tx.internshipPlacement.updateMany({
          where: {
            id,
            status: current.status,
            academicStatus: current.academicStatus,
          },
          data: { startDate, endDate },
        });
        if (update.count !== 1) {
          throw new ConflictException({
            code: 'PLACEMENT_STATUS_CONFLICT',
            message: 'Placement changed concurrently; refresh and try again',
          });
        }
        await tx.auditLog.create({
          data: {
            userId: actorId,
            action: 'PLACEMENT_SCHEDULE_UPDATED',
            entity: 'InternshipPlacement',
            entityId: id,
            metadata: {
              from: { startDate: current.startDate, endDate: current.endDate },
              to: { startDate, endDate },
            },
          },
        });
        return tx.internshipPlacement.findUniqueOrThrow({
          where: { id },
          select: placementSelect,
        });
      });
      const progress = await this.progressByPlacementIds([placement.id]);
      return this.toRecord(placement, progress.get(placement.id), true);
    } catch (error: unknown) {
      this.rethrowKnownDatabaseError(error);
    }
  }

  async updateStatus(
    id: string,
    dto: UpdatePlacementStatusDto,
    actorId: string,
  ) {
    try {
      const placement = await this.runSerializable(async (tx) => {
        const current = await tx.internshipPlacement.findUnique({
          where: { id },
          select: {
            id: true,
            internshipId: true,
            status: true,
            academicStatus: true,
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
        if (dto.status === PublicPlacementStatus.COMPLETED) {
          const [reports, evaluations] = await Promise.all([
            tx.report.findMany({
              where: { placementId: id },
              select: { status: true, week: true },
            }),
            tx.evaluation.findMany({
              where: { placementId: id },
              select: { type: true },
            }),
          ]);
          const pendingOrRejected = reports.filter(
            (r) =>
              r.status === ReportStatus.SUBMITTED ||
              r.status === ReportStatus.REJECTED,
          ).length;
          if (pendingOrRejected > 0) {
            throw new ConflictException({
              code: 'PLACEMENT_HAS_PENDING_REPORTS',
              message:
                'Cần giảng viên duyệt hết các báo cáo đang chờ hoặc cần chỉnh sửa trước khi hoàn tất hồ sơ thực tập.',
            });
          }
          const approvedCount = reports.filter(
            (r) => r.status === ReportStatus.APPROVED,
          ).length;
          if (approvedCount === 0) {
            throw new ConflictException({
              code: 'PLACEMENT_MISSING_APPROVED_REPORTS',
              message:
                'Sinh viên cần có ít nhất 1 báo cáo thực tập đã được giảng viên phê duyệt trước khi nghiệm thu hoàn tất.',
            });
          }
          const hasCompany = evaluations.some((e) => e.type === 'COMPANY');
          const hasLecturer = evaluations.some((e) => e.type === 'LECTURER');
          if (!hasCompany || !hasLecturer) {
            throw new ConflictException({
              code: 'PLACEMENT_MISSING_EVALUATIONS',
              message:
                'Cần có đầy đủ đánh giá của cả Doanh nghiệp và Giảng viên hướng dẫn trước khi xác nhận hoàn tất hồ sơ thực tập.',
            });
          }
        }

        const statusUpdate = await tx.internshipPlacement.updateMany({
          where: { id, status: current.status },
          data: {
            status: dto.status,
            ...(dto.status === PublicPlacementStatus.CANCELLED
              ? { academicStatus: 'CANCELLED', academicClosedAt: new Date() }
              : dto.status === PublicPlacementStatus.COMPLETED &&
                  current.academicStatus !== 'CLOSED'
                ? { academicStatus: 'CLOSED', academicClosedAt: new Date() }
                : {}),
          },
        });
        if (statusUpdate.count !== 1) {
          throw new ConflictException({
            code: 'PLACEMENT_STATUS_CONFLICT',
            message:
              'Placement status changed concurrently; refresh and try again',
          });
        }

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
            metadata: { from: current.status, to: dto.status, note: dto.note },
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
        if (
          dto.status === PublicPlacementStatus.CANCELLED &&
          current.supervision?.status === SupervisionStatus.ACTIVE
        ) {
          await tx.auditLog.create({
            data: {
              userId: actorId,
              action: 'SUPERVISION_CANCELLED',
              entity: 'Supervision',
              entityId: current.supervision.id,
              metadata: { placementId: id, note: dto.note },
            },
          });
        }
        return tx.internshipPlacement.findUniqueOrThrow({
          where: { id },
          select: placementSelect,
        });
      });
      const recipients = [
        placement.student.userId,
        placement.company.userId,
        placement.supervision?.lecturer.userId,
      ].filter((value): value is string => Boolean(value));
      for (const userId of [...new Set(recipients)]) {
        await this.notifications.create({
          userId,
          eventKey: `placement:${id}:status:${dto.status}:${userId}`,
          type: NotificationType.PLACEMENT,
          action: NotificationAction.OPEN_PLACEMENT,
          title:
            dto.status === PublicPlacementStatus.COMPLETED
              ? 'Kỳ thực tập đã hoàn thành'
              : 'Hồ sơ thực tập đã bị hủy',
          content:
            dto.status === PublicPlacementStatus.COMPLETED
              ? `Hồ sơ thực tập vị trí "${placement.internship.title}" của sinh viên ${placement.student.fullName} tại ${placement.company.companyName} đã được xác nhận hoàn thành.`
              : `Hồ sơ thực tập vị trí "${placement.internship.title}" của sinh viên ${placement.student.fullName} tại ${placement.company.companyName} đã bị hủy.`,
          resourceId: id,
          metadata: { status: dto.status },
        });
      }
      const progress = await this.progressByPlacementIds([placement.id]);
      return this.toRecord(placement, progress.get(placement.id), true);
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

  private async progressByPlacementIds(ids: string[]) {
    const progress = new Map<string, PlacementProgress>();
    if (ids.length === 0) return progress;
    const [reports, evaluations] = await this.prisma.$transaction([
      this.prisma.report.findMany({
        where: { placementId: { in: ids } },
        select: { placementId: true, week: true, status: true, updatedAt: true },
      }),
      this.prisma.evaluation.findMany({
        where: { placementId: { in: ids } },
        select: {
          placementId: true,
          type: true,
          score: true,
          certificateFileId: true,
        },
      }),
    ]);
    for (const id of ids) {
      progress.set(id, {
        reportCount: 0,
        weeklyReportCount: 0,
        finalReportStatus: null,
        draftReports: 0,
        submittedReports: 0,
        reportsAwaitingReview: 0,
        approvedReports: 0,
        rejectedReports: 0,
        evaluationCount: 0,
        hasCompanyEvaluation: false,
        hasLecturerEvaluation: false,
        companyScore: null,
        lecturerScore: null,
        finalScore: null,
        hasCompanyCertificate: false,
        lastReportAt: null,
      });
    }
    for (const row of reports) {
      const item = progress.get(row.placementId)!;
      item.reportCount += 1;
      if (row.week === 0) {
        item.finalReportStatus = row.status;
      } else {
        item.weeklyReportCount += 1;
      }
      if (row.status === ReportStatus.DRAFT) item.draftReports += 1;
      if (row.status === ReportStatus.SUBMITTED) item.submittedReports += 1;
      if (row.status === ReportStatus.APPROVED) item.approvedReports += 1;
      if (row.status === ReportStatus.REJECTED) item.rejectedReports += 1;
      if (!item.lastReportAt || row.updatedAt > item.lastReportAt)
        item.lastReportAt = row.updatedAt;
    }
    for (const row of evaluations) {
      const item = progress.get(row.placementId)!;
      item.evaluationCount += 1;
      if (row.type === 'COMPANY') {
        item.hasCompanyEvaluation = true;
        item.companyScore = row.score;
        item.hasCompanyCertificate = Boolean(row.certificateFileId);
      }
      if (row.type === 'LECTURER') {
        item.hasLecturerEvaluation = true;
        item.lecturerScore = row.score;
      }
    }
    for (const item of progress.values()) {
      item.reportsAwaitingReview = item.submittedReports;
      if (item.companyScore !== null && item.lecturerScore !== null) {
        item.finalScore =
          Math.round(((item.companyScore + item.lecturerScore) / 2) * 100) / 100;
      }
    }
    return progress;
  }

  private toRecord(
    item: PlacementRecord,
    progress?: PlacementProgress,
    _includeDetailedProgress = false,
  ) {
    const summary: PlacementProgress = progress ?? {
      reportCount: 0,
      weeklyReportCount: 0,
      finalReportStatus: null,
      draftReports: 0,
      submittedReports: 0,
      reportsAwaitingReview: 0,
      approvedReports: 0,
      rejectedReports: 0,
      evaluationCount: 0,
      hasCompanyEvaluation: false,
      hasLecturerEvaluation: false,
      companyScore: null,
      lecturerScore: null,
      finalScore: null,
      hasCompanyCertificate: false,
      lastReportAt: null,
    };
    return {
      ...item,
      assignmentStatus:
        item.supervision?.status === SupervisionStatus.ACTIVE
          ? PlacementAssignmentStatus.ASSIGNED
          : PlacementAssignmentStatus.UNASSIGNED,
      progress: summary,
    };
  }

  private async runSerializable<T>(
    operation: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await this.prisma.$transaction(operation, {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        });
      } catch (error: unknown) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2034' &&
          attempt < 2
        ) {
          continue;
        }
        throw error;
      }
    }
    throw new Error('Placement transaction retry limit reached');
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
