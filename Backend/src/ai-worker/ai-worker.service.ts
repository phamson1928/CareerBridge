import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseStorageService } from '../files/supabase-storage.service';
import {
  Prisma,
  AiScanStatus,
  CompanyStatus,
} from '../generated/prisma/client';
import { CreateAiWorkerDto } from './dto/create-ai-worker.dto';
import { CompleteAiScanJobDto } from './dto/complete-ai-scan-job.dto';
import { FailAiScanJobDto } from './dto/fail-ai-scan-job.dto';
import { AiWorkerHeartbeatDto } from './dto/ai-worker-heartbeat.dto';
import { UpdateAiScanSettingsDto } from './dto/update-ai-scan-settings.dto';
import { AuthenticatedAiWorker } from './guards/ai-worker-auth.guard';

export type PollJobResult =
  | { hasJob: false }
  | {
      hasJob: true;
      job: {
        jobId: string;
        applicationId: string;
        attempts: number;
        internship: {
          id: string;
          title: string;
          department: string | null;
          description: string;
          requirements: string | null;
          workType: string | null;
          requiredSkills: Array<{
            name: string;
            isRequired: boolean;
            weight: number;
          }>;
        };
        cvDownloadUrl: string;
        cvFileName: string;
        mimeType: string;
      };
    };

