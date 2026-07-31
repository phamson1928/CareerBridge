import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import {
  getClearRefreshCookieOptions,
  getRefreshCookieOptions,
  readCookie,
  REFRESH_COOKIE_NAME,
} from './utils/cookie-options.util';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async register(
    @Body() dto: RegisterDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.register(
      dto,
      this.getRequestMetadata(request),
    );
    response.cookie(
      REFRESH_COOKIE_NAME,
      result.refreshToken,
      getRefreshCookieOptions(this.config),
    );

    return {
      user: result.user,
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async login(
    @Body() dto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(
      dto,
      this.getRequestMetadata(request),
    );
    response.cookie(
      REFRESH_COOKIE_NAME,
      result.refreshToken,
      getRefreshCookieOptions(this.config),
    );

    return {
      user: result.user,
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.refresh(
      this.getRefreshToken(request),
      this.getRequestMetadata(request),
    );
    response.cookie(
      REFRESH_COOKIE_NAME,
      result.refreshToken,
      getRefreshCookieOptions(this.config),
    );

    return {
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.authService.logout(this.getRefreshToken(request));
    response.clearCookie(
      REFRESH_COOKIE_NAME,
      getClearRefreshCookieOptions(this.config),
    );
    return { loggedOut: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getCurrentUser(@CurrentUser('id') userId: string) {
    return this.authService.getCurrentUser(userId);
  }

  private getRefreshToken(request: Request): string | undefined {
    return readCookie(request.headers.cookie, REFRESH_COOKIE_NAME);
  }

  private getRequestMetadata(request: Request) {
    return {
      userAgent: request.get('user-agent'),
      ipAddress: request.ip,
    };
  }
}
