import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Role } from '../generated/prisma/client';
import type { AuthUser } from '../auth/types/auth-user.type';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { GenerateRecommendationsDto } from './dto/generate-recommendations.dto';
import { RecommendationsService } from './recommendations.service';

@Controller('recommendations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.STUDENT)
export class RecommendationsController {
  constructor(private readonly recommendations: RecommendationsService) {}

  @Get('internships/me')
  getCurrent(@CurrentUser() user: AuthUser) {
    return this.recommendations.getCurrent(user.id);
  }

  @Post('internships/me/generate')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 6, ttl: 60_000 } })
  generate(
    @Body() dto: GenerateRecommendationsDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.recommendations.generate(user.id, dto.force);
  }
}
