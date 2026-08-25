import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Role } from '../generated/prisma/client';
import type { AuthUser } from '../auth/types/auth-user.type';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { ListEvaluationsQueryDto } from './dto/list-evaluations-query.dto';
import { UpdateEvaluationDto } from './dto/update-evaluation.dto';
import { EvaluationsService } from './evaluations.service';

@Controller('evaluations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EvaluationsController {
  constructor(private readonly evaluations: EvaluationsService) {}

  @Post() @Roles(Role.COMPANY, Role.LECTURER)
  create(@Body() dto: CreateEvaluationDto, @CurrentUser() user: AuthUser) { return this.evaluations.create(dto, user); }

  @Get('me') @Roles(Role.STUDENT, Role.COMPANY, Role.LECTURER, Role.ADMIN)
  listMine(@Query() query: ListEvaluationsQueryDto, @CurrentUser() user: AuthUser) { return this.evaluations.listMine(query, user); }

  @Get(':id') @Roles(Role.STUDENT, Role.COMPANY, Role.LECTURER, Role.ADMIN)
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) { return this.evaluations.findOne(id, user); }

  @Patch(':id') @Roles(Role.COMPANY, Role.LECTURER)
  update(@Param('id') id: string, @Body() dto: UpdateEvaluationDto, @CurrentUser() user: AuthUser) { return this.evaluations.update(id, dto, user); }
}
