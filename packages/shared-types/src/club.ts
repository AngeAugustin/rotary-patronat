import { z } from 'zod';
import { actionSummarySchema } from './actions.js';
import { newsSummarySchema } from './news.js';
import { meetingSummarySchema } from './meetings.js';

export const executiveMemberSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  role: z.string(),
  photo: z.string().nullable(),
  bio: z.string().nullable(),
});

export type ExecutiveMember = z.infer<typeof executiveMemberSchema>;

export const commissionPublicSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string(),
});

export type CommissionPublic = z.infer<typeof commissionPublicSchema>;

export const galleryImageSchema = z.object({
  id: z.string().uuid(),
  url: z.string(),
  caption: z.string().nullable(),
});

export type GalleryImage = z.infer<typeof galleryImageSchema>;

export const clubTimelineEventSchema = z.object({
  id: z.string().uuid(),
  year: z.number().int(),
  title: z.string(),
  description: z.string(),
  imageUrl: z.string().nullable(),
  highlight: z.boolean(),
});

export type ClubTimelineEvent = z.infer<typeof clubTimelineEventSchema>;

export const socialLinkSchema = z.object({
  id: z.string().uuid(),
  platform: z.string(),
  url: z.string().url(),
});

export type SocialLink = z.infer<typeof socialLinkSchema>;

export const clubProfileSchema = z.object({
  history: z.string(),
  vision: z.string(),
  mission: z.string(),
  values: z.array(z.string()),
  organization: z.string(),
  presidentMessage: z.string(),
  presidentName: z.string(),
  presidentTitle: z.string(),
  presidentPhoto: z.string().nullable(),
  riPresidentName: z.string().nullable(),
  riPresidentTitle: z.string().nullable(),
  riPresidentBio: z.string().nullable(),
  riPresidentMessage: z.string().nullable(),
  riPresidentPhoto: z.string().nullable(),
  executive: z.array(executiveMemberSchema),
  commissions: z.array(commissionPublicSchema),
  gallery: z.array(galleryImageSchema),
  timeline: z.array(clubTimelineEventSchema),
  socialLinks: z.array(socialLinkSchema),
});

export type ClubProfile = z.infer<typeof clubProfileSchema>;

export const homepageDataSchema = z.object({
  presidentMessage: z.string(),
  presidentName: z.string(),
  presidentTitle: z.string(),
  presidentPhoto: z.string().nullable(),
  featuredActions: z.array(actionSummarySchema),
  recentNews: z.array(newsSummarySchema),
  upcomingMeetings: z.array(meetingSummarySchema),
  socialLinks: z.array(socialLinkSchema),
});

export type HomepageData = z.infer<typeof homepageDataSchema>;
