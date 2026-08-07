import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import type { AuthUser } from '../auth/types/auth-user.type';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../generated/prisma/client';
import { MatchingService } from './matching.service';

@Controller('internships/:internshipId/match')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.STUDENT)
export class InternshipMatchController {
  constructor(private readonly matchingService: MatchingService) {}

  @Get('me')
  calculate(
    @Param('internshipId') internshipId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.matchingService.calculateForUser(user.id, internshipId);
  }
}
