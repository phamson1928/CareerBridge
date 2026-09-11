import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { SkillsModule } from '../skills/skills.module';
import { AiRecommendationService } from './ai-recommendation.service';
import { ProfileReadinessService } from './profile-readiness.service';
import { RecommendationCacheService } from './recommendation-cache.service';
import { RecommendationCandidatesService } from './recommendation-candidates.service';
import { RecommendationScorerService } from './recommendation-scorer.service';
import { RecommendationsController } from './recommendations.controller';
import { RecommendationsService } from './recommendations.service';

@Module({
  imports: [ConfigModule, PrismaModule, SkillsModule],
  controllers: [RecommendationsController],
  providers: [
    AiRecommendationService,
    ProfileReadinessService,
    RecommendationCacheService,
    RecommendationCandidatesService,
    RecommendationScorerService,
    RecommendationsService,
  ],
})
export class RecommendationsModule {}
