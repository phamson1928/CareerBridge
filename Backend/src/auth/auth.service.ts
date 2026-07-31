import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AccessTokenPayload } from './types/token-payload.type';
import { PublicUser } from './types/auth-user.type';
import {
  generateRefreshToken,
  hashRefreshToken,
} from './utils/refresh-token.util';

interface RequestMetadata {
  userAgent?: string;
  ipAddress?: string;
}

interface AuthResult {
  user: PublicUser;
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
}

interface RefreshResult {
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
}

const publicUserSelect = {
  id: true,
  email: true,
  role: true,
  status: true,
} as const;

@Injectable()
export class AuthService {
  private readonly accessTokenExpiresIn: number;
  private readonly refreshTokenExpiresIn: number;
  private readonly bcryptRounds: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {
    this.accessTokenExpiresIn = this.config.getOrThrow<number>(
      'JWT_EXPIRES_IN_SECONDS',
    );
    this.refreshTokenExpiresIn = this.config.getOrThrow<number>(
      'JWT_REFRESH_EXPIRES_IN_SECONDS',
    );
    this.bcryptRounds = this.config.getOrThrow<number>('BCRYPT_ROUNDS');
  }

  async register(
    dto: RegisterDto,
    metadata: RequestMetadata,
  ): Promise<AuthResult> {
    const email = this.normalizeEmail(dto.email);
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictException({
        code: 'EMAIL_ALREADY_EXISTS',
        message: 'Email is already registered',
      });
    }

    const passwordHash = await bcrypt.hash(dto.password, this.bcryptRounds);
    const refreshToken = generateRefreshToken();
    const expiresAt = this.getRefreshExpiry();

    try {
      const user = await this.prisma.$transaction(async (tx) => {
        const createdUser = await tx.user.create({
          data: {
            email,
            passwordHash,
            role: dto.role,
          },
          select: publicUserSelect,
        });

        await tx.refreshToken.create({
          data: {
            userId: createdUser.id,
            tokenHash: hashRefreshToken(refreshToken),
            expiresAt,
            userAgent: this.sanitizeUserAgent(metadata.userAgent),
            ipAddress: metadata.ipAddress,
          },
        });

        return createdUser;
      });

      return this.buildAuthResult(user, refreshToken);
    } catch (error: unknown) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException({
          code: 'EMAIL_ALREADY_EXISTS',
          message: 'Email is already registered',
        });
      }
      throw error;
    }
  }

  async login(dto: LoginDto, metadata: RequestMetadata): Promise<AuthResult> {
    const email = this.normalizeEmail(dto.email);
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        ...publicUserSelect,
        passwordHash: true,
      },
    });

    if (!user) {
      await bcrypt.hash(dto.password, this.bcryptRounds);
      throw this.invalidCredentials();
    }

    const passwordMatches = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!passwordMatches) {
      throw this.invalidCredentials();
    }

    if (user.status !== 'ACTIVE') {
      throw new ForbiddenException({
        code: 'ACCOUNT_NOT_ACTIVE',
        message: 'Account is not active',
      });
    }

    const refreshToken = generateRefreshToken();
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashRefreshToken(refreshToken),
        expiresAt: this.getRefreshExpiry(),
        userAgent: this.sanitizeUserAgent(metadata.userAgent),
        ipAddress: metadata.ipAddress,
      },
    });

    return this.buildAuthResult(user, refreshToken);
  }

  async refresh(
    rawRefreshToken: string | undefined,
    metadata: RequestMetadata,
  ): Promise<RefreshResult> {
    if (!rawRefreshToken) {
      throw new UnauthorizedException({
        code: 'REFRESH_TOKEN_MISSING',
        message: 'Refresh token is missing',
      });
    }

    const now = new Date();
    const tokenHash = hashRefreshToken(rawRefreshToken);
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          select: publicUserSelect,
        },
      },
    });

    if (!storedToken || storedToken.revokedAt) {
      throw this.invalidRefreshToken();
    }

    if (storedToken.expiresAt <= now) {
      throw new UnauthorizedException({
        code: 'REFRESH_TOKEN_EXPIRED',
        message: 'Refresh token has expired',
      });
    }

    if (storedToken.user.status !== 'ACTIVE') {
      throw new ForbiddenException({
        code: 'ACCOUNT_NOT_ACTIVE',
        message: 'Account is not active',
      });
    }

    const nextRefreshToken = generateRefreshToken();
    const nextTokenHash = hashRefreshToken(nextRefreshToken);
    const nextExpiresAt = this.getRefreshExpiry();

    await this.prisma.$transaction(async (tx) => {
      const revokeResult = await tx.refreshToken.updateMany({
        where: {
          id: storedToken.id,
          revokedAt: null,
          expiresAt: { gt: now },
        },
        data: { revokedAt: now },
      });

      if (revokeResult.count !== 1) {
        throw this.invalidRefreshToken();
      }

      await tx.refreshToken.create({
        data: {
          userId: storedToken.userId,
          tokenHash: nextTokenHash,
          expiresAt: nextExpiresAt,
          userAgent: this.sanitizeUserAgent(metadata.userAgent),
          ipAddress: metadata.ipAddress,
        },
      });
    });

    const accessToken = await this.signAccessToken(storedToken.user);
    return {
      accessToken,
      expiresIn: this.accessTokenExpiresIn,
      refreshToken: nextRefreshToken,
    };
  }

  async logout(rawRefreshToken: string | undefined): Promise<void> {
    if (!rawRefreshToken) {
      return;
    }

    await this.prisma.refreshToken.updateMany({
      where: {
        tokenHash: hashRefreshToken(rawRefreshToken),
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
  }

  async getCurrentUser(userId: string): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: publicUserSelect,
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException({
        code: 'ACCOUNT_NOT_AVAILABLE',
        message: 'Account is not available',
      });
    }

    return user;
  }

  private async buildAuthResult(
    user: PublicUser,
    refreshToken: string,
  ): Promise<AuthResult> {
    return {
      user,
      accessToken: await this.signAccessToken(user),
      expiresIn: this.accessTokenExpiresIn,
      refreshToken,
    };
  }

  private signAccessToken(user: PublicUser): Promise<string> {
    const payload: AccessTokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    return this.jwtService.signAsync(payload);
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private getRefreshExpiry(): Date {
    return new Date(Date.now() + this.refreshTokenExpiresIn * 1000);
  }

  private sanitizeUserAgent(userAgent: string | undefined): string | undefined {
    return userAgent?.slice(0, 512);
  }

  private invalidCredentials(): UnauthorizedException {
    return new UnauthorizedException({
      code: 'INVALID_CREDENTIALS',
      message: 'Invalid email or password',
    });
  }

  private invalidRefreshToken(): UnauthorizedException {
    return new UnauthorizedException({
      code: 'REFRESH_TOKEN_INVALID',
      message: 'Refresh token is invalid or has been revoked',
    });
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: unknown }).code === 'P2002'
    );
  }
}
