import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, SemesterStatus } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSemesterDto } from './dto/create-semester.dto';
import { ListSemestersQueryDto } from './dto/list-semesters-query.dto';
import { UpdateSemesterDto } from './dto/update-semester.dto';

const semesterSelect = {
  id: true,
  name: true,
  startDate: true,
  endDate: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      internships: true,
      placements: true,
    },
  },
} satisfies Prisma.SemesterSelect;

type SemesterRecord = Prisma.SemesterGetPayload<{
  select: typeof semesterSelect;
}>;

const transitions: Record<SemesterStatus, readonly SemesterStatus[]> = {
  [SemesterStatus.UPCOMING]: [SemesterStatus.ACTIVE, SemesterStatus.CANCELLED],
  [SemesterStatus.ACTIVE]: [SemesterStatus.COMPLETED, SemesterStatus.CANCELLED],
  [SemesterStatus.COMPLETED]: [],
  [SemesterStatus.CANCELLED]: [],
};

@Injectable()
export class SemestersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListSemestersQueryDto) {
    const { page, limit, search, status } = query;
    const where: Prisma.SemesterWhereInput = {
      ...(status ? { status } : {}),
      ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.semester.findMany({
        where,
        select: semesterSelect,
        orderBy: [{ startDate: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.semester.count({ where }),
    ]);

    return {
      items: items.map((item) => this.toRecord(item)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    const semester = await this.prisma.semester.findUnique({
      where: { id },
      select: semesterSelect,
    });
    if (!semester) throw this.notFound();
    return this.toRecord(semester);
  }

  async create(dto: CreateSemesterDto, actorId: string) {
    const name = this.normalizeName(dto.name);
    const { startDate, endDate } = this.parseAndValidateDates(
      dto.startDate,
      dto.endDate,
    );
    await this.ensureNameAvailable(name);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const semester = await tx.semester.create({
          data: { name, startDate, endDate, status: SemesterStatus.UPCOMING },
          select: semesterSelect,
        });
        await tx.auditLog.create({
          data: {
            userId: actorId,
            action: 'SEMESTER_CREATED',
            entity: 'Semester',
            entityId: semester.id,
            metadata: { name, startDate, endDate },
          },
        });
        return this.toRecord(semester);
      });
    } catch (error: unknown) {
      this.rethrowKnownDatabaseError(error);
    }
  }

  async update(id: string, dto: UpdateSemesterDto, actorId: string) {
    if (
      dto.name === undefined &&
      dto.startDate === undefined &&
      dto.endDate === undefined
    ) {
      throw new BadRequestException({
        code: 'SEMESTER_UPDATE_EMPTY',
        message: 'At least one semester field must be provided',
      });
    }

    const current = await this.getForMutation(id);
    if (
      current.status === SemesterStatus.COMPLETED ||
      current.status === SemesterStatus.CANCELLED
    ) {
      throw new ConflictException({
        code: 'SEMESTER_IMMUTABLE',
        message: 'Completed or cancelled semesters cannot be edited',
      });
    }
    if (
      current.status === SemesterStatus.ACTIVE &&
      dto.startDate !== undefined
    ) {
      throw new ConflictException({
        code: 'SEMESTER_IMMUTABLE',
        message: 'The start date of an active semester cannot be changed',
      });
    }

    const name =
      dto.name === undefined ? current.name : this.normalizeName(dto.name);
    const startDate = dto.startDate
      ? new Date(dto.startDate)
      : current.startDate;
    const endDate = dto.endDate ? new Date(dto.endDate) : current.endDate;
    this.validateDateRange(startDate, endDate);

    if (name !== current.name) {
      await this.ensureNameAvailable(name, id);
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const semester = await tx.semester.update({
          where: { id },
          data: { name, startDate, endDate },
          select: semesterSelect,
        });
        await tx.auditLog.create({
          data: {
            userId: actorId,
            action: 'SEMESTER_UPDATED',
            entity: 'Semester',
            entityId: id,
            metadata: {
              before: {
                name: current.name,
                startDate: current.startDate,
                endDate: current.endDate,
              },
              after: { name, startDate, endDate },
            },
          },
        });
        return this.toRecord(semester);
      });
    } catch (error: unknown) {
      this.rethrowKnownDatabaseError(error);
    }
  }

  async updateStatus(id: string, status: SemesterStatus, actorId: string) {
    const current = await this.getForMutation(id);
    if (!transitions[current.status].includes(status)) {
      throw new ConflictException({
        code: 'INVALID_SEMESTER_TRANSITION',
        message: `Cannot change semester status from ${current.status} to ${status}`,
      });
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const semester = await tx.semester.update({
          where: { id },
          data: { status },
          select: semesterSelect,
        });
        await tx.auditLog.create({
          data: {
            userId: actorId,
            action: 'SEMESTER_STATUS_CHANGED',
            entity: 'Semester',
            entityId: id,
            metadata: { from: current.status, to: status },
          },
        });
        return this.toRecord(semester);
      });
    } catch (error: unknown) {
      this.rethrowKnownDatabaseError(error);
    }
  }

  async remove(id: string, actorId: string) {
    const current = await this.getForMutation(id);
    if (
      current.status !== SemesterStatus.UPCOMING &&
      current.status !== SemesterStatus.CANCELLED
    ) {
      throw new ConflictException({
        code: 'SEMESTER_IMMUTABLE',
        message: 'Only upcoming or cancelled semesters can be deleted',
      });
    }
    if (current._count.internships > 0 || current._count.placements > 0) {
      throw new ConflictException({
        code: 'SEMESTER_IN_USE',
        message: 'Semester cannot be deleted while it has related records',
      });
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.semester.delete({ where: { id } });
        await tx.auditLog.create({
          data: {
            userId: actorId,
            action: 'SEMESTER_DELETED',
            entity: 'Semester',
            entityId: id,
            metadata: { name: current.name, status: current.status },
          },
        });
      });
      return { deleted: true, id };
    } catch (error: unknown) {
      this.rethrowKnownDatabaseError(error);
    }
  }

  async assertExists(id: string) {
    const semester = await this.prisma.semester.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        status: true,
      },
    });
    if (!semester) throw this.notFound();
    return semester;
  }

  async assertAcceptsDraftInternship(id: string) {
    const semester = await this.assertExists(id);
    if (
      semester.status !== SemesterStatus.UPCOMING &&
      semester.status !== SemesterStatus.ACTIVE
    ) {
      throw new ConflictException({
        code: 'SEMESTER_NOT_ACCEPTING_INTERNSHIPS',
        message: 'The semester does not accept internship drafts',
      });
    }
    return semester;
  }

  async assertAcceptsOpenInternship(id: string) {
    const semester = await this.assertExists(id);
    if (semester.status !== SemesterStatus.ACTIVE) {
      throw new ConflictException({
        code: 'SEMESTER_NOT_ACTIVE',
        message: 'Internships can be opened only in an active semester',
      });
    }
    return semester;
  }

  private async getForMutation(id: string) {
    const semester = await this.prisma.semester.findUnique({
      where: { id },
      select: semesterSelect,
    });
    if (!semester) throw this.notFound();
    return semester;
  }

  private async ensureNameAvailable(name: string, exceptId?: string) {
    const duplicate = await this.prisma.semester.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        ...(exceptId ? { NOT: { id: exceptId } } : {}),
      },
      select: { id: true },
    });
    if (duplicate) {
      throw new ConflictException({
        code: 'SEMESTER_ALREADY_EXISTS',
        message: 'A semester with this name already exists',
      });
    }
  }

  private parseAndValidateDates(startDateInput: string, endDateInput: string) {
    const startDate = new Date(startDateInput);
    const endDate = new Date(endDateInput);
    this.validateDateRange(startDate, endDate);
    return { startDate, endDate };
  }

  private validateDateRange(startDate: Date, endDate: Date) {
    if (
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime()) ||
      startDate.getTime() >= endDate.getTime()
    ) {
      throw new BadRequestException({
        code: 'INVALID_SEMESTER_DATE_RANGE',
        message: 'startDate must be earlier than endDate',
      });
    }
  }

  private normalizeName(name: string) {
    return name.trim().replace(/\s+/g, ' ');
  }

  private toRecord(item: SemesterRecord) {
    return {
      id: item.id,
      name: item.name,
      startDate: item.startDate,
      endDate: item.endDate,
      status: item.status,
      internshipCount: item._count.internships,
      placementCount: item._count.placements,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  private notFound() {
    return new NotFoundException({
      code: 'SEMESTER_NOT_FOUND',
      message: 'Semester not found',
    });
  }

  private rethrowKnownDatabaseError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new ConflictException({
          code: 'SEMESTER_ALREADY_EXISTS',
          message: 'A semester with this name already exists',
        });
      }
      if (error.code === 'P2025') {
        throw this.notFound();
      }
      if (error.code === 'P2003') {
        throw new ConflictException({
          code: 'SEMESTER_IN_USE',
          message: 'Semester cannot be deleted while it has related records',
        });
      }
    }
    throw error;
  }
}
