import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';
import { NotificationsModule } from '../notifications/notifications.module';

/** Company profile registration and administrative verification. */
@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [CompaniesController],
  providers: [CompaniesService],
})
export class CompaniesModule {}
