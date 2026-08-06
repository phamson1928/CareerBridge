import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FileType, Prisma, Role } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudentProfileDto } from './dto/create-student-profile.dto';
import { UpdateStudentProfileDto } from './dto/update-student-profile.dto';

const profileSelect = {
  id: true,
  userId: true,
  studentCode: true,
  fullName: true,
  major: true,
  phone: true,
  summary: true,
  gpa: true,
  cvFileId: true,
  createdAt: true,
  updatedAt: true,
  user: { select: { email: true } },
  cvFile: {
    select: {
      id: true,
      originalName: true,
      mimeType: true,
      sizeBytes: true,
      createdAt: true,
    },
  },
} satisfies Prisma.StudentProfileSelect;

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string) {
    const profile = await this.prisma.studentProfile.findUnique({
      where: { userId },
      select: profileSelect,
    });
    if (!profile) throw this.notFound();
    return profile;
  }

  async create(userId: string, dto: CreateStudentProfileDto) {
    await this.ensureStudentUser(userId);
    await this.ensureCvFileIsOwnedByStudent(dto.cvFileId, userId);
    try {
      return await this.prisma.studentProfile.create({
        data: {
          userId,
          studentCode: dto.studentCode,
          fullName: dto.fullName,
          major: dto.major,
          phone: dto.phone,
          summary: dto.summary,
          gpa: dto.gpa,
          cvFileId: dto.cvFileId,
        },
        select: profileSelect,
      });
    } catch (error: unknown) {
      this.rethrowKnownDatabaseError(error);
    }
  }

  async updateByUserId(userId: string, dto: UpdateStudentProfileDto) {
    const profile = await this.findByUserId(userId);
    await this.ensureCvFileIsOwnedByStudent(dto.cvFileId, profile.userId);
    try {
      return await this.prisma.studentProfile.update({
        where: { id: profile.id },
        data: this.toUpdateData(dto),
        select: profileSelect,
      });
    } catch (error: unknown) {
      this.rethrowKnownDatabaseError(error);
    }
  }

  async removeByUserId(userId: string) {
    const profile = await this.findByUserId(userId);
    try {
      await this.prisma.studentProfile.delete({ where: { id: profile.id } });
      return { deleted: true, id: profile.id };
    } catch (error: unknown) {
      this.rethrowKnownDatabaseError(error);
    }
  }

  private toUpdateData(
    dto: UpdateStudentProfileDto,
  ): Prisma.StudentProfileUpdateInput {
    return {
      ...(dto.studentCode !== undefined
        ? { studentCode: dto.studentCode }
        : {}),
      ...(dto.fullName !== undefined ? { fullName: dto.fullName } : {}),
      ...(dto.major !== undefined ? { major: dto.major } : {}),
      ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
      ...(dto.summary !== undefined ? { summary: dto.summary } : {}),
      ...(dto.gpa !== undefined ? { gpa: dto.gpa } : {}),
      ...(dto.cvFileId !== undefined ? { cvFileId: dto.cvFileId } : {}),
    };
  }

  private async ensureStudentUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: 'User not found',
      });
    }
    if (user.role !== Role.STUDENT) {
      throw new ForbiddenException({
        code: 'USER_IS_NOT_STUDENT',
        message: 'A student profile can only belong to a STUDENT user',
      });
    }
  }

  private async ensureCvFileIsOwnedByStudent(
    cvFileId: string | null | undefined,
    userId: string,
  ) {
    if (cvFileId === undefined || cvFileId === null) return;
    const file = await this.prisma.file.findUnique({
      where: { id: cvFileId },
      select: { ownerId: true, type: true },
    });
    if (!file) {
      throw new NotFoundException({
        code: 'CV_FILE_NOT_FOUND',
        message: 'CV file not found',
      });
    }
    if (file.ownerId !== userId || file.type !== FileType.CV) {
      throw new ForbiddenException({
        code: 'INVALID_CV_FILE',
        message: 'The CV file must be owned by this student and have type CV',
      });
    }
  }

  private notFound(): NotFoundException {
    return new NotFoundException({
      code: 'STUDENT_PROFILE_NOT_FOUND',
      message: 'Student profile not found',
    });
  }

  private rethrowKnownDatabaseError(error: unknown): never {
    if (this.isPrismaError(error, 'P2002')) {
      throw new ConflictException({
        code: 'STUDENT_PROFILE_ALREADY_EXISTS',
        message: 'Student code or profile already exists',
      });
    }
    if (this.isPrismaError(error, 'P2003')) {
      throw new ConflictException({
        code: 'STUDENT_PROFILE_HAS_RELATED_DATA',
        message:
          'Student profile cannot be deleted because related records must be retained',
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
