import { Module } from '@nestjs/common';
import { PlacementsModule } from '../placements/placements.module';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';

/** Application submission and state-transition workflow. */
@Module({
  imports: [PlacementsModule],
  controllers: [ApplicationsController],
  providers: [ApplicationsService],
  exports: [ApplicationsService],
})
export class ApplicationsModule {}
