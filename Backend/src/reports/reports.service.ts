import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  FileType,
  AcademicMonitoringStatus,
  NotificationAction,
  NotificationType,
  Prisma,
  ReportStatus,
  Role,
  SemesterStatus,
  SupervisionStatus,
} from '../generated/prisma/client';
import type { AuthUser } from '../auth/types/auth-user.type';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReportDto } from './dto/create-report.dto';
import { ListReportsQueryDto } from './dto/list-reports-query.dto';
import { ReviewReportDto, ReviewReportStatus } from './dto/review-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { SemesterLifecycleService } from '../semesters/semester-lifecycle.service';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const select = {
  id: true,
  placementId: true,
  week: true,
  title: true,
  content: true,
  fileId: true,
  status: true,
  feedback: true,
  submittedAt: true,
  reviewedAt: true,
  createdAt: true,
  updatedAt: true,
  file: {
    select: {
      id: true,
      originalName: true,
      mimeType: true,
      sizeBytes: true,
      createdAt: true,
    },
  },
  placement: {
    select: {
      id: true,
      status: true,
      academicStatus: true,
      startDate: true,
      endDate: true,
      student: {
        select: { id: true, userId: true, studentCode: true, fullName: true },
      },
      company: { select: { companyName: true } },
      internship: { select: { title: true } },
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
          status: true,
          lecturer: { select: { userId: true, fullName: true } },
        },
      },
    },
  },
} satisfies Prisma.ReportSelect;
type ReportRecord = Prisma.ReportGetPayload<{ select: typeof select }>;

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly lifecycle: SemesterLifecycleService,
  ) {}

  async create(dto: CreateReportDto, user: AuthUser) {
    await this.lifecycle.reconcile();
    const placement = await this.studentPlacement(dto.placementId, user.id);
    this.assertReportWeekAvailable(placement, dto.week);
    await this.validateFile(dto.fileId, user.id);
    try {
      const report = await this.prisma.report.create({
        data: {
          placementId: dto.placementId,
          week: dto.week,
          title: dto.title?.trim(),
          content: dto.content.trim(),
          fileId: dto.fileId,
        },
        select,
      });
      return report;
    } catch (e) {
      this.known(e);
    }
  }
  async listStudent(query: ListReportsQueryDto, user: AuthUser) {
    return this.list(query, { placement: { student: { userId: user.id } } });
  }
  async listSupervised(query: ListReportsQueryDto, user: AuthUser) {
    return this.list(query, {
      placement: {
        supervision: {
          is: {
            lecturer: { userId: user.id },
            status: {
              in: [SupervisionStatus.ACTIVE, SupervisionStatus.COMPLETED],
            },
          },
        },
      },
    });
  }
  async findOne(id: string, user: AuthUser) {
    const report = await this.prisma.report.findUnique({
      where: { id },
      select,
    });
    if (!report) throw this.notFound();
    this.access(report, user);
    return report;
  }
  async update(id: string, dto: UpdateReportDto, user: AuthUser) {
    const current = await this.findOne(id, user);
    if (current.placement.student.userId !== user.id) throw this.denied();
    if (
      current.status !== ReportStatus.DRAFT &&
      current.status !== ReportStatus.REJECTED
    )
      throw this.conflict(
        'REPORT_NOT_EDITABLE',
        'Only draft or rejected reports can be edited',
      );
    if (dto.fileId !== undefined)
      await this.validateFile(dto.fileId ?? undefined, user.id);
    return this.prisma.report.update({
      where: { id },
      data: {
        title: dto.title?.trim(),
        content: dto.content?.trim(),
        fileId: dto.fileId,
      },
      select,
    });
  }
  async submit(id: string, user: AuthUser) {
    await this.lifecycle.reconcile();
    const current = await this.findOne(id, user);
    if (current.placement.student.userId !== user.id) throw this.denied();
    this.assertReportWeekAvailable(current.placement, current.week);
    if (
      current.status !== ReportStatus.DRAFT &&
      current.status !== ReportStatus.REJECTED
    )
      throw this.conflict(
        'INVALID_REPORT_TRANSITION',
        'Only draft or rejected reports can be submitted',
      );
    const result = await this.prisma.$transaction(async (tx) => {
      const report = await tx.report.update({
        where: { id },
        data: {
          status: ReportStatus.SUBMITTED,
          submittedAt: new Date(),
          reviewedAt: null,
          feedback: null,
        },
        select,
      });
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'REPORT_SUBMITTED',
          entity: 'Report',
          entityId: id,
          metadata: { placementId: report.placementId, week: report.week },
        },
      });
      const lecturerUserId = report.placement.supervision?.lecturer.userId;
      const notification = lecturerUserId
        ? await this.notifications.createInTransaction(tx, {
            userId: lecturerUserId,
            eventKey: `report:${id}:submitted:${report.submittedAt?.toISOString()}`,
            type: NotificationType.REPORT,
            action: NotificationAction.OPEN_REPORT,
            title: 'Có báo cáo mới cần duyệt',
            content: `Báo cáo tuần ${report.week} đang chờ bạn xem xét.`,
            resourceId: id,
            metadata: { placementId: report.placementId, week: report.week },
          })
        : null;
      return { report, notifications: notification ? [notification] : [] };
    });
    this.notifications.publishMany(result.notifications);
    return result.report;
  }
  async review(id: string, dto: ReviewReportDto, user: AuthUser) {
    const current = await this.findOne(id, user);
    if (
      current.placement.supervision?.lecturer.userId !== user.id ||
      (current.placement.supervision.status !== SupervisionStatus.ACTIVE &&
        current.placement.supervision.status !== SupervisionStatus.COMPLETED)
    )
      throw this.denied();
    if (current.status !== ReportStatus.SUBMITTED)
      throw this.conflict(
        'INVALID_REPORT_TRANSITION',
        'Only submitted reports can be reviewed',
      );
    const result = await this.prisma.$transaction(async (tx) => {
      const report = await tx.report.update({
        where: { id },
        data: {
          status: dto.status,
          feedback: dto.feedback?.trim() ?? null,
          reviewedAt: new Date(),
        },
        select,
      });
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action:
            dto.status === ReviewReportStatus.APPROVED
              ? 'REPORT_APPROVED'
              : 'REPORT_REJECTED',
          entity: 'Report',
          entityId: id,
          metadata: { placementId: report.placementId },
        },
      });
      const notification = await this.notifications.createInTransaction(tx, {
        userId: report.placement.student.userId,
        eventKey: `report:${id}:reviewed:${report.status}:${report.reviewedAt?.toISOString()}`,
        type: NotificationType.REPORT,
        action: NotificationAction.OPEN_REPORT,
        title:
          report.status === ReportStatus.APPROVED
            ? 'Báo cáo đã được duyệt'
            : 'Báo cáo cần chỉnh sửa',
        content:
          report.status === ReportStatus.APPROVED
            ? 'Báo cáo của bạn đã được giảng viên duyệt.'
            : 'Báo cáo của bạn cần được chỉnh sửa theo phản hồi của giảng viên.',
        resourceId: id,
        metadata: { placementId: report.placementId, status: report.status },
      });
      return { report, notifications: [notification] };
    });
    this.notifications.publishMany(result.notifications);
    return result.report;
  }

  private async list(
    query: ListReportsQueryDto,
    scope: Prisma.ReportWhereInput,
  ) {
    const where: Prisma.ReportWhereInput = {
      ...scope,
      ...(query.status ? { status: query.status } : {}),
      ...(query.placementId ? { placementId: query.placementId } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.report.findMany({
        where,
        select,
        orderBy: [{ submittedAt: 'desc' }, { createdAt: 'desc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.report.count({ where }),
    ]);
    return {
      items,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }
  private async studentPlacement(placementId: string, userId: string) {
    const p = await this.prisma.internshipPlacement.findFirst({
      where: { id: placementId, student: { userId } },
      select: {
        status: true,
        academicStatus: true,
        startDate: true,
        endDate: true,
        semester: {
          select: { id: true, status: true, startDate: true, endDate: true },
        },
      },
    });
    if (!p) throw this.denied();
    if (p.academicStatus !== AcademicMonitoringStatus.ACTIVE)
      throw this.conflict(
        'PLACEMENT_NOT_ACTIVE',
        'Reports require active academic monitoring',
      );
    this.lifecycle.assertMonitoringOpen(p.semester);
    return p;
  }
  private assertMonitoringOpen(placement: {
    academicStatus: AcademicMonitoringStatus;
    semester: {
      id: string;
      status: SemesterStatus;
      startDate: Date;
      endDate: Date;
    };
  }) {
    if (placement.academicStatus !== AcademicMonitoringStatus.ACTIVE) {
      throw this.conflict(
        'ACADEMIC_MONITORING_CLOSED',
        'Academic monitoring for this placement is closed',
      );
    }
    this.lifecycle.assertMonitoringOpen(placement.semester);
  }
  private assertReportWeekAvailable(
    placement: {
      academicStatus: AcademicMonitoringStatus;
      startDate: Date | null;
      endDate: Date | null;
      semester: {
        id: string;
        status: SemesterStatus;
        startDate: Date;
        endDate: Date;
      };
    },
    week: number,
    now = new Date(),
  ) {
    this.assertMonitoringOpen(placement);
    if (!placement.startDate || !placement.endDate) {
      throw this.conflict(
        'PLACEMENT_SCHEDULE_REQUIRED',
        'Academic monitoring dates have not been configured',
      );
    }
    if (now < placement.startDate || now > placement.endDate) {
      throw this.conflict(
        'REPORT_OUTSIDE_MONITORING_WINDOW',
        'Reports can only be submitted during this placement monitoring window',
      );
    }
    const totalWeeks = Math.ceil(
      (placement.endDate.getTime() - placement.startDate.getTime() + 1) /
        WEEK_MS,
    );
    if (week > totalWeeks) {
      throw this.conflict(
        'REPORT_WEEK_OUT_OF_RANGE',
        `This placement has only ${totalWeeks} academic monitoring week(s)`,
      );
    }
    const currentWeek =
      Math.floor((now.getTime() - placement.startDate.getTime()) / WEEK_MS) + 1;
    if (week > currentWeek) {
      throw this.conflict(
        'REPORT_WEEK_IN_FUTURE',
        `Week ${week} has not started yet`,
      );
    }
  }
  private async validateFile(fileId: string | undefined, userId: string) {
    if (!fileId) return;
    const f = await this.prisma.file.findFirst({
      where: { id: fileId, ownerId: userId, type: FileType.REPORT },
      select: { id: true },
    });
    if (!f)
      throw new NotFoundException({
        code: 'REPORT_FILE_NOT_FOUND',
        message: 'Report file not found or not owned by student',
      });
  }
  private access(r: ReportRecord, u: AuthUser) {
    if (
      u.role === Role.ADMIN ||
      r.placement.student.userId === u.id ||
      r.placement.supervision?.lecturer.userId === u.id
    )
      return;
    throw this.denied();
  }
  private async audit(
    userId: string,
    action: string,
    entityId: string,
    metadata: Prisma.InputJsonValue,
  ) {
    await this.prisma.auditLog.create({
      data: { userId, action, entity: 'Report', entityId, metadata },
    });
  }
  private notFound() {
    return new NotFoundException({
      code: 'REPORT_NOT_FOUND',
      message: 'Report not found',
    });
  }
  private denied() {
    return new ForbiddenException({
      code: 'REPORT_NOT_ACCESSIBLE',
      message: 'Report is not accessible',
    });
  }
  private conflict(code: string, message: string) {
    return new ConflictException({ code, message });
  }
  private known(e: unknown): never {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002')
      throw this.conflict(
        'REPORT_WEEK_ALREADY_EXISTS',
        'A report already exists for this placement and week',
      );
    throw e;
  }
}
