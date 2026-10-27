import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import {
  AcademicMonitoringStatus,
  NotificationAction,
  NotificationType,
  PlacementStatus,
  Prisma,
  Role,
  SupervisionStatus,
  UserStatus,
} from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from './notifications.service';

const DAY_MS = 24 * 60 * 60 * 1000;
const RUN_INTERVAL_MS = 6 * 60 * 60 * 1000;
const REMINDER_DAYS_BEFORE_DUE = 2;
const PLACEMENT_WARNING_DAYS = 7;

/** Sends report deadline reminders and placement lifecycle alerts (unassigned lecturer & monitoring ending soon). */
@Injectable()
export class ReportReminderService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ReportReminderService.name);
  private timer?: ReturnType<typeof setInterval>;
  private running?: Promise<void>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  onModuleInit() {
    void this.run().catch((error: unknown) =>
      this.logger.error('Unable to send report reminders', error),
    );
    this.timer = setInterval(() => {
      void this.run().catch((error: unknown) =>
        this.logger.error('Unable to send report reminders', error),
      );
    }, RUN_INTERVAL_MS);
    this.timer.unref();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async run(now = new Date()) {
    if (this.running) return this.running;
    this.running = this.runInternal(now).finally(() => {
      this.running = undefined;
    });
    return this.running;
  }

  private async runInternal(now: Date) {
    const today = this.day(now);
    const placements = await this.prisma.internshipPlacement.findMany({
      where: {
        status: PlacementStatus.ACTIVE,
        academicStatus: AcademicMonitoringStatus.ACTIVE,
        startDate: { not: null, lte: now },
        endDate: { not: null, gte: now },
        supervision: { is: { status: SupervisionStatus.ACTIVE } },
      },
      select: {
        id: true,
        startDate: true,
        endDate: true,
        student: { select: { userId: true, fullName: true } },
        company: { select: { userId: true, companyName: true } },
        internship: { select: { title: true } },
        supervision: {
          select: {
            lecturer: { select: { userId: true } },
          },
        },
        reports: { select: { week: true, status: true } },
      },
    });

    for (const placement of placements) {
      if (!placement.startDate || !placement.endDate) continue;
      const start = this.day(placement.startDate);
      const end = this.day(placement.endDate);
      const totalWeeks = Math.ceil((end.getTime() - start.getTime() + DAY_MS) / (7 * DAY_MS));
      const submittedWeeks = new Set(
        placement.reports
          .filter((report) => report.status !== 'DRAFT')
          .map((report) => report.week),
      );

      for (let week = 1; week <= totalWeeks; week += 1) {
        if (submittedWeeks.has(week)) continue;
        const dueDate = new Date(start.getTime() + week * 7 * DAY_MS - DAY_MS);
        const reminderDate = new Date(
          dueDate.getTime() - REMINDER_DAYS_BEFORE_DUE * DAY_MS,
        );
        if (today >= reminderDate && today <= dueDate) {
          await this.createOnce({
            userId: placement.student.userId,
            eventKey: `report-reminder:${placement.id}:week:${week}:before-due`,
            title: `Sắp đến hạn nộp báo cáo thực tập tuần ${week}`,
            content: `Báo cáo thực tập tuần ${week} sẽ đến hạn sau ${Math.max(0, Math.ceil((dueDate.getTime() - today.getTime()) / DAY_MS))} ngày nữa. Bạn vui lòng hoàn tất và nộp báo cáo đúng thời gian quy định.`,
            placementId: placement.id,
            week,
            kind: 'before-due',
          });
        } else if (today > dueDate) {
          const daysLate = Math.ceil((today.getTime() - dueDate.getTime()) / DAY_MS);
          await this.createOnce({
            userId: placement.student.userId,
            eventKey: `report-reminder:${placement.id}:week:${week}:overdue`,
            title: `Báo cáo thực tập tuần ${week} đã quá hạn`,
            content: `Bạn chưa nộp báo cáo thực tập tuần ${week} (đã trễ ${daysLate} ngày). Vui lòng hoàn thiện và nộp bổ sung sớm nhất có thể.`,
            placementId: placement.id,
            week,
            kind: 'overdue',
          });
        }
      }

      // Check if placement monitoring is ending within 7 days
      const daysUntilEnd = Math.ceil((end.getTime() - today.getTime()) / DAY_MS);
      if (daysUntilEnd >= 0 && daysUntilEnd <= PLACEMENT_WARNING_DAYS) {
        await this.createPlacementAlertOnce({
          userId: placement.student.userId,
          eventKey: `placement-ending:${placement.id}:student`,
          title: 'Thực tập sắp hết thời gian theo dõi',
          content: `Kỳ thực tập "${placement.internship.title}" tại ${placement.company.companyName} sẽ kết thúc thời gian theo dõi sau ${daysUntilEnd} ngày. Hãy hoàn tất và nộp đầy đủ các báo cáo tuần trước khi hệ thống đóng theo dõi.`,
          placementId: placement.id,
          action: NotificationAction.OPEN_PLACEMENT,
        });

        await this.createPlacementAlertOnce({
          userId: placement.company.userId,
          eventKey: `placement-ending:${placement.id}:company`,
          title: 'Thực tập sinh sắp hết thời gian theo dõi',
          content: `Thực tập sinh ${placement.student.fullName} (${placement.internship.title}) sẽ kết thúc thời gian theo dõi sau ${daysUntilEnd} ngày. Vui lòng hoàn tất đánh giá thực tập cho sinh viên.`,
          placementId: placement.id,
          action: NotificationAction.OPEN_EVALUATION,
        });

        if (placement.supervision?.lecturer?.userId) {
          await this.createPlacementAlertOnce({
            userId: placement.supervision.lecturer.userId,
            eventKey: `placement-ending:${placement.id}:lecturer`,
            title: 'Sinh viên hướng dẫn sắp hết thời gian theo dõi',
            content: `Sinh viên ${placement.student.fullName} thực tập tại ${placement.company.companyName} sẽ kết thúc thời gian theo dõi sau ${daysUntilEnd} ngày. Vui lòng rà soát báo cáo tuần và hoàn tất chấm điểm hướng dẫn.`,
            placementId: placement.id,
            action: NotificationAction.OPEN_EVALUATION,
          });
        }
      }
    }

    // Check unassigned placements starting within 7 days (or already past startDate)
    await this.checkUnassignedPlacementsStartingSoon(today);
  }

  private async checkUnassignedPlacementsStartingSoon(today: Date) {
    if (!this.prisma.user?.findMany) return;

    const threshold = new Date(today.getTime() + PLACEMENT_WARNING_DAYS * DAY_MS);
    const unassignedPlacements = await this.prisma.internshipPlacement.findMany({
      where: {
        status: PlacementStatus.PENDING,
        startDate: { not: null, lte: threshold },
        OR: [
          { supervision: { is: null } },
          { supervision: { isNot: { status: SupervisionStatus.ACTIVE } } },
        ],
      },
      select: {
        id: true,
        startDate: true,
        student: { select: { fullName: true } },
        company: { select: { companyName: true } },
        internship: { select: { title: true } },
      },
    });

    if (unassignedPlacements.length === 0) return;

    const admins = await this.prisma.user.findMany({
      where: { role: Role.ADMIN, status: UserStatus.ACTIVE },
      select: { id: true },
    });

    for (const placement of unassignedPlacements) {
      if (!placement.startDate) continue;
      const start = this.day(placement.startDate);
      const daysLeft = Math.ceil((start.getTime() - today.getTime()) / DAY_MS);
      const timeDesc =
        daysLeft > 0
          ? `sẽ bắt đầu sau ${daysLeft} ngày`
          : 'đã đến ngày bắt đầu thực tập';

      for (const admin of admins) {
        await this.createPlacementAlertOnce({
          userId: admin.id,
          eventKey: `placement-unassigned:${placement.id}:admin:${admin.id}`,
          title: 'Cần phân công giảng viên hướng dẫn',
          content: `Sinh viên ${placement.student.fullName} (${placement.internship.title} - ${placement.company.companyName}) ${timeDesc} nhưng chưa được phân công giảng viên hướng dẫn.`,
          placementId: placement.id,
          action: NotificationAction.OPEN_PLACEMENT,
        });
      }
    }
  }

  private async createOnce(input: {
    userId: string;
    eventKey: string;
    title: string;
    content: string;
    placementId: string;
    week: number;
    kind: 'before-due' | 'overdue';
  }) {
    try {
      await this.notifications.create({
        userId: input.userId,
        eventKey: input.eventKey,
        type: NotificationType.REPORT,
        action: NotificationAction.OPEN_REPORT,
        title: input.title,
        content: input.content,
        resourceId: input.placementId,
        metadata: {
          placementId: input.placementId,
          week: input.week,
          reminderKind: input.kind,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return;
      }
      throw error;
    }
  }

  private async createPlacementAlertOnce(input: {
    userId: string;
    eventKey: string;
    title: string;
    content: string;
    placementId: string;
    action: NotificationAction;
  }) {
    try {
      await this.notifications.create({
        userId: input.userId,
        eventKey: input.eventKey,
        type: NotificationType.SYSTEM,
        action: input.action,
        title: input.title,
        content: input.content,
        resourceId: input.placementId,
        metadata: {
          placementId: input.placementId,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return;
      }
      throw error;
    }
  }

  private day(value: Date) {
    return new Date(
      Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()),
    );
  }
}