@Injectable()
export class AiWorkerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: SupabaseStorageService,
  ) {}

  // ==========================================
  // COMPANY PORTAL MANAGEMENT APIS
  // ==========================================

  private async getCompanyByUserId(userId: string) {
    const company = await this.prisma.companyProfile.findUnique({
      where: { userId },
      select: {
        id: true,
        companyName: true,
        status: true,
        autoAiScanEnabled: true,
      },
    });

    if (!company) {
      throw new NotFoundException({
        code: 'COMPANY_PROFILE_NOT_FOUND',
        message: 'Hồ sơ doanh nghiệp không tồn tại',
      });
    }

    return company;
  }

  async listCompanyWorkers(userId: string) {
    const company = await this.getCompanyByUserId(userId);

    const workers = await this.prisma.companyAiWorker.findMany({
      where: { companyId: company.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        modelName: true,
        isActive: true,
        lastSeenAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const now = Date.now();
    const formattedWorkers = workers.map((w) => ({
      ...w,
      isOnline: Boolean(w.lastSeenAt && now - w.lastSeenAt.getTime() < 60_000),
    }));

    // Count pending / completed / failed scan jobs for this company
    const [pendingCount, completedCount, failedCount] = await Promise.all([
      this.prisma.aiScanJob.count({
        where: { companyId: company.id, status: AiScanStatus.PENDING },
      }),
      this.prisma.aiScanJob.count({
        where: { companyId: company.id, status: AiScanStatus.COMPLETED },
      }),
      this.prisma.aiScanJob.count({
        where: { companyId: company.id, status: AiScanStatus.FAILED },
      }),
    ]);

    return {
      autoAiScanEnabled: company.autoAiScanEnabled,
      workers: formattedWorkers,
      stats: {
        pendingJobs: pendingCount,
        completedJobs: completedCount,
        failedJobs: failedCount,
      },
    };
  }

  async createCompanyWorker(userId: string, dto: CreateAiWorkerDto) {
    const company = await this.getCompanyByUserId(userId);

    if (company.status !== CompanyStatus.APPROVED) {
      throw new ForbiddenException({
        code: 'COMPANY_NOT_APPROVED',
        message:
          'Doanh nghiệp cần được phê duyệt hồ sơ trước khi kích hoạt AI Worker',
      });
    }

    const workerCount = await this.prisma.companyAiWorker.count({
      where: { companyId: company.id, isActive: true },
    });

    if (workerCount >= 5) {
      throw new BadRequestException({
        code: 'WORKER_LIMIT_REACHED',
        message: 'Mỗi doanh nghiệp tối đa được kết nối 5 AI Worker đồng thời',
      });
    }

    // Generate secure token: cwb_ + 32 random bytes (64 hex characters)
    const rawToken = `cwb_${crypto.randomBytes(32).toString('hex')}`;
    const tokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    const worker = await this.prisma.companyAiWorker.create({
      data: {
        companyId: company.id,
        name: dto.name.trim(),
        tokenHash,
        modelName: dto.modelName?.trim() || null,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        modelName: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Auto-enable autoAiScanEnabled if not enabled yet
    if (!company.autoAiScanEnabled) {
      await this.prisma.companyProfile.update({
        where: { id: company.id },
        data: { autoAiScanEnabled: true },
      });
    }

    return {
      worker,
      token: rawToken,
      message:
        'Lưu ý: Mã token này chỉ hiển thị duy nhất một lần. Vui lòng sao chép và cấu hình vào file worker của bạn.',
    };
  }

  async deleteCompanyWorker(userId: string, workerId: string) {
    const company = await this.getCompanyByUserId(userId);

    const worker = await this.prisma.companyAiWorker.findFirst({
      where: { id: workerId, companyId: company.id },
    });

    if (!worker) {
      throw new NotFoundException({
        code: 'WORKER_NOT_FOUND',
        message: 'Không tìm thấy AI Worker cần xóa',
      });
    }

    await this.prisma.companyAiWorker.delete({
      where: { id: workerId },
    });

    return {
      deleted: true,
      workerId,
    };
  }

  async updateScanSettings(userId: string, dto: UpdateAiScanSettingsDto) {
    const company = await this.getCompanyByUserId(userId);

    const updated = await this.prisma.companyProfile.update({
      where: { id: company.id },
      data: { autoAiScanEnabled: dto.autoAiScanEnabled },
      select: { id: true, autoAiScanEnabled: true },
    });

    return {
      autoAiScanEnabled: updated.autoAiScanEnabled,
    };
  }

  async rescanApplication(userId: string, applicationId: string) {
    const company = await this.getCompanyByUserId(userId);

    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      select: {
        id: true,
        cvFileId: true,
        internship: {
          select: {
            companyId: true,
          },
        },
      },
    });

    if (!application || application.internship.companyId !== company.id) {
      throw new NotFoundException({
        code: 'APPLICATION_NOT_FOUND',
        message: 'Không tìm thấy hồ sơ ứng tuyển này của doanh nghiệp',
      });
    }

    if (!application.cvFileId) {
      throw new BadRequestException({
        code: 'CV_FILE_MISSING',
        message: 'Hồ sơ này không có tệp CV đính kèm để quét',
      });
    }

    const existingJob = await this.prisma.aiScanJob.findUnique({
      where: { applicationId },
    });

    let job;
    if (existingJob) {
      job = await this.prisma.aiScanJob.update({
        where: { id: existingJob.id },
        data: {
          status: AiScanStatus.PENDING,
          attempts: 0,
          lockedUntil: null,
          lockedByWorkerId: null,
          errorDetails: null,
        },
      });
    } else {
      job = await this.prisma.aiScanJob.create({
        data: {
          applicationId,
          companyId: company.id,
          status: AiScanStatus.PENDING,
        },
      });
    }

    return {
      success: true,
      jobId: job.id,
      applicationId,
      status: job.status,
    };
  }

  // ==========================================
  // AI WORKER CLIENT APIS (POLLING & EXECUTION)
  // ==========================================

  async pollJob(worker: AuthenticatedAiWorker): Promise<PollJobResult> {
    // 1. Atomic query to find and lock next eligible job
    const rows = await this.prisma.$queryRaw<Array<{ id: string }>>`
      SELECT "id"
      FROM "AiScanJob"
      WHERE "companyId" = ${worker.companyId}
        AND (
          "status" = 'PENDING'::"AiScanStatus"
          OR ("status" = 'PROCESSING'::"AiScanStatus" AND "lockedUntil" < NOW())
        )
        AND "attempts" < "maxAttempts"
      ORDER BY "createdAt" ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED;
    `;

    if (!rows || rows.length === 0) {
      // Keep worker alive
      await this.prisma.companyAiWorker.update({
        where: { id: worker.id },
        data: { lastSeenAt: new Date() },
      });
      return { hasJob: false };
    }

    const candidateId = rows[0].id;
    const lockExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes lock

    // 2. Lock the job
    const job = await this.prisma.aiScanJob.update({
      where: { id: candidateId },
      data: {
        status: AiScanStatus.PROCESSING,
        lockedUntil: lockExpiresAt,
        lockedByWorkerId: worker.id,
        attempts: { increment: 1 },
      },
      include: {
        application: {
          include: {
            cvFile: true,
            internship: {
              include: {
                skills: {
                  include: {
                    skill: {
                      select: { name: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    // 3. Update worker heartbeat
    await this.prisma.companyAiWorker.update({
      where: { id: worker.id },
      data: { lastSeenAt: new Date() },
    });

    // 4. Validate CV file
    const cvFile = job.application.cvFile;
    if (!cvFile || !cvFile.storageKey) {
      await this.prisma.aiScanJob.update({
        where: { id: job.id },
        data: {
          status: AiScanStatus.SKIPPED,
          lockedUntil: null,
          errorDetails: 'Tệp CV không tồn tại trên hệ thống lưu trữ',
        },
      });
      return { hasJob: false };
    }

    // 5. Generate Short-Lived Signed Download URL (10 minutes)
    const downloadUrl = await this.storage.createDownloadUrl(
      cvFile.storageKey,
      cvFile.originalName,
    );

    const internship = job.application.internship;
    return {
      hasJob: true,
      job: {
        jobId: job.id,
        applicationId: job.applicationId,
        attempts: job.attempts,
        internship: {
          id: internship.id,
          title: internship.title,
          department: internship.department,
          description: internship.description,
          requirements: internship.requirements,
          workType: internship.workType,
          requiredSkills: internship.skills.map((s) => ({
            name: s.skill.name,
            isRequired: s.isRequired,
            weight: s.weight,
          })),
        },
        cvDownloadUrl: downloadUrl,
        cvFileName: cvFile.originalName,
        mimeType: cvFile.mimeType,
      },
    };
  }

  async completeJob(
    worker: AuthenticatedAiWorker,
    jobId: string,
    dto: CompleteAiScanJobDto,
  ) {
    const job = await this.prisma.aiScanJob.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        companyId: true,
        applicationId: true,
      },
    });

    if (!job || job.companyId !== worker.companyId) {
      throw new NotFoundException({
        code: 'JOB_NOT_FOUND',
        message:
          'Tác vụ quét CV không tồn tại hoặc không thuộc quyền quản lý của worker này',
      });
    }

    await this.prisma.$transaction(async (tx) => {
      // 1. Update AiScanJob result
      await tx.aiScanJob.update({
        where: { id: jobId },
        data: {
          status: AiScanStatus.COMPLETED,
          aiScore: dto.aiScore,
          recommendation: dto.recommendation,
          experienceYears: dto.experienceYears ?? null,
          extractedSkills: dto.extractedSkills || [],
          matchedSkills: dto.matchedSkills || [],
          missingSkills: dto.missingSkills || [],
          strengths: dto.strengths || [],
          weaknesses: dto.weaknesses || [],
          summary: dto.summary ?? null,
          rawAnalysis: dto.rawAnalysis
            ? (dto.rawAnalysis as Prisma.InputJsonValue)
            : undefined,
          completedAt: new Date(),
          lockedUntil: null,
          errorDetails: null,
        },
      });

      // 2. Cache aiScore on Application for fast sorting/filtering
      await tx.application.update({
        where: { id: job.applicationId },
        data: {
          aiScore: dto.aiScore,
        },
      });

      // 3. Update worker status
      await tx.companyAiWorker.update({
        where: { id: worker.id },
        data: {
          lastSeenAt: new Date(),
          modelName: dto.modelUsed || worker.modelName,
        },
      });
    });

    return {
      success: true,
      jobId,
      aiScore: dto.aiScore,
      recommendation: dto.recommendation,
    };
  }

  async failJob(
    worker: AuthenticatedAiWorker,
    jobId: string,
    dto: FailAiScanJobDto,
  ) {
    const job = await this.prisma.aiScanJob.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        companyId: true,
        attempts: true,
        maxAttempts: true,
      },
    });

    if (!job || job.companyId !== worker.companyId) {
      throw new NotFoundException({
        code: 'JOB_NOT_FOUND',
        message:
          'Tác vụ quét CV không tồn tại hoặc không thuộc quyền quản lý của worker này',
      });
    }

    const isExhausted = job.attempts >= job.maxAttempts;
    const updated = await this.prisma.aiScanJob.update({
      where: { id: jobId },
      data: {
        status: isExhausted ? AiScanStatus.FAILED : AiScanStatus.PENDING,
        lockedUntil: null,
        errorDetails: dto.errorMessage,
      },
    });

    await this.prisma.companyAiWorker.update({
      where: { id: worker.id },
      data: { lastSeenAt: new Date() },
    });

    return {
      success: true,
      jobId,
      status: updated.status,
      attempts: updated.attempts,
      maxAttempts: updated.maxAttempts,
    };
  }

  async heartbeat(worker: AuthenticatedAiWorker, dto: AiWorkerHeartbeatDto) {
    await this.prisma.companyAiWorker.update({
      where: { id: worker.id },
      data: {
        lastSeenAt: new Date(),
        modelName: dto.modelName || worker.modelName,
      },
    });

    return {
      success: true,
      workerId: worker.id,
      timestamp: new Date().toISOString(),
    };
  }
}
