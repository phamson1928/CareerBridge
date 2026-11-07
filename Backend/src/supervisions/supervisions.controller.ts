import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { AuthUser } from '../auth/types/auth-user.type';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RequirePermission } from '../common/decorators/admin-permissions.decorator';
import { AdminPermission } from '../common/constants/admin-permissions.constants';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../generated/prisma/client';
import { CreateSupervisionDto } from './dto/create-supervision.dto';
import { ListLecturerOptionsQueryDto } from './dto/list-lecturer-options-query.dto';
import { ListSupervisionsQueryDto } from './dto/list-supervisions-query.dto';
import { UpdateSupervisionDto } from './dto/update-supervision.dto';
import { UpdateSupervisionStatusDto } from './dto/update-supervision-status.dto';
import { SupervisionsService } from './supervisions.service';

@Controller('supervisions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SupervisionsController {
  constructor(private readonly supervisionsService: SupervisionsService) {}

  @Get()
  @Roles(Role.ADMIN)
  @RequirePermission(AdminPermission.PLACEMENTS)
  list(@Query() query: ListSupervisionsQueryDto) {
    return this.supervisionsService.list(query);
  }

  @Get('me')
  @Roles(Role.LECTURER)
  listMine(@CurrentUser() user: AuthUser) {
    return this.supervisionsService.listMine(user);
  }

  @Get('lecturer-options')
  @Roles(Role.ADMIN)
  @RequirePermission(AdminPermission.PLACEMENTS)
  lecturerOptions(@Query() query: ListLecturerOptionsQueryDto) {
    return this.supervisionsService.lecturerOptions(query);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.LECTURER)
  findById(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.supervisionsService.findById(id, user);
  }

  @Post()
  @Roles(Role.ADMIN)
  @RequirePermission(AdminPermission.PLACEMENTS)
  assign(@Body() dto: CreateSupervisionDto, @CurrentUser() user: AuthUser) {
    return this.supervisionsService.assign(dto, user.id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @RequirePermission(AdminPermission.PLACEMENTS)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSupervisionDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.supervisionsService.update(id, dto, user.id);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN)
  @RequirePermission(AdminPermission.PLACEMENTS)
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateSupervisionStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.supervisionsService.updateStatus(id, user.id);
  }
}
