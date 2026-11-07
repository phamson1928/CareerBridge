import {
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { Role } from '../generated/prisma/client';
import type { AuthUser } from '../auth/types/auth-user.type';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RequirePermission } from '../common/decorators/admin-permissions.decorator';
import { AdminPermission } from '../common/constants/admin-permissions.constants';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ListPlacementsQueryDto } from './dto/list-placements-query.dto';
import { UpdatePlacementStatusDto } from './dto/update-placement-status.dto';
import { UpdatePlacementDto } from './dto/update-placement.dto';
import { PlacementsService } from './placements.service';

@Controller('placements')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PlacementsController {
  constructor(private readonly placementsService: PlacementsService) {}

  @Get()
  @Roles(Role.ADMIN)
  @RequirePermission(AdminPermission.PLACEMENTS)
  list(@Query() query: ListPlacementsQueryDto) {
    return this.placementsService.list(query);
  }

  @Get('me')
  @Roles(Role.STUDENT, Role.COMPANY, Role.LECTURER, Role.ADMIN)
  listMine(@CurrentUser() user: AuthUser) {
    return this.placementsService.listMine(user);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.STUDENT, Role.COMPANY, Role.LECTURER)
  findById(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.placementsService.findById(id, user);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @RequirePermission(AdminPermission.PLACEMENTS)
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePlacementDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.placementsService.update(id, dto, user.id);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN)
  @RequirePermission(AdminPermission.PLACEMENTS)
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdatePlacementStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.placementsService.updateStatus(id, dto, user.id);
  }
}
