import { z } from 'zod';

export const commissionMemberSchema = z.object({
  userId: z.string().uuid(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  role: z.string(),
  /** false si c'est la seule commission d'un membre actif non-admin */
  canRemove: z.boolean().optional(),
});

export type CommissionMember = z.infer<typeof commissionMemberSchema>;

export const commissionAdminSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  sortOrder: z.number().int(),
  leadUserId: z.string().uuid().nullable(),
  leadUserName: z.string().nullable(),
  memberCount: z.number().int(),
  members: z.array(commissionMemberSchema).optional(),
});

export type CommissionAdmin = z.infer<typeof commissionAdminSchema>;

export const createCommissionSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  description: z.string().min(1),
  sortOrder: z.number().int().optional(),
  leadUserId: z.string().uuid().optional(),
});

export type CreateCommissionInput = z.infer<typeof createCommissionSchema>;

export const updateCommissionSchema = createCommissionSchema.partial();

export type UpdateCommissionInput = z.infer<typeof updateCommissionSchema>;

export const assignCommissionMemberSchema = z.object({
  userId: z.string().uuid(),
  role: z.string().min(1),
});

export type AssignCommissionMemberInput = z.infer<typeof assignCommissionMemberSchema>;
