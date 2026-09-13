import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SemestersController } from './semesters.controller';
import { SemesterLifecycleService } from './semester-lifecycle.service';
import { SemestersService } from './semesters.service';

/** Internship-term configuration and lifecycle. */
@Module({
  imports: [PrismaModule],
  controllers: [SemestersController],
  providers: [SemestersService, SemesterLifecycleService],
  exports: [SemestersService, SemesterLifecycleService],
})
export class SemestersModule {}
