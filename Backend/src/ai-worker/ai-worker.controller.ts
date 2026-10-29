import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AiWorkerService } from './ai-worker.service';
import { AiWorkerAuthGuard } from './guards/ai-worker-auth.guard';
import { CurrentAiWorker } from './decorators/current-ai-worker.decorator';
import type { AuthenticatedAiWorker } from './guards/ai-worker-auth.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user.type';
import { Role } from '../generated/prisma/client';
import { CreateAiWorkerDto } from './dto/create-ai-worker.dto';
import { CompleteAiScanJobDto } from './dto/complete-ai-scan-job.dto';
import { FailAiScanJobDto } from './dto/fail-ai-scan-job.dto';
import { AiWorkerHeartbeatDto } from './dto/ai-worker-heartbeat.dto';
import { UpdateAiScanSettingsDto } from './dto/update-ai-scan-settings.dto';

@Controller('ai-worker')
export class AiWorkerController {
  constructor(private readonly aiWorkerService: AiWorkerService) {}

  // ==========================================
  // WORKER CLIENT ENDPOINTS
  // ==========================================

  @Get('jobs/poll')
  @UseGuards(AiWorkerAuthGuard)
  pollJob(@CurrentAiWorker() worker: AuthenticatedAiWorker) {
    return this.aiWorkerService.pollJob(worker);
  }

  @Post('jobs/:id/complete')
  @UseGuards(AiWorkerAuthGuard)
  completeJob(
    @Param('id') id: string,
    @Body() dto: CompleteAiScanJobDto,
    @CurrentAiWorker() worker: AuthenticatedAiWorker,
  ) {
    return this.aiWorkerService.completeJob(worker, id, dto);
  }

  @Post('jobs/:id/fail')
  @UseGuards(AiWorkerAuthGuard)
  failJob(
    @Param('id') id: string,
    @Body() dto: FailAiScanJobDto,
    @CurrentAiWorker() worker: AuthenticatedAiWorker,
  ) {
    return this.aiWorkerService.failJob(worker, id, dto);
  }

  @Post('heartbeat')
  @UseGuards(AiWorkerAuthGuard)
  heartbeat(
    @Body() dto: AiWorkerHeartbeatDto,
    @CurrentAiWorker() worker: AuthenticatedAiWorker,
  ) {
    return this.aiWorkerService.heartbeat(worker, dto);
  }

  // ==========================================
  // COMPANY PORTAL MANAGEMENT ENDPOINTS
  // ==========================================

  @Get('workers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.COMPANY)
  listWorkers(@CurrentUser() user: AuthUser) {
    return this.aiWorkerService.listCompanyWorkers(user.id);
  }

  @Post('workers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.COMPANY)
  createWorker(@Body() dto: CreateAiWorkerDto, @CurrentUser() user: AuthUser) {
    return this.aiWorkerService.createCompanyWorker(user.id, dto);
  }

  @Delete('workers/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.COMPANY)
  deleteWorker(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.aiWorkerService.deleteCompanyWorker(user.id, id);
  }

  @Patch('settings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.COMPANY)
  updateSettings(
    @Body() dto: UpdateAiScanSettingsDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.aiWorkerService.updateScanSettings(user.id, dto);
  }

  @Post('applications/:id/rescan')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.COMPANY)
  rescanApplication(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.aiWorkerService.rescanApplication(user.id, id);
  }
}
