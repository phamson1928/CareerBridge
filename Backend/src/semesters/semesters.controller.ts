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
import { CreateSemesterDto } from './dto/create-semester.dto';
import { ListSemestersQueryDto } from './dto/list-semesters-query.dto';
import { UpdateSemesterStatusDto } from './dto/update-semester-status.dto';
import { UpdateSemesterDto } from './dto/update-semester.dto';
import { SemestersService } from './semesters.service';

@Controller('semesters')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SemestersController {
  constructor(private readonly semestersService: SemestersService) {}

  @Get()
  list(@Query() query: ListSemestersQueryDto) {
    return this.semestersService.list(query);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.semestersService.findById(id);
  }

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateSemesterDto, @CurrentUser() user: AuthUser) {
    return this.semestersService.create(dto, user.id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSemesterDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.semestersService.update(id, dto, user.id);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN)
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateSemesterStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.semestersService.updateStatus(id, dto.status, user.id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.semestersService.remove(id, user.id);
  }
}
