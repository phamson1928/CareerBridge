import { Module } from '@nestjs/common';
import { AiWorkerController } from './ai-worker.controller';
import { AiWorkerService } from './ai-worker.service';
import { AiWorkerAuthGuard } from './guards/ai-worker-auth.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { FilesModule } from '../files/files.module';

@Module({
  imports: [PrismaModule, FilesModule],
  controllers: [AiWorkerController],
  providers: [AiWorkerService, AiWorkerAuthGuard],
  exports: [AiWorkerService],
})
export class AiWorkerModule {}
