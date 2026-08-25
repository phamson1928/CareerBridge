import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SupervisionsController } from './supervisions.controller';
import { SupervisionsService } from './supervisions.service';
import { NotificationsModule } from '../notifications/notifications.module';

/** Lecturer assignment for a specific internship placement. */
@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [SupervisionsController],
  providers: [SupervisionsService],
  exports: [SupervisionsService],
})
export class SupervisionsModule {}
