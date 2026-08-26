import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  EvaluationType,
  NotificationAction,
  NotificationType,
  PlacementStatus,
  Prisma,
  Role,
  SupervisionStatus,
} from '../generated/prisma/client';
import type { AuthUser } from '../auth/types/auth-user.type';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { ListEvaluationsQueryDto } from './dto/list-evaluations-query.dto';
import { UpdateEvaluationDto } from './dto/update-evaluation.dto';

const select = {
  id: true,
  placementId: true,
  evaluatorId: true,
  type: true,
  score: true,
  comment: true,
  submittedAt: true,
  updatedAt: true,
  evaluator: { select: { id: true, email: true, role: true } },
  placement: {
    select: {
      id: true,
      status: true,
      student: {
        select: {
          id: true,
          userId: true,
          studentCode: true,
          fullName: true,
          major: true,
        },
      },
      company: { select: { id: true, userId: true, companyName: true } },
      internship: { select: { id: true, title: true } },
      supervision: {
        select: {
          status: true,
          lecturer: { select: { id: true, userId: true, fullName: true } },
        },
      },
    },
  },
} satisfies Prisma.EvaluationSelect;

type EvaluationRecord = Prisma.EvaluationGetPayload<{ select: typeof select }>;

@Injectable()
export class EvaluationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(dto: CreateEvaluationDto, user: AuthUser) {
    const type = this.typeFor(user);
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const placement = await tx.internshipPlacement.findUnique({
          where: { id: dto.placementId },
          select: {
            id: true,
            status: true,
            student: { select: { userId: true } },
            company: { select: { userId: true } },
            supervision: {
              select: {
                status: true,
                lecturer: { select: { userId: true } },
              },
            },
          },
        });
        if (!placement) throw this.notFound();
        this.assertCanEvaluate(placement, user, type);

        const existing = await tx.evaluation.findUnique({
          where: {
            placementId_type: { placementId: dto.placementId, type },
          },
          select: { id: true },
        });
        if (existing) {
          throw this.conflict(
            'EVALUATION_ALREADY_EXISTS',
            'An evaluation of this type already exists for this placement',
          );
        }

