import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { AuthUser } from '../auth/types/auth-user.type';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../generated/prisma/client';
import { CreateInternshipDto } from './dto/create-internship.dto';
import { CreateInternshipReportDto } from './dto/create-internship-report.dto';
import { ListInternshipReportsQueryDto } from './dto/list-internship-reports-query.dto';
import { ListInternshipsQueryDto } from './dto/list-internships-query.dto';
import { ModerateInternshipDto } from './dto/moderate-internship.dto';
import { RepostInternshipDto } from './dto/repost-internship.dto';
import { ReviewInternshipReportDto } from './dto/review-internship-report.dto';
import { SaveAsTemplateDto } from './dto/save-as-template.dto';
import { UpdateInternshipDto } from './dto/update-internship.dto';
import { InternshipsService } from './internships.service';

@Controller('internships')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InternshipsController {
  constructor(private readonly internshipsService: InternshipsService) {}

  @Get()
  list(@Query() query: ListInternshipsQueryDto, @CurrentUser() user: AuthUser) {
    return this.internshipsService.list(query, user);
  }

  @Get('me')
  @Roles(Role.COMPANY)
  listMine(
    @Query() query: ListInternshipsQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.internshipsService.listMine(query, user.id);
  }

  @Get('reports/admin')
  @Roles(Role.ADMIN)
  listReports(@Query() query: ListInternshipReportsQueryDto) {
    return this.internshipsService.listReports(query);
  }

  @Patch('reports/:reportId/review')
  @Roles(Role.ADMIN)
  reviewReport(
    @Param('reportId') reportId: string,
    @Body() dto: ReviewInternshipReportDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.internshipsService.reviewReport(reportId, user.id, dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.internshipsService.findOne(id, user);
  }

  @Post()
  @Roles(Role.COMPANY)
  create(@Body() dto: CreateInternshipDto, @CurrentUser() user: AuthUser) {
    return this.internshipsService.create(dto, user.id);
  }

  @Patch(':id')
  @Roles(Role.COMPANY)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateInternshipDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.internshipsService.update(id, dto, user.id);
  }

  @Patch(':id/moderate')
  @Roles(Role.ADMIN)
  moderate(
    @Param('id') id: string,
    @Body() dto: ModerateInternshipDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.internshipsService.moderate(id, user.id, dto);
  }

  @Post(':id/report')
  @Roles(Role.STUDENT)
  report(
    @Param('id') id: string,
    @Body() dto: CreateInternshipReportDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.internshipsService.report(id, user.id, dto);
  }

  @Delete(':id')
  @Roles(Role.COMPANY)
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.internshipsService.remove(id, user.id);
  }

  @Post(':id/save-as-template')
  @Roles(Role.COMPANY)
  saveAsTemplate(
    @Param('id') id: string,
    @Body() dto: SaveAsTemplateDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.internshipsService.saveAsTemplate(id, user.id, dto);
  }

  @Post(':id/repost')
  @Roles(Role.COMPANY)
  repost(
    @Param('id') id: string,
    @Body() dto: RepostInternshipDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.internshipsService.repost(id, user.id, dto);
  }
}
