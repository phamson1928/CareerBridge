import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user.type';
import { Role } from '../generated/prisma/client';
import { CreateApplicationDto } from './dto/create-application.dto';
import { ListApplicationsQueryDto } from './dto/list-applications-query.dto';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';
import { ScheduleInterviewDto } from './dto/schedule-interview.dto';
import { SendOfferDto } from './dto/send-offer.dto';
import { RejectApplicationDto } from './dto/reject-application.dto';
import { EmailPreviewQueryDto } from './dto/email-preview-query.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post()
  @Roles(Role.STUDENT)
  create(@Body() dto: CreateApplicationDto, @CurrentUser() user: AuthUser) {
    return this.applicationsService.create(dto, user);
  }

  @Get()
  @Roles(Role.ADMIN)
  list(
    @Query() query: ListApplicationsQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.applicationsService.list(query, user);
  }

  @Get('me')
  @Roles(Role.STUDENT, Role.COMPANY, Role.ADMIN)
  findMine(
    @Query() query: ListApplicationsQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.applicationsService.findMine(query, user);
  }

  @Get(':id/history')
  @Roles(Role.STUDENT, Role.COMPANY, Role.ADMIN)
  history(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.applicationsService.getHistory(id, user);
  }

  @Get(':id/email-preview')
  @Roles(Role.COMPANY, Role.ADMIN)
  previewEmail(
    @Param('id') id: string,
    @Query() query: EmailPreviewQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.applicationsService.previewEmail(id, query, user);
  }

  @Get(':id')
  @Roles(Role.STUDENT, Role.COMPANY, Role.ADMIN)
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.applicationsService.findOne(id, user);
  }

  @Patch(':id/status')
  @Roles(Role.STUDENT, Role.COMPANY, Role.ADMIN)
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateApplicationStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.applicationsService.updateStatus(id, dto, user);
  }

  @Post(':id/interview')
  @Roles(Role.COMPANY, Role.ADMIN)
  scheduleInterview(
    @Param('id') id: string,
    @Body() dto: ScheduleInterviewDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.applicationsService.scheduleInterview(id, dto, user);
  }

  @Post(':id/offer')
  @Roles(Role.COMPANY, Role.ADMIN)
  sendOffer(
    @Param('id') id: string,
    @Body() dto: SendOfferDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.applicationsService.sendOffer(id, dto, user);
  }

  @Post(':id/reject')
  @Roles(Role.COMPANY, Role.ADMIN)
  rejectApplication(
    @Param('id') id: string,
    @Body() dto: RejectApplicationDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.applicationsService.rejectApplication(id, dto, user);
  }

  @Post(':id/offer/accept')
  @Roles(Role.STUDENT)
  acceptOffer(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.applicationsService.acceptOffer(id, user);
  }

  @Post(':id/offer/decline')
  @Roles(Role.STUDENT)
  declineOffer(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.applicationsService.declineOffer(id, user);
  }

  @Post(':id/emails/:logId/resend')
  @Roles(Role.COMPANY, Role.ADMIN)
  resendEmail(
    @Param('id') id: string,
    @Param('logId') logId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.applicationsService.resendEmail(id, logId, user);
  }

  @Delete(':id')
  @Roles(Role.STUDENT, Role.COMPANY, Role.ADMIN)
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.applicationsService.remove(id, user);
  }
}
