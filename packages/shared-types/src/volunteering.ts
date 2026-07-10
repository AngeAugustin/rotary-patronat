import { z } from 'zod';

export const VolunteeringStatus = {
  PENDING: 'PENDING',
  VALIDATED: 'VALIDATED',
  REJECTED: 'REJECTED',
} as const;

export type VolunteeringStatus =
  (typeof VolunteeringStatus)[keyof typeof VolunteeringStatus];

export const VOLUNTEERING_STATUS_LABELS: Record<VolunteeringStatus, string> = {
  [VolunteeringStatus.PENDING]: 'En attente',
  [VolunteeringStatus.VALIDATED]: 'Validée',
  [VolunteeringStatus.REJECTED]: 'Refusée',
};

export const volunteeringSummarySchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  userName: z.string(),
  visitedClub: z.string(),
  city: z.string(),
  country: z.string(),
  activity: z.string(),
  description: z.string(),
  date: z.string().datetime(),
  startTime: z.string(),
  durationMinutes: z.number().int(),
  hours: z.number(),
  proofUrl: z.string().url().nullable(),
  status: z.enum(['PENDING', 'VALIDATED', 'REJECTED']),
  validatedByName: z.string().nullable(),
  validatedAt: z.string().datetime().nullable(),
  rejectionReason: z.string().nullable(),
  createdAt: z.string().datetime(),
});

export type VolunteeringSummary = z.infer<typeof volunteeringSummarySchema>;

export const volunteeringStatsSchema = z.object({
  totalDeclarations: z.number().int(),
  validatedCount: z.number().int(),
  pendingCount: z.number().int(),
  rejectedCount: z.number().int(),
  totalHours: z.number(),
  validatedHours: z.number(),
});

export type VolunteeringStats = z.infer<typeof volunteeringStatsSchema>;

export const createVolunteeringSchema = z.object({
  visitedClub: z.string().min(1, 'Le club visité est requis'),
  city: z.string().min(1, 'La ville est requise'),
  country: z.string().min(1, 'Le pays est requis'),
  activity: z.string().min(1, "L'activité est requise"),
  description: z.string().min(1, 'La description est requise'),
  date: z.string().min(1, 'La date est requise'),
  startTime: z.string().min(1, "L'heure est requise"),
  durationMinutes: z.number().int().min(15, 'Durée minimale : 15 minutes'),
  hours: z.number().min(0.25, 'Minimum 0,25 heure'),
  proofUrl: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().url('URL invalide').optional(),
  ),
});

export type CreateVolunteeringInput = z.infer<typeof createVolunteeringSchema>;

export const updateVolunteeringSchema = createVolunteeringSchema;
export type UpdateVolunteeringInput = CreateVolunteeringInput;

export const reviewVolunteeringSchema = z.object({
  status: z.enum(['VALIDATED', 'REJECTED']),
  rejectionReason: z.string().optional(),
});

export type ReviewVolunteeringInput = z.infer<typeof reviewVolunteeringSchema>;
