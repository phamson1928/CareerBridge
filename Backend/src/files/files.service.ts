import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuthUser } from '../auth/types/auth-user.type';
import { FileType } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUploadUrlDto } from './dto/create-upload-url.dto';
import { SupabaseStorageService } from './supabase-storage.service';

const allowedMimeTypes: Record<FileType, readonly string[]> = {
  CV: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  REPORT: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  CERTIFICATE: ['application/pdf', 'image/jpeg', 'image/png'],
  COMPANY_REGISTRATION: ['application/pdf', 'image/jpeg', 'image/png'],
  AVATAR: ['image/jpeg', 'image/png', 'image/webp'],
};

@Injectable()
export class FilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: SupabaseStorageService,
  ) {}

  async createUploadUrl(dto: CreateUploadUrlDto, user: AuthUser) {
    if (dto.type === FileType.COMPANY_REGISTRATION && user.role !== 'COMPANY') {
      throw new ForbiddenException({
        code: 'COMPANY_REGISTRATION_UPLOAD_FORBIDDEN',
        message: 'Only company accounts can upload company registration files',
      });
    }
    this.validateUpload(dto);
    const storageKey = this.createStorageKey(user.id, dto.originalName);
    const file = await this.prisma.file.create({
      data: {
        ownerId: user.id,
        type: dto.type,
        storageKey,
        originalName: dto.originalName.trim(),
        mimeType: dto.mimeType.toLowerCase(),
        sizeBytes: dto.sizeBytes,
      },
      select: {
        id: true,
        type: true,
        storageKey: true,
        originalName: true,
        mimeType: true,
        sizeBytes: true,
        createdAt: true,
      },
    });
    try {
      const signed = await this.storage.createUploadUrl(storageKey);
      return { file, ...signed, expiresIn: this.storage.getExpiresIn() };
    } catch (error: unknown) {
      await this.prisma.file
        .delete({ where: { id: file.id } })
        .catch(() => undefined);
      throw error;
    }
  }

  async createDownloadUrl(fileId: string, user: AuthUser) {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
      include: {
        studentCv: { select: { userId: true } },
        applicationCvs: {
          select: {
            internship: { select: { company: { select: { userId: true } } } },
          },
        },
        reportFiles: {
          select: {
            placement: {
              select: {
                student: { select: { userId: true } },
                supervision: {
                  select: { lecturer: { select: { userId: true } } },
                },
              },
            },
          },
        },
      },
    });
    if (!file) {
      throw new NotFoundException({
        code: 'FILE_NOT_FOUND',
        message: 'File not found',
      });
    }
    if (!this.canAccess(file, user)) {
      throw new ForbiddenException({
        code: 'FILE_ACCESS_FORBIDDEN',
        message: 'You do not have permission to access this file',
      });
    }
    return {
      file: {
        id: file.id,
        type: file.type,
        originalName: file.originalName,
        mimeType: file.mimeType,
        sizeBytes: file.sizeBytes,
        createdAt: file.createdAt,
      },
      downloadUrl: await this.storage.createDownloadUrl(
        file.storageKey,
        file.originalName,
      ),
      expiresIn: this.storage.getExpiresIn(),
    };
  }

  private validateUpload(dto: CreateUploadUrlDto) {
    if (dto.originalName.trim() === '' || /[\\/\r\n]/.test(dto.originalName)) {
      throw new BadRequestException({
        code: 'INVALID_FILE_NAME',
        message: 'File name is invalid',
      });
    }
    if (!allowedMimeTypes[dto.type].includes(dto.mimeType.toLowerCase())) {
      throw new BadRequestException({
        code: 'UNSUPPORTED_FILE_TYPE',
        message: 'The file MIME type is not allowed for this file category',
      });
    }
    if (dto.type === FileType.AVATAR && dto.sizeBytes > 5 * 1024 * 1024) {
      throw new BadRequestException({
        code: 'AVATAR_FILE_TOO_LARGE',
        message: 'Avatar image must not exceed 5 MB',
      });
    }
    if (
      dto.type === FileType.COMPANY_REGISTRATION &&
      dto.sizeBytes > 10 * 1024 * 1024
    ) {
      throw new BadRequestException({
        code: 'COMPANY_REGISTRATION_FILE_TOO_LARGE',
        message: 'Company registration file must not exceed 10 MB',
      });
    }
  }

  private createStorageKey(ownerId: string, originalName: string): string {
    const extension = originalName.trim().split('.').pop()?.toLowerCase();
    const suffix =
      extension && /^[a-z0-9]{1,10}$/.test(extension) ? `.${extension}` : '';
    const date = new Date();
    return `${ownerId}/${date.getUTCFullYear()}/${String(date.getUTCMonth() + 1).padStart(2, '0')}/${randomUUID()}${suffix}`;
  }

  private canAccess(
    file: {
      ownerId: string;
      type: FileType;
      studentCv: { userId: string } | null;
      applicationCvs: { internship: { company: { userId: string } } }[];
      reportFiles: {
        placement: {
          student: { userId: string };
          supervision: { lecturer: { userId: string } } | null;
        };
      }[];
    },
    user: AuthUser,
  ): boolean {
    // Profile avatars are visible to every authenticated user; all other file
    // categories retain their existing private access rules.
    if (file.type === FileType.AVATAR) return true;
    if (
      user.role === 'ADMIN' ||
      file.ownerId === user.id ||
      file.studentCv?.userId === user.id
    )
      return true;
    if (
      file.applicationCvs.some(
        (application) => application.internship.company.userId === user.id,
      )
    )
      return true;
    return file.reportFiles.some(
      (report) =>
        report.placement.student.userId === user.id ||
        report.placement.supervision?.lecturer.userId === user.id,
    );
  }
}
