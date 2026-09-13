import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { SemestersModule } from '../semesters/semesters.module';

/** Weekly reports and lecturer review workflow. */
@Module({
  imports: [PrismaModule, NotificationsModule, SemestersModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
