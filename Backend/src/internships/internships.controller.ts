import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import type { AuthUser } from '../auth/types/auth-user.type';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../generated/prisma/client';
import { CreateInternshipDto } from './dto/create-internship.dto';
import { ListInternshipsQueryDto } from './dto/list-internships-query.dto';
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
  listMine(@Query() query: ListInternshipsQueryDto, @CurrentUser() user: AuthUser) {
    return this.internshipsService.listMine(query, user.id);
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
  update(@Param('id') id: string, @Body() dto: UpdateInternshipDto, @CurrentUser() user: AuthUser) {
    return this.internshipsService.update(id, dto, user.id);
  }

  @Delete(':id')
  @Roles(Role.COMPANY)
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.internshipsService.remove(id, user.id);
  }
}
