import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InternshipsService } from './internships.service';
import { ListInternshipsQueryDto } from './dto/list-internships-query.dto';
import {
  ApplicationStatus,
  InternshipModerationReasonCode,
  InternshipReportReasonCode,
  InternshipReportStatus,
  InternshipStatus,
  SemesterStatus,
} from '../generated/prisma/client';
import { ModerationActionType } from './dto/moderate-internship.dto';

describe('InternshipsService skill filters and moderation query', () => {
  const service = new InternshipsService({} as never, {} as never, {} as never);
  const buildWhere = (
    service as unknown as {
      buildWhere: (
        query: ListInternshipsQueryDto,
        status?: unknown,
        companyId?: string,
        onlyApprovedCompany?: boolean,
      ) => unknown;
    }
  ).buildWhere.bind(service);

  it('requires an internship to contain every selected skill', () => {
    const where = buildWhere({
      page: 1,
      limit: 20,
      skillIds: ['skill-a', 'skill-b'],
    });

    expect(where).toEqual({
      AND: [
        { skills: { some: { skillId: 'skill-a' } } },
        { skills: { some: { skillId: 'skill-b' } } },
      ],
    });
  });

  it('keeps the legacy single skill filter compatible', () => {
    const where = buildWhere({
      page: 1,
      limit: 20,
      skillId: 'skill-a',
    });

    expect(where).toEqual({
      AND: [{ skills: { some: { skillId: 'skill-a' } } }],
    });
  });

  it('limits public listings to approved companies when requested', () => {
    const where = buildWhere(
      { page: 1, limit: 20 },
      undefined,
      undefined,
      true,
    );

    expect(where).toEqual({ company: { status: 'APPROVED' } });
  });

  it('supports admin filtering by companyId, hasReports, and moderationReasonCode', () => {
    const where = buildWhere(
      {
        page: 1,
        limit: 20,
        companyId: 'company-xyz',
        hasReports: true,
        moderationReasonCode: 'UNAUTHORIZED_FEE',
      },
      undefined,
      undefined,
      false,
    );

    expect(where).toEqual({
      companyId: 'company-xyz',
      AND: [
        { reports: { some: { status: InternshipReportStatus.PENDING } } },
        { moderationReasonCode: 'UNAUTHORIZED_FEE' },
      ],
    });
  });
});

describe('InternshipsService academic date validation', () => {
  const service = new InternshipsService({} as never, {} as never, {} as never);
  const validateDates = (
    service as unknown as {
      validateDates: (
        dates: {
          deadline?: Date | null;
          startDate?: Date | null;
          endDate?: Date | null;
        },
        semester: {
          id: string;
          status: SemesterStatus;
          startDate: Date;
          endDate: Date;
        },
      ) => void;
    }
  ).validateDates.bind(service);
  const semester = {
    id: 'semester-1',
    status: SemesterStatus.RECRUITING,
    startDate: new Date('2026-09-01T00:00:00.000Z'),
    endDate: new Date('2026-12-31T23:59:59.999Z'),
  };

  it('accepts either a complete proposed range or no proposed range', () => {
    expect(() => validateDates({}, semester)).not.toThrow();
    expect(() =>
      validateDates(
        {
          deadline: new Date('2026-09-09T23:59:59.999Z'),
          startDate: new Date('2026-09-10T00:00:00.000Z'),
          endDate: new Date('2026-12-01T23:59:59.999Z'),
        },
        semester,
      ),
    ).not.toThrow();
  });

  it('rejects an incomplete or out-of-campaign range', () => {
    expect(() =>
      validateDates(
        { startDate: new Date('2026-09-10T00:00:00.000Z') },
        semester,
      ),
    ).toThrow('Provide both startDate and endDate');
    expect(() =>
      validateDates(
        {
          startDate: new Date('2026-08-31T00:00:00.000Z'),
          endDate: new Date('2026-10-01T23:59:59.999Z'),
        },
        semester,
      ),
    ).toThrow('must stay within the campaign monitoring window');
  });

  it('requires the application deadline to be before the proposed start', () => {
    expect(() =>
      validateDates(
        {
          deadline: new Date('2026-09-10T00:00:00.000Z'),
          startDate: new Date('2026-09-10T00:00:00.000Z'),
          endDate: new Date('2026-10-01T23:59:59.999Z'),
        },
        semester,
      ),
    ).toThrow('Deadline must be before');
  });
});

