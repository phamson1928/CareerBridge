import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { InternshipMatchController } from './internship-match.controller';
import { InternshipSkillsController } from './internship-skills.controller';
import { MatchingService } from './matching.service';
import { SkillsController } from './skills.controller';
import { SkillsService } from './skills.service';
import { StudentSkillsController } from './student-skills.controller';

/** Canonical skills catalogue and matching rules. */
@Module({
  imports: [PrismaModule],
  controllers: [
    SkillsController,
    StudentSkillsController,
    InternshipSkillsController,
    InternshipMatchController,
  ],
  providers: [SkillsService, MatchingService],
  exports: [SkillsService, MatchingService],
})
export class SkillsModule {}
