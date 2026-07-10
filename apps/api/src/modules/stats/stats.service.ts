import { Injectable } from '@nestjs/common';
import { ProjectStatus, PublishStatus, VolunteeringStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { GlobalStats } from '@rotary/shared-types';

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getGlobalStats(): Promise<GlobalStats> {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalMembers,
      activeMembers,
      totalCommissions,
      commissionsWithLead,
      totalActions,
      publishedActions,
      totalNews,
      publishedNews,
      totalMeetings,
      upcomingMeetings,
      totalProjects,
      inProgressProjects,
      completedProjects,
      progressAgg,
      logs24h,
      logs7d,
      totalPosts,
      totalAnnouncements,
      totalConversations,
      totalMessages,
      totalVolunteering,
      pendingVolunteering,
      validatedVolunteering,
      hoursAgg,
      totalCalendarEvents,
      upcomingCalendarEvents,
      totalDocuments,
      privateDocuments,
      publicDocuments,
      downloadAgg,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.commission.count(),
      this.prisma.commission.count({ where: { leadUserId: { not: null } } }),
      this.prisma.action.count(),
      this.prisma.action.count({ where: { status: PublishStatus.PUBLISHED } }),
      this.prisma.newsArticle.count(),
      this.prisma.newsArticle.count({ where: { status: PublishStatus.PUBLISHED } }),
      this.prisma.meeting.count(),
      this.prisma.meeting.count({
        where: { status: PublishStatus.PUBLISHED, date: { gte: now } },
      }),
      this.prisma.project.count(),
      this.prisma.project.count({ where: { status: ProjectStatus.IN_PROGRESS } }),
      this.prisma.project.count({ where: { status: ProjectStatus.COMPLETED } }),
      this.prisma.project.aggregate({ _avg: { progressPercent: true } }),
      this.prisma.activityLog.count({ where: { createdAt: { gte: dayAgo } } }),
      this.prisma.activityLog.count({ where: { createdAt: { gte: weekAgo } } }),
      this.prisma.post.count(),
      this.prisma.post.count({
        where: { kind: { in: ['ANNOUNCEMENT', 'EVENT', 'COMMUNIQUE'] } },
      }),
      this.prisma.conversation.count(),
      this.prisma.message.count(),
      this.prisma.volunteeringDeclaration.count(),
      this.prisma.volunteeringDeclaration.count({
        where: { status: VolunteeringStatus.PENDING },
      }),
      this.prisma.volunteeringDeclaration.count({
        where: { status: VolunteeringStatus.VALIDATED },
      }),
      this.prisma.volunteeringDeclaration.aggregate({
        where: { status: VolunteeringStatus.VALIDATED },
        _sum: { hours: true },
      }),
      this.prisma.calendarEvent.count(),
      this.prisma.calendarEvent.count({ where: { startAt: { gte: now } } }),
      this.prisma.document.count(),
      this.prisma.document.count({ where: { visibility: 'PRIVATE' } }),
      this.prisma.document.count({ where: { visibility: 'PUBLIC' } }),
      this.prisma.document.aggregate({ _sum: { downloadCount: true } }),
    ]);

    return {
      members: {
        total: totalMembers,
        active: activeMembers,
        inactive: totalMembers - activeMembers,
      },
      commissions: { total: totalCommissions, withLead: commissionsWithLead },
      actions: { total: totalActions, published: publishedActions },
      news: { total: totalNews, published: publishedNews },
      meetings: { total: totalMeetings, upcoming: upcomingMeetings },
      projects: {
        total: totalProjects,
        inProgress: inProgressProjects,
        completed: completedProjects,
        averageProgress: Math.round(progressAgg._avg.progressPercent ?? 0),
      },
      logs: { last24h: logs24h, last7d: logs7d },
      social: {
        posts: totalPosts,
        announcements: totalAnnouncements,
        conversations: totalConversations,
        messages: totalMessages,
      },
      volunteering: {
        total: totalVolunteering,
        pending: pendingVolunteering,
        validated: validatedVolunteering,
        totalHours: Number(hoursAgg._sum.hours ?? 0),
      },
      calendar: {
        events: totalCalendarEvents,
        upcoming: upcomingCalendarEvents,
      },
      documents: {
        total: totalDocuments,
        private: privateDocuments,
        public: publicDocuments,
        downloads: downloadAgg._sum.downloadCount ?? 0,
      },
    };
  }
}
