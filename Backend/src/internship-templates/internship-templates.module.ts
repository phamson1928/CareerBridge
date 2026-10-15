import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { InternshipsModule } from '../internships/internships.module';
import { InternshipTemplatesController } from './internship-templates.controller';
import { InternshipTemplatesService } from './internship-templates.service';

/** Company reusable internship templates and controlled reposting workflow. */
@Module({
  imports: [PrismaModule, InternshipsModule],
  controllers: [InternshipTemplatesController],
  providers: [InternshipTemplatesService],
  exports: [InternshipTemplatesService],
})
export class InternshipTemplatesModule {}
