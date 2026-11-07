import {
  ConflictException,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  Optional,
} from '@nestjs/common';
import {
  AcademicMonitoringStatus,
  ApplicationStatus,
  EmailLogType,
  InternshipStatus,
  NotificationAction,
  NotificationType,
  PlacementStatus,
  ReportStatus,
  SemesterStatus,
  SupervisionStatus,
} from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { MailerService } from '../mailer/mailer.service';

export type InternshipCampaignPhase =
  'UPCOMING' | 'RECRUITING' | 'MONITORING' | 'COMPLETED' | 'CANCELLED';

export type SemesterWindow = {
  id: string;
  status: SemesterStatus;
  startDate: Date;
  endDate: Date;
};

const RECONCILIATION_INTERVAL_MS = 5 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Applies the time-based rules of an internship campaign.
 * The recruitment window is one calendar month before the monitoring period.
 */
@Injectable()
export class SemesterLifecycleService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SemesterLifecycleService.name);
  private timer?: ReturnType<typeof setInterval>;
  private reconciliation?: Promise<void>;

  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly notifications?: NotificationsService,
    @Optional() private readonly mailer?: MailerService,
  ) {}

  onModuleInit() {
    void this.reconcile().catch((error: unknown) =>
      this.logger.error('Unable to reconcile internship campaigns', error),
    );
    this.timer = setInterval(() => {
      void this.reconcile().catch((error: unknown) =>
        this.logger.error('Unable to reconcile internship campaigns', error),
      );
    }, RECONCILIATION_INTERVAL_MS);
    this.timer.unref();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  recruitmentStart(startDate: Date) {
    const year = startDate.getUTCFullYear();
    const month = startDate.getUTCMonth() - 1;
    const day = startDate.getUTCDate();
    const firstOfTargetMonth = new Date(Date.UTC(year, month, 1));
    const lastDayOfTargetMonth = new Date(
      Date.UTC(
        firstOfTargetMonth.getUTCFullYear(),
        firstOfTargetMonth.getUTCMonth() + 1,
        0,
      ),
    ).getUTCDate();
    return new Date(
      Date.UTC(
        firstOfTargetMonth.getUTCFullYear(),
        firstOfTargetMonth.getUTCMonth(),
        Math.min(day, lastDayOfTargetMonth),
      ),
    );
  }

  phaseOf(semester: SemesterWindow, now = new Date()): InternshipCampaignPhase {
    if (semester.status === SemesterStatus.CANCELLED) return 'CANCELLED';

    const monitoringEndExclusive = new Date(
      Date.UTC(
        semester.endDate.getUTCFullYear(),
        semester.endDate.getUTCMonth(),
        semester.endDate.getUTCDate() + 1,
      ),
    );
    if (now >= monitoringEndExclusive) return 'COMPLETED';
    if (now >= semester.startDate) return 'MONITORING';
    if (now >= this.recruitmentStart(semester.startDate)) return 'RECRUITING';
    return 'UPCOMING';
  }

  statusFor(semester: SemesterWindow, now = new Date()): SemesterStatus {
    const phase = this.phaseOf(semester, now);
    return SemesterStatus[phase];
  }

  assertRecruitmentOpen(semester: SemesterWindow, now = new Date()) {
    if (this.phaseOf(semester, now) !== 'RECRUITING') {
      throw new ConflictException({
        code: 'RECRUITMENT_CLOSED',
        message:
          'Internships can only be posted, applied for, or accepted during the recruitment window.',
      });
    }
  }

  assertMonitoringOpen(semester: SemesterWindow, now = new Date()) {
    if (this.phaseOf(semester, now) !== 'MONITORING') {
      throw new ConflictException({
        code: 'ACADEMIC_MONITORING_CLOSED',
        message:
          'Academic reports and evaluations are only available during the monitoring period.',
      });
    }
  }

  async reconcile(now = new Date()): Promise<void> {
    if (this.reconciliation) return this.reconciliation;
    this.reconciliation = this.reconcileInternal(now).finally(() => {
      this.reconciliation = undefined;
    });
    return this.reconciliation;
  }

  private async reconcileInternal(now: Date) {
    const semesters = await this.prisma.semester.findMany({
      where: { status: { not: SemesterStatus.CANCELLED } },
      select: { id: true, status: true, startDate: true, endDate: true },
    });

    await Promise.all(
      semesters.map((semester) => {
        const status = this.statusFor(semester, now);
        return status === semester.status
          ? Promise.resolve()
          : this.prisma.semester.update({
              where: { id: semester.id },
              data: { status },
            });
      }),
    );

    await this.prisma.internship.updateMany({
      where: {
        status: InternshipStatus.OPEN,
        semester: { startDate: { lte: now } },
      },
      data: { status: InternshipStatus.CLOSED },
    });

    await this.reconcileApplicationOffersAndCampaigns(now);

    await this.prisma.internshipPlacement.updateMany({
      where: {
        academicStatus: AcademicMonitoringStatus.PENDING,
        semester: { status: SemesterStatus.MONITORING },
        startDate: { not: null, lte: now },
        endDate: { not: null, gte: now },
        supervision: { is: { status: SupervisionStatus.ACTIVE } },
      },
      data: { academicStatus: AcademicMonitoringStatus.ACTIVE },
    });

    await this.prisma.internshipPlacement.updateMany({
      where: {
        academicStatus: {
          in: [
            AcademicMonitoringStatus.PENDING,
            AcademicMonitoringStatus.ACTIVE,
          ],
        },
        OR: [
          { semester: { status: SemesterStatus.COMPLETED } },
          { endDate: { not: null, lt: now } },
        ],
      },
      data: {
        academicStatus: AcademicMonitoringStatus.CLOSED,
        academicClosedAt: now,
      },
    });

    await this.prisma.supervision.updateMany({
      where: {
        status: SupervisionStatus.ACTIVE,
        placement: {
          academicStatus: AcademicMonitoringStatus.CLOSED,
        },
      },
      data: { status: SupervisionStatus.COMPLETED, completedAt: now },
    });

    await this.reconcileAutoCompletedPlacements(now);
  }

  async autoCompletePlacementIfEligible(
    placementId: string,
    now = new Date(),
  ): Promise<boolean> {
    if (!this.prisma.internshipPlacement?.findUnique) return false;

    const placement = await this.prisma.internshipPlacement.findUnique({
      where: { id: placementId },
      select: {
        id: true,
        status: true,
        academicStatus: true,
        student: { select: { userId: true, fullName: true } },
        company: { select: { userId: true, companyName: true } },
        internship: { select: { title: true } },
        supervision: {
          select: {
            id: true,
            status: true,
            lecturer: { select: { userId: true } },
          },
        },
        reports: { select: { status: true } },
        evaluations: { select: { type: true } },
      },
    });

    if (!placement || placement.status !== PlacementStatus.ACTIVE) {
      return false;
    }

    const hasCompanyEval = placement.evaluations.some(
      (e) => e.type === 'COMPANY',
    );
    const hasLecturerEval = placement.evaluations.some(
      (e) => e.type === 'LECTURER',
    );
    const hasApprovedReport = placement.reports.some(
      (r) => r.status === ReportStatus.APPROVED,
    );
    const hasPendingOrRejectedReport = placement.reports.some(
      (r) =>
        r.status === ReportStatus.SUBMITTED ||
        r.status === ReportStatus.REJECTED,
    );

    if (
      !hasCompanyEval ||
      !hasLecturerEval ||
      !hasApprovedReport ||
      hasPendingOrRejectedReport
    ) {
      return false;
    }

    const updated = await this.prisma.internshipPlacement.updateMany({
      where: { id: placement.id, status: PlacementStatus.ACTIVE },
      data: {
        status: PlacementStatus.COMPLETED,
        ...(placement.academicStatus !== AcademicMonitoringStatus.CLOSED
          ? {
              academicStatus: AcademicMonitoringStatus.CLOSED,
              academicClosedAt: now,
            }
          : {}),
      },
    });

    if (updated.count !== 1) return false;

    if (placement.supervision?.status === SupervisionStatus.ACTIVE) {
      await this.prisma.supervision.update({
        where: { id: placement.supervision.id },
        data: {
          status: SupervisionStatus.COMPLETED,
          completedAt: now,
        },
      });
    }

    await this.prisma.auditLog?.create({
      data: {
        userId: null,
        action: 'PLACEMENT_STATUS_CHANGED',
        entity: 'InternshipPlacement',
        entityId: placement.id,
        metadata: {
          from: PlacementStatus.ACTIVE,
          to: PlacementStatus.COMPLETED,
          note: 'Tự động hoàn tất khi đủ báo cáo được duyệt và điểm đánh giá từ Doanh nghiệp & Giảng viên hướng dẫn.',
        },
      },
    });

    const recipients = [
      placement.student.userId,
      placement.company.userId,
      placement.supervision?.lecturer.userId,
    ].filter((value): value is string => Boolean(value));

    for (const userId of [...new Set(recipients)]) {
      await this.notifications?.create({
        userId,
        eventKey: `placement:${placement.id}:status:COMPLETED:${userId}`,
        type: NotificationType.PLACEMENT,
        action: NotificationAction.OPEN_PLACEMENT,
        title: 'Kỳ thực tập đã hoàn thành',
        content: `Hồ sơ thực tập vị trí "${placement.internship.title}" của sinh viên ${placement.student.fullName} tại ${placement.company.companyName} đã hoàn tất đầy đủ báo cáo và điểm đánh giá cuối kỳ.`,
        resourceId: placement.id,
        metadata: { status: PlacementStatus.COMPLETED },
      });
    }

    return true;
  }

  private async reconcileAutoCompletedPlacements(now: Date) {
    if (!this.prisma.internshipPlacement?.findMany) return;

    const candidates = await this.prisma.internshipPlacement.findMany({
      where: {
        status: PlacementStatus.ACTIVE,
        evaluations: { some: { type: 'COMPANY' } },
        AND: [
          { evaluations: { some: { type: 'LECTURER' } } },
          { reports: { some: { status: ReportStatus.APPROVED } } },
          {
            reports: {
              none: {
                status: {
                  in: [ReportStatus.SUBMITTED, ReportStatus.REJECTED],
                },
              },
            },
          },
        ],
      },
      select: { id: true },
    });

    for (const candidate of candidates) {
      await this.autoCompletePlacementIfEligible(candidate.id, now);
    }
  }

  private async reconcileApplicationOffersAndCampaigns(now: Date) {
    if (!this.prisma.application?.findMany) return;

    // 1. Overdue offers -> EXPIRED
    const overdueOffers = await this.prisma.application.findMany({
      where: {
        status: ApplicationStatus.OFFERED,
        offerExpiresAt: { not: null, lt: now },
      },
      include: {
        student: { include: { user: true } },
        internship: { include: { company: { include: { user: true } } } },
      },
    });

    for (const app of overdueOffers) {
      await this.prisma.application.update({
        where: { id: app.id },
        data: { status: ApplicationStatus.EXPIRED, respondedAt: now },
      });
      await this.prisma.applicationStatusHistory?.create({
        data: {
          applicationId: app.id,
          fromStatus: ApplicationStatus.OFFERED,
          toStatus: ApplicationStatus.EXPIRED,
          changedById: null,
          note: 'Quá hạn phản hồi lời mời thực tập',
        },
      });

      await this.notifications?.create({
        userId: app.student.userId,
        eventKey: `offer-expired:${app.id}:student`,
        type: NotificationType.APPLICATION,
        action: NotificationAction.OPEN_APPLICATION,
        title: 'Lời mời thực tập đã hết hạn xác nhận',
        content: `Lời mời thực tập vị trí "${app.internship.title}" tại ${app.internship.company.companyName} đã tự động hủy do quá thời hạn xác nhận.`,
        resourceId: app.id,
        metadata: { applicationId: app.id, status: ApplicationStatus.EXPIRED },
      });

      await this.notifications?.create({
        userId: app.internship.company.userId,
        eventKey: `offer-expired:${app.id}:company`,
        type: NotificationType.APPLICATION,
        action: NotificationAction.OPEN_APPLICATION,
        title: 'Lời mời thực tập đã quá hạn phản hồi',
        content: `Ứng viên ${app.student.fullName} chưa phản hồi lời mời thực tập vị trí "${app.internship.title}" trong thời hạn quy định. Chỉ tiêu tuyển dụng đã được hoàn lại để quý công ty chọn ứng viên khác.`,
        resourceId: app.id,
        metadata: { applicationId: app.id, status: ApplicationStatus.EXPIRED },
      });

      if (this.mailer) {
        const studentTemplate =
          this.mailer.renderCampaignExpiredStudentTemplate({
            studentName: app.student.fullName,
            companyName: app.internship.company.companyName,
            internshipTitle: app.internship.title,
            reasonText: 'Quá thời hạn xác nhận lời mời thực tập',
          });
        await this.mailer.sendAndLogApplicationEmail({
          applicationId: app.id,
          type: EmailLogType.OFFER_EXPIRED,
          to: app.student.user.email,
          template: studentTemplate,
        });

        const companyTemplate = this.mailer.renderOfferDeclinedCompanyTemplate({
          companyName: app.internship.company.companyName,
          studentName: app.student.fullName,
          internshipTitle: app.internship.title,
          reasonLabel: 'Ứng viên không phản hồi trong thời hạn quy định',
        });
        await this.mailer.sendAndLogApplicationEmail({
          applicationId: app.id,
          type: EmailLogType.OFFER_EXPIRED,
          to: app.internship.company.user.email,
          template: companyTemplate,
        });
      }
    }

    // 2. 24h offer reminder for offers expiring within 24 hours
    const reminderThreshold = new Date(now.getTime() + DAY_MS);
    const soonExpiringOffers = await this.prisma.application.findMany({
      where: {
        status: ApplicationStatus.OFFERED,
        offerReminderSentAt: null,
        offerExpiresAt: { gt: now, lte: reminderThreshold },
      },
      include: {
        student: { include: { user: true } },
        internship: { include: { company: true } },
      },
    });

    for (const app of soonExpiringOffers) {
      await this.prisma.application.update({
        where: { id: app.id },
        data: { offerReminderSentAt: now },
      });

      await this.notifications?.create({
        userId: app.student.userId,
        eventKey: `offer-reminder-24h:${app.id}`,
        type: NotificationType.APPLICATION,
        action: NotificationAction.OPEN_APPLICATION,
        title: 'Lời mời thực tập sắp hết hạn xác nhận',
        content: `Bạn còn chưa đầy 24 giờ để phản hồi lời mời thực tập vị trí "${app.internship.title}" tại ${app.internship.company.companyName}. Vui lòng xác nhận sớm trước khi lời mời hết hiệu lực.`,
        resourceId: app.id,
        metadata: { applicationId: app.id, status: ApplicationStatus.OFFERED },
      });

      if (this.mailer && app.offerExpiresAt) {
        const template = this.mailer.renderOfferReminderTemplate({
          studentName: app.student.fullName,
          companyName: app.internship.company.companyName,
          internshipTitle: app.internship.title,
          offerExpiresAt: app.offerExpiresAt,
        });
        await this.mailer.sendAndLogApplicationEmail({
          applicationId: app.id,
          type: EmailLogType.OFFER_REMINDER,
          to: app.student.user.email,
          template,
        });
      }
    }

    // 3. Campaign recruitment ended -> expire remaining open applications
    const campaignExpiredApps = await this.prisma.application.findMany({
      where: {
        status: {
          in: [
            ApplicationStatus.PENDING,
            ApplicationStatus.REVIEWING,
            ApplicationStatus.INTERVIEWING,
            ApplicationStatus.OFFERED,
          ],
        },
        internship: {
          OR: [
            { semester: { startDate: { lte: now } } },
            { semester: { status: SemesterStatus.CANCELLED } },
          ],
        },
      },
      include: {
        student: { include: { user: true } },
        internship: { include: { company: true } },
      },
    });

    for (const app of campaignExpiredApps) {
      await this.prisma.application.update({
        where: { id: app.id },
        data: { status: ApplicationStatus.EXPIRED, respondedAt: now },
      });
      await this.prisma.applicationStatusHistory?.create({
        data: {
          applicationId: app.id,
          fromStatus: app.status,
          toStatus: ApplicationStatus.EXPIRED,
          changedById: null,
          note: 'Đợt tuyển dụng thực tập đã kết thúc',
        },
      });

      await this.notifications?.create({
        userId: app.student.userId,
        eventKey: `campaign-expired:${app.id}`,
        type: NotificationType.APPLICATION,
        action: NotificationAction.OPEN_APPLICATION,
        title: 'Đợt tuyển dụng học kỳ đã khép lại',
        content: `Hồ sơ ứng tuyển vị trí "${app.internship.title}" tại ${app.internship.company.companyName} đã tự động đóng do thời gian tuyển dụng của học kỳ đã kết thúc.`,
        resourceId: app.id,
        metadata: { applicationId: app.id, status: ApplicationStatus.EXPIRED },
      });

      if (this.mailer) {
        const template = this.mailer.renderCampaignExpiredStudentTemplate({
          studentName: app.student.fullName,
          companyName: app.internship.company.companyName,
          internshipTitle: app.internship.title,
          reasonText: 'Đợt tuyển dụng của kỳ thực tập đã kết thúc',
        });
        await this.mailer.sendAndLogApplicationEmail({
          applicationId: app.id,
          type: EmailLogType.OFFER_EXPIRED,
          to: app.student.user.email,
          template,
        });
      }
    }
  }
}
