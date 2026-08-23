import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Role } from '../generated/prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AdminDashboardQueryDto } from './dto/admin-dashboard-query.dto';
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
}
