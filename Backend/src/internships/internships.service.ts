import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
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
import type { AuthUser } from '../auth/types/auth-user.type';
import { CreateInternshipDto } from './dto/create-internship.dto';
import { ListInternshipsQueryDto } from './dto/list-internships-query.dto';
import { UpdateInternshipDto } from './dto/update-internship.dto';

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
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListInternshipsQueryDto, user: AuthUser) {
    const where = this.buildWhere(
      query,
      user.role === Role.ADMIN ? undefined : InternshipStatus.OPEN,
    );
    return this.paginate(where, query);
  }

  async listMine(query: ListInternshipsQueryDto, userId: string) {
    const company = await this.getCompanyForUser(userId);
    return this.paginate(this.buildWhere(query, undefined, company.id), query);
  }

  async findOne(id: string, user: AuthUser) {
    const internship = await this.prisma.internship.findUnique({
      where: { id },
      select: internshipSelect,
    });
    if (!internship) throw this.notFound();
    if (user.role === Role.COMPANY) {
      const company = await this.getCompanyForUser(user.id);
      if (internship.companyId !== company.id) throw this.notFound();
    } else if (internship.status !== InternshipStatus.OPEN) {
      throw this.notFound();
    }
    return this.toResponse(internship);
  }

  async create(dto: CreateInternshipDto, userId: string) {
    const company = await this.getApprovedCompanyForUser(userId);
    const semester = await this.resolvePostingSemester(dto.semesterId);
    this.validateDates(dto);
    this.ensureCanOpen(dto.status ?? InternshipStatus.DRAFT, dto.deadline);
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
    if (dto.semesterId !== undefined) {
      await this.ensureSemesterAvailable(dto.semesterId);
    }
    if (dto.slots !== undefined && dto.slots < current.filledSlots) {
      throw new BadRequestException({
        code: 'SLOTS_BELOW_FILLED',
        message: 'Slots cannot be lower than filled slots',
      });
    }
    const merged = {
      deadline: dto.deadline ?? current.deadline,
      startDate: dto.startDate ?? current.startDate,
      endDate: dto.endDate ?? current.endDate,
    };
    this.validateDates(merged);
    this.ensureCanOpen(dto.status ?? current.status, merged.deadline);

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
  ): Prisma.InternshipWhereInput {
    const status = enforcedStatus ?? query.status;
    return {
      ...(companyId ? { companyId } : {}),
      ...(status ? { status } : {}),
      ...(enforcedStatus === InternshipStatus.OPEN
        ? { OR: [{ deadline: null }, { deadline: { gte: new Date() } }] }
        : {}),
      ...(query.semesterId ? { semesterId: query.semesterId } : {}),
      ...(query.skillId
        ? { skills: { some: { skillId: query.skillId } } }
        : {}),
      ...(query.search
        ? {
            AND: [
              {
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
              },
            ],
          }
        : {}),
    };
  }

  private async getCompanyForUser(userId: string) {
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

  private async getApprovedCompanyForUser(userId: string) {
    const company = await this.getCompanyForUser(userId);
    if (company.status !== CompanyStatus.APPROVED)
      throw new ForbiddenException({
        code: 'COMPANY_NOT_APPROVED',
        message: 'Company must be approved before managing internships',
      });
    return company;
  }

  private async ensureSemesterAvailable(semesterId: string) {
    const semester = await this.prisma.semester.findUnique({
      where: { id: semesterId },
      select: { status: true },
    });
    if (!semester)
      throw new NotFoundException({
        code: 'SEMESTER_NOT_FOUND',
        message: 'Semester not found',
      });
    if (
      semester.status === SemesterStatus.CANCELLED ||
      semester.status === SemesterStatus.COMPLETED
    ) {
      throw new BadRequestException({
        code: 'SEMESTER_NOT_AVAILABLE',
        message:
          'Internships can only be assigned to an upcoming or active semester',
      });
    }
  }

  private async resolvePostingSemester(requestedSemesterId?: string | null) {
    if (requestedSemesterId) {
      const semester = await this.prisma.semester.findUnique({
        where: { id: requestedSemesterId },
        select: { id: true, status: true },
      });
      if (!semester || semester.status !== SemesterStatus.ACTIVE) {
        throw new BadRequestException({
          code: 'SEMESTER_NOT_ACTIVE',
          message: 'The selected internship semester is not active',
        });
      }
      return semester;
    }

    const activeSemesters = await this.prisma.semester.findMany({
      where: { status: SemesterStatus.ACTIVE },
      select: { id: true },
      orderBy: [{ startDate: 'desc' }, { createdAt: 'desc' }],
    });
    if (!activeSemesters.length) {
      throw new BadRequestException({
        code: 'NO_ACTIVE_SEMESTER',
        message: 'No active internship semester is available for posting',
      });
    }
    if (activeSemesters.length > 1) {
      throw new BadRequestException({
        code: 'SEMESTER_SELECTION_REQUIRED',
        message: 'Select an active internship semester before posting',
      });
    }
    return activeSemesters[0];
  }

  private validateDates(dates: {
    deadline?: Date | null;
    startDate?: Date | null;
    endDate?: Date | null;
  }) {
    if (dates.startDate && dates.endDate && dates.startDate > dates.endDate)
      throw new BadRequestException({
        code: 'INVALID_DATE_RANGE',
        message: 'Start date must be before end date',
      });
    if (dates.deadline && dates.startDate && dates.deadline > dates.startDate)
      throw new BadRequestException({
        code: 'INVALID_DEADLINE',
        message: 'Deadline must not be after the internship start date',
      });
  }

  private ensureCanOpen(status: InternshipStatus, deadline?: Date | null) {
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
  }

  private toResponse(record: InternshipRecord) {
    return {
      ...record,
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
