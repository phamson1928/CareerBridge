import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFacultyDto } from './dto/create-faculty.dto';
import { ListFacultiesQueryDto } from './dto/list-faculties-query.dto';
import { ListFacultyOptionsQueryDto } from './dto/list-faculty-options-query.dto';
import { UpdateFacultyDto } from './dto/update-faculty.dto';

const facultySelect = {
  id: true,
  code: true,
  name: true,
  description: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      majors: true,
      lecturers: true,
    },
  },
  majors: {
    orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    select: {
      id: true,
      code: true,
      name: true,
      isActive: true,
      _count: {
        select: {
          students: true,
        },
      },
    },
  },
} satisfies Prisma.FacultySelect;

type FacultyPayload = Prisma.FacultyGetPayload<{
  select: typeof facultySelect;
}>;

@Injectable()
export class FacultiesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListFacultiesQueryDto) {
    const { page, limit, search, isActive } = query;
    const where: Prisma.FacultyWhereInput = {
      ...(typeof isActive === 'boolean' ? { isActive } : {}),
      ...(search
        ? {
            OR: [
              { code: { contains: search, mode: 'insensitive' } },
              { name: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.faculty.findMany({
        where,
        select: facultySelect,
        orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.faculty.count({ where }),
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

  async listOptions(query: ListFacultyOptionsQueryDto) {
    const includeInactive = Boolean(query.includeInactive);
    const search = query.search?.trim();

    const items = await this.prisma.faculty.findMany({
      where: {
        ...(includeInactive ? {} : { isActive: true }),
        ...(search
          ? {
              OR: [
                { code: { contains: search, mode: 'insensitive' } },
                { name: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
      select: {
        id: true,
        code: true,
        name: true,
        isActive: true,
        majors: {
          where: includeInactive ? {} : { isActive: true },
          orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
          select: {
            id: true,
            code: true,
            name: true,
            facultyId: true,
            isActive: true,
          },
        },
      },
    });

    return { items };
  }

  async findById(id: string) {
    const faculty = await this.prisma.faculty.findUnique({
      where: { id },
      select: facultySelect,
    });
    if (!faculty) throw this.notFound();
    return this.toRecord(faculty);
  }

  async assertActiveExists(id: string) {
    const faculty = await this.prisma.faculty.findUnique({
      where: { id },
      select: { id: true, code: true, name: true, isActive: true },
    });
    if (!faculty) throw this.notFound();
    if (!faculty.isActive) {
      throw new ConflictException({
        code: 'FACULTY_INACTIVE',
        message: 'Khoa này đã ngừng hoạt động, vui lòng chọn khoa khác',
      });
    }
    return faculty;
  }

  async create(dto: CreateFacultyDto, actorId?: string) {
    const code = this.normalizeCode(dto.code);
    const name = this.normalizeName(dto.name);
    await this.ensureUnique(code, name);

    try {
      const created = await this.prisma.$transaction(async (tx) => {
        const faculty = await tx.faculty.create({
          data: {
            code,
            name,
            description: dto.description ?? null,
            isActive: dto.isActive ?? true,
          },
          select: facultySelect,
        });

        await tx.auditLog.create({
          data: {
            userId: actorId ?? null,
            action: 'FACULTY_CREATED',
            entity: 'Faculty',
            entityId: faculty.id,
            metadata: { code: faculty.code, name: faculty.name },
          },
        });

        return faculty;
      });

      return this.toRecord(created);
    } catch (error: unknown) {
      this.rethrowKnownDatabaseError(error);
    }
  }

  async update(id: string, dto: UpdateFacultyDto, actorId?: string) {
    const current = await this.prisma.faculty.findUnique({
      where: { id },
      select: facultySelect,
    });
    if (!current) throw this.notFound();

    const code = dto.code ? this.normalizeCode(dto.code) : current.code;
    const name = dto.name ? this.normalizeName(dto.name) : current.name;
    await this.ensureUnique(code, name, id);

    try {
      const updated = await this.prisma.$transaction(async (tx) => {
        const faculty = await tx.faculty.update({
          where: { id },
          data: {
            ...(dto.code !== undefined ? { code } : {}),
            ...(dto.name !== undefined ? { name } : {}),
            ...(dto.description !== undefined
              ? { description: dto.description }
              : {}),
            ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
          },
          select: facultySelect,
        });

        await tx.auditLog.create({
          data: {
            userId: actorId ?? null,
            action: 'FACULTY_UPDATED',
            entity: 'Faculty',
            entityId: faculty.id,
            metadata: {
              code: faculty.code,
              name: faculty.name,
              isActive: faculty.isActive,
            },
          },
        });

        return faculty;
      });

      return this.toRecord(updated);
    } catch (error: unknown) {
      this.rethrowKnownDatabaseError(error);
    }
  }

  async updateActive(id: string, isActive: boolean, actorId?: string) {
    const current = await this.prisma.faculty.findUnique({
      where: { id },
      select: { id: true, code: true, name: true, isActive: true },
    });
    if (!current) throw this.notFound();

    const updated = await this.prisma.$transaction(async (tx) => {
      const faculty = await tx.faculty.update({
        where: { id },
        data: { isActive },
        select: facultySelect,
      });

      await tx.auditLog.create({
        data: {
          userId: actorId ?? null,
          action: isActive ? 'FACULTY_ACTIVATED' : 'FACULTY_DEACTIVATED',
          entity: 'Faculty',
          entityId: faculty.id,
          metadata: {
            code: faculty.code,
            name: faculty.name,
            previousIsActive: current.isActive,
            isActive,
          },
        },
      });

      return faculty;
    });

    return this.toRecord(updated);
  }

  async remove(id: string, actorId?: string) {
    const current = await this.prisma.faculty.findUnique({
      where: { id },
      select: facultySelect,
    });
    if (!current) throw this.notFound();

    if (current._count.majors > 0 || current._count.lecturers > 0) {
      throw new ConflictException({
        code: 'FACULTY_IN_USE',
        message:
          'Không thể xóa khoa đã có ngành học hoặc giảng viên tham chiếu. Vui lòng chuyển trạng thái sang ngừng sử dụng (isActive = false).',
      });
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.faculty.delete({ where: { id } });
        await tx.auditLog.create({
          data: {
            userId: actorId ?? null,
            action: 'FACULTY_DELETED',
            entity: 'Faculty',
            entityId: id,
            metadata: { code: current.code, name: current.name },
          },
        });
      });

      return { deleted: true, id };
    } catch (error: unknown) {
      this.rethrowKnownDatabaseError(error);
    }
  }

  private async ensureUnique(code: string, name: string, exceptId?: string) {
    const existingByCode = await this.prisma.faculty.findFirst({
      where: {
        code: { equals: code, mode: 'insensitive' },
        ...(exceptId ? { NOT: { id: exceptId } } : {}),
      },
      select: { id: true },
    });
    if (existingByCode) {
      throw new ConflictException({
        code: 'FACULTY_CODE_EXISTS',
        message: 'Mã khoa này đã tồn tại',
      });
    }

    const existingByName = await this.prisma.faculty.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        ...(exceptId ? { NOT: { id: exceptId } } : {}),
      },
      select: { id: true },
    });
    if (existingByName) {
      throw new ConflictException({
        code: 'FACULTY_NAME_EXISTS',
        message: 'Tên khoa này đã tồn tại',
      });
    }
  }

  private normalizeCode(code: string) {
    return code.trim().toUpperCase();
  }

  private normalizeName(name: string) {
    return name.trim().replace(/\s+/g, ' ');
  }

  private toRecord(item: FacultyPayload) {
    const activeMajorCount = item.majors.filter((m) => m.isActive).length;
    const studentCount = item.majors.reduce(
      (sum, major) => sum + major._count.students,
      0,
    );

    return {
      id: item.id,
      code: item.code,
      name: item.name,
      description: item.description,
      isActive: item.isActive,
      majorCount: item._count.majors,
      activeMajorCount,
      lecturerCount: item._count.lecturers,
      studentCount,
      majors: item.majors.map((m) => ({
        id: m.id,
        code: m.code,
        name: m.name,
        isActive: m.isActive,
        studentCount: m._count.students,
      })),
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  private notFound() {
    return new NotFoundException({
      code: 'FACULTY_NOT_FOUND',
      message: 'Không tìm thấy khoa',
    });
  }

  private rethrowKnownDatabaseError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new ConflictException({
          code: 'FACULTY_ALREADY_EXISTS',
          message: 'Mã khoa hoặc tên khoa đã tồn tại',
        });
      }
      if (error.code === 'P2025') {
        throw this.notFound();
      }
      if (error.code === 'P2003') {
        throw new ConflictException({
          code: 'FACULTY_IN_USE',
          message:
            'Không thể xóa khoa đã có dữ liệu tham chiếu. Vui lòng ngừng sử dụng (isActive = false).',
        });
      }
    }
    throw error;
  }
}
