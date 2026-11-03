import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  ApplicationStatus,
  CompanyStatus,
  InternshipModerationReasonCode,
  InternshipReportReasonCode,
  InternshipReportStatus,
  InternshipStatus,
  NotificationAction,
  NotificationType,
  Prisma,
  Role,
  SemesterStatus,
} from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  SemesterLifecycleService,
  type SemesterWindow,
} from '../semesters/semester-lifecycle.service';
import { NotificationsService } from '../notifications/notifications.service';
import type { AuthUser } from '../auth/types/auth-user.type';
import { CreateInternshipDto } from './dto/create-internship.dto';
import { ListInternshipsQueryDto } from './dto/list-internships-query.dto';
import { RepostInternshipDto } from './dto/repost-internship.dto';
import { SaveAsTemplateDto } from './dto/save-as-template.dto';
import { UpdateInternshipDto } from './dto/update-internship.dto';
import {
  ModerateInternshipDto,
  ModerationActionType,
} from './dto/moderate-internship.dto';
import { CreateInternshipReportDto } from './dto/create-internship-report.dto';
import { ReviewInternshipReportDto } from './dto/review-internship-report.dto';
import { ListInternshipReportsQueryDto } from './dto/list-internship-reports-query.dto';
import type { CreateInternshipFromTemplateDto } from '../internship-templates/dto/create-internship-from-template.dto';

const internshipSelect = {
  id: true,
  companyId: true,
  semesterId: true,
  title: true,
  department: true,
  location: true,
  workType: true,
  stipend: true,
  description: true,
  requirements: true,
  slots: true,
  filledSlots: true,
  deadline: true,
  startDate: true,
  endDate: true,
  status: true,
  sourceTemplateId: true,
  sourceInternshipId: true,
  viewCount: true,
  uniqueViewerCount: true,
  moderationReasonCode: true,
  moderationReason: true,
  moderatedById: true,
  moderatedAt: true,
  createdAt: true,
  updatedAt: true,
  company: {
    select: { id: true, companyName: true, logo: true, status: true },
  },
  semester: {
    select: {
      id: true,
      name: true,
      startDate: true,
      endDate: true,
      status: true,
    },
  },
  skills: {
    select: {
      skillId: true,
      isRequired: true,
      weight: true,
      skill: { select: { id: true, name: true } },
    },
    orderBy: { skill: { name: 'asc' } },
  },
  _count: {
    select: {
      applications: true,
      reports: true,
    },
  },
} satisfies Prisma.InternshipSelect;

type InternshipRecord = Prisma.InternshipGetPayload<{
  select: typeof internshipSelect;
}>;

@Injectable()
export class InternshipsService {
  private readonly logger = new Logger(InternshipsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly lifecycle: SemesterLifecycleService,
    private readonly notifications: NotificationsService,
  ) {}

  async list(query: ListInternshipsQueryDto, user: AuthUser) {
    await this.lifecycle.reconcile();
    const where = this.buildWhere(
      query,
      user.role === Role.ADMIN ? undefined : InternshipStatus.OPEN,
      undefined,
      user.role !== Role.ADMIN,
    );
    return this.paginate(where, query);
  }

  async listMine(query: ListInternshipsQueryDto, userId: string) {
    await this.lifecycle.reconcile();
    const company = await this.getCompanyForUser(userId);
    return this.paginate(this.buildWhere(query, undefined, company.id), query);
  }

  async findOne(id: string, user: AuthUser) {
    await this.lifecycle.reconcile();
    const internship = await this.prisma.internship.findUnique({
      where: { id },
      select: internshipSelect,
    });
    if (!internship) throw this.notFound();
    if (user.role === Role.COMPANY) {
      const company = await this.getCompanyForUser(user.id);
      if (internship.companyId !== company.id) throw this.notFound();
    } else if (user.role !== Role.ADMIN) {
      if (
        internship.status !== InternshipStatus.OPEN ||
        internship.company.status !== CompanyStatus.APPROVED
      ) {
        throw this.notFound();
      }
    }

    if (user.role === Role.STUDENT) {
      const inc = await this.recordStudentView(id, user.id);
      internship.viewCount += inc.viewIncrement;
      internship.uniqueViewerCount += inc.uniqueIncrement;
    }

    return this.toResponse(internship);
  }

