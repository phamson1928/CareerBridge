import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { validateEnvironment } from './config/env.validation';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { StudentsModule } from './students/students.module';
import { LecturersModule } from './lecturers/lecturers.module';
import { CompaniesModule } from './companies/companies.module';
import { InternshipsModule } from './internships/internships.module';
import { ApplicationsModule } from './applications/applications.module';
import { PlacementsModule } from './placements/placements.module';
import { SemestersModule } from './semesters/semesters.module';
import { SkillsModule } from './skills/skills.module';
import { SupervisionsModule } from './supervisions/supervisions.module';
import { ReportsModule } from './reports/reports.module';
import { EvaluationsModule } from './evaluations/evaluations.module';
import { FilesModule } from './files/files.module';
import { NotificationsModule } from './notifications/notifications.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ChatModule } from './chat/chat.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { RealtimeModule } from './realtime/realtime.module';
import { MailerModule } from './mailer/mailer.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnvironment,
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: 60000,
          limit: config.get<number>('THROTTLE_LIMIT', 60),
        },
      ],
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    StudentsModule,
    LecturersModule,
    CompaniesModule,
    InternshipsModule,
    ApplicationsModule,
    PlacementsModule,
    SemestersModule,
    SkillsModule,
    SupervisionsModule,
    ReportsModule,
    EvaluationsModule,
    FilesModule,
    NotificationsModule,
    DashboardModule,
    ChatModule,
    AuditLogsModule,
    RealtimeModule,
    MailerModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
