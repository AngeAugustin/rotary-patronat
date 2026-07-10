import { z } from 'zod';

export const activityLogSchema = z.object({
  id: z.string().uuid(),
  action: z.string(),
  resource: z.string().nullable(),
  resourceId: z.string().nullable(),
  ipAddress: z.string().nullable(),
  createdAt: z.string().datetime(),
  user: z
    .object({
      id: z.string().uuid(),
      firstName: z.string(),
      lastName: z.string(),
      email: z.string().email(),
    })
    .nullable(),
});

export type ActivityLogEntry = z.infer<typeof activityLogSchema>;
