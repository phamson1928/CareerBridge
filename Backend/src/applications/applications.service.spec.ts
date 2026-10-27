import { BadRequestException } from '@nestjs/common';
import { ApplicationStatus, Role } from '../generated/prisma/client';
import { PlacementsService } from '../placements/placements.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../auth/types/auth-user.type';
import { NotificationsService } from '../notifications/notifications.service';
import { SemesterLifecycleService } from '../semesters/semester-lifecycle.service';
import { MailerService } from '../mailer/mailer.service';
import { ApplicationsService } from './applications.service';

type OfferAcceptanceTestService = {
  acceptOffer: (id: string, user: AuthUser) => Promise<unknown>;
  acceptOfferOnce: (id: string, user: AuthUser) => Promise<unknown>;
};

describe('ApplicationsService interview & offer workflow', () => {
  const studentUser: AuthUser = {
    id: 'student-user-id',
    email: 'student@example.com',
    role: Role.STUDENT,
  };

  const companyUser: AuthUser = {
    id: 'company-user-id',
    email: 'company@example.com',
    role: Role.COMPANY,
  };

  const mockLifecycle = {
    reconcile: jest.fn().mockResolvedValue(undefined),
  } as unknown as SemesterLifecycleService;

  it('retries serializable transaction conflicts on acceptOffer before succeeding', async () => {
    const service = new ApplicationsService(
      {} as PrismaService,
      {} as PlacementsService,
      {} as NotificationsService,
      mockLifecycle,
      {} as MailerService,
    );
    const retryableService = service as unknown as OfferAcceptanceTestService;
    const acceptOfferOnce = jest
      .spyOn(retryableService, 'acceptOfferOnce')
      .mockRejectedValueOnce({ code: 'P2034' })
      .mockRejectedValueOnce({ code: 'P2034' })
      .mockResolvedValueOnce({ id: 'application-id', status: 'ACCEPTED' });

    const result = await retryableService.acceptOffer(
      'application-id',
      studentUser,
    );

    expect(acceptOfferOnce).toHaveBeenCalledTimes(3);
    expect(result).toEqual({ id: 'application-id', status: 'ACCEPTED' });
  });

  it('blocks direct ACCEPTED status update and requires interview -> offer flow', async () => {
    const mockPrisma = {
      application: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'application-id',
          status: ApplicationStatus.PENDING,
          student: { userId: 'student-user-id', fullName: 'Student' },
          internship: {
            id: 'internship-id',
            title: 'Intern',
            company: { userId: companyUser.id, companyName: 'Company' },
            semester: {
              id: 'semester-id',
              status: 'RECRUITING',
              startDate: new Date(Date.now() + 30 * 86400000),
              endDate: new Date(Date.now() + 90 * 86400000),
            },
          },
        }),
      },
      companyProfile: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'company-id',
          userId: companyUser.id,
          status: 'APPROVED',
        }),
      },
    } as unknown as PrismaService;

    const service = new ApplicationsService(
      mockPrisma,
      {} as PlacementsService,
      {} as NotificationsService,
      mockLifecycle,
      {} as MailerService,
    );

    await expect(
      service.updateStatus(
        'application-id',
        { status: ApplicationStatus.ACCEPTED },
        companyUser,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('blocks resendEmail when application is EXPIRED', async () => {
    const mockPrisma = {
      application: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'application-id',
          status: ApplicationStatus.EXPIRED,
          student: { userId: studentUser.id, fullName: 'Student' },
          internship: {
            id: 'internship-id',
            title: 'Intern',
            company: { userId: companyUser.id, companyName: 'Company' },
          },
        }),
      },
      companyProfile: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'company-id',
          userId: companyUser.id,
          status: 'APPROVED',
        }),
      },
    } as unknown as PrismaService;

    const service = new ApplicationsService(
      mockPrisma,
      {} as PlacementsService,
      {} as NotificationsService,
      mockLifecycle,
      {} as MailerService,
    );

    await expect(
      service.resendEmail('application-id', 'log-id', companyUser),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('allows per-side remove only for finalized applications and blocks active ones', async () => {
    const updateMock = jest.fn().mockResolvedValue({ id: 'application-id' });
    const auditMock = jest.fn().mockResolvedValue({ id: 'audit-id' });
    const findUniqueMock = jest
      .fn()
      .mockResolvedValueOnce({
        id: 'application-id',
        status: ApplicationStatus.INTERVIEWING,
        student: { userId: studentUser.id },
        internship: { company: { userId: companyUser.id } },
      })
      .mockResolvedValueOnce({
        id: 'application-id',
        status: ApplicationStatus.EXPIRED,
        student: { userId: studentUser.id },
        internship: { company: { userId: companyUser.id } },
      });

    const mockPrisma = {
      application: {
        findUnique: findUniqueMock,
        update: updateMock,
      },
      auditLog: {
        create: auditMock,
      },
      $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
    } as unknown as PrismaService;

    const service = new ApplicationsService(
      mockPrisma,
      {} as PlacementsService,
      {} as NotificationsService,
      mockLifecycle,
      {} as MailerService,
    );

    await expect(
      service.remove('application-id', companyUser),
    ).rejects.toBeInstanceOf(BadRequestException);

    const res = await service.remove('application-id', companyUser);
    expect(res).toEqual({ id: 'application-id', deleted: true });
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'application-id' },
        data: expect.objectContaining({
          hiddenByCompanyAt: expect.any(Date),
        }),
      }),
    );
  });
});
