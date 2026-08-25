import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PlacementsController } from './placements.controller';
import { PlacementsService } from './placements.service';
import { NotificationsModule } from '../notifications/notifications.module';

/** Confirmed internship engagements created from accepted applications. */
@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [PlacementsController],
  providers: [PlacementsService],
  exports: [PlacementsService],
})
export class PlacementsModule {}
