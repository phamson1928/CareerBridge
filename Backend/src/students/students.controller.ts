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
import { CreateStudentProfileDto } from './dto/create-student-profile.dto';
import { UpdateStudentProfileDto } from './dto/update-student-profile.dto';
import { StudentsService } from './students.service';

@Controller('students')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.STUDENT)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get('me')
  findMyProfile(@CurrentUser() user: AuthUser) {
    return this.studentsService.findByUserId(user.id);
  }

  @Post('me')
  createMyProfile(
    @Body() dto: CreateStudentProfileDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.studentsService.create(user.id, dto);
  }

  @Patch('me')
  updateMyProfile(
    @Body() dto: UpdateStudentProfileDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.studentsService.updateByUserId(user.id, dto);
  }

  @Delete('me')
  @HttpCode(HttpStatus.OK)
  removeMyProfile(@CurrentUser() user: AuthUser) {
    return this.studentsService.removeByUserId(user.id);
  }
}
