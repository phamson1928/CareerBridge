import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SupervisionsController } from './supervisions.controller';
import { SupervisionsService } from './supervisions.service';

/** Lecturer assignment for a specific internship placement. */
@Module({
  imports: [PrismaModule],
  controllers: [SupervisionsController],
  providers: [SupervisionsService],
  exports: [SupervisionsService],
})
export class SupervisionsModule {}
