import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CompanyStatus,
  NotificationAction,
  NotificationType,
  Prisma,
} from '../generated/prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyProfileDto } from './dto/create-company-profile.dto';
import { ListCompanyProfilesQueryDto } from './dto/list-company-profiles-query.dto';
import { UpdateCompanyProfileDto } from './dto/update-company-profile.dto';

const profileSelect = {
  id: true,
  userId: true,
  companyName: true,
  businessRegistrationNumber: true,
  contactPersonName: true,
  contactPhone: true,
  tagline: true,
  description: true,
  industry: true,
  website: true,
  address: true,
  logo: true,
  contactEmail: true,
  registrationDocumentFileId: true,
  status: true,
  reviewedById: true,
  reviewedAt: true,
  rejectionReason: true,
  submittedAt: true,
  suspensionReason: true,
  suspendedAt: true,
  createdAt: true,
  updatedAt: true,
  user: { select: { email: true, emailVerifiedAt: true } },
  reviewedBy: { select: { email: true } },
  registrationDocument: {
    select: {
      id: true,
      originalName: true,
      mimeType: true,
      sizeBytes: true,
      createdAt: true,
    },
  },
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
    if (dto.registrationDocumentFileId) {
      await this.assertRegistrationDocument(userId, dto.registrationDocumentFileId);
    }
    try {
      return await this.prisma.$transaction(async (tx) => {
        const profile = await tx.companyProfile.create({
          data: { userId, ...dto, status: CompanyStatus.DRAFT },
          select: profileSelect,
        });
        await tx.auditLog.create({
          data: {
            userId,
            action: 'COMPANY_PROFILE_CREATED',
            entity: 'CompanyProfile',
            entityId: profile.id,
            metadata: { status: profile.status },
          },
        });
        return profile;
      });
    } catch (error: unknown) {
      this.rethrowKnownDatabaseError(error);
    }
  }

  async updateByUserId(userId: string, dto: UpdateCompanyProfileDto) {
    const existing = await this.findByUserId(userId);
    if (existing.status === CompanyStatus.PENDING) {
      throw new BadRequestException({
        code: 'COMPANY_PROFILE_UNDER_REVIEW',
        message: 'Company profile cannot be edited while it is under review',
      });
    }
    if (existing.status === CompanyStatus.SUSPENDED) {
      throw new ForbiddenException({
        code: 'COMPANY_PROFILE_SUSPENDED',
        message: 'Suspended company profiles cannot be edited',
      });
    }

    const identityFields = [
      'companyName',
      'businessRegistrationNumber',
      'address',
      'contactPersonName',
      'contactPhone',
      'contactEmail',
      'registrationDocumentFileId',
    ] as const;
    if (
      existing.status === CompanyStatus.APPROVED &&
      identityFields.some((field) => dto[field] !== undefined)
    ) {
      throw new BadRequestException({
        code: 'COMPANY_VERIFIED_IDENTITY_LOCKED',
        message:
          'Verified legal information cannot be changed without a new review',
      });
    }
    if (dto.registrationDocumentFileId) {
      await this.assertRegistrationDocument(userId, dto.registrationDocumentFileId);
    }
    try {
      return await this.prisma.$transaction(async (tx) => {
        const profile = await tx.companyProfile.update({
          where: { id: existing.id },
          data: {
            ...dto,
          },
          select: profileSelect,
        });
        await tx.auditLog.create({
          data: {
            userId,
            action: 'COMPANY_PROFILE_UPDATED',
            entity: 'CompanyProfile',
            entityId: profile.id,
            metadata: {
              changedFields: Object.keys(dto),
              fromStatus: existing.status,
              toStatus: profile.status,
            },
          },
        });
        return profile;
      });
    } catch (error: unknown) {
      this.rethrowKnownDatabaseError(error);
    }
  }

  async removeByUserId(userId: string) {
    const profile = await this.findByUserId(userId);
    try {
      return await this.prisma.$transaction(async (tx) => {
        await tx.companyProfile.delete({ where: { id: profile.id } });
        await tx.auditLog.create({
          data: {
            userId,
            action: 'COMPANY_PROFILE_DELETED',
            entity: 'CompanyProfile',
            entityId: profile.id,
            metadata: { companyName: profile.companyName },
          },
        });
        return { deleted: true, id: profile.id };
      });
    } catch (error: unknown) {
      this.rethrowKnownDatabaseError(error);
    }
  }

  async submitVerification(userId: string) {
    const existing = await this.findByUserId(userId);
    if (
      existing.status !== CompanyStatus.DRAFT &&
      existing.status !== CompanyStatus.REJECTED
    ) {
      throw new BadRequestException({
        code: 'COMPANY_PROFILE_CANNOT_BE_SUBMITTED',
        message: 'Only draft or rejected company profiles can be submitted',
      });
    }

    const missingFields = [
      ['businessRegistrationNumber', existing.businessRegistrationNumber],
      ['address', existing.address],
      ['contactPersonName', existing.contactPersonName],
      ['contactPhone', existing.contactPhone],
      ['contactEmail', existing.contactEmail],
      ['registrationDocumentFileId', existing.registrationDocumentFileId],
    ]
      .filter(([, value]) => !value)
      .map(([field]) => field);

    if (missingFields.length > 0) {
      throw new BadRequestException({
        code: 'COMPANY_PROFILE_INCOMPLETE',
        message: 'Company profile is missing required verification information',
        details: { missingFields },
      });
    }

    await this.assertRegistrationDocument(
      userId,
      existing.registrationDocumentFileId!,
    );

    const result = await this.prisma.$transaction(async (tx) => {
      const changed = await tx.companyProfile.updateMany({
        where: {
          id: existing.id,
          status: { in: [CompanyStatus.DRAFT, CompanyStatus.REJECTED] },
        },
        data: {
          status: CompanyStatus.PENDING,
          submittedAt: new Date(),
          reviewedById: null,
          reviewedAt: null,
          rejectionReason: null,
          suspensionReason: null,
          suspendedAt: null,
        },
      });
      if (changed.count !== 1) {
        throw new BadRequestException({
          code: 'COMPANY_PROFILE_CANNOT_BE_SUBMITTED',
          message: 'Company profile is no longer editable',
        });
      }

      const profile = await tx.companyProfile.findUniqueOrThrow({
        where: { id: existing.id },
        select: profileSelect,
      });
      await tx.auditLog.create({
        data: {
          userId,
          action: 'COMPANY_PROFILE_SUBMITTED',
          entity: 'CompanyProfile',
          entityId: existing.id,
          metadata: { status: CompanyStatus.PENDING },
        },
      });
      return profile;
    });
    return result;
  }

  async findAll(query: ListCompanyProfilesQueryDto) {
    const { page, limit, status, search } = query;
    const normalizedSearch = search?.trim();
    const where: Prisma.CompanyProfileWhereInput = {
      ...(status ? { status } : {}),
      ...(normalizedSearch
        ? {
            OR: [
              { companyName: { contains: normalizedSearch, mode: 'insensitive' } },
              {
                businessRegistrationNumber: {
                  contains: normalizedSearch,
                  mode: 'insensitive',
                },
              },
              {
                user: {
                  email: { contains: normalizedSearch, mode: 'insensitive' },
                },
              },
            ],
          }
        : {}),
    };
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
    const normalizedReason = reason.trim();
    if (normalizedReason.length < 3) {
      throw new BadRequestException({
        code: 'COMPANY_REJECTION_REASON_REQUIRED',
        message: 'A clear rejection reason is required',
      });
    }
    return this.review(
      id,
      reviewerId,
      CompanyStatus.REJECTED,
      normalizedReason,
    );
  }

  async suspend(id: string, reviewerId: string, reason: string) {
    const normalizedReason = reason.trim();
    if (normalizedReason.length < 3) {
      throw new BadRequestException({
        code: 'COMPANY_SUSPENSION_REASON_REQUIRED',
        message: 'A clear suspension reason is required',
      });
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const changed = await tx.companyProfile.updateMany({
        where: { id, status: CompanyStatus.APPROVED },
        data: {
          status: CompanyStatus.SUSPENDED,
          suspensionReason: normalizedReason,
          suspendedAt: new Date(),
        },
      });
      if (changed.count !== 1) {
        throw new BadRequestException({
          code: 'COMPANY_PROFILE_NOT_APPROVED',
          message: 'Only an approved company profile can be suspended',
        });
      }
      const profile = await tx.companyProfile.findUniqueOrThrow({
        where: { id },
        select: profileSelect,
      });
      await tx.auditLog.create({
        data: {
          userId: reviewerId,
          action: 'COMPANY_SUSPENDED',
          entity: 'CompanyProfile',
          entityId: id,
          metadata: { reason: normalizedReason },
        },
      });
      const notification = await this.notifications.createInTransaction(tx, {
        userId: profile.userId,
        eventKey: `company:${profile.id}:suspended`,
        type: NotificationType.COMPANY,
        action: NotificationAction.OPEN_COMPANY_PROFILE,
        title: 'Quyền doanh nghiệp đã bị tạm đình chỉ',
        content: normalizedReason,
        resourceId: profile.id,
        metadata: { status: CompanyStatus.SUSPENDED },
      });
      return { profile, notifications: [notification] };
    });
    this.notifications.publishMany(result.notifications);
    return result.profile;
  }

  private async review(
    id: string,
    reviewerId: string,
    status: 'APPROVED' | 'REJECTED',
    rejectionReason: string | null = null,
  ) {
    const result = await this.prisma.$transaction(async (tx) => {
      const changed = await tx.companyProfile.updateMany({
        where: { id, status: CompanyStatus.PENDING },
        data: {
          status,
          reviewedById: reviewerId,
          reviewedAt: new Date(),
          rejectionReason,
        },
      });
      if (changed.count !== 1) {
        const existing = await tx.companyProfile.findUnique({
          where: { id },
          select: { id: true, status: true },
        });
        if (!existing) throw this.notFound();
        throw new BadRequestException({
          code: 'COMPANY_PROFILE_NOT_PENDING',
          message: 'Only a pending company profile can be reviewed',
        });
      }
      const profile = await tx.companyProfile.findUniqueOrThrow({
        where: { id },
        select: profileSelect,
      });
      await tx.auditLog.create({
        data: {
          userId: reviewerId,
          action: `COMPANY_${status}`,
          entity: 'CompanyProfile',
          entityId: id,
          metadata: {
            fromStatus: CompanyStatus.PENDING,
            toStatus: status,
            rejectionReason,
          },
        },
      });
      const notification = await this.notifications.createInTransaction(tx, {
        userId: profile.userId,
        eventKey: `company:${profile.id}:reviewed:${status}`,
        type: NotificationType.COMPANY,
        action: NotificationAction.OPEN_COMPANY_PROFILE,
        title:
          status === CompanyStatus.APPROVED
            ? 'Hồ sơ công ty đã được duyệt'
            : 'Hồ sơ công ty cần được bổ sung',
        content:
          status === CompanyStatus.APPROVED
            ? 'Hồ sơ công ty của bạn đã được duyệt và có thể tiếp tục sử dụng hệ thống.'
            : `Hồ sơ công ty cần được cập nhật: ${rejectionReason}`,
        resourceId: profile.id,
        metadata: { status },
      });
      return { profile, notifications: [notification] };
    });
    this.notifications.publishMany(result.notifications);
    return result.profile;
  }

  async findOne(id: string) {
    const profile = await this.prisma.companyProfile.findUnique({
      where: { id },
      select: profileSelect,
    });
    if (!profile) throw this.notFound();
    return profile;
  }

  private async assertRegistrationDocument(userId: string, fileId: string) {
    const file = await this.prisma.file.findFirst({
      where: {
        id: fileId,
        ownerId: userId,
        type: 'COMPANY_REGISTRATION',
      },
      select: { id: true },
    });
    if (!file) {
      throw new BadRequestException({
        code: 'COMPANY_REGISTRATION_DOCUMENT_INVALID',
        message: 'A valid company registration document is required',
      });
    }
  }

  private notFound(): NotFoundException {
    return new NotFoundException({
      code: 'COMPANY_PROFILE_NOT_FOUND',
      message: 'Company profile not found',
    });
  }

  private rethrowKnownDatabaseError(error: unknown): never {
    if (this.isPrismaError(error, 'P2002')) {
      throw new ConflictException({
        code: 'COMPANY_PROFILE_ALREADY_EXISTS',
        message: 'Company profile already exists',
      });
    }
    if (this.isPrismaError(error, 'P2003')) {
      throw new ConflictException({
        code: 'COMPANY_PROFILE_HAS_RELATED_DATA',
        message:
          'Company profile cannot be deleted because related records must be retained',
      });
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
}
