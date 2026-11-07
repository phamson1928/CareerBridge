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

function formatViDate(date: Date): string {
  const d = new Date(date);
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const year = d.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

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
      select: {
        id: true,
        name: true,
        status: true,
        startDate: true,
        endDate: true,
      },
    });

    await Promise.all(
      semesters.map(async (semester) => {
        const status = this.statusFor(semester, now);
        if (status === semester.status) return;
        await this.prisma.semester.update({
          where: { id: semester.id },
          data: { status },
        });
        if (status === SemesterStatus.RECRUITING) {
          await this.notifyCampaignRecruiting(semester);
        } else if (status === SemesterStatus.MONITORING) {
          await this.notifyCampaignMonitoring(semester);
        }
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

  async notifyCampaignRecruiting(semester: {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
  }) {
    if (!this.notifications || !this.prisma.studentProfile?.findMany) return;
    const recruitmentStart = this.recruitmentStart(semester.startDate);
    const formattedRecruitmentStart = formatViDate(recruitmentStart);
    const formattedStart = formatViDate(semester.startDate);

    try {
      // 1. Notify Active Students
      const students = await this.prisma.studentProfile.findMany({
        where: { user: { status: 'ACTIVE' } },
        include: { user: { select: { id: true, email: true } } },
      });

      for (const student of students) {
        const eventKey = `campaign-recruiting:${semester.id}:${student.userId}`;
        await this.notifications.create({
          userId: student.userId,
          eventKey,
          type: NotificationType.INTERNSHIP,
          action: NotificationAction.OPEN_INTERNSHIP,
          title: `🎉 Đợt thực tập "${semester.name}" đã chính thức mở nhận hồ sơ!`,
          content: `Đợt tuyển dụng cho "${semester.name}" đã chính thức bắt đầu (từ ${formattedRecruitmentStart} đến ${formattedStart}). Hãy cập nhật hồ sơ và ứng tuyển ngay vào các cơ hội phù hợp!`,
          resourceId: semester.id,
          metadata: {
            semesterId: semester.id,
            semesterName: semester.name,
            phase: 'RECRUITING',
          },
        });

        if (this.mailer && student.user?.email) {
          const template = this.mailer.renderCampaignRecruitingTemplate({
            recipientName: student.fullName || 'bạn sinh viên',
            semesterName: semester.name,
            recruitmentStart,
            startDate: semester.startDate,
            isCompany: false,
          });
          void this.mailer.sendCampaignAnnouncementEmail({
            to: student.user.email,
            template,
          });
        }
      }

      // 2. Notify Approved Companies
      if (this.prisma.companyProfile?.findMany) {
        const companies = await this.prisma.companyProfile.findMany({
          where: { status: 'APPROVED' },
          include: { user: { select: { id: true, email: true } } },
        });

        for (const company of companies) {
          const eventKey = `campaign-recruiting-company:${semester.id}:${company.userId}`;
          await this.notifications.create({
            userId: company.userId,
            eventKey,
            type: NotificationType.INTERNSHIP,
            action: NotificationAction.OPEN_INTERNSHIP,
            title: `📢 Đợt thực tập "${semester.name}" đã mở cổng tuyển dụng`,
            content: `Cổng tiếp nhận tin tuyển dụng thực tập cho đợt "${semester.name}" đã chính thức mở. Quý doanh nghiệp có thể đăng bài tuyển dụng và gửi lời mời thực tập cho sinh viên.`,
            resourceId: semester.id,
            metadata: {
              semesterId: semester.id,
              semesterName: semester.name,
              phase: 'RECRUITING',
            },
          });

          if (this.mailer && company.user?.email) {
            const template = this.mailer.renderCampaignRecruitingTemplate({
              recipientName: company.companyName || 'Quý doanh nghiệp',
              semesterName: semester.name,
              recruitmentStart,
              startDate: semester.startDate,
              isCompany: true,
            });
            void this.mailer.sendCampaignAnnouncementEmail({
              to: company.user.email,
              template,
            });
          }
        }
      }
    } catch (error) {
      this.logger.error(
        `Failed to broadcast recruiting notifications for semester ${semester.id}`,
        error,
      );
    }
  }

  async notifyCampaignMonitoring(semester: {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
  }) {
    if (!this.notifications || !this.prisma.internshipPlacement?.findMany) return;
    const formattedStart = formatViDate(semester.startDate);
    const formattedEnd = formatViDate(semester.endDate);

    try {
      const placements = await this.prisma.internshipPlacement.findMany({
        where: { semesterId: semester.id },
        include: {
          student: {
            include: { user: { select: { id: true, email: true } } },
          },
          company: {
            include: { user: { select: { id: true, email: true } } },
          },
        },
      });

      for (const placement of placements) {
        const studentEventKey = `campaign-monitoring-student:${semester.id}:${placement.student.userId}`;
        await this.notifications.create({
          userId: placement.student.userId,
          eventKey: studentEventKey,
          type: NotificationType.PLACEMENT,
          action: NotificationAction.OPEN_PLACEMENT,
          title: `🚀 Bắt đầu giai đoạn thực tế: "${semester.name}"`,
          content: `Đợt tuyển dụng đã khép lại. Kỳ thực tập chính thức diễn ra từ ${formattedStart} đến ${formattedEnd}. Chúc bạn có kỳ thực tập hiệu quả và đừng quên nộp báo cáo định kỳ!`,
          resourceId: placement.id,
          metadata: {
            semesterId: semester.id,
            placementId: placement.id,
            phase: 'MONITORING',
          },
        });

        if (this.mailer && placement.student.user?.email) {
          const template = this.mailer.renderCampaignMonitoringTemplate({
            recipientName: placement.student.fullName || 'bạn sinh viên',
            semesterName: semester.name,
            startDate: semester.startDate,
            endDate: semester.endDate,
            isCompany: false,
          });
          void this.mailer.sendCampaignAnnouncementEmail({
            to: placement.student.user.email,
            template,
          });
        }

        const companyEventKey = `campaign-monitoring-company:${semester.id}:${placement.company.userId}`;
        await this.notifications.create({
          userId: placement.company.userId,
          eventKey: companyEventKey,
          type: NotificationType.PLACEMENT,
          action: NotificationAction.OPEN_PLACEMENT,
          title: `🏢 Đợt thực tập "${semester.name}" bước vào giai đoạn theo dõi thực tế`,
          content: `Giai đoạn tuyển dụng đã khép lại. Quý công ty và sinh viên bắt đầu giai đoạn làm việc thực tế và đánh giá học vụ trong đợt này.`,
          resourceId: placement.id,
          metadata: {
            semesterId: semester.id,
            placementId: placement.id,
            phase: 'MONITORING',
          },
        });

        if (this.mailer && placement.company.user?.email) {
          const template = this.mailer.renderCampaignMonitoringTemplate({
            recipientName: placement.company.companyName || 'Quý doanh nghiệp',
            semesterName: semester.name,
            startDate: semester.startDate,
            endDate: semester.endDate,
            isCompany: true,
          });
          void this.mailer.sendCampaignAnnouncementEmail({
            to: placement.company.user.email,
            template,
          });
        }
      }
    } catch (error) {
      this.logger.error(
        `Failed to broadcast monitoring notifications for semester ${semester.id}`,
        error,
      );
    }
  }
}
