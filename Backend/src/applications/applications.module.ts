import { Module } from '@nestjs/common';
import { PlacementsModule } from '../placements/placements.module';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';
import { NotificationsModule } from '../notifications/notifications.module';

/** Application submission and state-transition workflow. */
@Module({
  imports: [PlacementsModule, NotificationsModule],
  controllers: [ApplicationsController],
  providers: [ApplicationsService],
  exports: [ApplicationsService],
})
export class ApplicationsModule {}
