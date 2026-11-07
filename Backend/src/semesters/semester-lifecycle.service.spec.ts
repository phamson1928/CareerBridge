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

  it('broadcasts notifications to active students and approved companies when recruitment opens', async () => {
    const notifications = {
      create: jest.fn().mockResolvedValue({}),
    };
    const mailer = {
      renderCampaignRecruitingTemplate: jest
        .fn()
        .mockReturnValue({ subject: 'Recruiting', html: '<p>Open</p>' }),
      sendCampaignAnnouncementEmail: jest.fn().mockResolvedValue(undefined),
    };
    const prisma = {
      studentProfile: {
        findMany: jest.fn().mockResolvedValue([
          {
            userId: 'student-u1',
            fullName: 'Nguyen Van A',
            user: { id: 'student-u1', email: 'vana@school.edu.vn' },
          },
        ]),
      },
      companyProfile: {
        findMany: jest.fn().mockResolvedValue([
          {
            userId: 'company-u1',
            companyName: 'FPT Software',
            user: { id: 'company-u1', email: 'hr@fpt.com' },
          },
        ]),
      },
    };

    const service = new SemesterLifecycleService(
      prisma as never,
      notifications as never,
      mailer as never,
    );

    await service.notifyCampaignRecruiting({
      id: 'sem-2026',
      name: 'Học kỳ 1 2026-2027',
      startDate: new Date('2026-09-01T00:00:00.000Z'),
      endDate: new Date('2026-12-31T00:00:00.000Z'),
    });

    expect(notifications.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'student-u1',
        eventKey: 'campaign-recruiting:sem-2026:student-u1',
        title: expect.stringContaining('Học kỳ 1 2026-2027'),
      }),
    );
    expect(notifications.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'company-u1',
        eventKey: 'campaign-recruiting-company:sem-2026:company-u1',
        title: expect.stringContaining('Học kỳ 1 2026-2027'),
      }),
    );
    expect(mailer.sendCampaignAnnouncementEmail).toHaveBeenCalledTimes(2);
  });
});
