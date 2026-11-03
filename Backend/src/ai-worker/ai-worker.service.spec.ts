import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { AiWorkerService } from './ai-worker.service';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseStorageService } from '../files/supabase-storage.service';
import {
  AiCandidateRecommendation,
  AiScanStatus,
  CompanyStatus,
} from '../generated/prisma/client';
import { AuthenticatedAiWorker } from './guards/ai-worker-auth.guard';

describe('AiWorkerService', () => {
  let service: AiWorkerService;
  let mockPrisma: any;
  let mockStorage: any;

  const mockWorker: AuthenticatedAiWorker = {
    id: 'worker-id-1',
    companyId: 'company-id-1',
    name: 'Worker Gemini 2.5 Pro',
    modelName: 'gemini-2.5-pro',
    company: {
      id: 'company-id-1',
      companyName: 'TechCorp Vietnam',
    },
  };

  beforeEach(() => {
    mockPrisma = {
      companyProfile: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      companyAiWorker: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
      },
      aiScanJob: {
        count: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
      },
      application: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      $queryRaw: jest.fn(),
      $transaction: jest.fn((callback) => callback(mockPrisma)),
    };

    mockStorage = {
      createDownloadUrl: jest.fn(),
    };

    service = new AiWorkerService(
      mockPrisma as PrismaService,
      mockStorage as SupabaseStorageService,
    );
  });

  describe('createCompanyWorker', () => {
    it('throws ForbiddenException if company is not approved', async () => {
      mockPrisma.companyProfile.findUnique.mockResolvedValue({
        id: 'company-id-1',
        status: CompanyStatus.PENDING,
      });

      await expect(
        service.createCompanyWorker('user-1', { name: 'My Worker' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('throws BadRequestException if active worker limit (5) reached', async () => {
      mockPrisma.companyProfile.findUnique.mockResolvedValue({
        id: 'company-id-1',
        status: CompanyStatus.APPROVED,
        autoAiScanEnabled: true,
      });
      mockPrisma.companyAiWorker.count.mockResolvedValue(5);

      await expect(
        service.createCompanyWorker('user-1', { name: 'My Worker' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('creates worker token with cwb_ prefix and enables autoAiScanEnabled', async () => {
      mockPrisma.companyProfile.findUnique.mockResolvedValue({
        id: 'company-id-1',
        status: CompanyStatus.APPROVED,
        autoAiScanEnabled: false,
      });
      mockPrisma.companyAiWorker.count.mockResolvedValue(2);
      mockPrisma.companyAiWorker.create.mockResolvedValue({
        id: 'worker-id-2',
        name: 'Worker 2',
        modelName: 'gemini-2.5-flash',
        isActive: true,
        createdAt: new Date(),
      });
      mockPrisma.companyProfile.update.mockResolvedValue({});

      const result = await service.createCompanyWorker('user-1', {
        name: 'Worker 2',
        modelName: 'gemini-2.5-flash',
      });

      expect(result.token).toMatch(/^cwb_[a-f0-9]{64}$/);
      expect(mockPrisma.companyAiWorker.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            companyId: 'company-id-1',
            name: 'Worker 2',
            modelName: 'gemini-2.5-flash',
          }),
        }),
      );
      expect(mockPrisma.companyProfile.update).toHaveBeenCalledWith({
        where: { id: 'company-id-1' },
        data: { autoAiScanEnabled: true },
      });
    });
  });

  describe('pollJob', () => {
    it('returns hasJob: false when no eligible job found', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([]);
      mockPrisma.companyAiWorker.update.mockResolvedValue({});

      const result = await service.pollJob(mockWorker);

      expect(result).toEqual({ hasJob: false });
      expect(mockPrisma.companyAiWorker.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockWorker.id },
          data: expect.objectContaining({ lastSeenAt: expect.any(Date) }),
        }),
      );
    });

    it('locks job, increments attempts, and generates signed download URL', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ id: 'job-1' }]);
      mockPrisma.aiScanJob.update.mockResolvedValue({
        id: 'job-1',
        applicationId: 'app-1',
        attempts: 1,
        application: {
          cvFile: {
            storageKey: 'cvs/app-1.pdf',
            originalName: 'CV_NguyenVanA.pdf',
            mimeType: 'application/pdf',
          },
          internship: {
            id: 'internship-1',
            title: 'Node.js Developer Intern',
            department: 'Engineering',
            description: 'Building microservices',
            requirements: 'Good JS/TS knowledge',
            workType: 'HYBRID',
            skills: [
              {
                isRequired: true,
                weight: 2,
                skill: { name: 'TypeScript' },
              },
            ],
          },
        },
      });
      mockPrisma.companyAiWorker.update.mockResolvedValue({});
      mockStorage.createDownloadUrl.mockResolvedValue(
        'https://supabase.co/storage/v1/object/sign/cvs/app-1.pdf?token=exp10m',
      );

      const result = await service.pollJob(mockWorker);

      expect(result.hasJob).toBe(true);
      if (result.hasJob) {
        expect(result.job.jobId).toBe('job-1');
        expect(result.job.cvDownloadUrl).toContain('supabase.co');
        expect(result.job.internship.requiredSkills[0].name).toBe('TypeScript');
      }
      expect(mockPrisma.aiScanJob.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'job-1' },
          data: expect.objectContaining({
            status: AiScanStatus.PROCESSING,
            lockedByWorkerId: mockWorker.id,
            attempts: { increment: 1 },
          }),
        }),
      );
    });
  });

  describe('completeJob', () => {
    it('throws NotFoundException if job does not belong to worker company', async () => {
      mockPrisma.aiScanJob.findUnique.mockResolvedValue({
        id: 'job-1',
        companyId: 'different-company',
      });

      await expect(
        service.completeJob(mockWorker, 'job-1', {
          aiScore: 85,
          recommendation: AiCandidateRecommendation.HIRE,
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('updates job results and updates Application.aiScore', async () => {
      mockPrisma.aiScanJob.findUnique.mockResolvedValue({
        id: 'job-1',
        companyId: mockWorker.companyId,
        applicationId: 'app-1',
      });
      mockPrisma.aiScanJob.update.mockResolvedValue({});
      mockPrisma.application.update.mockResolvedValue({});
      mockPrisma.companyAiWorker.update.mockResolvedValue({});

      const result = await service.completeJob(mockWorker, 'job-1', {
        aiScore: 92,
        recommendation: AiCandidateRecommendation.STRONG_HIRE,
        experienceYears: 1.5,
        matchedSkills: ['TypeScript', 'NestJS'],
        missingSkills: ['Docker'],
        strengths: ['Strong fundamentals'],
        weaknesses: ['Limited DevOps experience'],
        summary: 'Excellent candidate for backend role',
        modelUsed: 'gemini-2.5-pro',
      });

      expect(result.success).toBe(true);
      expect(result.aiScore).toBe(92);
      expect(mockPrisma.application.update).toHaveBeenCalledWith({
        where: { id: 'app-1' },
        data: { aiScore: 92 },
      });
      expect(mockPrisma.aiScanJob.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'job-1' },
          data: expect.objectContaining({
            status: AiScanStatus.COMPLETED,
            aiScore: 92,
            recommendation: AiCandidateRecommendation.STRONG_HIRE,
          }),
        }),
      );
    });
  });

  describe('failJob', () => {
    it('resets to PENDING if attempts < maxAttempts', async () => {
      mockPrisma.aiScanJob.findUnique.mockResolvedValue({
        id: 'job-1',
        companyId: mockWorker.companyId,
        attempts: 1,
        maxAttempts: 3,
      });
      mockPrisma.aiScanJob.update.mockResolvedValue({
        status: AiScanStatus.PENDING,
        attempts: 1,
        maxAttempts: 3,
      });
      mockPrisma.companyAiWorker.update.mockResolvedValue({});

      const result = await service.failJob(mockWorker, 'job-1', {
        errorMessage: 'Network timeout downloading CV',
      });

      expect(result.status).toBe(AiScanStatus.PENDING);
      expect(mockPrisma.aiScanJob.update).toHaveBeenCalledWith({
        where: { id: 'job-1' },
        data: {
          status: AiScanStatus.PENDING,
          lockedUntil: null,
          errorDetails: 'Network timeout downloading CV',
        },
      });
    });

    it('marks job as FAILED if attempts >= maxAttempts', async () => {
      mockPrisma.aiScanJob.findUnique.mockResolvedValue({
        id: 'job-1',
        companyId: mockWorker.companyId,
        attempts: 3,
        maxAttempts: 3,
      });
      mockPrisma.aiScanJob.update.mockResolvedValue({
        status: AiScanStatus.FAILED,
        attempts: 3,
        maxAttempts: 3,
      });
      mockPrisma.companyAiWorker.update.mockResolvedValue({});

      const result = await service.failJob(mockWorker, 'job-1', {
        errorMessage: 'Corrupt PDF format',
      });

      expect(result.status).toBe(AiScanStatus.FAILED);
      expect(mockPrisma.aiScanJob.update).toHaveBeenCalledWith({
        where: { id: 'job-1' },
        data: {
          status: AiScanStatus.FAILED,
          lockedUntil: null,
          errorDetails: 'Corrupt PDF format',
        },
      });
    });
  });

  describe('rescanApplication', () => {
    it('resets existing scan job to PENDING', async () => {
      mockPrisma.companyProfile.findUnique.mockResolvedValue({
        id: 'company-id-1',
      });
      mockPrisma.application.findUnique.mockResolvedValue({
        id: 'app-1',
        cvFileId: 'file-1',
        internship: { companyId: 'company-id-1' },
      });
      mockPrisma.aiScanJob.findUnique.mockResolvedValue({
        id: 'job-1',
        applicationId: 'app-1',
      });
      mockPrisma.aiScanJob.update.mockResolvedValue({
        id: 'job-1',
        status: AiScanStatus.PENDING,
      });

      const result = await service.rescanApplication('user-1', 'app-1');

      expect(result.success).toBe(true);
      expect(result.status).toBe(AiScanStatus.PENDING);
      expect(mockPrisma.aiScanJob.update).toHaveBeenCalledWith({
        where: { id: 'job-1' },
        data: {
          status: AiScanStatus.PENDING,
          attempts: 0,
          lockedUntil: null,
          lockedByWorkerId: null,
          errorDetails: null,
        },
      });
    });
  });
});
