import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MailerService } from './mailer.service';

@Module({
  imports: [PrismaModule],
  providers: [MailerService],
  exports: [MailerService],
})
export class MailerModule {}
