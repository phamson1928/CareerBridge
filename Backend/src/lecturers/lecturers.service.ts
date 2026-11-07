import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FileType, Prisma } from '../generated/prisma/client';
import { FacultiesService } from '../faculties/faculties.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLecturerProfileDto } from './dto/create-lecturer-profile.dto';
import { UpdateLecturerProfileDto } from './dto/update-lecturer-profile.dto';

const profileSelect = {
  id: true,
  userId: true,
  fullName: true,
  department: true,
  facultyId: true,
  title: true,
  avatarFileId: true,
  createdAt: true,
  updatedAt: true,
  user: { select: { email: true } },
  faculty: {
    select: {
      id: true,
      code: true,
      name: true,
      isActive: true,
    },
  },
  avatarFile: {
    select: {
      id: true,
      originalName: true,
      mimeType: true,
      sizeBytes: true,
      createdAt: true,
    },
  },
} satisfies Prisma.LecturerProfileSelect;

type LecturerProfileRecord = Prisma.LecturerProfileGetPayload<{
  select: typeof profileSelect;
}>;

@Injectable()
export class LecturersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly facultiesService: FacultiesService,
  ) {}

  async findByUserId(userId: string) {
    const profile = await this.prisma.lecturerProfile.findUnique({
      where: { userId },
      select: profileSelect,
    });
    if (!profile) throw this.notFound();
    return this.toProfileResponse(profile);
  }

  async create(userId: string, dto: CreateLecturerProfileDto) {
    await this.ensureAvatarFileIsOwnedByUser(dto.avatarFileId, userId);
    const resolvedFaculty = await this.resolveFacultyInput(
      dto.facultyId,
      dto.department,
    );

    try {
      const profile = await this.prisma.lecturerProfile.create({
        data: {
          userId,
          fullName: dto.fullName,
          department: resolvedFaculty.departmentName,
          facultyId: resolvedFaculty.facultyId,
          title: dto.title,
          avatarFileId: dto.avatarFileId,
        },
        select: profileSelect,
      });
      return this.toProfileResponse(profile);
    } catch (error: unknown) {
      this.rethrowKnownDatabaseError(error);
    }
  }

  async updateByUserId(userId: string, dto: UpdateLecturerProfileDto) {
    const profile = await this.findByUserId(userId);
    await this.ensureAvatarFileIsOwnedByUser(dto.avatarFileId, userId);

    const facultyPatch = await this.resolveFacultyUpdate(
      dto.facultyId,
      dto.department,
      profile.facultyId,
    );

    try {
      const updated = await this.prisma.lecturerProfile.update({
        where: { id: profile.id },
        data: {
          ...(dto.fullName !== undefined ? { fullName: dto.fullName } : {}),
          ...facultyPatch,
          ...(dto.title !== undefined ? { title: dto.title } : {}),
          ...(dto.avatarFileId !== undefined
            ? { avatarFileId: dto.avatarFileId }
            : {}),
        },
        select: profileSelect,
      });
      return this.toProfileResponse(updated);
    } catch (error: unknown) {
      this.rethrowKnownDatabaseError(error);
    }
  }

  async removeByUserId(userId: string) {
    const profile = await this.findByUserId(userId);
    try {
      await this.prisma.lecturerProfile.delete({ where: { id: profile.id } });
      return { deleted: true, id: profile.id };
    } catch (error: unknown) {
      this.rethrowKnownDatabaseError(error);
    }
  }

  private async resolveFacultyInput(
    facultyIdInput?: string,
    departmentTextInput?: string,
  ): Promise<{ facultyId: string | null; departmentName: string }> {
    if (facultyIdInput) {
      const faculty =
        await this.facultiesService.assertActiveExists(facultyIdInput);
      return { facultyId: faculty.id, departmentName: faculty.name };
    }

    if (departmentTextInput) {
      const matched = await this.prisma.faculty.findFirst({
        where: {
          isActive: true,
          OR: [
            { code: { equals: departmentTextInput, mode: 'insensitive' } },
            { name: { equals: departmentTextInput, mode: 'insensitive' } },
          ],
        },
        select: { id: true, name: true },
      });
      if (matched) {
        return { facultyId: matched.id, departmentName: matched.name };
      }
      return { facultyId: null, departmentName: departmentTextInput };
    }

    throw new BadRequestException({
      code: 'FACULTY_REQUIRED',
      message: 'Vui lòng chọn Khoa chủ quản',
    });
  }

  private async resolveFacultyUpdate(
    facultyIdInput: string | undefined,
    departmentTextInput: string | undefined,
    currentFacultyId: string | null,
  ): Promise<{ department?: string; facultyId?: string | null }> {
    if (facultyIdInput !== undefined) {
      if (facultyIdInput === currentFacultyId && currentFacultyId) {
        const currentFaculty = await this.prisma.faculty.findUnique({
          where: { id: currentFacultyId },
          select: { id: true, name: true },
        });
        if (currentFaculty) {
          return {
            facultyId: currentFaculty.id,
            department: currentFaculty.name,
          };
        }
      }
      const faculty =
        await this.facultiesService.assertActiveExists(facultyIdInput);
      return { facultyId: faculty.id, department: faculty.name };
    }

    if (departmentTextInput !== undefined) {
      const resolved = await this.resolveFacultyInput(
        undefined,
        departmentTextInput,
      );
      return {
        department: resolved.departmentName,
        ...(resolved.facultyId ? { facultyId: resolved.facultyId } : {}),
      };
    }

    return {};
  }

  private toProfileResponse(profile: LecturerProfileRecord) {
    return {
      ...profile,
      department: profile.faculty?.name ?? profile.department,
      facultyId: profile.facultyId ?? profile.faculty?.id ?? null,
      faculty: profile.faculty ?? null,
    };
  }

  private notFound(): NotFoundException {
    return new NotFoundException({
      code: 'LECTURER_PROFILE_NOT_FOUND',
      message: 'Lecturer profile not found',
    });
  }

  private async ensureAvatarFileIsOwnedByUser(
    avatarFileId: string | null | undefined,
    userId: string,
  ) {
    if (avatarFileId === undefined || avatarFileId === null) return;
    const file = await this.prisma.file.findUnique({
      where: { id: avatarFileId },
      select: { ownerId: true, type: true },
    });
    if (!file)
      throw new NotFoundException({
        code: 'AVATAR_FILE_NOT_FOUND',
        message: 'Avatar file not found',
      });
    if (file.ownerId !== userId || file.type !== FileType.AVATAR) {
      throw new ForbiddenException({
        code: 'INVALID_AVATAR_FILE',
        message:
          'The avatar must be owned by this lecturer and have type AVATAR',
      });
    }
  }

  private rethrowKnownDatabaseError(error: unknown): never {
    if (this.isPrismaError(error, 'P2002')) {
      throw new ConflictException({
        code: 'LECTURER_PROFILE_ALREADY_EXISTS',
        message: 'Lecturer profile already exists',
      });
    }
    if (this.isPrismaError(error, 'P2003')) {
      throw new ConflictException({
        code: 'LECTURER_PROFILE_HAS_RELATED_DATA',
        message:
          'Lecturer profile cannot be deleted because related records must be retained',
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