        const evaluation = await tx.evaluation.create({
          data: {
            placementId: dto.placementId,
            evaluatorId: user.id,
            type,
            score: dto.score,
            comment: dto.comment?.trim() || null,
          },
          select,
        });
        await tx.auditLog.create({
          data: {
            userId: user.id,
            action: 'EVALUATION_CREATED',
            entity: 'Evaluation',
            entityId: evaluation.id,
            metadata: { placementId: dto.placementId, type, score: dto.score },
          },
        });
        const notification = await this.notifications.createInTransaction(tx, {
          userId: evaluation.placement.student.userId,
          eventKey: `evaluation:${evaluation.id}:created:${evaluation.placement.student.userId}`,
          type: NotificationType.EVALUATION,
          action: NotificationAction.OPEN_EVALUATION,
          title: 'Bạn có đánh giá mới',
          content: 'Một đánh giá mới đã được cập nhật cho kỳ thực tập của bạn.',
          resourceId: evaluation.id,
          metadata: { placementId: dto.placementId, type },
        });
        return { evaluation, notifications: [notification] };
      });
      this.notifications.publishMany(result.notifications);
      return result.evaluation;
    } catch (error: unknown) {
      this.rethrowKnownMutationError(error);
    }
  }

  async listMine(query: ListEvaluationsQueryDto, user: AuthUser) {
    const where: Prisma.EvaluationWhereInput = {
      ...(query.placementId ? { placementId: query.placementId } : {}),
      ...(query.type ? { type: query.type } : {}),
      ...this.scope(user),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.evaluation.findMany({
        where,
        select,
        orderBy: [{ submittedAt: 'desc' }, { id: 'desc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.evaluation.count({ where }),
    ]);
    return {
      items,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async findOne(id: string, user: AuthUser) {
    const evaluation = await this.prisma.evaluation.findUnique({
      where: { id },
      select,
    });
    if (!evaluation) throw this.notFound();
    this.assertCanRead(evaluation, user);
    return evaluation;
  }

  async update(id: string, dto: UpdateEvaluationDto, user: AuthUser) {
    const current = await this.findOne(id, user);
    if (current.evaluatorId !== user.id) throw this.denied();
    if (dto.score === undefined && dto.comment === undefined) {
      throw this.conflict(
        'EVALUATION_UPDATE_EMPTY',
        'Provide score or comment',
      );
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const updated = await tx.evaluation.update({
          where: { id },
          data: {
            ...(dto.score === undefined ? {} : { score: dto.score }),
            ...(dto.comment === undefined
              ? {}
              : { comment: dto.comment?.trim() || null }),
          },
          select,
        });
        await tx.auditLog.create({
          data: {
            userId: user.id,
            action: 'EVALUATION_UPDATED',
            entity: 'Evaluation',
            entityId: id,
            metadata: { placementId: updated.placementId, type: updated.type },
          },
        });
        return updated;
      });
    } catch (error: unknown) {
      this.rethrowKnownMutationError(error);
    }
  }

  async remove(id: string, user: AuthUser) {
    const current = await this.findOne(id, user);
    if (current.evaluatorId !== user.id) throw this.denied();

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.evaluation.delete({ where: { id } });
        await tx.auditLog.create({
          data: {
            userId: user.id,
            action: 'EVALUATION_DELETED',
            entity: 'Evaluation',
            entityId: id,
            metadata: {
              placementId: current.placementId,
              type: current.type,
            },
          },
        });
      });
      return { id, deleted: true };
    } catch (error: unknown) {
      this.rethrowKnownMutationError(error);
    }
  }

  private typeFor(user: AuthUser) {
    if (user.role === Role.COMPANY) return EvaluationType.COMPANY;
    if (user.role === Role.LECTURER) return EvaluationType.LECTURER;
    throw this.denied();
  }

  private assertCanEvaluate(
    placement: {
      status: PlacementStatus;
      company: { userId: string };
      supervision: {
        status: SupervisionStatus;
        lecturer: { userId: string };
      } | null;
    },
    user: AuthUser,
    type: EvaluationType,
  ) {
    if (
      placement.status !== PlacementStatus.ACTIVE &&
      placement.status !== PlacementStatus.COMPLETED
    ) {
      throw this.conflict(
        'PLACEMENT_NOT_EVALUABLE',
        'Only active or completed placements can be evaluated',
      );
    }
    if (type === EvaluationType.COMPANY && placement.company.userId === user.id) {
      return;
    }
    if (
      type === EvaluationType.LECTURER &&
      (placement.supervision?.status === SupervisionStatus.ACTIVE ||
        placement.supervision?.status === SupervisionStatus.COMPLETED) &&
      placement.supervision.lecturer.userId === user.id
    ) {
      return;
    }
    throw this.denied();
  }

  private scope(user: AuthUser): Prisma.EvaluationWhereInput {
    if (user.role === Role.ADMIN) return {};
    if (user.role === Role.STUDENT) {
      return { placement: { student: { userId: user.id } } };
    }
    if (user.role === Role.COMPANY) {
      return { placement: { company: { userId: user.id } } };
    }
    if (user.role === Role.LECTURER) {
      return {
        placement: { supervision: { is: { lecturer: { userId: user.id } } } },
      };
    }
    throw this.denied();
  }

  private assertCanRead(evaluation: EvaluationRecord, user: AuthUser) {
    if (
      user.role === Role.ADMIN ||
      evaluation.placement.student.userId === user.id ||
      evaluation.placement.company.userId === user.id ||
      evaluation.placement.supervision?.lecturer.userId === user.id
    ) {
      return;
    }
    throw this.denied();
  }

  private rethrowKnownMutationError(error: unknown): never {
    if (this.isPrismaError(error, 'P2002')) {
      throw this.conflict(
        'EVALUATION_ALREADY_EXISTS',
        'An evaluation of this type already exists for this placement',
      );
    }
    if (this.isPrismaError(error, 'P2025')) throw this.notFound();
    throw error;
  }

  private isPrismaError(error: unknown, code: string): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: unknown }).code === code
    );
  }

  private notFound() {
    return new NotFoundException({
      code: 'EVALUATION_NOT_FOUND',
      message: 'Evaluation not found',
    });
  }

  private denied() {
    return new ForbiddenException({
      code: 'EVALUATION_NOT_ACCESSIBLE',
      message: 'Evaluation is not accessible',
    });
  }

  private conflict(code: string, message: string) {
    return new ConflictException({ code, message });
  }
}