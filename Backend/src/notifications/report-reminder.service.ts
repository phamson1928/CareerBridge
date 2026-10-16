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
  SupervisionStatus,
} from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from './notifications.service';

const DAY_MS = 24 * 60 * 60 * 1000;
const RUN_INTERVAL_MS = 6 * 60 * 60 * 1000;
const REMINDER_DAYS_BEFORE_DUE = 2;

/** Sends one pre-deadline and one overdue reminder for each required report week. */
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
        student: { select: { userId: true } },
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
            title: `Sắp đến hạn nộp báo cáo tuần ${week}`,
            content: `Báo cáo tuần ${week} sẽ đến hạn sau ${Math.max(0, Math.ceil((dueDate.getTime() - today.getTime()) / DAY_MS))} ngày. Hãy hoàn tất và nộp báo cáo đúng hạn.`,
            placementId: placement.id,
            week,
            kind: 'before-due',
          });
        } else if (today > dueDate) {
          const daysLate = Math.ceil((today.getTime() - dueDate.getTime()) / DAY_MS);
          await this.createOnce({
            userId: placement.student.userId,
            eventKey: `report-reminder:${placement.id}:week:${week}:overdue`,
            title: `Báo cáo tuần ${week} đã quá hạn`,
            content: `Bạn chưa nộp báo cáo tuần ${week}. Báo cáo hiện đã trễ ${daysLate} ngày; vui lòng nộp sớm nhất có thể.`,
            placementId: placement.id,
            week,
            kind: 'overdue',
          });
        }
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

  private day(value: Date) {
    return new Date(
      Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()),
    );
  }
}
