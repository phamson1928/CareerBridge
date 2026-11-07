import { Module } from '@nestjs/common';
import { FacultiesModule } from '../faculties/faculties.module';
import { PrismaModule } from '../prisma/prisma.module';
import { LecturersController } from './lecturers.controller';
import { LecturersService } from './lecturers.service';

/** Lecturer profiles and their supervised placements. */
@Module({
  imports: [PrismaModule, FacultiesModule],
  controllers: [LecturersController],
  providers: [LecturersService],
  exports: [LecturersService],
})
export class LecturersModule {}
