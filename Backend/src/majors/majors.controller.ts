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
import { CreateMajorDto } from './dto/create-major.dto';
import { ListMajorOptionsQueryDto } from './dto/list-major-options-query.dto';
import { ListMajorsQueryDto } from './dto/list-majors-query.dto';
import { UpdateMajorActiveDto } from './dto/update-major-active.dto';
import { UpdateMajorDto } from './dto/update-major.dto';
import { MajorsService } from './majors.service';

@Controller('majors')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MajorsController {
  constructor(private readonly majorsService: MajorsService) {}

  @Get('options')
  listOptions(@Query() query: ListMajorOptionsQueryDto) {
    return this.majorsService.listOptions(query);
  }

  @Get()
  list(@Query() query: ListMajorsQueryDto) {
    return this.majorsService.list(query);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.majorsService.findById(id);
  }

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateMajorDto, @CurrentUser() user: AuthUser) {
    return this.majorsService.create(dto, user.id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMajorDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.majorsService.update(id, dto, user.id);
  }

  @Patch(':id/active')
  @Roles(Role.ADMIN)
  updateActive(
    @Param('id') id: string,
    @Body() dto: UpdateMajorActiveDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.majorsService.updateActive(id, dto.isActive, user.id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.majorsService.remove(id, user.id);
  }
}
