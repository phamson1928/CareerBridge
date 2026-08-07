import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import type { AuthUser } from '../auth/types/auth-user.type';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../generated/prisma/client';
import { SyncInternshipSkillsDto } from './dto/sync-internship-skills.dto';
import { SkillsService } from './skills.service';

@Controller('internships/:internshipId/skills')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InternshipSkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @Get()
  @Roles(Role.ADMIN, Role.STUDENT, Role.COMPANY, Role.LECTURER)
  getSkills(@Param('internshipId') internshipId: string) {
    return this.skillsService.getInternshipSkills(internshipId);
  }

  @Put()
  @Roles(Role.ADMIN, Role.COMPANY)
  syncSkills(
    @Param('internshipId') internshipId: string,
    @Body() dto: SyncInternshipSkillsDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.skillsService.syncInternshipSkills(
      internshipId,
      user.id,
      user.role,
      dto,
    );
  }
}
