import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';

/** Student profiles, portfolios, CVs, and declared skills. */
@Module({
  imports: [PrismaModule],
  controllers: [StudentsController],
  providers: [StudentsService],
  exports: [StudentsService],
})
export class StudentsModule {}