  private async recordStudentView(
    internshipId: string,
    userId: string,
  ): Promise<{ viewIncrement: number; uniqueIncrement: number }> {
    try {
      const now = new Date();
      const existing = await this.prisma.internshipView.findUnique({
        where: {
          internshipId_viewerUserId: {
            internshipId,
            viewerUserId: userId,
          },
        },
        select: {
          id: true,
          lastViewedAt: true,
        },
      });

      if (!existing) {
        await this.prisma.$transaction([
          this.prisma.internshipView.create({
            data: {
              internshipId,
              viewerUserId: userId,
              firstViewedAt: now,
              lastViewedAt: now,
            },
          }),
          this.prisma.internship.update({
            where: { id: internshipId },
            data: {
              viewCount: { increment: 1 },
              uniqueViewerCount: { increment: 1 },
            },
          }),
        ]);
        return { viewIncrement: 1, uniqueIncrement: 1 };
      }

      const diffMs = now.getTime() - existing.lastViewedAt.getTime();
      const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
      if (diffMs >= TWENTY_FOUR_HOURS_MS) {
        await this.prisma.$transaction([
          this.prisma.internshipView.update({
            where: { id: existing.id },
            data: {
              lastViewedAt: now,
            },
          }),
          this.prisma.internship.update({
            where: { id: internshipId },
            data: {
              viewCount: { increment: 1 },
            },
          }),
        ]);
        return { viewIncrement: 1, uniqueIncrement: 0 };
      }

      return { viewIncrement: 0, uniqueIncrement: 0 };
    } catch (error) {
      this.logger.warn(
        `Failed to record view for internship ${internshipId} by student ${userId}`,
        error,
      );
      return { viewIncrement: 0, uniqueIncrement: 0 };
    }
  }

  async create(dto: CreateInternshipDto, userId: string) {
    if (dto.status === InternshipStatus.REJECTED) {
      throw new BadRequestException({
        code: 'INVALID_STATUS',
        message: 'Doanh nghiệp không thể đặt trạng thái tin là REJECTED',
      });
    }
    const company = await this.getApprovedCompanyForUser(userId);
    const semester = await this.resolvePostingSemester(dto.semesterId);
    this.validateDates(dto, semester);
    this.ensureCanOpen(
      dto.status ?? InternshipStatus.DRAFT,
      dto.deadline,
      dto.startDate,
      dto.endDate,
      semester,
    );
    const record = await this.prisma.$transaction(async (tx) => {
      const internship = await tx.internship.create({
        data: {
          ...dto,
          companyId: company.id,
          semesterId: semester.id,
          status: dto.status ?? InternshipStatus.DRAFT,
        },
        select: internshipSelect,
      });
      await tx.auditLog.create({
        data: {
          userId,
          action: 'INTERNSHIP_CREATED',
          entity: 'Internship',
          entityId: internship.id,
          metadata: {
            companyId: company.id,
            semesterId: internship.semesterId,
            status: internship.status,
          },
        },
      });
      return internship;
    });
    return this.toResponse(record);
  }

  async update(id: string, dto: UpdateInternshipDto, userId: string) {
    const company = await this.getApprovedCompanyForUser(userId);
    const current = await this.prisma.internship.findUnique({
      where: { id },
      select: {
        companyId: true,
        filledSlots: true,
        slots: true,
        semesterId: true,
        startDate: true,
        endDate: true,
        deadline: true,
        status: true,
      },
    });
    if (!current) throw this.notFound();
    if (current.companyId !== company.id) throw this.notOwned();
    if (current.status === InternshipStatus.CANCELLED) {
      throw new BadRequestException({
        code: 'INTERNSHIP_CANCELLED',
        message: 'A cancelled internship cannot be edited',
      });
    }
    if (current.status === InternshipStatus.REJECTED) {
      throw new BadRequestException({
        code: 'INTERNSHIP_REJECTED',
        message: 'Tin tuyển dụng đã bị Ban quản trị gỡ bỏ do vi phạm quy định',
      });
    }
    if (dto.status === InternshipStatus.REJECTED) {
      throw new BadRequestException({
        code: 'INVALID_STATUS',
        message: 'Doanh nghiệp không thể đặt trạng thái tin là REJECTED',
      });
    }
    const semester = await this.ensureSemesterAvailable(
      dto.semesterId ?? current.semesterId,
    );
    if (dto.slots !== undefined && dto.slots < current.filledSlots) {
      throw new BadRequestException({
        code: 'SLOTS_BELOW_FILLED',
        message: 'Slots cannot be lower than filled slots',
      });
    }
    const merged = {
      deadline: dto.deadline === undefined ? current.deadline : dto.deadline,
      startDate:
        dto.startDate === undefined ? current.startDate : dto.startDate,
      endDate: dto.endDate === undefined ? current.endDate : dto.endDate,
    };
    this.validateDates(merged, semester);
    this.ensureCanOpen(
      dto.status ?? current.status,
      merged.deadline,
      merged.startDate,
      merged.endDate,
      semester,
    );

    const updated = await this.prisma.$transaction(async (tx) => {
      const internship = await tx.internship.update({
        where: { id },
        data: dto,
        select: internshipSelect,
      });
      await tx.auditLog.create({
        data: {
          userId,
          action:
            dto.status !== undefined && dto.status !== current.status
              ? 'INTERNSHIP_STATUS_CHANGED'
              : 'INTERNSHIP_UPDATED',
          entity: 'Internship',
          entityId: id,
          metadata: {
            changedFields: Object.keys(dto),
            companyId: company.id,
            ...(dto.status !== undefined
              ? { fromStatus: current.status, toStatus: dto.status }
              : {}),
          },
        },
      });
      return internship;
    });
    return this.toResponse(updated);
  }

