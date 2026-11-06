import { Test, TestingModule } from '@nestjs/testing';
import { PlacementsService } from './placements.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SemesterLifecycleService } from '../semesters/semester-lifecycle.service';
import {
  CompanyStatus,
  PlacementStatus,
  ReportStatus,
  Role,
  UserStatus,
} from '../generated/prisma/client';
import { PublicPlacementStatus } from './dto/update-placement-status.dto';
import { ConflictException } from '@nestjs/common';

describe('PlacementsService - Evaluation Waiver on Suspended Company', () => {
  let service: PlacementsService;
  let prismaMock: any;
  let notificationsMock: any;
  let lifecycleMock: any;

  beforeEach(async () => {
    prismaMock = {
      $transaction: jest.fn((cb) => cb(prismaMock)),
      internshipPlacement: {
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        updateMany: jest.fn(),
      },
      report: {
        findMany: jest.fn(),
      },
      evaluation: {
        findMany: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
      },
    };

    notificationsMock = {
      create: jest.fn(),
      createInTransaction: jest.fn(),
      publishMany: jest.fn(),
    };

    lifecycleMock = {
      reconcile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlacementsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: NotificationsService, useValue: notificationsMock },
        { provide: SemesterLifecycleService, useValue: lifecycleMock },
      ],
    }).compile();

    service = module.get<PlacementsService>(PlacementsService);
  });

  const adminUser = {
    id: 'admin-1',
    role: Role.ADMIN,
    email: 'admin@test.com',
    status: UserStatus.ACTIVE,
  };

  it('allows completion without company evaluation if company is SUSPENDED and lecturer evaluation exists', async () => {
    prismaMock.internshipPlacement.findUnique.mockResolvedValue({
      id: 'place-1',
      internshipId: 'intern-1',
      status: PlacementStatus.ACTIVE,
      academicStatus: 'ACTIVE',
      company: { id: 'comp-1', status: CompanyStatus.SUSPENDED },
      supervision: null,
    });

    prismaMock.report.findMany.mockResolvedValue([
      { status: ReportStatus.APPROVED, week: 1 },
    ]);

    // Only lecturer evaluation exists
    prismaMock.evaluation.findMany.mockResolvedValue([{ type: 'LECTURER' }]);

    prismaMock.internshipPlacement.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.internshipPlacement.findUniqueOrThrow.mockResolvedValue({
      id: 'place-1',
      status: PlacementStatus.COMPLETED,
      academicStatus: 'CLOSED',
      student: { userId: 'student-u1', fullName: 'Student A' },
      company: { userId: 'company-u1', companyName: 'Acme' },
      supervision: null,
      internship: { title: 'Internship' },
      semester: { name: 'Fall 2026' },
      reports: [],
      evaluations: [],
    });

    // Mock progressByPlacementIds to return a map
    jest
      .spyOn<any, any>(service, 'progressByPlacementIds')
      .mockResolvedValue(new Map());

    const result = await service.updateStatus(
      'place-1',
      { status: PublicPlacementStatus.COMPLETED },
      adminUser,
    );

    expect(result).toBeDefined();
    expect(prismaMock.internshipPlacement.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'place-1', status: PlacementStatus.ACTIVE },
        data: expect.objectContaining({
          status: PublicPlacementStatus.COMPLETED,
        }),
      }),
    );
  });

  it('throws PLACEMENT_MISSING_EVALUATIONS if company is APPROVED but missing company evaluation', async () => {
    prismaMock.internshipPlacement.findUnique.mockResolvedValue({
      id: 'place-1',
      internshipId: 'intern-1',
      status: PlacementStatus.ACTIVE,
      academicStatus: 'ACTIVE',
      company: { id: 'comp-1', status: CompanyStatus.APPROVED },
      supervision: null,
    });

    prismaMock.report.findMany.mockResolvedValue([
      { status: ReportStatus.APPROVED, week: 1 },
    ]);

    // Only lecturer evaluation exists
    prismaMock.evaluation.findMany.mockResolvedValue([{ type: 'LECTURER' }]);

    await expect(
      service.updateStatus(
        'place-1',
        { status: PublicPlacementStatus.COMPLETED },
        adminUser,
      ),
    ).rejects.toThrow(ConflictException);
  });
});
