import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CompanyStatus, Prisma, Role } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ListSkillsQueryDto } from './dto/list-skills-query.dto';
import { SyncInternshipSkillsDto } from './dto/sync-internship-skills.dto';
import { SyncStudentSkillsDto } from './dto/sync-student-skills.dto';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';

const skillSelect = {
  id: true,
  name: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      studentSkills: true,
      internshipSkills: true,
    },
  },
} satisfies Prisma.SkillSelect;

const studentSkillSelect = {
  skillId: true,
  level: true,
  skill: { select: { id: true, name: true } },
} satisfies Prisma.StudentSkillSelect;

const internshipSkillSelect = {
  skillId: true,
  isRequired: true,
  weight: true,
  skill: { select: { id: true, name: true } },
} satisfies Prisma.InternshipSkillSelect;

@Injectable()
export class SkillsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListSkillsQueryDto) {
    const { page, limit, search } = query;
    const where: Prisma.SkillWhereInput = search
      ? { name: { contains: search, mode: 'insensitive' } }
      : {};

    const [items, total] = await this.prisma.$transaction([
      this.prisma.skill.findMany({
        where,
        select: skillSelect,
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.skill.count({ where }),
    ]);

    return {
      items: items.map((item) => this.toSkillRecord(item)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    const skill = await this.prisma.skill.findUnique({
      where: { id },
      select: skillSelect,
    });
    if (!skill) throw this.skillNotFound();
    return this.toSkillRecord(skill);
  }

  async create(dto: CreateSkillDto) {
    const name = this.normalizeName(dto.name);
    await this.ensureNameAvailable(name);
    try {
      const skill = await this.prisma.skill.create({
        data: { name },
        select: skillSelect,
      });
      return this.toSkillRecord(skill);
    } catch (error: unknown) {
      this.rethrowKnownDatabaseError(error);
    }
  }

  async update(id: string, dto: UpdateSkillDto) {
    if (dto.name === undefined) {
      throw new BadRequestException({
        code: 'SKILL_UPDATE_EMPTY',
        message: 'At least one skill field must be provided',
      });
    }

    const name = this.normalizeName(dto.name);
    await this.ensureNameAvailable(name, id);
    try {
      const skill = await this.prisma.skill.update({
        where: { id },
        data: { name },
        select: skillSelect,
      });
      return this.toSkillRecord(skill);
    } catch (error: unknown) {
      this.rethrowKnownDatabaseError(error);
    }
  }

  async remove(id: string) {
    const skill = await this.prisma.skill.findUnique({
      where: { id },
      select: {
        id: true,
        _count: { select: { studentSkills: true, internshipSkills: true } },
      },
    });
    if (!skill) throw this.skillNotFound();
    if (skill._count.studentSkills > 0 || skill._count.internshipSkills > 0) {
      throw new ConflictException({
        code: 'SKILL_IN_USE',
        message: 'Skill cannot be deleted while it is assigned',
      });
    }

    try {
      await this.prisma.skill.delete({ where: { id } });
      return { deleted: true, id };
    } catch (error: unknown) {
      this.rethrowKnownDatabaseError(error);
    }
  }

  async getStudentSkills(userId: string) {
    const profile = await this.prisma.studentProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!profile) throw this.studentProfileNotFound();
    const items = await this.prisma.studentSkill.findMany({
      where: { studentId: profile.id },
      select: studentSkillSelect,
      orderBy: { skill: { name: 'asc' } },
    });
    return items.map((item) => ({
      skillId: item.skillId,
      name: item.skill.name,
      level: item.level,
    }));
  }

  async syncStudentSkills(userId: string, dto: SyncStudentSkillsDto) {
    this.ensureUniqueSkillIds(dto.skills.map((item) => item.skillId));
    const profile = await this.prisma.studentProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!profile) throw this.studentProfileNotFound();
    await this.ensureSkillsExist(dto.skills.map((item) => item.skillId));

    await this.prisma.$transaction(async (tx) => {
      await tx.studentSkill.deleteMany({ where: { studentId: profile.id } });
      if (dto.skills.length > 0) {
        await tx.studentSkill.createMany({
          data: dto.skills.map((item) => ({
            studentId: profile.id,
            skillId: item.skillId,
            level: item.level,
          })),
        });
      }
    });

    return this.getStudentSkills(userId);
  }

  async getInternshipSkills(internshipId: string) {
    const internship = await this.prisma.internship.findUnique({
      where: { id: internshipId },
      select: { id: true },
    });
    if (!internship) throw this.internshipNotFound();
    const items = await this.prisma.internshipSkill.findMany({
      where: { internshipId },
      select: internshipSkillSelect,
      orderBy: [
        { isRequired: 'desc' },
        { weight: 'desc' },
        { skill: { name: 'asc' } },
      ],
    });
    return items.map((item) => ({
      skillId: item.skillId,
      name: item.skill.name,
      isRequired: item.isRequired,
      weight: item.weight,
    }));
  }

  async syncInternshipSkills(
    internshipId: string,
    userId: string,
    userRole: Role,
    dto: SyncInternshipSkillsDto,
  ) {
    this.ensureUniqueSkillIds(dto.skills.map((item) => item.skillId));
    const internship = await this.prisma.internship.findUnique({
      where: { id: internshipId },
      select: {
        id: true,
        company: { select: { userId: true, status: true } },
      },
    });
    if (!internship) throw this.internshipNotFound();
    if (userRole !== Role.COMPANY && userRole !== Role.ADMIN) {
      throw new ForbiddenException({
        code: 'INTERNSHIP_NOT_OWNED',
        message: 'You do not own this internship',
      });
    }
    if (userRole === Role.COMPANY && internship.company.userId !== userId) {
      throw new ForbiddenException({
        code: 'INTERNSHIP_NOT_OWNED',
        message: 'You do not own this internship',
      });
    }
    if (
      userRole !== Role.ADMIN &&
      internship.company.status !== CompanyStatus.APPROVED
    ) {
      throw new ForbiddenException({
        code: 'COMPANY_NOT_APPROVED',
        message: 'Company must be approved before editing internship skills',
      });
    }
    await this.ensureSkillsExist(dto.skills.map((item) => item.skillId));

    await this.prisma.$transaction(async (tx) => {
      await tx.internshipSkill.deleteMany({ where: { internshipId } });
      if (dto.skills.length > 0) {
        await tx.internshipSkill.createMany({
          data: dto.skills.map((item) => ({
            internshipId,
            skillId: item.skillId,
            isRequired: item.isRequired,
            weight: item.weight,
          })),
        });
      }
    });

    return this.getInternshipSkills(internshipId);
  }

  private normalizeName(name: string): string {
    return name.trim().replace(/\s+/g, ' ');
  }

  private toSkillRecord(skill: {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    _count: { studentSkills: number; internshipSkills: number };
  }) {
    const { _count, ...record } = skill;
    return {
      ...record,
      studentCount: _count.studentSkills,
      internshipCount: _count.internshipSkills,
    };
  }

  private async ensureNameAvailable(name: string, exceptId?: string) {
    const existing = await this.prisma.skill.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        ...(exceptId ? { id: { not: exceptId } } : {}),
      },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException({
        code: 'SKILL_ALREADY_EXISTS',
        message: 'Skill name already exists',
      });
    }
  }

  private async ensureSkillsExist(skillIds: string[]) {
    if (skillIds.length === 0) return;
    const skills = await this.prisma.skill.findMany({
      where: { id: { in: skillIds } },
      select: { id: true },
    });
    if (skills.length !== new Set(skillIds).size) {
      throw new NotFoundException({
        code: 'SKILLS_NOT_FOUND',
        message: 'One or more skills were not found',
      });
    }
  }

  private ensureUniqueSkillIds(skillIds: string[]) {
    if (new Set(skillIds).size !== skillIds.length) {
      throw new BadRequestException({
        code: 'DUPLICATE_SKILL_ID',
        message: 'A skill can only appear once in the collection',
      });
    }
  }

  private skillNotFound(): NotFoundException {
    return new NotFoundException({
      code: 'SKILL_NOT_FOUND',
      message: 'Skill not found',
    });
  }

  private studentProfileNotFound(): NotFoundException {
    return new NotFoundException({
      code: 'STUDENT_PROFILE_NOT_FOUND',
      message: 'Student profile not found',
    });
  }

  private internshipNotFound(): NotFoundException {
    return new NotFoundException({
      code: 'INTERNSHIP_NOT_FOUND',
      message: 'Internship not found',
    });
  }

  private rethrowKnownDatabaseError(error: unknown): never {
    if (this.isPrismaError(error, 'P2002')) {
      throw new ConflictException({
        code: 'SKILL_ALREADY_EXISTS',
        message: 'Skill name already exists',
      });
    }
    if (this.isPrismaError(error, 'P2025')) throw this.skillNotFound();
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
