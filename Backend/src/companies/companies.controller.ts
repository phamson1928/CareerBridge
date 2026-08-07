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
import { CompaniesService } from './companies.service';
import { CreateCompanyProfileDto } from './dto/create-company-profile.dto';
import { ListCompanyProfilesQueryDto } from './dto/list-company-profiles-query.dto';
import { RejectCompanyDto } from './dto/reject-company.dto';
import { UpdateCompanyProfileDto } from './dto/update-company-profile.dto';

@Controller('companies')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get('me')
  @Roles(Role.COMPANY)
  findMyProfile(@CurrentUser() user: AuthUser) {
    return this.companiesService.findByUserId(user.id);
  }

  @Post('me')
  @Roles(Role.COMPANY)
  createMyProfile(
    @Body() dto: CreateCompanyProfileDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.companiesService.create(user.id, dto);
  }

  @Patch('me')
  @Roles(Role.COMPANY)
  updateMyProfile(
    @Body() dto: UpdateCompanyProfileDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.companiesService.updateByUserId(user.id, dto);
  }

  @Delete('me')
  @Roles(Role.COMPANY)
  @HttpCode(HttpStatus.OK)
  removeMyProfile(@CurrentUser() user: AuthUser) {
    return this.companiesService.removeByUserId(user.id);
  }

  @Get()
  @Roles(Role.ADMIN)
  findAll(@Query() query: ListCompanyProfilesQueryDto) {
    return this.companiesService.findAll(query);
  }

  @Post(':id/approve')
  @Roles(Role.ADMIN)
  approve(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.companiesService.approve(id, user.id);
  }

  @Post(':id/reject')
  @Roles(Role.ADMIN)
  reject(
    @Param('id') id: string,
    @Body() dto: RejectCompanyDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.companiesService.reject(id, user.id, dto.reason);
  }
}
