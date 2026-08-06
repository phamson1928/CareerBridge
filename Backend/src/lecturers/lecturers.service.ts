import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLecturerProfileDto } from './dto/create-lecturer-profile.dto';
import { UpdateLecturerProfileDto } from './dto/update-lecturer-profile.dto';

const profileSelect = {
  id: true,
  userId: true,
  fullName: true,
  department: true,
  title: true,
  createdAt: true,
  updatedAt: true,
  user: { select: { email: true } },
} satisfies Prisma.LecturerProfileSelect;

@Injectable()
export class LecturersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string) {
    const profile = await this.prisma.lecturerProfile.findUnique({
      where: { userId },
      select: profileSelect,
    });
    if (!profile) throw this.notFound();
    return profile;
  }

  async create(userId: string, dto: CreateLecturerProfileDto) {
    try {
      return await this.prisma.lecturerProfile.create({
        data: {
          userId,
          fullName: dto.fullName,
          department: dto.department,
          title: dto.title,
        },
        select: profileSelect,
      });
    } catch (error: unknown) {
      this.rethrowKnownDatabaseError(error);
    }
  }

  async updateByUserId(userId: string, dto: UpdateLecturerProfileDto) {
    const profile = await this.findByUserId(userId);
    try {
      return await this.prisma.lecturerProfile.update({
        where: { id: profile.id },
        data: {
          ...(dto.fullName !== undefined ? { fullName: dto.fullName } : {}),
          ...(dto.department !== undefined
            ? { department: dto.department }
            : {}),
          ...(dto.title !== undefined ? { title: dto.title } : {}),
        },
        select: profileSelect,
      });
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

  private notFound(): NotFoundException {
    return new NotFoundException({
      code: 'LECTURER_PROFILE_NOT_FOUND',
      message: 'Lecturer profile not found',
    });
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
