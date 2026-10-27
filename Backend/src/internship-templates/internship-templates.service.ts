import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { InternshipsService } from '../internships/internships.service';
import { CreateInternshipFromTemplateDto } from './dto/create-internship-from-template.dto';
import { CreateInternshipTemplateDto } from './dto/create-internship-template.dto';
import { UpdateInternshipTemplateDto } from './dto/update-internship-template.dto';

const templateSelect = {
  id: true,
  companyId: true,
  name: true,
  title: true,
  department: true,
  location: true,
  workType: true,
  stipend: true,
  description: true,
  requirements: true,
  slotsDefault: true,
  createdAt: true,
  updatedAt: true,
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
      internships: true,
    },
  },
} satisfies Prisma.InternshipTemplateSelect;

type TemplateRecord = Prisma.InternshipTemplateGetPayload<{
  select: typeof templateSelect;
}>;

@Injectable()
export class InternshipTemplatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly internshipsService: InternshipsService,
  ) {}

  async listMine(userId: string) {
    const company =
      await this.internshipsService.getApprovedCompanyForUser(userId);
    const items = await this.prisma.internshipTemplate.findMany({
      where: { companyId: company.id },
      select: templateSelect,
      orderBy: { updatedAt: 'desc' },
    });
    return items.map((item) => this.toResponse(item));
  }

  async findOne(id: string, userId: string) {
    const company =
      await this.internshipsService.getApprovedCompanyForUser(userId);
    const template = await this.prisma.internshipTemplate.findUnique({
      where: { id },
      select: templateSelect,
    });
    if (!template) throw this.notFound();
    if (template.companyId !== company.id) throw this.notOwned();
    return this.toResponse(template);
  }

  async create(userId: string, dto: CreateInternshipTemplateDto) {
    const company =
      await this.internshipsService.getApprovedCompanyForUser(userId);

    const count = await this.prisma.internshipTemplate.count({
      where: { companyId: company.id },
    });
    if (count >= 20) {
      throw new BadRequestException({
        code: 'INTERNSHIP_TEMPLATE_LIMIT',
        message: 'Tối đa 20 mẫu tin tuyển dụng cho mỗi doanh nghiệp',
      });
    }

    const trimmedName = dto.name.trim();
    const existing = await this.prisma.internshipTemplate.findUnique({
      where: {
        companyId_name: {
          companyId: company.id,
          name: trimmedName,
        },
      },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException({
        code: 'INTERNSHIP_TEMPLATE_NAME_EXISTS',
        message: 'Tên mẫu tin đã tồn tại trong doanh nghiệp này',
      });
    }

    const skillItems = dto.skills ?? [];
    const uniqueSkills = Array.from(
      new Map(skillItems.map((s) => [s.skillId, s])).values(),
    );

    const result = await this.prisma.$transaction(async (tx) => {
      const template = await tx.internshipTemplate.create({
        data: {
          companyId: company.id,
          name: trimmedName,
          title: dto.title.trim(),
          department: dto.department?.trim() || null,
          location: dto.location?.trim() || null,
          workType: dto.workType?.trim() || null,
          stipend: dto.stipend?.trim() || null,
          description: dto.description.trim(),
          requirements: dto.requirements?.trim() || null,
          slotsDefault: dto.slotsDefault ?? 1,
          skills: {
            create: uniqueSkills.map((s) => ({
              skillId: s.skillId,
              isRequired: s.isRequired ?? true,
              weight: s.weight ?? 1,
            })),
          },
        },
        select: templateSelect,
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'INTERNSHIP_TEMPLATE_CREATED',
          entity: 'InternshipTemplate',
          entityId: template.id,
          metadata: { companyId: company.id, name: template.name },
        },
      });

      return template;
    });

    return this.toResponse(result);
  }

  async update(id: string, userId: string, dto: UpdateInternshipTemplateDto) {
    const company =
      await this.internshipsService.getApprovedCompanyForUser(userId);
    const existing = await this.prisma.internshipTemplate.findUnique({
      where: { id },
      select: { id: true, companyId: true, name: true },
    });
    if (!existing) throw this.notFound();
    if (existing.companyId !== company.id) throw this.notOwned();

    if (dto.name && dto.name.trim() !== existing.name) {
      const duplicate = await this.prisma.internshipTemplate.findUnique({
        where: {
          companyId_name: {
            companyId: company.id,
            name: dto.name.trim(),
          },
        },
        select: { id: true },
      });
      if (duplicate) {
        throw new ConflictException({
          code: 'INTERNSHIP_TEMPLATE_NAME_EXISTS',
          message: 'Tên mẫu tin đã tồn tại trong doanh nghiệp này',
        });
      }
    }

    const result = await this.prisma.$transaction(async (tx) => {
      if (dto.skills !== undefined) {
        await tx.internshipTemplateSkill.deleteMany({
          where: { templateId: id },
        });
        const uniqueSkills = Array.from(
          new Map(dto.skills.map((s) => [s.skillId, s])).values(),
        );
        if (uniqueSkills.length > 0) {
          await tx.internshipTemplateSkill.createMany({
            data: uniqueSkills.map((s) => ({
              templateId: id,
              skillId: s.skillId,
              isRequired: s.isRequired ?? true,
              weight: s.weight ?? 1,
            })),
          });
        }
      }

      const updated = await tx.internshipTemplate.update({
        where: { id },
        data: {
          name: dto.name?.trim(),
          title: dto.title?.trim(),
          department:
            dto.department === undefined
              ? undefined
              : dto.department?.trim() || null,
          location:
            dto.location === undefined
              ? undefined
              : dto.location?.trim() || null,
          workType:
            dto.workType === undefined
              ? undefined
              : dto.workType?.trim() || null,
          stipend:
            dto.stipend === undefined ? undefined : dto.stipend?.trim() || null,
          description: dto.description?.trim(),
          requirements:
            dto.requirements === undefined
              ? undefined
              : dto.requirements?.trim() || null,
          slotsDefault: dto.slotsDefault,
        },
        select: templateSelect,
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'INTERNSHIP_TEMPLATE_UPDATED',
          entity: 'InternshipTemplate',
          entityId: id,
          metadata: {
            companyId: company.id,
            changedFields: Object.keys(dto),
          },
        },
      });

      return updated;
    });

    return this.toResponse(result);
  }

  async remove(id: string, userId: string) {
    const company =
      await this.internshipsService.getApprovedCompanyForUser(userId);
    const existing = await this.prisma.internshipTemplate.findUnique({
      where: { id },
      select: { id: true, companyId: true, name: true },
    });
    if (!existing) throw this.notFound();
    if (existing.companyId !== company.id) throw this.notOwned();

    await this.prisma.$transaction(async (tx) => {
      await tx.internshipTemplate.delete({ where: { id } });
      await tx.auditLog.create({
        data: {
          userId,
          action: 'INTERNSHIP_TEMPLATE_DELETED',
          entity: 'InternshipTemplate',
          entityId: id,
          metadata: { companyId: company.id, name: existing.name },
        },
      });
    });

    return { deleted: true, id };
  }

  async createInternship(
    id: string,
    userId: string,
    dto: CreateInternshipFromTemplateDto,
  ) {
    return this.internshipsService.createFromTemplate(id, userId, dto);
  }

  private toResponse(record: TemplateRecord) {
    return {
      ...record,
      skills: record.skills.map(({ skill, ...item }) => ({
        ...item,
        name: skill.name,
      })),
      usageCount: record._count.internships,
    };
  }

  private notFound() {
    return new NotFoundException({
      code: 'INTERNSHIP_TEMPLATE_NOT_FOUND',
      message: 'Mẫu tin tuyển dụng không tìm thấy',
    });
  }

  private notOwned() {
    return new ForbiddenException({
      code: 'INTERNSHIP_TEMPLATE_NOT_OWNED',
      message: 'Bạn không sở hữu mẫu tin này',
    });
  }
}