  async remove(id: string, userId: string) {
    const company = await this.getCompanyForUser(userId);
    const internship = await this.prisma.internship.findUnique({
      where: { id },
      select: {
        id: true,
        companyId: true,
        title: true,
        status: true,
        _count: { select: { applications: true, placements: true } },
      },
    });
    if (!internship) throw this.notFound();
    if (internship.companyId !== company.id) throw this.notOwned();
    if (internship._count.applications || internship._count.placements) {
      throw new ConflictException({
        code: 'INTERNSHIP_HAS_RELATED_DATA',
        message: 'Internship with applications or placements cannot be deleted',
      });
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.internship.delete({ where: { id } });
      await tx.auditLog.create({
        data: {
          userId,
          action: 'INTERNSHIP_DELETED',
          entity: 'Internship',
          entityId: id,
          metadata: {
            companyId: company.id,
            title: internship.title,
            status: internship.status,
          },
        },
      });
    });
    return { deleted: true, id };
  }

  async saveAsTemplate(id: string, userId: string, dto: SaveAsTemplateDto) {
    const company = await this.getApprovedCompanyForUser(userId);
    const internship = await this.prisma.internship.findUnique({
      where: { id },
      include: {
        skills: {
          select: { skillId: true, isRequired: true, weight: true },
        },
      },
    });
    if (!internship) throw this.notFound();
    if (internship.companyId !== company.id) throw this.notOwned();

    const templateCount = await this.prisma.internshipTemplate.count({
      where: { companyId: company.id },
    });
    if (templateCount >= 20) {
      throw new BadRequestException({
        code: 'INTERNSHIP_TEMPLATE_LIMIT',
        message: 'Tối đa 20 mẫu tin tuyển dụng cho mỗi doanh nghiệp',
      });
    }

    const trimmedName = dto.name.trim();
    const existingName = await this.prisma.internshipTemplate.findUnique({
      where: {
        companyId_name: {
          companyId: company.id,
          name: trimmedName,
        },
      },
      select: { id: true },
    });
    if (existingName) {
      throw new ConflictException({
        code: 'INTERNSHIP_TEMPLATE_NAME_EXISTS',
        message: 'Tên mẫu tin đã tồn tại trong doanh nghiệp này',
      });
    }

    const template = await this.prisma.$transaction(async (tx) => {
      const created = await tx.internshipTemplate.create({
        data: {
          companyId: company.id,
          name: trimmedName,
          title: internship.title,
          department: internship.department,
          location: internship.location,
          workType: internship.workType,
          stipend: internship.stipend,
          description: internship.description,
          requirements: internship.requirements,
          slotsDefault: internship.slots,
          skills: {
            create: internship.skills.map((s) => ({
              skillId: s.skillId,
              isRequired: s.isRequired,
              weight: s.weight,
            })),
          },
        },
        include: {
          skills: {
            include: { skill: { select: { id: true, name: true } } },
          },
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'INTERNSHIP_TEMPLATE_CREATED',
          entity: 'InternshipTemplate',
          entityId: created.id,
          metadata: {
            companyId: company.id,
            fromInternshipId: internship.id,
            name: created.name,
          },
        },
      });

      return created;
    });

    return template;
  }

  async repost(id: string, userId: string, dto: RepostInternshipDto) {
    const company = await this.getApprovedCompanyForUser(userId);
    const source = await this.prisma.internship.findUnique({
      where: { id },
      include: {
        skills: {
          include: { skill: { select: { id: true, name: true } } },
        },
      },
    });
    if (!source) throw this.notFound();
    if (source.companyId !== company.id) throw this.notOwned();

    const semester = await this.ensureSemesterAvailable(dto.semesterId);

    const mergedDates = {
      deadline: dto.deadline !== undefined ? dto.deadline : null,
      startDate: dto.startDate !== undefined ? dto.startDate : null,
      endDate: dto.endDate !== undefined ? dto.endDate : null,
    };
    this.validateDates(mergedDates, semester);

    const targetStatus = dto.status ?? InternshipStatus.DRAFT;
    this.ensureCanOpen(
      targetStatus,
      mergedDates.deadline,
      mergedDates.startDate,
      mergedDates.endDate,
      semester,
    );

    const targetSlots = dto.slots ?? source.slots;
    if (targetSlots < 1) {
      throw new BadRequestException({
        code: 'INVALID_SLOTS',
        message: 'Số lượng tuyển phải lớn hơn hoặc bằng 1',
      });
    }

    const rawSkills = dto.skills
      ? dto.skills.map((s) => ({
          skillId: s.skillId,
          isRequired: s.isRequired ?? true,
          weight: s.weight ?? 1,
        }))
      : source.skills.map((s) => ({
          skillId: s.skillId,
          isRequired: s.isRequired,
          weight: s.weight,
        }));

    const uniqueSkillMap = new Map<
      string,
      { skillId: string; isRequired: boolean; weight: number }
    >();
    for (const s of rawSkills) {
      uniqueSkillMap.set(s.skillId, s);
    }
    const uniqueSkills = Array.from(uniqueSkillMap.values());

    const validCatalogSkills = await this.prisma.skill.findMany({
      where: { id: { in: uniqueSkills.map((s) => s.skillId) } },
      select: { id: true, name: true },
    });
    const validSkillIdSet = new Set(validCatalogSkills.map((s) => s.id));
    const warnings: string[] = [];
    const skillsToCreate = uniqueSkills.filter((s) => {
      const exists = validSkillIdSet.has(s.skillId);
      if (!exists) {
        const original = source.skills.find((os) => os.skillId === s.skillId);
        const skillName = original?.skill?.name || s.skillId;
        warnings.push(
          `Kỹ năng "${skillName}" không còn tồn tại trong hệ thống và đã được bỏ qua.`,
        );
      }
      return exists;
    });

    const created = await this.prisma.$transaction(async (tx) => {
      const newInternship = await tx.internship.create({
        data: {
          companyId: company.id,
          semesterId: semester.id,
          title: dto.title ?? source.title,
          department:
            dto.department !== undefined ? dto.department : source.department,
          location: dto.location !== undefined ? dto.location : source.location,
          workType: dto.workType !== undefined ? dto.workType : source.workType,
          stipend: dto.stipend !== undefined ? dto.stipend : source.stipend,
          description: dto.description ?? source.description,
          requirements:
            dto.requirements !== undefined
              ? dto.requirements
              : source.requirements,
          slots: targetSlots,
          filledSlots: 0,
          viewCount: 0,
          uniqueViewerCount: 0,
          deadline: mergedDates.deadline,
          startDate: mergedDates.startDate,
          endDate: mergedDates.endDate,
          status: targetStatus,
          sourceInternshipId: source.id,
          sourceTemplateId: null,
          skills: {
            create: skillsToCreate.map((s) => ({
              skillId: s.skillId,
              isRequired: s.isRequired,
              weight: s.weight,
            })),
          },
        },
        select: internshipSelect,
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'INTERNSHIP_REPOSTED',
          entity: 'Internship',
          entityId: newInternship.id,
          metadata: {
            companyId: company.id,
            sourceInternshipId: source.id,
            newInternshipId: newInternship.id,
            semesterId: semester.id,
            status: targetStatus,
          },
        },
      });

      return newInternship;
    });

    return {
      ...this.toResponse(created),
      warnings,
    };
  }

  async createFromTemplate(
    templateId: string,
    userId: string,
    dto: CreateInternshipFromTemplateDto,
  ) {
    const company = await this.getApprovedCompanyForUser(userId);
    const template = await this.prisma.internshipTemplate.findUnique({
      where: { id: templateId },
      include: {
        skills: {
          include: { skill: { select: { id: true, name: true } } },
        },
      },
    });
    if (!template) {
      throw new NotFoundException({
        code: 'INTERNSHIP_TEMPLATE_NOT_FOUND',
        message: 'Mẫu tin tuyển dụng không tìm thấy',
      });
    }
    if (template.companyId !== company.id) throw this.notOwned();

    const semester = await this.ensureSemesterAvailable(dto.semesterId);

    const mergedDates = {
      deadline: dto.deadline !== undefined ? dto.deadline : null,
      startDate: dto.startDate !== undefined ? dto.startDate : null,
      endDate: dto.endDate !== undefined ? dto.endDate : null,
    };
    this.validateDates(mergedDates, semester);

    const targetStatus = dto.status ?? InternshipStatus.DRAFT;
    this.ensureCanOpen(
      targetStatus,
      mergedDates.deadline,
      mergedDates.startDate,
      mergedDates.endDate,
      semester,
    );

    const targetSlots = dto.slots ?? template.slotsDefault;
    if (targetSlots < 1) {
      throw new BadRequestException({
        code: 'INVALID_SLOTS',
        message: 'Số lượng tuyển phải lớn hơn hoặc bằng 1',
      });
    }

    const rawSkills = dto.skills
      ? dto.skills.map((s) => ({
          skillId: s.skillId,
          isRequired: s.isRequired ?? true,
          weight: s.weight ?? 1,
        }))
      : template.skills.map((s) => ({
          skillId: s.skillId,
          isRequired: s.isRequired,
          weight: s.weight,
        }));

    const uniqueSkillMap = new Map<
      string,
      { skillId: string; isRequired: boolean; weight: number }
    >();
    for (const s of rawSkills) {
      uniqueSkillMap.set(s.skillId, s);
    }
    const uniqueSkills = Array.from(uniqueSkillMap.values());

    const validCatalogSkills = await this.prisma.skill.findMany({
      where: { id: { in: uniqueSkills.map((s) => s.skillId) } },
      select: { id: true, name: true },
    });
    const validSkillIdSet = new Set(validCatalogSkills.map((s) => s.id));
    const warnings: string[] = [];
    const skillsToCreate = uniqueSkills.filter((s) => {
      const exists = validSkillIdSet.has(s.skillId);
      if (!exists) {
        const original = template.skills.find((ts) => ts.skillId === s.skillId);
        const skillName = original?.skill?.name || s.skillId;
        warnings.push(
          `Kỹ năng "${skillName}" không còn tồn tại trong hệ thống và đã được bỏ qua.`,
        );
      }
      return exists;
    });

    const created = await this.prisma.$transaction(async (tx) => {
      const newInternship = await tx.internship.create({
        data: {
          companyId: company.id,
          semesterId: semester.id,
          title: dto.title ?? template.title,
          department:
            dto.department !== undefined ? dto.department : template.department,
          location:
            dto.location !== undefined ? dto.location : template.location,
          workType:
            dto.workType !== undefined ? dto.workType : template.workType,
          stipend: dto.stipend !== undefined ? dto.stipend : template.stipend,
          description: dto.description ?? template.description,
          requirements:
            dto.requirements !== undefined
              ? dto.requirements
              : template.requirements,
          slots: targetSlots,
          filledSlots: 0,
          viewCount: 0,
          uniqueViewerCount: 0,
          deadline: mergedDates.deadline,
          startDate: mergedDates.startDate,
          endDate: mergedDates.endDate,
          status: targetStatus,
          sourceTemplateId: template.id,
          sourceInternshipId: null,
          skills: {
            create: skillsToCreate.map((s) => ({
              skillId: s.skillId,
              isRequired: s.isRequired,
              weight: s.weight,
            })),
          },
        },
        select: internshipSelect,
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'INTERNSHIP_CREATED_FROM_TEMPLATE',
          entity: 'Internship',
          entityId: newInternship.id,
          metadata: {
            companyId: company.id,
            templateId: template.id,
            newInternshipId: newInternship.id,
            semesterId: semester.id,
            status: targetStatus,
          },
        },
      });

      return newInternship;
    });

    return {
      ...this.toResponse(created),
      warnings,
    };
  }

  private async paginate(
    where: Prisma.InternshipWhereInput,
    query: ListInternshipsQueryDto,
  ) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.internship.findMany({
        where,
        select: internshipSelect,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.internship.count({ where }),
    ]);
    return {
      items: items.map((item) => this.toResponse(item)),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  private buildWhere(
    query: ListInternshipsQueryDto,
    enforcedStatus?: InternshipStatus,
    companyId?: string,
    onlyApprovedCompany = false,
  ): Prisma.InternshipWhereInput {
    const status = enforcedStatus ?? query.status;
    const targetCompanyId = companyId ?? query.companyId;
    const skillIds = [
      ...(query.skillIds ?? []),
      ...(query.skillId ? [query.skillId] : []),
    ].filter((skillId, index, values) => values.indexOf(skillId) === index);
    const and: Prisma.InternshipWhereInput[] = skillIds.map((skillId) => ({
      skills: { some: { skillId } },
    }));

    if (query.hasReports) {
      and.push({
        reports: { some: { status: InternshipReportStatus.PENDING } },
      });
    }

    if (query.moderationReasonCode) {
      and.push({
        moderationReasonCode: query.moderationReasonCode as any,
      });
    }

    if (query.search) {
      and.push({
        OR: [
          { title: { contains: query.search, mode: 'insensitive' } },
          {
            description: {
              contains: query.search,
              mode: 'insensitive',
            },
          },
          {
            company: {
              companyName: {
                contains: query.search,
                mode: 'insensitive',
              },
            },
          },
        ],
      });
    }

    return {
      ...(targetCompanyId ? { companyId: targetCompanyId } : {}),
      ...(onlyApprovedCompany
        ? { company: { status: CompanyStatus.APPROVED } }
        : {}),
      ...(status ? { status } : {}),
      ...(enforcedStatus === InternshipStatus.OPEN
        ? { OR: [{ deadline: null }, { deadline: { gte: new Date() } }] }
        : {}),
      ...(query.semesterId ? { semesterId: query.semesterId } : {}),
      ...(and.length ? { AND: and } : {}),
    };
  }

  async getCompanyForUser(userId: string) {
    const company = await this.prisma.companyProfile.findUnique({
      where: { userId },
      select: { id: true, status: true },
    });
    if (!company)
      throw new NotFoundException({
        code: 'COMPANY_PROFILE_NOT_FOUND',
        message: 'Company profile not found',
      });
    return company;
  }

  async getApprovedCompanyForUser(userId: string) {
    const company = await this.getCompanyForUser(userId);
    if (company.status !== CompanyStatus.APPROVED)
      throw new ForbiddenException({
        code: 'COMPANY_NOT_APPROVED',
        message: 'Company must be approved before managing internships',
      });
    return company;
  }

  async ensureSemesterAvailable(semesterId: string) {
    const semester = await this.prisma.semester.findUnique({
      where: { id: semesterId },
      select: { id: true, status: true, startDate: true, endDate: true },
    });
    if (!semester)
      throw new NotFoundException({
        code: 'SEMESTER_NOT_FOUND',
        message: 'Semester not found',
      });
    this.lifecycle.assertRecruitmentOpen(semester);
    return semester;
  }

  private async resolvePostingSemester(requestedSemesterId?: string | null) {
    if (requestedSemesterId) {
      const semester = await this.prisma.semester.findUnique({
        where: { id: requestedSemesterId },
        select: { id: true, status: true, startDate: true, endDate: true },
      });
      if (!semester) {
        throw new BadRequestException({
          code: 'SEMESTER_NOT_FOUND',
          message: 'The selected internship campaign was not found',
        });
      }
      this.lifecycle.assertRecruitmentOpen(semester);
      return semester;
    }

    const semesters = await this.prisma.semester.findMany({
      select: { id: true, status: true, startDate: true, endDate: true },
      orderBy: [{ startDate: 'desc' }, { createdAt: 'desc' }],
    });
    const recruitingSemesters = semesters.filter(
      (semester) => this.lifecycle.phaseOf(semester) === 'RECRUITING',
    );
    if (!recruitingSemesters.length) {
      throw new BadRequestException({
        code: 'NO_RECRUITING_SEMESTER',
        message: 'No internship campaign is currently recruiting',
      });
    }
    if (recruitingSemesters.length > 1) {
      throw new BadRequestException({
        code: 'SEMESTER_SELECTION_REQUIRED',
        message: 'Select an internship campaign before posting',
      });
    }
    return recruitingSemesters[0];
  }

  validateDates(
    dates: {
      deadline?: Date | null;
      startDate?: Date | null;
      endDate?: Date | null;
    },
    semester: SemesterWindow,
  ) {
    const hasStartDate = Boolean(dates.startDate);
    const hasEndDate = Boolean(dates.endDate);
    if (hasStartDate !== hasEndDate) {
      throw new BadRequestException({
        code: 'INTERNSHIP_DATES_INCOMPLETE',
        message: 'Provide both startDate and endDate, or leave both empty',
      });
    }
    if (dates.startDate && dates.endDate && dates.startDate >= dates.endDate)
      throw new BadRequestException({
        code: 'INVALID_DATE_RANGE',
        message: 'Start date must be before end date',
      });
    if (
      dates.startDate &&
      dates.endDate &&
      (dates.startDate < semester.startDate || dates.endDate > semester.endDate)
    ) {
      throw new BadRequestException({
        code: 'INTERNSHIP_DATES_OUTSIDE_CAMPAIGN',
        message:
          'Proposed academic dates must stay within the campaign monitoring window',
      });
    }
    if (dates.deadline && dates.startDate && dates.deadline >= dates.startDate)
      throw new BadRequestException({
        code: 'INVALID_DEADLINE',
        message: 'Deadline must be before the internship start date',
      });
  }

  ensureCanOpen(
    status: InternshipStatus,
    deadline: Date | null | undefined,
    startDate: Date | null | undefined,
    endDate: Date | null | undefined,
    semester: {
      id: string;
      status: SemesterStatus;
      startDate: Date;
      endDate: Date;
    },
  ) {
    if (status === InternshipStatus.OPEN && (!startDate || !endDate)) {
      throw new BadRequestException({
        code: 'INTERNSHIP_DATES_REQUIRED',
        message:
          'Both startDate and endDate are required when opening an internship',
      });
    }
    if (
      status === InternshipStatus.OPEN &&
      deadline &&
      deadline <= new Date()
    ) {
      throw new BadRequestException({
        code: 'INTERNSHIP_DEADLINE_PASSED',
        message: 'An open internship must have a future deadline',
      });
    }
    if (status === InternshipStatus.OPEN) {
      this.lifecycle.assertRecruitmentOpen(semester);
    }
  }

  toResponse(record: InternshipRecord) {
    return {
      ...record,
      recruitmentStart: this.lifecycle.recruitmentStart(
        record.semester.startDate,
      ),
      campaignPhase: this.lifecycle.phaseOf(record.semester),
      skills: record.skills.map(({ skill, ...item }) => ({
        ...item,
        name: skill.name,
      })),
    };
  }

  async moderate(id: string, adminUserId: string, dto: ModerateInternshipDto) {
    const current = await this.prisma.internship.findUnique({
      where: { id },
      include: {
        company: { select: { id: true, userId: true, companyName: true } },
      },
    });
    if (!current) throw this.notFound();

    const result = await this.prisma.$transaction(async (tx) => {
      const notificationsToPublish: any[] = [];
      let updatedStatus: InternshipStatus;
      let reasonCodeToSet: InternshipModerationReasonCode | null = null;
      let reasonDetailToSet: string | null = null;

      if (dto.action === ModerationActionType.REJECT) {
        updatedStatus = InternshipStatus.REJECTED;
        reasonCodeToSet =
          dto.reasonCode ?? InternshipModerationReasonCode.OTHER;
        reasonDetailToSet = dto.reasonDetail.trim();

        // Gửi thông báo cho doanh nghiệp
        const companyNotif = await this.notifications.createInTransaction(tx, {
          userId: current.company.userId,
          eventKey: `internship:${id}:rejected:${Date.now()}`,
          type: NotificationType.INTERNSHIP,
          action: NotificationAction.OPEN_INTERNSHIP,
          title: 'Tin tuyển dụng đã bị gỡ bỏ do vi phạm quy định',
          content: `Tin "${current.title}" đã bị gỡ bỏ. Lý do: ${reasonDetailToSet}`,
          resourceId: id,
          metadata: {
            internshipId: id,
            status: updatedStatus,
            reasonCode: reasonCodeToSet,
            reasonDetail: reasonDetailToSet,
          },
        });
        notificationsToPublish.push(companyNotif);

        // Bảo vệ ứng viên đã nộp đơn
        if (dto.notifyApplicants !== false) {
          const activeApplications = await tx.application.findMany({
            where: {
              internshipId: id,
              status: {
                in: [
                  ApplicationStatus.PENDING,
                  ApplicationStatus.REVIEWING,
                  ApplicationStatus.INTERVIEWING,
                ],
              },
            },
            include: {
              student: { select: { userId: true, fullName: true } },
            },
          });

          if (activeApplications.length > 0) {
            await tx.application.updateMany({
              where: {
                id: { in: activeApplications.map((a) => a.id) },
              },
              data: {
                status: ApplicationStatus.WITHDRAWN,
                withdrawnAt: new Date(),
                rejectionReason: `Tin tuyển dụng đã bị gỡ bỏ bởi Ban quản trị: ${reasonDetailToSet}`,
              },
            });

            for (const app of activeApplications) {
              const studentNotif = await this.notifications.createInTransaction(
                tx,
                {
                  userId: app.student.userId,
                  eventKey: `application:${app.id}:internship_rejected:${Date.now()}`,
                  type: NotificationType.APPLICATION,
                  action: NotificationAction.OPEN_APPLICATION,
                  title: 'Tin tuyển dụng bạn đã ứng tuyển bị gỡ bỏ',
                  content: `Tin "${current.title}" tại ${current.company.companyName} đã bị Nhà trường gỡ bỏ do vi phạm quy định. Đơn ứng tuyển của bạn đã được hủy an toàn.`,
                  resourceId: app.id,
                  metadata: {
                    applicationId: app.id,
                    internshipId: id,
                    reason: reasonDetailToSet,
                  },
                },
              );
              notificationsToPublish.push(studentNotif);
            }
          }
        }
      } else if (dto.action === ModerationActionType.REQUEST_REVISION) {
        updatedStatus = InternshipStatus.DRAFT;
        reasonCodeToSet = dto.reasonCode ?? null;
        reasonDetailToSet = dto.reasonDetail.trim();

        const companyNotif = await this.notifications.createInTransaction(tx, {
          userId: current.company.userId,
          eventKey: `internship:${id}:revision_requested:${Date.now()}`,
          type: NotificationType.INTERNSHIP,
          action: NotificationAction.OPEN_INTERNSHIP,
          title: 'Yêu cầu điều chỉnh nội dung tin tuyển dụng',
          content: `Ban quản trị yêu cầu điều chỉnh tin "${current.title}": ${reasonDetailToSet}. Tin đã được chuyển về bản nháp.`,
          resourceId: id,
          metadata: {
            internshipId: id,
            status: updatedStatus,
            reasonCode: reasonCodeToSet,
            reasonDetail: reasonDetailToSet,
          },
        });
        notificationsToPublish.push(companyNotif);
      } else if (dto.action === ModerationActionType.RESTORE) {
        updatedStatus = InternshipStatus.DRAFT;
        reasonCodeToSet = null;
        reasonDetailToSet = null;

        const companyNotif = await this.notifications.createInTransaction(tx, {
          userId: current.company.userId,
          eventKey: `internship:${id}:restored:${Date.now()}`,
          type: NotificationType.INTERNSHIP,
          action: NotificationAction.OPEN_INTERNSHIP,
          title: 'Tin tuyển dụng đã được khôi phục',
          content: `Tin "${current.title}" đã được Ban quản trị khôi phục về trạng thái nháp. Bạn có thể kiểm tra và công khai lại tin.`,
          resourceId: id,
          metadata: {
            internshipId: id,
            status: updatedStatus,
          },
        });
        notificationsToPublish.push(companyNotif);
      } else {
        throw new BadRequestException({
          code: 'INVALID_MODERATION_ACTION',
          message: 'Invalid moderation action',
        });
      }

      const updated = await tx.internship.update({
        where: { id },
        data: {
          status: updatedStatus,
          moderationReasonCode: reasonCodeToSet,
          moderationReason: reasonDetailToSet,
          moderatedById: adminUserId,
          moderatedAt: new Date(),
        },
        select: internshipSelect,
      });

      await tx.auditLog.create({
        data: {
          userId: adminUserId,
          action: 'INTERNSHIP_MODERATED',
          entity: 'Internship',
          entityId: id,
          metadata: {
            action: dto.action,
            fromStatus: current.status,
            toStatus: updatedStatus,
            reasonCode: reasonCodeToSet,
            reasonDetail: reasonDetailToSet,
            companyId: current.companyId,
          },
        },
      });

      return { updated, notifications: notificationsToPublish };
    });

    if (result.notifications.length > 0) {
      this.notifications.publishMany(result.notifications);
    }

    return this.toResponse(result.updated);
  }

  async report(
    internshipId: string,
    studentUserId: string,
    dto: CreateInternshipReportDto,
  ) {
    const student = await this.prisma.studentProfile.findUnique({
      where: { userId: studentUserId },
      select: { id: true, fullName: true },
    });
    if (!student) {
      throw new NotFoundException({
        code: 'STUDENT_NOT_FOUND',
        message: 'Student profile not found',
      });
    }

    const internship = await this.prisma.internship.findUnique({
      where: { id: internshipId },
      select: { id: true, title: true, companyId: true },
    });
    if (!internship) throw this.notFound();

    const existingPendingReport = await this.prisma.internshipReport.findFirst({
      where: {
        internshipId,
        studentId: student.id,
        status: {
          in: [
            InternshipReportStatus.PENDING,
            InternshipReportStatus.INVESTIGATING,
          ],
        },
      },
      select: { id: true },
    });
    if (existingPendingReport) {
      throw new ConflictException({
        code: 'ALREADY_REPORTED',
        message:
          'Bạn đã gửi báo cáo cho tin tuyển dụng này và đang chờ Ban quản trị xử lý',
      });
    }

    const report = await this.prisma.$transaction(async (tx) => {
      const created = await tx.internshipReport.create({
        data: {
          internshipId,
          studentId: student.id,
          reasonCode: dto.reasonCode,
          reasonDetail: dto.reasonDetail?.trim() || null,
          status: InternshipReportStatus.PENDING,
        },
        include: {
          student: {
            select: { id: true, fullName: true, studentCode: true },
          },
          internship: {
            select: {
              id: true,
              title: true,
              company: { select: { id: true, companyName: true } },
            },
          },
        },
      });

      await tx.auditLog.create({
        data: {
          userId: studentUserId,
          action: 'INTERNSHIP_REPORTED',
          entity: 'InternshipReport',
          entityId: created.id,
          metadata: {
            internshipId,
            reasonCode: dto.reasonCode,
            companyId: internship.companyId,
          },
        },
      });

      return created;
    });

    return report;
  }

  async listReports(query: ListInternshipReportsQueryDto) {
    const where: Prisma.InternshipReportWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.internshipId ? { internshipId: query.internshipId } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.internshipReport.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              fullName: true,
              studentCode: true,
              major: true,
            },
          },
          internship: {
            select: {
              id: true,
              title: true,
              status: true,
              company: { select: { id: true, companyName: true, logo: true } },
            },
          },
          reviewedBy: {
            select: { id: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.internshipReport.count({ where }),
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

  async reviewReport(
    reportId: string,
    adminUserId: string,
    dto: ReviewInternshipReportDto,
  ) {
    const current = await this.prisma.internshipReport.findUnique({
      where: { id: reportId },
      select: { id: true, internshipId: true, status: true },
    });
    if (!current) {
      throw new NotFoundException({
        code: 'REPORT_NOT_FOUND',
        message: 'Báo cáo vi phạm không tìm thấy',
      });
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const record = await tx.internshipReport.update({
        where: { id: reportId },
        data: {
          status: dto.status,
          adminNotes: dto.adminNotes?.trim() || null,
          reviewedById: adminUserId,
          reviewedAt: new Date(),
        },
        include: {
          student: {
            select: { id: true, fullName: true, studentCode: true },
          },
          internship: {
            select: {
              id: true,
              title: true,
              status: true,
              company: { select: { id: true, companyName: true } },
            },
          },
          reviewedBy: {
            select: { id: true, email: true },
          },
        },
      });

      await tx.auditLog.create({
        data: {
          userId: adminUserId,
          action: 'INTERNSHIP_REPORT_REVIEWED',
          entity: 'InternshipReport',
          entityId: reportId,
          metadata: {
            fromStatus: current.status,
            toStatus: dto.status,
            internshipId: current.internshipId,
          },
        },
      });

      return record;
    });

    return updated;
  }

  private notFound() {
    return new NotFoundException({
      code: 'INTERNSHIP_NOT_FOUND',
      message: 'Internship not found',
    });
  }
  private notOwned() {
    return new ForbiddenException({
      code: 'INTERNSHIP_NOT_OWNED',
      message: 'You do not own this internship',
    });
  }
}
