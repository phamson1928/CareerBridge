import {
  BadRequestException,
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
  PlacementStatus,
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
const MAX_INTERNSHIP_WEEKS = 10;

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
      company: { select: { id: true, userId: true, companyName: true } },
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
    this.assertCanCreateOrSubmit(placement, dto.week);
    await this.validateFile(dto.fileId, user.id);
    try {
      const defaultTitle =
        dto.week === 0
          ? 'Báo cáo tổng kết thực tập cuối kỳ'
          : `Báo cáo thực tập tuần ${dto.week}`;
      const report = await this.prisma.report.create({
        data: {
          placementId: dto.placementId,
          week: dto.week,
          title: dto.title?.trim() || defaultTitle,
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

  async listCompany(query: ListReportsQueryDto, user: AuthUser) {
    return this.list(query, {
      placement: { company: { userId: user.id } },
      status: {
        in: [
          ReportStatus.SUBMITTED,
          ReportStatus.APPROVED,
          ReportStatus.REJECTED,
        ],
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
    this.assertCanCreateOrSubmit(current.placement, current.week);
    if (
      current.status !== ReportStatus.DRAFT &&
      current.status !== ReportStatus.REJECTED
    )
      throw this.conflict(
        'INVALID_REPORT_TRANSITION',
        'Only draft or rejected reports can be submitted',
      );
    if (current.week === 0 && !current.fileId) {
      throw new BadRequestException({
        code: 'FINAL_REPORT_FILE_REQUIRED',
        message:
          'Báo cáo tổng kết thực tập cuối kỳ bắt buộc phải đính kèm tệp báo cáo hoàn chỉnh (PDF/DOCX).',
      });
    }
    const reportLabel =
      current.week === 0
        ? 'Báo cáo tổng kết thực tập'
        : `báo cáo thực tập tuần ${current.week}`;
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
            title:
              report.week === 0
                ? 'Sinh viên nộp Báo cáo tổng kết thực tập'
                : 'Sinh viên nộp báo cáo thực tập mới',
            content: `Sinh viên ${report.placement.student.fullName} vừa nộp ${reportLabel} và đang chờ bạn nhận xét, phê duyệt.`,
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
    if (
      dto.status === ReviewReportStatus.REJECTED &&
      (!dto.feedback || !dto.feedback.trim())
    ) {
      throw new BadRequestException({
        code: 'REPORT_FEEDBACK_REQUIRED',
        message:
          'Vui lòng nhập nhận xét chi tiết khi yêu cầu sinh viên chỉnh sửa lại báo cáo.',
      });
    }
    const reportTitleText =
      current.week === 0
        ? 'Báo cáo tổng kết thực tập'
        : `Báo cáo tuần ${current.week}`;
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
          metadata: { placementId: report.placementId, week: report.week },
        },
      });
      const notification = await this.notifications.createInTransaction(tx, {
        userId: report.placement.student.userId,
        eventKey: `report:${id}:reviewed:${report.status}:${report.reviewedAt?.toISOString()}`,
        type: NotificationType.REPORT,
        action: NotificationAction.OPEN_REPORT,
        title:
          report.status === ReportStatus.APPROVED
            ? `${reportTitleText} đã được phê duyệt`
            : `${reportTitleText} cần chỉnh sửa`,
        content:
          report.status === ReportStatus.APPROVED
            ? `Giảng viên hướng dẫn đã phê duyệt ${reportTitleText.toLowerCase()} của bạn.`
            : `Giảng viên hướng dẫn đã gửi nhận xét và yêu cầu bạn bổ sung, chỉnh sửa lại ${reportTitleText.toLowerCase()}.`,
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
        orderBy: [{ week: 'asc' }, { submittedAt: 'desc' }, { createdAt: 'desc' }],
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
    if (
      p.status !== PlacementStatus.ACTIVE ||
      (p.academicStatus !== AcademicMonitoringStatus.ACTIVE &&
        p.academicStatus !== AcademicMonitoringStatus.CLOSED)
    ) {
      throw this.conflict(
        'PLACEMENT_NOT_ACTIVE',
        'Hồ sơ thực tập chưa bắt đầu theo dõi hoặc đã hoàn tất nghiệm thu.',
      );
    }
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

  /**
   * Kept for strict monitoring window checks and unit tests.
   */
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
    if (week === 0) return;
    const totalWeeks = Math.min(
      MAX_INTERNSHIP_WEEKS,
      Math.ceil(
        (placement.endDate.getTime() - placement.startDate.getTime() + 1) /
          WEEK_MS,
      ),
    );
    if (week > totalWeeks) {
      throw this.conflict(
        'REPORT_WEEK_OUT_OF_RANGE',
        `This placement has only ${totalWeeks} academic monitoring week(s)`,
      );
    }
    const currentWeek = Math.min(
      MAX_INTERNSHIP_WEEKS,
      Math.floor((now.getTime() - placement.startDate.getTime()) / WEEK_MS) + 1,
    );
    if (week > currentWeek) {
      throw this.conflict(
        'REPORT_WEEK_IN_FUTURE',
        `Week ${week} has not started yet`,
      );
    }
  }

  /**
   * Allows weekly reports (1..totalWeeks, max 10 weeks) once their week has started AND
   * allows Final Report (week = 0) or late/revised submissions while the
   * placement is still ACTIVE (not yet marked COMPLETED or CANCELLED).
   */
  private assertCanCreateOrSubmit(
    placement: {
      status: string;
      academicStatus: AcademicMonitoringStatus;
      startDate: Date | null;
      endDate: Date | null;
    },
    week: number,
    now = new Date(),
  ) {
    if (
      placement.status !== PlacementStatus.ACTIVE ||
      (placement.academicStatus !== AcademicMonitoringStatus.ACTIVE &&
        placement.academicStatus !== AcademicMonitoringStatus.CLOSED)
    ) {
      throw this.conflict(
        'ACADEMIC_MONITORING_CLOSED',
        'Hồ sơ thực tập chưa mở theo dõi hoặc đã hoàn tất nghiệm thu.',
      );
    }
    if (!placement.startDate || !placement.endDate) {
      throw this.conflict(
        'PLACEMENT_SCHEDULE_REQUIRED',
        'Academic monitoring dates have not been configured',
      );
    }
    if (now < placement.startDate) {
      throw this.conflict(
        'REPORT_OUTSIDE_MONITORING_WINDOW',
        'Đợt thực tập chưa đến ngày bắt đầu.',
      );
    }
    if (week === 0) {
      return;
    }
    const totalWeeks = Math.min(
      MAX_INTERNSHIP_WEEKS,
      Math.ceil(
        (placement.endDate.getTime() - placement.startDate.getTime() + 1) /
          WEEK_MS,
      ),
    );
    if (week > totalWeeks) {
      throw this.conflict(
        'REPORT_WEEK_OUT_OF_RANGE',
        `Đợt thực tập này chỉ có tối đa ${totalWeeks} tuần theo dõi (chuẩn tối đa 10 tuần).`,
      );
    }
    const effectiveNow = Math.min(now.getTime(), placement.endDate.getTime());
    const currentWeek = Math.min(
      totalWeeks,
      Math.floor((effectiveNow - placement.startDate.getTime()) / WEEK_MS) + 1,
    );
    if (week > currentWeek) {
      throw this.conflict(
        'REPORT_WEEK_IN_FUTURE',
        `Tuần ${week} chưa bắt đầu, chưa thể tạo hoặc nộp báo cáo.`,
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
      r.placement.company.userId === u.id ||
      r.placement.supervision?.lecturer.userId === u.id
    )
      return;
    throw this.denied();
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
        'Báo cáo của mục này đã tồn tại trong hồ sơ thực tập.',
      );
    throw e;
  }
}
