import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { validateEnv } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { LogsModule } from './modules/logs/logs.module';
import { MailModule } from './modules/mail/mail.module';
import { HealthController } from './health.controller';
import { ActionsModule } from './modules/actions/actions.module';
import { NewsModule } from './modules/news/news.module';
import { ClubModule } from './modules/club/club.module';
import { CommissionsAdminModule } from './modules/commissions/commissions-admin.module';
import { StatsModule } from './modules/stats/stats.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { PostsModule } from './modules/posts/posts.module';
import { NewsFeedModule } from './modules/news-feed/news-feed.module';
import { MessagingModule } from './modules/messaging/messaging.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { VolunteeringModule } from './modules/volunteering/volunteering.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { SearchModule } from './modules/search/search.module';
import { MeetingsModule } from './modules/meetings/meetings.module';
import { MembershipModule } from './modules/membership/membership.module';
import { MembersModule } from './modules/members/members.module';
import { ModerationModule } from './modules/moderation/moderation.module';
import { ProfileModule } from './modules/profile/profile.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    ThrottlerModule.forRoot([
      { name: 'default', ttl: 60_000, limit: 120 },
      { name: 'auth', ttl: 60_000, limit: 10 },
    ]),
    PrismaModule,
    LogsModule,
    MailModule,
    RolesModule,
    UsersModule,
    AuthModule,
    ActionsModule,
    NewsModule,
    ClubModule,
    CommissionsAdminModule,
    StatsModule,
    DashboardModule,
    ProjectsModule,
    PostsModule,
    NewsFeedModule,
    MessagingModule,
    NotificationsModule,
    RealtimeModule,
    VolunteeringModule,
    CalendarModule,
    DocumentsModule,
    SearchModule,
    MeetingsModule,
    MembershipModule,
    MembersModule,
    ModerationModule,
    ProfileModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
