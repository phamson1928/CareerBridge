import {
  NotFoundException,
} from '@nestjs/common';
import { AiWorkerService } from './ai-worker.service';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseStorageService } from '../files/supabase-storage.service';
import {
  AiScanStatus,
} from '../generated/prisma/client';
import { AuthenticatedAiWorker } from './guards/ai-worker-auth.guard';

describe('AiWorkerService Concurrency & Resilience Tests (Phase 4)', () => {
  let service: AiWorkerService;
  let mockPrisma: any;
  let mockStorage: any;

  const companyA = 'company-A';
  const companyB = 'company-B';

  const workerA1: AuthenticatedAiWorker = {
    id: 'worker-A-1',
    companyId: companyA,
    name: 'Worker Alpha 1',
    modelName: 'ollama-qwen2.5',
    company: { id: companyA, companyName: 'Company A Corp' },
  };

  const workerA2: AuthenticatedAiWorker = {
    id: 'worker-A-2',
    companyId: companyA,
    name: 'Worker Alpha 2',
    modelName: 'ollama-qwen2.5',
    company: { id: companyA, companyName: 'Company A Corp' },
  };

  const workerB: AuthenticatedAiWorker = {
    id: 'worker-B-1',
    companyId: companyB,
    name: 'Worker Beta 1',
    modelName: 'mock-engine',
    company: { id: companyB, companyName: 'Company B Inc' },
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
        update: jest.fn().mockResolvedValue({}),
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
      createDownloadUrl: jest.fn().mockResolvedValue('https://storage.careerbridge.vn/cv.pdf'),
    };

    service = new AiWorkerService(
      mockPrisma as PrismaService,
      mockStorage as SupabaseStorageService,
    );
  });

  describe('1. Concurrent Polling & Zero-Duplication (SKIP LOCKED Simulation)', () => {
    it('simulates 2 concurrent workers polling distinct jobs without race conditions', async () => {
      // Mocking SKIP LOCKED behavior:
      // Worker A1 gets job-1, Worker A2 gets job-2
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([{ id: 'job-1' }])
        .mockResolvedValueOnce([{ id: 'job-2' }]);

      const mockJobData = (id: string) => ({
        id,
        companyId: companyA,
        status: AiScanStatus.PROCESSING,
        attempts: 1,
        application: {
          internship: {
            title: `Software Engineer Intern ${id}`,
            department: 'Engineering',
            description: 'Develop features',
            requirements: 'TypeScript',
            skills: [{ skill: { name: 'TypeScript' }, isRequired: true, weight: 5 }],
          },
          cvFile: {
            id: `file-${id}`,
            originalName: `cv-${id}.pdf`,
            storageKey: `storage/cv-${id}.pdf`,
          },
        },
      });

      mockPrisma.aiScanJob.update
        .mockResolvedValueOnce(mockJobData('job-1'))
        .mockResolvedValueOnce(mockJobData('job-2'));

      // Concurrently poll jobs
      const [res1, res2] = await Promise.all([
        service.pollJob(workerA1),
        service.pollJob(workerA2),
      ]);

      expect(res1.hasJob).toBe(true);
      expect(res2.hasJob).toBe(true);

      if (res1.hasJob && res2.hasJob) {
        expect(res1.job.jobId).toBe('job-1');
        expect(res2.job.jobId).toBe('job-2');
        expect(res1.job.jobId).not.toBe(res2.job.jobId); // Zero duplication!
      }

      // Verify each worker set lock on its respective job
      expect(mockPrisma.aiScanJob.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'job-1' },
          data: expect.objectContaining({
            status: AiScanStatus.PROCESSING,
            lockedByWorkerId: workerA1.id,
            attempts: { increment: 1 },
          }),
        }),
      );

      expect(mockPrisma.aiScanJob.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'job-2' },
          data: expect.objectContaining({
            status: AiScanStatus.PROCESSING,
            lockedByWorkerId: workerA2.id,
            attempts: { increment: 1 },
          }),
        }),
      );
    });

    it('returns { hasJob: false } gracefully when queue is empty and updates heartbeat', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([]);

      const result = await service.pollJob(workerA1);

      expect(result.hasJob).toBe(false);
      expect(mockPrisma.companyAiWorker.update).toHaveBeenCalledWith({
        where: { id: workerA1.id },
        data: expect.objectContaining({ lastSeenAt: expect.any(Date) }),
      });
    });
  });

  describe('2. Multi-tenant Isolation (Company A vs Company B)', () => {
    it('prevents Worker B from accessing or completing jobs belonging to Company A', async () => {
      mockPrisma.aiScanJob.findUnique.mockResolvedValueOnce({
        id: 'job-company-A',
        companyId: companyA, // Belongs to Company A
      });

      await expect(
        service.completeJob(workerB, 'job-company-A', {
          aiScore: 99,
          recommendation: 'STRONG_HIRE' as any,
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('prevents Worker B from failing jobs belonging to Company A', async () => {
      mockPrisma.aiScanJob.findUnique.mockResolvedValueOnce({
        id: 'job-company-A',
        companyId: companyA,
      });

      await expect(
        service.failJob(workerB, 'job-company-A', {
          errorMessage: 'Malicious attempt to fail foreign job',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('3. Fault Tolerance & Lock Timeout Recovery (Worker Crash)', () => {
    it('reclaims an expired locked job after worker crash and increments attempts', async () => {
      // Simulate that worker crashed, job was locked with expired timestamp
      mockPrisma.$queryRaw.mockResolvedValueOnce([{ id: 'orphaned-job-1' }]);

      mockPrisma.aiScanJob.update.mockResolvedValueOnce({
        id: 'orphaned-job-1',
        companyId: companyA,
        status: AiScanStatus.PROCESSING,
        attempts: 2, // Second attempt after crash
        application: {
          internship: {
            title: 'Backend Intern',
            department: 'Tech',
            description: 'NestJS',
            requirements: 'NestJS',
            skills: [],
          },
          cvFile: {
            id: 'file-1',
            originalName: 'cv.pdf',
            storageKey: 'storage/cv.pdf',
          },
        },
      });

      const result = await service.pollJob(workerA2);

      expect(result.hasJob).toBe(true);
      if (result.hasJob) {
        expect(result.job.jobId).toBe('orphaned-job-1');
        expect(result.job.attempts).toBe(2);
      }

      // Assert lock was refreshed and assigned to workerA2
      expect(mockPrisma.aiScanJob.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'orphaned-job-1' },
          data: expect.objectContaining({
            status: AiScanStatus.PROCESSING,
            lockedByWorkerId: workerA2.id,
            attempts: { increment: 1 },
          }),
        }),
      );
    });
  });

  describe('4. Worker Heartbeat & Realtime Online Status', () => {
    it('accurately identifies online vs offline workers based on 60s window', async () => {
      const now = Date.now();
      mockPrisma.companyProfile.findUnique.mockResolvedValueOnce({
        id: companyA,
        autoAiScanEnabled: true,
      });

      mockPrisma.companyAiWorker.findMany.mockResolvedValueOnce([
        {
          id: 'w-online',
          name: 'Online Worker',
          lastSeenAt: new Date(now - 15_000), // 15 seconds ago -> Online
          isActive: true,
        },
        {
          id: 'w-offline',
          name: 'Offline Worker',
          lastSeenAt: new Date(now - 120_000), // 2 minutes ago -> Offline
          isActive: true,
        },
        {
          id: 'w-never',
          name: 'Never Connected Worker',
          lastSeenAt: null, // Never -> Offline
          isActive: true,
        },
      ]);

      mockPrisma.aiScanJob.count
        .mockResolvedValueOnce(2) // pending
        .mockResolvedValueOnce(10) // completed
        .mockResolvedValueOnce(1); // failed

      const dashboard = await service.listCompanyWorkers('user-A');

      expect(dashboard.workers).toHaveLength(3);
      expect(dashboard.workers[0].isOnline).toBe(true);
      expect(dashboard.workers[1].isOnline).toBe(false);
      expect(dashboard.workers[2].isOnline).toBe(false);
    });
  });
});
