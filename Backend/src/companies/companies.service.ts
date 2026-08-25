import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CompanyStatus, Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyProfileDto } from './dto/create-company-profile.dto';
import { ListCompanyProfilesQueryDto } from './dto/list-company-profiles-query.dto';
import { UpdateCompanyProfileDto } from './dto/update-company-profile.dto';
import { NotificationAction, NotificationType } from '../generated/prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

const profileSelect = {
  id: true,
  userId: true,
  companyName: true,
  tagline: true,
  description: true,
  industry: true,
  website: true,
  address: true,
  logo: true,
  contactEmail: true,
  status: true,
  reviewedById: true,
  reviewedAt: true,
  rejectionReason: true,
  createdAt: true,
  updatedAt: true,
  user: { select: { email: true } },
  reviewedBy: { select: { email: true } },
} satisfies Prisma.CompanyProfileSelect;

@Injectable()
export class CompaniesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async findByUserId(userId: string) {
    const profile = await this.prisma.companyProfile.findUnique({
      where: { userId },
      select: profileSelect,
    });
    if (!profile) throw this.notFound();
    return profile;
  }

  async create(userId: string, dto: CreateCompanyProfileDto) {
    try {
      return await this.prisma.companyProfile.create({
        data: { userId, ...dto, status: CompanyStatus.PENDING },
        select: profileSelect,
      });
    } catch (error: unknown) {
      this.rethrowKnownDatabaseError(error);
    }
  }

  async updateByUserId(userId: string, dto: UpdateCompanyProfileDto) {
    const profile = await this.findByUserId(userId);
    try {
      return await this.prisma.companyProfile.update({
        where: { id: profile.id },
        data: {
          ...dto,
          status: CompanyStatus.PENDING,
          reviewedById: null,
          reviewedAt: null,
          rejectionReason: null,
        },
        select: profileSelect,
      });
    } catch (error: unknown) {
      this.rethrowKnownDatabaseError(error);
    }
  }

  async removeByUserId(userId: string) {
    const profile = await this.findByUserId(userId);
    try {
      await this.prisma.companyProfile.delete({ where: { id: profile.id } });
      return { deleted: true, id: profile.id };
    } catch (error: unknown) {
      this.rethrowKnownDatabaseError(error);
    }
  }

  async findAll(query: ListCompanyProfilesQueryDto) {
    const { page, limit, status } = query;
    const where: Prisma.CompanyProfileWhereInput = status ? { status } : {};
    const [items, total] = await this.prisma.$transaction([
      this.prisma.companyProfile.findMany({
        where,
        select: profileSelect,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.companyProfile.count({ where }),
    ]);
    return {
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async approve(id: string, reviewerId: string) {
    return this.review(id, reviewerId, CompanyStatus.APPROVED);
  }

  async reject(id: string, reviewerId: string, reason: string) {
    return this.review(id, reviewerId, CompanyStatus.REJECTED, reason.trim());
  }

  private async review(
    id: string,
    reviewerId: string,
    status: 'APPROVED' | 'REJECTED',
    rejectionReason: string | null = null,
  ) {
    const existing = await this.findById(id);
    if (existing.status !== CompanyStatus.PENDING) {
      throw new BadRequestException({
        code: 'COMPANY_PROFILE_NOT_PENDING',
        message: 'Only a pending company profile can be reviewed',
      });
    }
    const result = await this.prisma.$transaction(async (tx) => {
      const profile = await tx.companyProfile.update({
        where: { id },
        data: {
          status,
          reviewedById: reviewerId,
          reviewedAt: new Date(),
          rejectionReason,
        },
        select: profileSelect,
      });
      await tx.auditLog.create({
        data: {
          userId: reviewerId,
          action: `COMPANY_${status}`,
          entity: 'CompanyProfile',
          entityId: id,
          metadata: { status, rejectionReason },
        },
      });
      const notification = await this.notifications.createInTransaction(tx, {
        userId: profile.userId,
        eventKey: `company:${profile.id}:reviewed:${status}`,
        type: NotificationType.COMPANY,
        action: NotificationAction.OPEN_COMPANY_PROFILE,
        title: status === CompanyStatus.APPROVED ? 'Hồ sơ công ty đã được duyệt' : 'Hồ sơ công ty bị từ chối',
        content: status === CompanyStatus.APPROVED
          ? 'Hồ sơ công ty của bạn đã được duyệt và có thể tiếp tục sử dụng hệ thống.'
          : 'Hồ sơ công ty của bạn cần được cập nhật theo phản hồi của quản trị viên.',
        resourceId: profile.id,
        metadata: { status },
      });
      return { profile, notifications: [notification] };
    });
    this.notifications.publishMany(result.notifications);
    return result.profile;
  }

  private async findById(id: string) {
    const profile = await this.prisma.companyProfile.findUnique({
      where: { id },
      select: { id: true, status: true },
    });
    if (!profile) throw this.notFound();
    return profile;
  }

  private notFound(): NotFoundException {
    return new NotFoundException({
      code: 'COMPANY_PROFILE_NOT_FOUND',
      message: 'Company profile not found',
    });
  }

  private rethrowKnownDatabaseError(error: unknown): never {
    if (this.isPrismaError(error, 'P2002'))
      throw new ConflictException({
        code: 'COMPANY_PROFILE_ALREADY_EXISTS',
        message: 'Company profile already exists',
      });
    if (this.isPrismaError(error, 'P2003'))
      throw new ConflictException({
        code: 'COMPANY_PROFILE_HAS_RELATED_DATA',
        message:
          'Company profile cannot be deleted because related records must be retained',
      });
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
}