describe('InternshipsService moderation and reports', () => {
  let prismaMock: any;
  let notificationsMock: any;
  let lifecycleMock: any;
  let service: InternshipsService;

  beforeEach(() => {
    prismaMock = {
      $transaction: jest.fn(async (callback: any) => {
        if (typeof callback === 'function') {
          return callback(prismaMock);
        }
        return Promise.all(callback);
      }),
      internship: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      application: {
        findMany: jest.fn(),
        updateMany: jest.fn(),
      },
      studentProfile: {
        findUnique: jest.fn(),
      },
      internshipReport: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
      },
    };

    notificationsMock = {
      createInTransaction: jest.fn().mockImplementation((_tx, data) => ({
        id: `notif-${Date.now()}`,
        ...data,
      })),
      publishMany: jest.fn(),
    };

    lifecycleMock = {
      recruitmentStart: jest.fn().mockReturnValue('2026-08-01T00:00:00.000Z'),
      phaseOf: jest.fn().mockReturnValue('RECRUITING'),
    };

    service = new InternshipsService(
      prismaMock,
      lifecycleMock,
      notificationsMock,
    );
  });

  it('moderates an internship with REJECT action, withdraws active applications, and notifies parties', async () => {
    const mockInternship = {
      id: 'internship-1',
      title: 'Tuyển Thực tập sinh Backend',
      status: InternshipStatus.OPEN,
      companyId: 'comp-1',
      company: {
        id: 'comp-1',
        userId: 'comp-user-1',
        companyName: 'Công ty Công nghệ ABC',
      },
      semester: { startDate: new Date('2026-09-01') },
      skills: [],
    };
    prismaMock.internship.findUnique.mockResolvedValue(mockInternship);

    const activeApps = [
      {
        id: 'app-1',
        internshipId: 'internship-1',
        status: ApplicationStatus.REVIEWING,
        student: { userId: 'student-user-1', fullName: 'Nguyen Van A' },
      },
    ];
    prismaMock.application.findMany.mockResolvedValue(activeApps);
    prismaMock.application.updateMany.mockResolvedValue({ count: 1 });

    const updatedInternship = {
      ...mockInternship,
      status: InternshipStatus.REJECTED,
      moderationReasonCode: InternshipModerationReasonCode.UNAUTHORIZED_FEE,
      moderationReason: 'Yêu cầu ứng viên nộp tiền giữ chỗ khi phỏng vấn',
      moderatedById: 'admin-1',
      moderatedAt: new Date(),
    };
    prismaMock.internship.update.mockResolvedValue(updatedInternship);

    const result = await service.moderate('internship-1', 'admin-1', {
      action: ModerationActionType.REJECT,
      reasonCode: InternshipModerationReasonCode.UNAUTHORIZED_FEE,
      reasonDetail: 'Yêu cầu ứng viên nộp tiền giữ chỗ khi phỏng vấn',
      notifyApplicants: true,
    });

    expect(prismaMock.internship.update).toHaveBeenCalledWith({
      where: { id: 'internship-1' },
      data: expect.objectContaining({
        status: InternshipStatus.REJECTED,
        moderationReasonCode: InternshipModerationReasonCode.UNAUTHORIZED_FEE,
        moderationReason: 'Yêu cầu ứng viên nộp tiền giữ chỗ khi phỏng vấn',
        moderatedById: 'admin-1',
      }),
      select: expect.any(Object),
    });

    expect(prismaMock.application.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['app-1'] } },
      data: expect.objectContaining({
        status: ApplicationStatus.WITHDRAWN,
      }),
    });

    expect(notificationsMock.createInTransaction).toHaveBeenCalledTimes(2); // 1 for company + 1 for applicant
    expect(notificationsMock.publishMany).toHaveBeenCalled();
    expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'INTERNSHIP_MODERATED',
        entity: 'Internship',
        entityId: 'internship-1',
      }),
    });
    expect(result.status).toBe(InternshipStatus.REJECTED);
  });

  it('moderates an internship with REQUEST_REVISION action (turns status to DRAFT)', async () => {
    const mockInternship = {
      id: 'internship-2',
      title: 'Tuyển Thiết kế UI/UX',
      status: InternshipStatus.OPEN,
      companyId: 'comp-1',
      company: {
        id: 'comp-1',
        userId: 'comp-user-1',
        companyName: 'Công ty ABC',
      },
      semester: { startDate: new Date('2026-09-01') },
      skills: [],
    };
    prismaMock.internship.findUnique.mockResolvedValue(mockInternship);
    prismaMock.internship.update.mockResolvedValue({
      ...mockInternship,
      status: InternshipStatus.DRAFT,
      moderationReason: 'Vui lòng bổ sung mức phụ cấp rõ ràng',
    });

    const result = await service.moderate('internship-2', 'admin-1', {
      action: ModerationActionType.REQUEST_REVISION,
      reasonDetail: 'Vui lòng bổ sung mức phụ cấp rõ ràng',
    });

    expect(prismaMock.internship.update).toHaveBeenCalledWith({
      where: { id: 'internship-2' },
      data: expect.objectContaining({
        status: InternshipStatus.DRAFT,
        moderationReason: 'Vui lòng bổ sung mức phụ cấp rõ ràng',
      }),
      select: expect.any(Object),
    });
    expect(result.status).toBe(InternshipStatus.DRAFT);
  });

  it('moderates an internship with RESTORE action (clears moderation reason)', async () => {
    const mockInternship = {
      id: 'internship-3',
      title: 'Tuyển QA/QC',
      status: InternshipStatus.REJECTED,
      companyId: 'comp-1',
      company: {
        id: 'comp-1',
        userId: 'comp-user-1',
        companyName: 'Công ty ABC',
      },
      semester: { startDate: new Date('2026-09-01') },
      skills: [],
    };
    prismaMock.internship.findUnique.mockResolvedValue(mockInternship);
    prismaMock.internship.update.mockResolvedValue({
      ...mockInternship,
      status: InternshipStatus.DRAFT,
      moderationReasonCode: null,
      moderationReason: null,
    });

    const result = await service.moderate('internship-3', 'admin-1', {
      action: ModerationActionType.RESTORE,
      reasonDetail: 'Doanh nghiệp đã giải trình hợp lệ, khôi phục tin',
    });

    expect(prismaMock.internship.update).toHaveBeenCalledWith({
      where: { id: 'internship-3' },
      data: expect.objectContaining({
        status: InternshipStatus.DRAFT,
        moderationReasonCode: null,
        moderationReason: null,
      }),
      select: expect.any(Object),
    });
    expect(result.status).toBe(InternshipStatus.DRAFT);
  });

  it('allows a student to report an internship', async () => {
    prismaMock.studentProfile.findUnique.mockResolvedValue({
      id: 'student-profile-1',
      fullName: 'Le Thi B',
    });
    prismaMock.internship.findUnique.mockResolvedValue({
      id: 'internship-1',
      title: 'Tuyển Dev',
      companyId: 'comp-1',
    });
    prismaMock.internshipReport.findFirst.mockResolvedValue(null);
    prismaMock.internshipReport.create.mockResolvedValue({
      id: 'report-1',
      internshipId: 'internship-1',
      studentId: 'student-profile-1',
      reasonCode: InternshipReportReasonCode.FEE_CHARGED,
      status: InternshipReportStatus.PENDING,
    });

    const report = await service.report('internship-1', 'student-user-1', {
      reasonCode: InternshipReportReasonCode.FEE_CHARGED,
      reasonDetail: 'Bắt đóng tiền cọc hồ sơ 500k',
    });

    expect(report.id).toBe('report-1');
    expect(prismaMock.internshipReport.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        internshipId: 'internship-1',
        studentId: 'student-profile-1',
        reasonCode: InternshipReportReasonCode.FEE_CHARGED,
        status: InternshipReportStatus.PENDING,
      }),
      include: expect.any(Object),
    });
  });

  it('blocks duplicate pending reports from the same student on the same internship', async () => {
    prismaMock.studentProfile.findUnique.mockResolvedValue({
      id: 'student-profile-1',
      fullName: 'Le Thi B',
    });
    prismaMock.internship.findUnique.mockResolvedValue({
      id: 'internship-1',
      title: 'Tuyển Dev',
      companyId: 'comp-1',
    });
    prismaMock.internshipReport.findFirst.mockResolvedValue({ id: 'existing-report-1' });

    await expect(
      service.report('internship-1', 'student-user-1', {
        reasonCode: InternshipReportReasonCode.FEE_CHARGED,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('allows admin to review a report', async () => {
    prismaMock.internshipReport.findUnique.mockResolvedValue({
      id: 'report-1',
      internshipId: 'internship-1',
      status: InternshipReportStatus.PENDING,
    });
    prismaMock.internshipReport.update.mockResolvedValue({
      id: 'report-1',
      status: InternshipReportStatus.RESOLVED,
      adminNotes: 'Đã nhắc nhở công ty gỡ yêu cầu nộp tiền',
      reviewedById: 'admin-1',
    });

    const result = await service.reviewReport('report-1', 'admin-1', {
      status: InternshipReportStatus.RESOLVED,
      adminNotes: 'Đã nhắc nhở công ty gỡ yêu cầu nộp tiền',
    });

    expect(prismaMock.internshipReport.update).toHaveBeenCalledWith({
      where: { id: 'report-1' },
      data: expect.objectContaining({
        status: InternshipReportStatus.RESOLVED,
        adminNotes: 'Đã nhắc nhở công ty gỡ yêu cầu nộp tiền',
        reviewedById: 'admin-1',
      }),
      include: expect.any(Object),
    });
    expect(result.status).toBe(InternshipReportStatus.RESOLVED);
  });
});
