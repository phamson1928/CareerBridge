import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SemestersModule } from '../semesters/semesters.module';
import { InternshipsController } from './internships.controller';
import { InternshipsService } from './internships.service';

/** Company internship posts scoped to a semester. */
@Module({
  imports: [PrismaModule, SemestersModule, NotificationsModule],
  controllers: [InternshipsController],
  providers: [InternshipsService],
  exports: [InternshipsService],
})
export class InternshipsModule {}
