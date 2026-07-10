import { Injectable } from '@nestjs/common';
import { ProjectStatus, ProjectTaskStatus, PublishStatus, VolunteeringStatus } from '@prisma/client';
import {
  AuthUser,
  DashboardData,
  ROLE_HIERARCHY,
  RoleCode,
} from '@rotary/shared-types';
import { PrismaService } from '../../prisma/prisma.service';
import { StatsService } from '../stats/stats.service';
import { LogsService } from '../logs/logs.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly statsService: StatsService,
    private readonly logsService: LogsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getDashboard(user: AuthUser): Promise<DashboardData> {
    const primaryRole = this.getPrimaryRole(user.roles);
    const result: DashboardData = { role: primaryRole };

    if (user.roles.includes(RoleCode.ADMIN)) {
      result.global = await this.statsService.getGlobalStats();
      const recentLogs = await this.logsService.findRecent(8);
      result.recentLogs = recentLogs.map((log) => ({
        id: log.id,
        action: log.action,
        createdAt: log.createdAt,
        userName: log.user
          ? `${log.user.firstName} ${log.user.lastName}`
          : null,
      }));

      const recentProjects = await this.prisma.project.findMany({
        include: { commission: true },
        orderBy: { updatedAt: 'desc' },
        take: 5,
      });
      result.recentProjects = recentProjects.map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        status: p.status,
        progressPercent: p.progressPercent,
        commissionName: p.commission.name,
      }));
    }

    const recentPosts = await this.prisma.post.findMany({
      include: { author: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    result.recentPosts = recentPosts.map((p) => ({
      id: p.id,
      kind: p.kind,
      content: p.content.slice(0, 120),
      authorName: `${p.author.firstName} ${p.author.lastName}`,
      createdAt: p.createdAt.toISOString(),
    }));

    if (
      user.roles.includes(RoleCode.COMMISSION_LEAD) ||
      user.roles.includes(RoleCode.ADMIN)
    ) {
      const ledCommission = await this.prisma.commission.findFirst({
        where: { leadUserId: user.id },
        include: { _count: { select: { members: true, projects: true } } },
      });

      if (ledCommission) {
        const [activeProjects, progressAgg] = await Promise.all([
          this.prisma.project.count({
            where: {
              commissionId: ledCommission.id,
              status: ProjectStatus.IN_PROGRESS,
            },
          }),
          this.prisma.project.aggregate({
            where: { commissionId: ledCommission.id },
            _avg: { progressPercent: true },
          }),
        ]);

        result.commissionLead = {
          commissionId: ledCommission.id,
          commissionName: ledCommission.name,
          memberCount: ledCommission._count.members,
          projectsCount: ledCommission._count.projects,
          activeProjects,
          averageProgress: Math.round(progressAgg._avg.progressPercent ?? 0),
        };
      }
    }

    const [commissions, upcomingMeetings, assignedProjects, pendingTasks, counts, volunteeringHours, upcomingCalendarEvents] =
      await Promise.all([
        this.prisma.commissionMember.count({ where: { userId: user.id } }),
        this.prisma.meeting.count({
          where: { status: PublishStatus.PUBLISHED, date: { gte: new Date() } },
        }),
        this.prisma.projectMember.count({ where: { userId: user.id } }),
        this.prisma.projectTask.count({
          where: {
            assigneeId: user.id,
            status: { in: [ProjectTaskStatus.TODO, ProjectTaskStatus.IN_PROGRESS] },
          },
        }),
        this.notificationsService.getCounts(user.id),
        this.prisma.volunteeringDeclaration.aggregate({
          where: { userId: user.id, status: VolunteeringStatus.VALIDATED },
          _sum: { hours: true },
        }),
        this.prisma.calendarEvent.count({
          where: {
            startAt: { gte: new Date() },
          },
        }),
      ]);

    if (!user.roles.includes(RoleCode.ADMIN)) {
      result.member = {
        commissions,
        upcomingMeetings,
        assignedProjects,
        pendingTasks,
        unreadNotifications: counts.unread,
        unreadMessages: counts.unreadMessages,
        volunteeringHours: Number(volunteeringHours._sum.hours ?? 0),
        upcomingCalendarEvents,
      };
    } else {
      result.member = {
        commissions,
        upcomingMeetings,
        assignedProjects,
        pendingTasks,
        unreadNotifications: counts.unread,
        unreadMessages: counts.unreadMessages,
        volunteeringHours: Number(volunteeringHours._sum.hours ?? 0),
        upcomingCalendarEvents,
      };
    }

    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const [calendarUpcoming, meetingUpcoming] = await Promise.all([
      this.prisma.calendarEvent.findMany({
        where: {
          startAt: { gte: now, lte: in30Days },
        },
        orderBy: { startAt: 'asc' },
        take: 5,
      }),
      this.prisma.meeting.findMany({
        where: {
          status: PublishStatus.PUBLISHED,
          calendarEventId: null,
          date: { gte: now, lte: in30Days },
        },
        orderBy: { date: 'asc' },
        take: 5,
      }),
    ]);

    result.upcomingEvents = [
      ...calendarUpcoming.map((e) => ({
        id: e.id,
        title: e.title,
        startAt: e.startAt.toISOString(),
        type: e.type,
        source: 'calendar' as const,
      })),
      ...meetingUpcoming.map((m) => ({
        id: `meeting-${m.id}`,
        title: m.title,
        startAt: m.date.toISOString(),
        type: 'MEETING',
        source: 'meeting' as const,
      })),
    ]
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
      .slice(0, 5);

    return result;
  }

  private getPrimaryRole(roles: RoleCode[]): RoleCode {
    return roles.reduce((best, role) =>
      ROLE_HIERARCHY[role] > ROLE_HIERARCHY[best] ? role : best,
    roles[0] ?? RoleCode.MEMBER);
  }
}
