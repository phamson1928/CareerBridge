import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { LecturersController } from './lecturers.controller';
import { LecturersService } from './lecturers.service';

/** Lecturer profiles and their supervised placements. */
@Module({
  imports: [PrismaModule],
  controllers: [LecturersController],
  providers: [LecturersService],
  exports: [LecturersService],
})
export class LecturersModule {}
