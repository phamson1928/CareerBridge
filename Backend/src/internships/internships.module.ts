import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { InternshipsController } from './internships.controller';
import { InternshipsService } from './internships.service';

/** Company internship posts scoped to a semester. */
@Module({
  imports: [PrismaModule],
  controllers: [InternshipsController],
  providers: [InternshipsService],
  exports: [InternshipsService],
})
export class InternshipsModule {}
