import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CompanyStatus,
  InternshipStatus,
  NotificationAction,
  NotificationType,
  Prisma,
} from '../generated/prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  COMPANY_CHECKLIST_DEFINITIONS,
  REQUIRED_CHECKLIST_CODES,
  REJECTION_REASON_LABELS,
  SUSPENSION_REASON_LABELS,
} from './constants/company-verification.constants';
import { ApproveCompanyDto } from './dto/approve-company.dto';
import { CreateCompanyProfileDto } from './dto/create-company-profile.dto';
import { ListCompanyProfilesQueryDto } from './dto/list-company-profiles-query.dto';
import { RejectCompanyDto } from './dto/reject-company.dto';
import { SuspendCompanyDto } from './dto/suspend-company.dto';
import { UnsuspendCompanyDto } from './dto/unsuspend-company.dto';
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
  rejectionReasonCode: true,
  submittedAt: true,
  reviewDueAt: true,
  reviewChecklist: true,
  suspensionReason: true,
  suspensionReasonCode: true,
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
    private readonly configService: ConfigService,
  ) {}

  async findByUserId(userId: string) {
    const profile = await this.prisma.companyProfile.findUnique({
      where: { userId },
      select: profileSelect,
    });
    if (!profile) throw this.notFound();
    return this.enrichProfile(profile);
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
        return this.enrichProfile(profile);
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
        return this.enrichProfile(profile);
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

    const slaHours = this.configService.get<number>(
      'COMPANY_REVIEW_SLA_HOURS',
      72,
    );
    const submittedAt = new Date();
    const reviewDueAt = new Date(submittedAt.getTime() + slaHours * 3600 * 1000);

    const result = await this.prisma.$transaction(async (tx) => {
      const changed = await tx.companyProfile.updateMany({
        where: {
          id: existing.id,
          status: { in: [CompanyStatus.DRAFT, CompanyStatus.REJECTED] },
        },
        data: {
          status: CompanyStatus.PENDING,
          submittedAt,
          reviewDueAt,
          reviewChecklist: Prisma.DbNull,
          reviewedById: null,
          reviewedAt: null,
          rejectionReason: null,
          rejectionReasonCode: null,
          suspensionReason: null,
          suspensionReasonCode: null,
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
          metadata: { status: CompanyStatus.PENDING, reviewDueAt },
        },
      });
      return profile;
    });
    return this.enrichProfile(result);
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

    const isPending = status === CompanyStatus.PENDING;
    const orderBy: Prisma.CompanyProfileOrderByWithRelationInput[] = isPending
      ? [{ reviewDueAt: 'asc' }, { submittedAt: 'asc' }]
      : [{ createdAt: 'desc' }];

    const [items, total] = await this.prisma.$transaction([
      this.prisma.companyProfile.findMany({
        where,
        select: profileSelect,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.companyProfile.count({ where }),
    ]);

    return {
      items: items.map((item) => this.enrichProfile(item)),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async approve(id: string, reviewerId: string, dto: ApproveCompanyDto) {
    const checklistItems = dto?.checklist ?? [];
    const missingOrUnchecked = REQUIRED_CHECKLIST_CODES.filter((code) => {
      const item = checklistItems.find((i) => i.code === code);
      return !item || item.checked !== true;
    });
    if (missingOrUnchecked.length > 0) {
      throw new BadRequestException({
        code: 'COMPANY_VERIFICATION_CHECKLIST_INCOMPLETE',
        message: 'All verification checklist items must be checked before approval',
        details: { missingOrUnchecked },
      });
    }

    const existing = await this.prisma.companyProfile.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        userId: true,
        user: { select: { email: true, emailVerifiedAt: true } },
      },
    });
    if (!existing) throw this.notFound();
    if (existing.status !== CompanyStatus.PENDING) {
      throw new BadRequestException({
        code: 'COMPANY_PROFILE_NOT_PENDING',
        message: 'Only a pending company profile can be reviewed',
      });
    }
    if (!existing.user.emailVerifiedAt) {
      throw new BadRequestException({
        code: 'COMPANY_ACCOUNT_EMAIL_NOT_VERIFIED',
        message: 'Company user account email must be verified before approval',
      });
    }

    const checklistPayload = {
      items: REQUIRED_CHECKLIST_CODES.map((code) => ({
        code,
        label: COMPANY_CHECKLIST_DEFINITIONS[code],
        checked: true,
      })),
      completedAt: new Date().toISOString(),
      reviewerId,
    };

    const result = await this.prisma.$transaction(async (tx) => {
      const changed = await tx.companyProfile.updateMany({
        where: { id, status: CompanyStatus.PENDING },
        data: {
          status: CompanyStatus.APPROVED,
          reviewedById: reviewerId,
          reviewedAt: new Date(),
          reviewChecklist: checklistPayload,
          rejectionReason: null,
          rejectionReasonCode: null,
        },
      });
      if (changed.count !== 1) {
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
          action: 'COMPANY_APPROVED',
          entity: 'CompanyProfile',
          entityId: id,
          metadata: {
            fromStatus: CompanyStatus.PENDING,
            toStatus: CompanyStatus.APPROVED,
            checklist: checklistPayload,
          },
        },
      });
      const notification = await this.notifications.createInTransaction(tx, {
        userId: profile.userId,
        eventKey: `company:${profile.id}:reviewed:APPROVED:${Date.now()}`,
        type: NotificationType.COMPANY,
        action: NotificationAction.OPEN_COMPANY_PROFILE,
        title: 'Hồ sơ công ty đã được duyệt',
        content:
          'Hồ sơ công ty của bạn đã được duyệt và có thể tiếp tục sử dụng hệ thống.',
        resourceId: profile.id,
        metadata: { status: CompanyStatus.APPROVED },
      });
      return { profile, notifications: [notification] };
    });
    this.notifications.publishMany(result.notifications);
    return this.enrichProfile(result.profile);
  }

  async reject(id: string, reviewerId: string, dto: RejectCompanyDto) {
    const normalizedDetail = dto.reasonDetail?.trim() || '';
    if (!dto.reasonCode || normalizedDetail.length < 10) {
      throw new BadRequestException({
        code: 'COMPANY_REJECTION_REASON_INVALID',
        message:
          'Reason code and a detailed explanation (minimum 10 characters) are required',
      });
    }
    const label = REJECTION_REASON_LABELS[dto.reasonCode] || dto.reasonCode;
    const formattedReason = `[${label}] ${normalizedDetail}`;

    const result = await this.prisma.$transaction(async (tx) => {
      const changed = await tx.companyProfile.updateMany({
        where: { id, status: CompanyStatus.PENDING },
        data: {
          status: CompanyStatus.REJECTED,
          reviewedById: reviewerId,
          reviewedAt: new Date(),
          rejectionReasonCode: dto.reasonCode,
          rejectionReason: formattedReason,
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
          action: 'COMPANY_REJECTED',
          entity: 'CompanyProfile',
          entityId: id,
          metadata: {
            fromStatus: CompanyStatus.PENDING,
            toStatus: CompanyStatus.REJECTED,
            reasonCode: dto.reasonCode,
            reasonDetail: normalizedDetail,
            rejectionReason: formattedReason,
          },
        },
      });
      const notification = await this.notifications.createInTransaction(tx, {
        userId: profile.userId,
        eventKey: `company:${profile.id}:reviewed:REJECTED:${Date.now()}`,
        type: NotificationType.COMPANY,
        action: NotificationAction.OPEN_COMPANY_PROFILE,
        title: 'Hồ sơ công ty cần được bổ sung',
        content: `Hồ sơ công ty cần được cập nhật: ${formattedReason}`,
        resourceId: profile.id,
        metadata: { status: CompanyStatus.REJECTED },
      });
      return { profile, notifications: [notification] };
    });
    this.notifications.publishMany(result.notifications);
    return this.enrichProfile(result.profile);
  }

  async suspend(id: string, reviewerId: string, dto: SuspendCompanyDto) {
    const normalizedDetail = dto.reasonDetail?.trim() || '';
    if (!dto.reasonCode || normalizedDetail.length < 10) {
      throw new BadRequestException({
        code: 'COMPANY_SUSPENSION_REASON_INVALID',
        message:
          'Suspension reason code and details (minimum 10 characters) are required',
      });
    }
    const label = SUSPENSION_REASON_LABELS[dto.reasonCode] || dto.reasonCode;
    const formattedReason = `[${label}] ${normalizedDetail}`;

    const result = await this.prisma.$transaction(async (tx) => {
      const changed = await tx.companyProfile.updateMany({
        where: { id, status: CompanyStatus.APPROVED },
        data: {
          status: CompanyStatus.SUSPENDED,
          suspensionReasonCode: dto.reasonCode,
          suspensionReason: formattedReason,
          suspendedAt: new Date(),
        },
      });
      if (changed.count !== 1) {
        throw new BadRequestException({
          code: 'COMPANY_PROFILE_NOT_APPROVED',
          message: 'Only an approved company profile can be suspended',
        });
      }

      const closedInternships = await tx.internship.updateMany({
        where: { companyId: id, status: InternshipStatus.OPEN },
        data: { status: InternshipStatus.CLOSED },
      });

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
          metadata: {
            reasonCode: dto.reasonCode,
            reasonDetail: normalizedDetail,
            closedCount: closedInternships.count,
          },
        },
      });
      const notification = await this.notifications.createInTransaction(tx, {
        userId: profile.userId,
        eventKey: `company:${profile.id}:suspended:${Date.now()}`,
        type: NotificationType.COMPANY,
        action: NotificationAction.OPEN_COMPANY_PROFILE,
        title: 'Quyền doanh nghiệp đã bị tạm đình chỉ',
        content: formattedReason,
        resourceId: profile.id,
        metadata: { status: CompanyStatus.SUSPENDED },
      });
      return { profile, notifications: [notification] };
    });
    this.notifications.publishMany(result.notifications);
    return this.enrichProfile(result.profile);
  }

  async unsuspend(id: string, reviewerId: string, dto: UnsuspendCompanyDto) {
    const normalizedDetail = dto.reasonDetail?.trim() || '';
    if (normalizedDetail.length < 10) {
      throw new BadRequestException({
        code: 'COMPANY_UNSUSPENSION_REASON_INVALID',
        message: 'Unsuspend reason details (minimum 10 characters) are required',
      });
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const changed = await tx.companyProfile.updateMany({
        where: { id, status: CompanyStatus.SUSPENDED },
        data: {
          status: CompanyStatus.APPROVED,
          suspensionReason: null,
          suspensionReasonCode: null,
          suspendedAt: null,
        },
      });
      if (changed.count !== 1) {
        throw new BadRequestException({
          code: 'COMPANY_PROFILE_NOT_SUSPENDED',
          message: 'Only a suspended company profile can be unsuspended',
        });
      }
      const profile = await tx.companyProfile.findUniqueOrThrow({
        where: { id },
        select: profileSelect,
      });
      await tx.auditLog.create({
        data: {
          userId: reviewerId,
          action: 'COMPANY_UNSUSPENDED',
          entity: 'CompanyProfile',
          entityId: id,
          metadata: { reasonDetail: normalizedDetail },
        },
      });
      const notification = await this.notifications.createInTransaction(tx, {
        userId: profile.userId,
        eventKey: `company:${profile.id}:unsuspended:${Date.now()}`,
        type: NotificationType.COMPANY,
        action: NotificationAction.OPEN_COMPANY_PROFILE,
        title: 'Quyền doanh nghiệp đã được khôi phục',
        content: `Hồ sơ công ty của bạn đã được khôi phục quyền hoạt động: ${normalizedDetail}`,
        resourceId: profile.id,
        metadata: { status: CompanyStatus.APPROVED },
      });
      return { profile, notifications: [notification] };
    });
    this.notifications.publishMany(result.notifications);
    return this.enrichProfile(result.profile);
  }

  async findOne(id: string) {
    const profile = await this.prisma.companyProfile.findUnique({
      where: { id },
      select: profileSelect,
    });
    if (!profile) throw this.notFound();
    return this.enrichProfile(profile);
  }

  private enrichProfile<
    T extends {
      status: CompanyStatus;
      reviewDueAt?: Date | null;
    },
  >(profile: T) {
    const now = new Date();
    const isPending = profile.status === CompanyStatus.PENDING;
    const reviewDueDate = profile.reviewDueAt
      ? new Date(profile.reviewDueAt)
      : null;
    const isOverdue = Boolean(
      isPending && reviewDueDate && reviewDueDate.getTime() < now.getTime(),
    );
    let hoursRemaining: number | null = null;
    if (isPending && reviewDueDate) {
      const diff = reviewDueDate.getTime() - now.getTime();
      hoursRemaining = Math.max(0, Math.round(diff / (3600 * 1000)));
    }
    return {
      ...profile,
      isOverdue,
      hoursRemaining,
    };
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
