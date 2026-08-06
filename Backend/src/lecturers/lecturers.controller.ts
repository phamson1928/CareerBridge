import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { AuthUser } from '../auth/types/auth-user.type';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../generated/prisma/client';
import { CreateLecturerProfileDto } from './dto/create-lecturer-profile.dto';
import { UpdateLecturerProfileDto } from './dto/update-lecturer-profile.dto';
import { LecturersService } from './lecturers.service';

@Controller('lecturers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.LECTURER)
export class LecturersController {
  constructor(private readonly lecturersService: LecturersService) {}

  @Get('me')
  findMyProfile(@CurrentUser() user: AuthUser) {
    return this.lecturersService.findByUserId(user.id);
  }

  @Post('me')
  createMyProfile(
    @Body() dto: CreateLecturerProfileDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.lecturersService.create(user.id, dto);
  }

  @Patch('me')
  updateMyProfile(
    @Body() dto: UpdateLecturerProfileDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.lecturersService.updateByUserId(user.id, dto);
  }

  @Delete('me')
  @HttpCode(HttpStatus.OK)
  removeMyProfile(@CurrentUser() user: AuthUser) {
    return this.lecturersService.removeByUserId(user.id);
  }
}
