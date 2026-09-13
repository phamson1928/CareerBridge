import {
  ConflictException,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import {
  AcademicMonitoringStatus,
  InternshipStatus,
  SemesterStatus,
  SupervisionStatus,
} from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type InternshipCampaignPhase =
  'UPCOMING' | 'RECRUITING' | 'MONITORING' | 'COMPLETED' | 'CANCELLED';

export type SemesterWindow = {
  id: string;
  status: SemesterStatus;
  startDate: Date;
  endDate: Date;
};

const RECONCILIATION_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Applies the time-based rules of an internship campaign.
 * The recruitment window is one calendar month before the monitoring period.
 */
@Injectable()
export class SemesterLifecycleService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SemesterLifecycleService.name);
  private timer?: ReturnType<typeof setInterval>;
  private reconciliation?: Promise<void>;

  constructor(private readonly prisma: PrismaService) {}

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

    await this.prisma.internshipPlacement.updateMany({
      where: {
        academicStatus: AcademicMonitoringStatus.PENDING,
        semester: { status: SemesterStatus.MONITORING },
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
        semester: { status: SemesterStatus.COMPLETED },
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
}
