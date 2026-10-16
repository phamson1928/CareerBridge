import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { ReportReminderService } from './report-reminder.service';

/** In-app notification delivery and read state. */
@Module({
  imports: [PrismaModule, RealtimeModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, ReportReminderService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
