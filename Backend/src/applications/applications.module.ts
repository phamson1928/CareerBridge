import { Module } from '@nestjs/common';
import { PlacementsModule } from '../placements/placements.module';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { SkillsModule } from '../skills/skills.module';

/** Application submission and state-transition workflow. */
@Module({
  imports: [PlacementsModule, NotificationsModule, SkillsModule],
  controllers: [ApplicationsController],
  providers: [ApplicationsService],
  exports: [ApplicationsService],
})
export class ApplicationsModule {}
