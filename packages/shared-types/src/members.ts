import { z } from 'zod';
import { commissionMembershipSchema } from './users.js';
import { volunteeringSummarySchema } from './volunteering.js';

export const MemberStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
} as const;

export type MemberStatus = (typeof MemberStatus)[keyof typeof MemberStatus];

export const MEMBER_STATUS_LABELS: Record<MemberStatus, string> = {
  [MemberStatus.ACTIVE]: 'Actif',
  [MemberStatus.INACTIVE]: 'Inactif',
};

export const memberSummarySchema = z.object({
  id: z.string().uuid(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  phone: z.string().nullable(),
  profession: z.string().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE']),
  joinedAt: z.string().datetime(),
  hasAccount: z.boolean(),
  userId: z.string().uuid().nullable(),
});

export type MemberSummary = z.infer<typeof memberSummarySchema>;

export const memberVolunteeringStatsSchema = z.object({
  declarationCount: z.number().int(),
  pendingCount: z.number().int(),
  validatedCount: z.number().int(),
  rejectedCount: z.number().int(),
  /** Heures validées uniquement (comptabilisées) */
  validatedHours: z.number(),
  pendingHours: z.number(),
  totalDeclaredHours: z.number(),
});

export type MemberVolunteeringStats = z.infer<typeof memberVolunteeringStatsSchema>;

export const memberDetailSchema = memberSummarySchema.extend({
  motivation: z.string().nullable(),
  sponsorFirstName: z.string().nullable(),
  sponsorLastName: z.string().nullable(),
  membershipApplicationId: z.string().uuid().nullable(),
  commissions: z.array(commissionMembershipSchema),
  volunteering: memberVolunteeringStatsSchema,
  volunteeringDeclarations: z.array(volunteeringSummarySchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type MemberDetail = z.infer<typeof memberDetailSchema>;
