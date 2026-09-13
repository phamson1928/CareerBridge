import {
  AcademicMonitoringStatus,
  SemesterStatus,
  SupervisionStatus,
} from '../generated/prisma/client';
import { SemesterLifecycleService } from './semester-lifecycle.service';

describe('SemesterLifecycleService', () => {
  const lifecycle = new SemesterLifecycleService({} as never);
  const campaign = {
    id: 'campaign-1',
    status: SemesterStatus.UPCOMING,
    startDate: new Date('2026-03-01T00:00:00.000Z'),
    endDate: new Date('2026-06-30T00:00:00.000Z'),
  };

  it('opens recruitment exactly one calendar month before monitoring starts', () => {
    expect(lifecycle.recruitmentStart(campaign.startDate)).toEqual(
      new Date('2026-02-01T00:00:00.000Z'),
    );
    expect(
      lifecycle.phaseOf(campaign, new Date('2026-01-31T23:59:59.000Z')),
    ).toBe('UPCOMING');
    expect(
      lifecycle.phaseOf(campaign, new Date('2026-02-01T00:00:00.000Z')),
    ).toBe('RECRUITING');
  });

  it('ends recruitment when academic monitoring starts', () => {
    expect(
      lifecycle.phaseOf(campaign, new Date('2026-03-01T00:00:00.000Z')),
    ).toBe('MONITORING');
  });

  it('keeps the end date inside the monitoring period', () => {
    expect(
      lifecycle.phaseOf(campaign, new Date('2026-06-30T23:59:59.000Z')),
    ).toBe('MONITORING');
    expect(
      lifecycle.phaseOf(campaign, new Date('2026-07-01T00:00:00.000Z')),
    ).toBe('COMPLETED');
  });

  it('treats a cancelled campaign as terminal regardless of its dates', () => {
    expect(
      lifecycle.phaseOf(
        { ...campaign, status: SemesterStatus.CANCELLED },
        new Date('2026-02-15T00:00:00.000Z'),
      ),
    ).toBe('CANCELLED');
  });

  it('activates and closes academic monitoring by placement dates', async () => {
    const prisma = {
      semester: { findMany: jest.fn().mockResolvedValue([]) },
      internship: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
      internshipPlacement: {
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      supervision: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
    };
    const service = new SemesterLifecycleService(prisma as never);
    const now = new Date('2026-09-14T12:00:00.000Z');

    await service.reconcile(now);

    expect(prisma.internshipPlacement.updateMany).toHaveBeenNthCalledWith(1, {
      where: {
        academicStatus: AcademicMonitoringStatus.PENDING,
        semester: { status: SemesterStatus.MONITORING },
        startDate: { not: null, lte: now },
        endDate: { not: null, gte: now },
        supervision: { is: { status: SupervisionStatus.ACTIVE } },
      },
      data: { academicStatus: AcademicMonitoringStatus.ACTIVE },
    });
    expect(prisma.internshipPlacement.updateMany).toHaveBeenNthCalledWith(2, {
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
  });
});
