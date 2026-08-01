import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { Prisma, UserStatus } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const userSelect = {
  id: true,
  email: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  private readonly bcryptRounds: number;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.bcryptRounds = config.getOrThrow<number>('BCRYPT_ROUNDS');
  }

  async findAll(query: ListUsersQueryDto) {
    const { page, limit, search, role, status } = query;
    const where: Prisma.UserWhereInput = {
      ...(role ? { role } : {}),
      ...(status ? { status } : {}),
      ...(search ? { email: { contains: search, mode: 'insensitive' } } : {}),
    };
    const skip = (page - 1) * limit;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: userSelect,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });
    if (!user) throw this.notFound();
    return user;
  }

  async create(dto: CreateUserDto) {
    try {
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          passwordHash: await bcrypt.hash(dto.password, this.bcryptRounds),
          role: dto.role,
          status: dto.status ?? UserStatus.ACTIVE,
        },
        select: userSelect,
      });
      return user;
    } catch (error: unknown) {
      this.rethrowKnownDatabaseError(error);
    }
  }

  async update(id: string, dto: UpdateUserDto, currentUserId: string) {
    const existing = await this.findOne(id);
    if (
      id === currentUserId &&
      ((dto.status && dto.status !== UserStatus.ACTIVE) || dto.role)
    ) {
      throw new ForbiddenException({
        code: 'SELF_ACCOUNT_CHANGE_FORBIDDEN',
        message: 'You cannot change your own role or deactivate your account',
      });
    }

    try {
      const user = await this.prisma.user.update({
        where: { id: existing.id },
        data: {
          ...(dto.email ? { email: dto.email } : {}),
          ...(dto.role ? { role: dto.role } : {}),
          ...(dto.status ? { status: dto.status } : {}),
          ...(dto.password
            ? {
                passwordHash: await bcrypt.hash(
                  dto.password,
                  this.bcryptRounds,
                ),
              }
            : {}),
        },
        select: userSelect,
      });
      if (dto.password || (dto.status && dto.status !== UserStatus.ACTIVE)) {
        await this.prisma.refreshToken.updateMany({
          where: { userId: id, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }
      return user;
    } catch (error: unknown) {
      this.rethrowKnownDatabaseError(error);
    }
  }

  async remove(id: string, currentUserId: string) {
    if (id === currentUserId) {
      throw new ForbiddenException({
        code: 'SELF_DELETE_FORBIDDEN',
        message: 'You cannot delete your own account',
      });
    }
    await this.findOne(id);
    try {
      await this.prisma.user.delete({ where: { id } });
      return { deleted: true, id };
    } catch (error: unknown) {
      this.rethrowKnownDatabaseError(error);
    }
  }

  private notFound(): NotFoundException {
    return new NotFoundException({
      code: 'USER_NOT_FOUND',
      message: 'User not found',
    });
  }

  private rethrowKnownDatabaseError(error: unknown): never {
    if (this.isPrismaError(error, 'P2002')) {
      throw new ConflictException({
        code: 'EMAIL_ALREADY_EXISTS',
        message: 'Email is already registered',
      });
    }
    if (this.isPrismaError(error, 'P2003')) {
      throw new ConflictException({
        code: 'USER_HAS_RELATED_DATA',
        message:
          'User cannot be deleted because related records must be retained',
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
