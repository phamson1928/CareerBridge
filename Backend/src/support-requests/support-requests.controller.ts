import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '../generated/prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import type { AuthUser } from '../auth/types/auth-user.type';
import { CreateSupportRequestDto } from './dto/create-support-request.dto';
import { ListSupportRequestsQueryDto } from './dto/list-support-requests-query.dto';
import { ReplySupportRequestDto } from './dto/reply-support-request.dto';
import { SupportRequestsService } from './support-requests.service';

@Controller('support-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SupportRequestsController {
  constructor(private readonly supportRequests: SupportRequestsService) {}

  @Post()
  @Roles(Role.STUDENT)
  create(@Body() dto: CreateSupportRequestDto, @CurrentUser() user: AuthUser) {
    return this.supportRequests.create(dto, user);
  }

  @Get('me')
  @Roles(Role.STUDENT)
  mine(
    @Query() query: ListSupportRequestsQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.supportRequests.listStudent(query, user);
  }

  @Get()
  @Roles(Role.ADMIN)
  listAll(@Query() query: ListSupportRequestsQueryDto) {
    return this.supportRequests.listAdmin(query);
  }

  @Get(':id')
  @Roles(Role.STUDENT, Role.ADMIN)
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.supportRequests.findOne(id, user);
  }

  @Post(':id/reply')
  @Roles(Role.ADMIN)
  reply(
    @Param('id') id: string,
    @Body() dto: ReplySupportRequestDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.supportRequests.reply(id, dto, user);
  }
}
