import { z } from 'zod';

export const globalStatsSchema = z.object({
  members: z.object({ total: z.number(), active: z.number(), inactive: z.number() }),
  commissions: z.object({ total: z.number(), withLead: z.number() }),
  actions: z.object({ total: z.number(), published: z.number() }),
  news: z.object({ total: z.number(), published: z.number() }),
  meetings: z.object({ total: z.number(), upcoming: z.number() }),
  projects: z.object({
    total: z.number(),
    inProgress: z.number(),
    completed: z.number(),
    averageProgress: z.number(),
  }),
  logs: z.object({ last24h: z.number(), last7d: z.number() }),
  social: z
    .object({
      posts: z.number(),
      announcements: z.number(),
      conversations: z.number(),
      messages: z.number(),
    })
    .optional(),
  volunteering: z
    .object({
      total: z.number(),
      pending: z.number(),
      validated: z.number(),
      totalHours: z.number(),
    })
    .optional(),
  calendar: z
    .object({
      events: z.number(),
      upcoming: z.number(),
    })
    .optional(),
  documents: z
    .object({
      total: z.number(),
      private: z.number(),
      public: z.number(),
      downloads: z.number(),
    })
    .optional(),
});

export type GlobalStats = z.infer<typeof globalStatsSchema>;

export const commissionLeadStatsSchema = z.object({
  commissionId: z.string().uuid(),
  commissionName: z.string(),
  memberCount: z.number(),
  projectsCount: z.number(),
  activeProjects: z.number(),
  averageProgress: z.number(),
});

export type CommissionLeadStats = z.infer<typeof commissionLeadStatsSchema>;

export const memberDashboardStatsSchema = z.object({
  commissions: z.number(),
  upcomingMeetings: z.number(),
  assignedProjects: z.number(),
  pendingTasks: z.number(),
  unreadNotifications: z.number().optional(),
  unreadMessages: z.number().optional(),
  volunteeringHours: z.number().optional(),
  upcomingCalendarEvents: z.number().optional(),
});

export type MemberDashboardStats = z.infer<typeof memberDashboardStatsSchema>;

export const dashboardDataSchema = z.object({
  role: z.string(),
  global: globalStatsSchema.optional(),
  commissionLead: commissionLeadStatsSchema.optional(),
  member: memberDashboardStatsSchema.optional(),
  recentLogs: z
    .array(
      z.object({
        id: z.string().uuid(),
        action: z.string(),
        createdAt: z.string().datetime(),
        userName: z.string().nullable(),
      }),
    )
    .optional(),
  recentProjects: z.array(
    z.object({
      id: z.string().uuid(),
      title: z.string(),
      slug: z.string(),
      status: z.string(),
      progressPercent: z.number(),
      commissionName: z.string(),
    }),
  ).optional(),
  recentPosts: z
    .array(
      z.object({
        id: z.string().uuid(),
        kind: z.string(),
        content: z.string(),
        authorName: z.string(),
        createdAt: z.string().datetime(),
      }),
    )
    .optional(),
  upcomingEvents: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        startAt: z.string().datetime(),
        type: z.string(),
        source: z.enum(['calendar', 'meeting']),
      }),
    )
    .optional(),
});

export type DashboardData = z.infer<typeof dashboardDataSchema>;
