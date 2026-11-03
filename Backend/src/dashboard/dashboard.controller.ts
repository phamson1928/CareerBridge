import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { Role } from '../generated/prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user.type';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AdminDashboardQueryDto } from './dto/admin-dashboard-query.dto';
import { CompanyDashboardQueryDto } from './dto/company-dashboard-query.dto';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('admin')
  @Roles(Role.ADMIN)
  getAdminDashboard(@Query() query: AdminDashboardQueryDto) {
    return this.dashboardService.getAdminDashboard(query);
  }

  @Get('company')
  @Roles(Role.COMPANY)
  getCompanyDashboard(
    @CurrentUser() user: AuthUser,
    @Query() query: CompanyDashboardQueryDto,
  ) {
    return this.dashboardService.getCompanyDashboard(user.id, query);
  }

  @Get('company/internships/:id')
  @Roles(Role.COMPANY)
  getCompanyInternshipStats(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    return this.dashboardService.getCompanyInternshipStats(user.id, id);
  }
}
