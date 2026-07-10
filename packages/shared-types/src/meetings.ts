import { z } from 'zod';

export const meetingSummarySchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  date: z.string().datetime(),
  startTime: z.string(),
  location: z.string(),
  speakers: z.array(z.string()).default([]),
});

export type MeetingSummary = z.infer<typeof meetingSummarySchema>;

export const meetingDetailSchema = meetingSummarySchema.extend({
  agenda: z.string().nullable(),
  publishedAt: z.string().datetime().nullable(),
});

export type MeetingDetail = z.infer<typeof meetingDetailSchema>;
