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
import { CreateFacultyDto } from './dto/create-faculty.dto';
import { ListFacultiesQueryDto } from './dto/list-faculties-query.dto';
import { ListFacultyOptionsQueryDto } from './dto/list-faculty-options-query.dto';
import { UpdateFacultyActiveDto } from './dto/update-faculty-active.dto';
import { UpdateFacultyDto } from './dto/update-faculty.dto';
import { FacultiesService } from './faculties.service';

@Controller('faculties')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FacultiesController {
  constructor(private readonly facultiesService: FacultiesService) {}

  @Get('options')
  listOptions(@Query() query: ListFacultyOptionsQueryDto) {
    return this.facultiesService.listOptions(query);
  }

  @Get()
  list(@Query() query: ListFacultiesQueryDto) {
    return this.facultiesService.list(query);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.facultiesService.findById(id);
  }

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateFacultyDto, @CurrentUser() user: AuthUser) {
    return this.facultiesService.create(dto, user.id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateFacultyDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.facultiesService.update(id, dto, user.id);
  }

  @Patch(':id/active')
  @Roles(Role.ADMIN)
  updateActive(
    @Param('id') id: string,
    @Body() dto: UpdateFacultyActiveDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.facultiesService.updateActive(id, dto.isActive, user.id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.facultiesService.remove(id, user.id);
  }
}
