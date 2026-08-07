import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import type { AuthUser } from '../auth/types/auth-user.type';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../generated/prisma/client';
import { SyncStudentSkillsDto } from './dto/sync-student-skills.dto';
import { SkillsService } from './skills.service';

@Controller('students/me/skills')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.STUDENT)
export class StudentSkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @Get()
  getMine(@CurrentUser() user: AuthUser) {
    return this.skillsService.getStudentSkills(user.id);
  }

  @Put()
  syncMine(@Body() dto: SyncStudentSkillsDto, @CurrentUser() user: AuthUser) {
    return this.skillsService.syncStudentSkills(user.id, dto);
  }
}
