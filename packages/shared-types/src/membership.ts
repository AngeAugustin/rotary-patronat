import { z } from 'zod';

export const MembershipApplicationStatus = {
  PENDING: 'PENDING',
  REVIEWED: 'REVIEWED',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
} as const;

export type MembershipApplicationStatus =
  (typeof MembershipApplicationStatus)[keyof typeof MembershipApplicationStatus];

export const MEMBERSHIP_APPLICATION_STATUS_LABELS: Record<
  MembershipApplicationStatus,
  string
> = {
  [MembershipApplicationStatus.PENDING]: 'En attente',
  [MembershipApplicationStatus.REVIEWED]: 'Examinée',
  [MembershipApplicationStatus.ACCEPTED]: 'Acceptée',
  [MembershipApplicationStatus.REJECTED]: 'Refusée',
};

export const createMembershipApplicationSchema = z.object({
  firstName: z.string().min(1, 'Le prénom est requis'),
  lastName: z.string().min(1, 'Le nom est requis'),
  email: z.string().email('Email invalide'),
  phone: z.string().min(6, 'Téléphone invalide'),
  profession: z.string().min(1, 'La profession est requise'),
  motivation: z.string().min(20, 'Décrivez votre motivation (20 caractères minimum)'),
  sponsorFirstName: z.string().trim().optional(),
  sponsorLastName: z.string().trim().optional(),
  attachmentUrls: z.array(z.string().url()).optional(),
}).superRefine((data, ctx) => {
  const sponsorFirst = data.sponsorFirstName?.trim();
  const sponsorLast = data.sponsorLastName?.trim();
  if (sponsorFirst && !sponsorLast) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Le nom du parrain est requis si vous indiquez un prénom',
      path: ['sponsorLastName'],
    });
  }
  if (sponsorLast && !sponsorFirst) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Le prénom du parrain est requis si vous indiquez un nom',
      path: ['sponsorFirstName'],
    });
  }
});

export type CreateMembershipApplicationInput = z.infer<
  typeof createMembershipApplicationSchema
>;

export const reviewMembershipApplicationSchema = z.object({
  status: z.enum(['REVIEWED', 'ACCEPTED', 'REJECTED']),
  adminNotes: z.string().optional(),
});

export type ReviewMembershipApplicationInput = z.infer<
  typeof reviewMembershipApplicationSchema
>;

export const membershipApplicationSummarySchema = z.object({
  id: z.string().uuid(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  phone: z.string(),
  profession: z.string(),
  sponsorFirstName: z.string().nullable(),
  sponsorLastName: z.string().nullable(),
  motivation: z.string(),
  attachmentUrls: z.array(z.string()).nullable(),
  status: z.enum(['PENDING', 'REVIEWED', 'ACCEPTED', 'REJECTED']),
  adminNotes: z.string().nullable(),
  reviewedByName: z.string().nullable(),
  reviewedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  memberId: z.string().uuid().nullable(),
});

export type MembershipApplicationSummary = z.infer<
  typeof membershipApplicationSummarySchema
>;
