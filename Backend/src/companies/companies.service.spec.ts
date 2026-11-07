import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CompaniesService } from './companies.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  ApplicationStatus,
  CompanyStatus,
  InternshipStatus,
  PlacementStatus,
  SupervisionStatus,
} from '../generated/prisma/client';
import { BadRequestException } from '@nestjs/common';

describe('CompaniesService - Suspension and Impact', () => {
  let service: CompaniesService;
  let prismaMock: any;
  let notificationsMock: any;

  beforeEach(async () => {
    prismaMock = {
      $transaction: jest.fn((cb) => cb(prismaMock)),
      companyProfile: {
        updateMany: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        findUnique: jest.fn(),
      },
      internship: {
        updateMany: jest.fn(),
        count: jest.fn(),
      },
      application: {
        findMany: jest.fn(),
        updateMany: jest.fn(),
        count: jest.fn(),
      },
      applicationStatusHistory: {
        createMany: jest.fn(),
      },
      internshipPlacement: {
        findMany: jest.fn(),
        updateMany: jest.fn(),
        count: jest.fn(),
      },
      supervision: {
        update: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
      },
    };

    notificationsMock = {
      createInTransaction: jest.fn().mockImplementation((_tx, input) => ({
        id: 'notif-1',
        ...input,
      })),
      publishMany: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompaniesService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: NotificationsService, useValue: notificationsMock },
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    service = module.get<CompaniesService>(CompaniesService);
  });

  describe('getSuspensionImpact', () => {
    it('returns impact metrics for a company', async () => {
      prismaMock.companyProfile.findUnique.mockResolvedValue({
        id: 'company-1',
        companyName: 'Acme Corp',
        status: CompanyStatus.APPROVED,
      });
      prismaMock.internship.count.mockResolvedValue(2);
      prismaMock.application.count.mockResolvedValue(5);
      prismaMock.internshipPlacement.count
        .mockResolvedValueOnce(3) // pending
        .mockResolvedValueOnce(4); // active

      const result = await service.getSuspensionImpact('company-1');

      expect(result).toEqual({
        companyId: 'company-1',
        companyName: 'Acme Corp',
        status: CompanyStatus.APPROVED,
        openInternshipsCount: 2,
        activeApplicationsCount: 5,
        pendingPlacementsCount: 3,
        activePlacementsCount: 4,
      });
    });
  });

  describe('suspend', () => {
    it('throws error if reason detail is less than 10 characters', async () => {
      await expect(
        service.suspend('company-1', 'admin-1', {
          reasonCode: 'POLICY_VIOLATION' as any,
          reasonDetail: 'short',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('successfully suspends company, closes internships, expires applications, cancels pending placements and alerts active placements', async () => {
      prismaMock.companyProfile.updateMany.mockResolvedValue({ count: 1 });
      prismaMock.internship.updateMany.mockResolvedValue({ count: 2 });
      prismaMock.companyProfile.findUniqueOrThrow.mockResolvedValue({
        id: 'company-1',
        userId: 'user-c1',
        companyName: 'Acme Corp',
        status: CompanyStatus.SUSPENDED,
      });

      // Active applications
      prismaMock.application.findMany.mockResolvedValue([
        {
          id: 'app-1',
          status: ApplicationStatus.REVIEWING,
          student: { userId: 'student-u1', fullName: 'Nguyen Van A' },
          internship: { id: 'intern-1', title: 'Frontend Intern' },
        },
      ]);
      prismaMock.application.updateMany.mockResolvedValue({ count: 1 });
      prismaMock.applicationStatusHistory.createMany.mockResolvedValue({
        count: 1,
      });

      // Pending placements
      prismaMock.internshipPlacement.findMany
        .mockResolvedValueOnce([
          {
            id: 'place-pending-1',
            internshipId: 'intern-1',
            student: { userId: 'student-u2', fullName: 'Tran Van B' },
            internship: { id: 'intern-1', title: 'Backend Intern' },
            supervision: {
              id: 'sup-1',
              lecturer: { userId: 'lecturer-u1', fullName: 'Dr. John' },
            },
          },
        ])
        // Active placements
        .mockResolvedValueOnce([
          {
            id: 'place-active-1',
            student: { userId: 'student-u3', fullName: 'Le Van C' },
            internship: { id: 'intern-2', title: 'DevOps Intern' },
            supervision: {
              id: 'sup-2',
              lecturer: { userId: 'lecturer-u2', fullName: 'Prof. Mary' },
            },
          },
        ]);

      prismaMock.internshipPlacement.updateMany.mockResolvedValue({ count: 1 });
      prismaMock.supervision.update.mockResolvedValue({});
      prismaMock.auditLog.create.mockResolvedValue({});

      await service.suspend('company-1', 'admin-1', {
        reasonCode: 'POLICY_VIOLATION',
        reasonDetail: 'Doanh nghiệp vi phạm điều khoản hợp đồng tuyển dụng',
      });

      // Assertions
      expect(prismaMock.companyProfile.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'company-1', status: CompanyStatus.APPROVED },
          data: expect.objectContaining({ status: CompanyStatus.SUSPENDED }),
        }),
      );

      // Open internships closed
      expect(prismaMock.internship.updateMany).toHaveBeenCalledWith({
        where: { companyId: 'company-1', status: InternshipStatus.OPEN },
        data: { status: InternshipStatus.CLOSED },
      });

      // Applications expired
      expect(prismaMock.application.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['app-1'] } },
        data: expect.objectContaining({ status: ApplicationStatus.EXPIRED }),
      });
      expect(prismaMock.applicationStatusHistory.createMany).toHaveBeenCalled();

      // Pending placement cancelled and filledSlots decremented
      expect(prismaMock.internshipPlacement.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['place-pending-1'] } },
        data: expect.objectContaining({
          status: PlacementStatus.CANCELLED,
          academicStatus: 'CANCELLED',
        }),
      });
      expect(prismaMock.supervision.update).toHaveBeenCalledWith({
        where: { id: 'sup-1' },
        data: expect.objectContaining({ status: SupervisionStatus.CANCELLED }),
      });

      // Audit log created with full metrics
      expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'COMPANY_SUSPENDED',
          metadata: expect.objectContaining({
            closedCount: 2,
            expiredApplicationsCount: 1,
            cancelledPendingPlacementsCount: 1,
            activePlacementsAlertedCount: 1,
          }),
        }),
      });

      // Notifications published to company, student app, student pending placement, lecturer pending, student active, lecturer active
      expect(notificationsMock.publishMany).toHaveBeenCalled();
      expect(notificationsMock.createInTransaction).toHaveBeenCalledTimes(6);
    });
  });
});
