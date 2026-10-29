import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import type { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { CompanyStatus } from '../../generated/prisma/client';

export interface AuthenticatedAiWorker {
  id: string;
  companyId: string;
  name: string;
  modelName: string | null;
  company: {
    id: string;
    companyName: string;
  };
}

@Injectable()
export class AiWorkerAuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { worker?: AuthenticatedAiWorker }>();
    const xWorkerToken = request.headers['x-worker-token'];
    const authorization = request.headers.authorization;
    const tokenHeader =
      (typeof xWorkerToken === 'string' ? xWorkerToken : null) ||
      (authorization?.startsWith('Bearer ') ? authorization.slice(7) : null);

    if (
      !tokenHeader ||
      typeof tokenHeader !== 'string' ||
      !tokenHeader.trim()
    ) {
      throw new UnauthorizedException({
        code: 'WORKER_TOKEN_REQUIRED',
        message:
          'Worker token is required in header X-Worker-Token or Authorization Bearer',
      });
    }

    const rawToken = tokenHeader.trim();
    const tokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    const worker = await this.prisma.companyAiWorker.findUnique({
      where: { tokenHash },
      include: {
        company: {
          select: {
            id: true,
            companyName: true,
            status: true,
          },
        },
      },
    });

    if (!worker || !worker.isActive) {
      throw new UnauthorizedException({
        code: 'INVALID_OR_REVOKED_WORKER_TOKEN',
        message: 'Token worker không hợp lệ hoặc đã bị vô hiệu hóa',
      });
    }

    if (worker.company.status !== CompanyStatus.APPROVED) {
      throw new ForbiddenException({
        code: 'COMPANY_NOT_APPROVED',
        message: 'Doanh nghiệp chưa được phê duyệt hoặc đang bị khóa',
      });
    }

    request.worker = {
      id: worker.id,
      companyId: worker.companyId,
      name: worker.name,
      modelName: worker.modelName,
      company: {
        id: worker.company.id,
        companyName: worker.company.companyName,
      },
    } satisfies AuthenticatedAiWorker;

    return true;
  }
}
