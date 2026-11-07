import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMajorDto } from './dto/create-major.dto';
import { ListMajorOptionsQueryDto } from './dto/list-major-options-query.dto';
import { ListMajorsQueryDto } from './dto/list-majors-query.dto';
import { UpdateMajorDto } from './dto/update-major.dto';

const majorSelect = {
  id: true,
  facultyId: true,
  code: true,
  name: true,
  description: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  faculty: {
    select: {
      id: true,
      code: true,
      name: true,
      isActive: true,
    },
  },
  _count: {
    select: {
      students: true,
      internships: true,
    },
  },
} satisfies Prisma.MajorSelect;

type MajorPayload = Prisma.MajorGetPayload<{
  select: typeof majorSelect;
}>;

@Injectable()
export class MajorsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListMajorsQueryDto) {
    const { page, limit, search, facultyId, isActive } = query;
    const where: Prisma.MajorWhereInput = {
      ...(facultyId ? { facultyId } : {}),
      ...(typeof isActive === 'boolean' ? { isActive } : {}),
      ...(search
        ? {
            OR: [
              { code: { contains: search, mode: 'insensitive' } },
              { name: { contains: search, mode: 'insensitive' } },
              { faculty: { name: { contains: search, mode: 'insensitive' } } },
              { faculty: { code: { contains: search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.major.findMany({
        where,
        select: majorSelect,
        orderBy: [
          { isActive: 'desc' },
          { faculty: { name: 'asc' } },
          { name: 'asc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.major.count({ where }),
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

  async listOptions(query: ListMajorOptionsQueryDto) {
    const includeInactive = Boolean(query.includeInactive);
    const search = query.search?.trim();

    const items = await this.prisma.major.findMany({
      where: {
        ...(query.facultyId ? { facultyId: query.facultyId } : {}),
        ...(includeInactive
          ? {}
          : { isActive: true, faculty: { isActive: true } }),
        ...(search
          ? {
              OR: [
                { code: { contains: search, mode: 'insensitive' } },
                { name: { contains: search, mode: 'insensitive' } },
                {
                  faculty: { name: { contains: search, mode: 'insensitive' } },
                },
              ],
            }
          : {}),
      },
      orderBy: [
        { isActive: 'desc' },
        { faculty: { name: 'asc' } },
        { name: 'asc' },
      ],
      select: {
        id: true,
        code: true,
        name: true,
        isActive: true,
        facultyId: true,
        faculty: {
          select: {
            id: true,
            code: true,
            name: true,
            isActive: true,
          },
        },
      },
    });

    return { items };
  }

  async findById(id: string) {
    const major = await this.prisma.major.findUnique({
      where: { id },
      select: majorSelect,
    });
    if (!major) throw this.notFound();
    return this.toRecord(major);
  }

  async assertActiveExists(id: string) {
    const major = await this.prisma.major.findUnique({
      where: { id },
      select: {
        id: true,
        code: true,
        name: true,
        isActive: true,
        facultyId: true,
        faculty: {
          select: { id: true, code: true, name: true, isActive: true },
        },
      },
    });
    if (!major) throw this.notFound();
    if (!major.isActive || !major.faculty.isActive) {
      throw new ConflictException({
        code: 'MAJOR_INACTIVE',
        message:
          'Ngành học hoặc Khoa chủ quản đã ngừng hoạt động, vui lòng chọn ngành khác',
      });
    }
    return major;
  }

  async create(dto: CreateMajorDto, actorId?: string) {
    const faculty = await this.ensureFacultyExists(dto.facultyId);
    const code = this.normalizeCode(dto.code);
    const name = this.normalizeName(dto.name);
    const isActive = dto.isActive ?? true;

    if (isActive && !faculty.isActive) {
      throw new BadRequestException({
        code: 'FACULTY_INACTIVE',
        message:
          'Không thể tạo ngành đang hoạt động thuộc một Khoa đang ngừng sử dụng',
      });
    }

    await this.ensureUnique(code, dto.facultyId, name);

    try {
      const created = await this.prisma.$transaction(async (tx) => {
        const major = await tx.major.create({
          data: {
            facultyId: dto.facultyId,
            code,
            name,
            description: dto.description ?? null,
            isActive,
          },
          select: majorSelect,
        });

        await tx.auditLog.create({
          data: {
            userId: actorId ?? null,
            action: 'MAJOR_CREATED',
            entity: 'Major',
            entityId: major.id,
            metadata: {
              code: major.code,
              name: major.name,
              facultyId: major.facultyId,
            },
          },
        });

        return major;
      });

      return this.toRecord(created);
    } catch (error: unknown) {
      this.rethrowKnownDatabaseError(error);
    }
  }

  async update(id: string, dto: UpdateMajorDto, actorId?: string) {
    const current = await this.prisma.major.findUnique({
      where: { id },
      select: majorSelect,
    });
    if (!current) throw this.notFound();

    const targetFacultyId = dto.facultyId ?? current.facultyId;
    const faculty = await this.ensureFacultyExists(targetFacultyId);
    const code = dto.code ? this.normalizeCode(dto.code) : current.code;
    const name = dto.name ? this.normalizeName(dto.name) : current.name;
    const nextIsActive = dto.isActive ?? current.isActive;

    if (nextIsActive && !faculty.isActive) {
      throw new BadRequestException({
        code: 'FACULTY_INACTIVE',
        message:
          'Không thể kích hoạt ngành khi Khoa chủ quản đang ngừng hoạt động',
      });
    }

    await this.ensureUnique(code, targetFacultyId, name, id);

    try {
      const updated = await this.prisma.$transaction(async (tx) => {
        const major = await tx.major.update({
          where: { id },
          data: {
            ...(dto.facultyId !== undefined
              ? { facultyId: dto.facultyId }
              : {}),
            ...(dto.code !== undefined ? { code } : {}),
            ...(dto.name !== undefined ? { name } : {}),
            ...(dto.description !== undefined
              ? { description: dto.description }
              : {}),
            ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
          },
          select: majorSelect,
        });

        if (dto.name !== undefined && name !== current.name) {
          await tx.studentProfile.updateMany({
            where: { majorId: id },
            data: { major: name },
          });
        }

        await tx.auditLog.create({
          data: {
            userId: actorId ?? null,
            action: 'MAJOR_UPDATED',
            entity: 'Major',
            entityId: major.id,
            metadata: {
              code: major.code,
              name: major.name,
              facultyId: major.facultyId,
              isActive: major.isActive,
            },
          },
        });

        return major;
      });

      return this.toRecord(updated);
    } catch (error: unknown) {
      this.rethrowKnownDatabaseError(error);
    }
  }

  async updateActive(id: string, isActive: boolean, actorId?: string) {
    const current = await this.prisma.major.findUnique({
      where: { id },
      select: {
        id: true,
        code: true,
        name: true,
        isActive: true,
        faculty: { select: { id: true, isActive: true } },
      },
    });
    if (!current) throw this.notFound();

    if (isActive && !current.faculty.isActive) {
      throw new BadRequestException({
        code: 'FACULTY_INACTIVE',
        message:
          'Không thể kích hoạt ngành khi Khoa chủ quản đang ngừng hoạt động',
      });
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const major = await tx.major.update({
        where: { id },
        data: { isActive },
        select: majorSelect,
      });

      await tx.auditLog.create({
        data: {
          userId: actorId ?? null,
          action: isActive ? 'MAJOR_ACTIVATED' : 'MAJOR_DEACTIVATED',
          entity: 'Major',
          entityId: major.id,
          metadata: {
            code: major.code,
            name: major.name,
            previousIsActive: current.isActive,
            isActive,
          },
        },
      });

      return major;
    });

    return this.toRecord(updated);
  }

  async remove(id: string, actorId?: string) {
    const current = await this.prisma.major.findUnique({
      where: { id },
      select: majorSelect,
    });
    if (!current) throw this.notFound();

    if (current._count.students > 0 || current._count.internships > 0) {
      throw new ConflictException({
        code: 'MAJOR_IN_USE',
        message:
          'Không thể xóa ngành học đã có sinh viên hoặc tin tuyển dụng tham chiếu. Vui lòng chuyển trạng thái sang ngừng sử dụng (isActive = false).',
      });
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.major.delete({ where: { id } });

        await tx.auditLog.create({
          data: {
            userId: actorId ?? null,
            action: 'MAJOR_DELETED',
            entity: 'Major',
            entityId: id,
            metadata: {
              code: current.code,
              name: current.name,
              facultyId: current.facultyId,
            },
          },
        });
      });

      return { deleted: true, id };
    } catch (error: unknown) {
      this.rethrowKnownDatabaseError(error);
    }
  }

  private async ensureFacultyExists(facultyId: string) {
    const faculty = await this.prisma.faculty.findUnique({
      where: { id: facultyId },
      select: { id: true, code: true, name: true, isActive: true },
    });
    if (!faculty) {
      throw new NotFoundException({
        code: 'FACULTY_NOT_FOUND',
        message: 'Không tìm thấy khoa',
      });
    }
    return faculty;
  }

  private async ensureUnique(
    code: string,
    facultyId: string,
    name: string,
    exceptId?: string,
  ) {
    const existingByCode = await this.prisma.major.findFirst({
      where: {
        code: { equals: code, mode: 'insensitive' },
        ...(exceptId ? { NOT: { id: exceptId } } : {}),
      },
      select: { id: true },
    });
    if (existingByCode) {
      throw new ConflictException({
        code: 'MAJOR_CODE_EXISTS',
        message: 'Mã ngành này đã tồn tại',
      });
    }

    const existingByNameInFaculty = await this.prisma.major.findFirst({
      where: {
        facultyId,
        name: { equals: name, mode: 'insensitive' },
        ...(exceptId ? { NOT: { id: exceptId } } : {}),
      },
      select: { id: true },
    });
    if (existingByNameInFaculty) {
      throw new ConflictException({
        code: 'MAJOR_NAME_EXISTS',
        message: 'Tên ngành này đã tồn tại trong khoa đã chọn',
      });
    }
  }

  private normalizeCode(code: string) {
    return code.trim().toUpperCase();
  }

  private normalizeName(name: string) {
    return name.trim().replace(/\s+/g, ' ');
  }

  private toRecord(item: MajorPayload) {
    return {
      id: item.id,
      facultyId: item.facultyId,
      code: item.code,
      name: item.name,
      description: item.description,
      isActive: item.isActive,
      faculty: item.faculty,
      studentCount: item._count.students,
      internshipCount: item._count.internships,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  private notFound() {
    return new NotFoundException({
      code: 'MAJOR_NOT_FOUND',
      message: 'Không tìm thấy ngành học',
    });
  }

  private rethrowKnownDatabaseError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new ConflictException({
          code: 'MAJOR_ALREADY_EXISTS',
          message: 'Mã ngành hoặc tên ngành đã tồn tại',
        });
      }
      if (error.code === 'P2025') {
        throw this.notFound();
      }
      if (error.code === 'P2003') {
        throw new ConflictException({
          code: 'MAJOR_IN_USE',
          message:
            'Không thể xóa ngành đã có dữ liệu tham chiếu. Vui lòng ngừng sử dụng (isActive = false).',
        });
      }
    }
    throw error;
  }
}
