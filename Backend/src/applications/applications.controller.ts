import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user.type';
import { Role } from '../generated/prisma/client';
import { CreateApplicationDto } from './dto/create-application.dto';
import { ListApplicationsQueryDto } from './dto/list-applications-query.dto';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post()
  @Roles(Role.STUDENT)
  create(@Body() dto: CreateApplicationDto, @CurrentUser() user: AuthUser) {
    return this.applicationsService.create(dto, user);
  }

  @Get()
  @Roles(Role.ADMIN)
  list(@Query() query: ListApplicationsQueryDto, @CurrentUser() user: AuthUser) {
    return this.applicationsService.list(query, user);
  }

  @Get('me')
  @Roles(Role.STUDENT, Role.COMPANY, Role.ADMIN)
  findMine(@Query() query: ListApplicationsQueryDto, @CurrentUser() user: AuthUser) {
    return this.applicationsService.findMine(query, user);
  }

  @Get(':id/history')
  @Roles(Role.STUDENT, Role.COMPANY, Role.ADMIN)
  history(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.applicationsService.getHistory(id, user);
  }

  @Get(':id')
  @Roles(Role.STUDENT, Role.COMPANY, Role.ADMIN)
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.applicationsService.findOne(id, user);
  }

  @Patch(':id/status')
  @Roles(Role.STUDENT, Role.COMPANY, Role.ADMIN)
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateApplicationStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.applicationsService.updateStatus(id, dto, user);
  }
}
