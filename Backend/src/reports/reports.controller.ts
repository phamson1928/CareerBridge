import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Role } from '../generated/prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import type { AuthUser } from '../auth/types/auth-user.type';
import { CreateReportDto } from './dto/create-report.dto';
import { ListReportsQueryDto } from './dto/list-reports-query.dto';
import { ReviewReportDto } from './dto/review-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { ReportsService } from './reports.service';

@Controller('reports') @UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}
  @Post() @Roles(Role.STUDENT) create(@Body() dto: CreateReportDto, @CurrentUser() user: AuthUser) { return this.reports.create(dto, user); }
  @Get('me') @Roles(Role.STUDENT) mine(@Query() query: ListReportsQueryDto, @CurrentUser() user: AuthUser) { return this.reports.listStudent(query, user); }
  @Get('supervised') @Roles(Role.LECTURER) supervised(@Query() query: ListReportsQueryDto, @CurrentUser() user: AuthUser) { return this.reports.listSupervised(query, user); }
  @Get(':id') @Roles(Role.STUDENT, Role.LECTURER, Role.ADMIN) one(@Param('id') id: string, @CurrentUser() user: AuthUser) { return this.reports.findOne(id, user); }
  @Patch(':id') @Roles(Role.STUDENT) update(@Param('id') id: string, @Body() dto: UpdateReportDto, @CurrentUser() user: AuthUser) { return this.reports.update(id, dto, user); }
  @Post(':id/submit') @Roles(Role.STUDENT) submit(@Param('id') id: string, @CurrentUser() user: AuthUser) { return this.reports.submit(id, user); }
  @Post(':id/review') @Roles(Role.LECTURER) review(@Param('id') id: string, @Body() dto: ReviewReportDto, @CurrentUser() user: AuthUser) { return this.reports.review(id, dto, user); }
}
