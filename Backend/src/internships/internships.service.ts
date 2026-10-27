import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  CompanyStatus,
  InternshipStatus,
  Prisma,
  Role,
  SemesterStatus,
} from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  SemesterLifecycleService,
  type SemesterWindow,
} from '../semesters/semester-lifecycle.service';
import type { AuthUser } from '../auth/types/auth-user.type';
import { CreateInternshipDto } from './dto/create-internship.dto';
import { ListInternshipsQueryDto } from './dto/list-internships-query.dto';
import { RepostInternshipDto } from './dto/repost-internship.dto';
import { SaveAsTemplateDto } from './dto/save-as-template.dto';
import { UpdateInternshipDto } from './dto/update-internship.dto';
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
    } else if (
      internship.status !== InternshipStatus.OPEN ||
      internship.company.status !== CompanyStatus.APPROVED
    ) {
      throw this.notFound();
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
          location:
            dto.location !== undefined ? dto.location : source.location,
          workType:
            dto.workType !== undefined ? dto.workType : source.workType,
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
            dto.department !== undefined
              ? dto.department
              : template.department,
          location:
            dto.location !== undefined ? dto.location : template.location,
          workType:
            dto.workType !== undefined ? dto.workType : template.workType,
          stipend:
            dto.stipend !== undefined ? dto.stipend : template.stipend,
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
    const skillIds = [
      ...(query.skillIds ?? []),
      ...(query.skillId ? [query.skillId] : []),
    ].filter((skillId, index, values) => values.indexOf(skillId) === index);
    const and: Prisma.InternshipWhereInput[] = skillIds.map((skillId) => ({
      skills: { some: { skillId } },
    }));

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
      ...(companyId ? { companyId } : {}),
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
