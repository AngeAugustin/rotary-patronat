import { z } from 'zod';
import { RoleCode } from './roles.js';

export const userSummarySchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  isActive: z.boolean(),
  roles: z.array(
    z.enum([
      RoleCode.ADMIN,
      RoleCode.PRESIDENT,
      RoleCode.SECRETARY,
      RoleCode.TREASURER,
      RoleCode.COMMISSION_LEAD,
      RoleCode.MEMBER,
    ]),
  ),
  commissionCount: z.number().int(),
  memberId: z.string().uuid().nullable(),
  createdAt: z.string().datetime(),
});

export type UserSummary = z.infer<typeof userSummarySchema>;

export const commissionMembershipSchema = z.object({
  commissionId: z.string().uuid(),
  commissionName: z.string(),
  role: z.string(),
});

export type CommissionMembership = z.infer<typeof commissionMembershipSchema>;

export const userDetailSchema = userSummarySchema.extend({
  commissions: z.array(commissionMembershipSchema),
  updatedAt: z.string().datetime(),
});

export type UserDetail = z.infer<typeof userDetailSchema>;

export const createUserSchema = z.object({
  memberId: z.string().uuid('Sélectionnez un membre'),
  roles: z
    .array(
      z.enum([
        RoleCode.ADMIN,
        RoleCode.PRESIDENT,
        RoleCode.SECRETARY,
        RoleCode.TREASURER,
        RoleCode.COMMISSION_LEAD,
        RoleCode.MEMBER,
      ]),
    )
    .min(1),
  commissions: z
    .array(
      z.object({
        commissionId: z.string().uuid(),
        role: z.string().min(1),
      }),
    )
    .min(1, 'Un membre doit être rattaché à au moins une commission'),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const editUserSchema = z.object({
  roles: z
    .array(
      z.enum([
        RoleCode.ADMIN,
        RoleCode.PRESIDENT,
        RoleCode.SECRETARY,
        RoleCode.TREASURER,
        RoleCode.COMMISSION_LEAD,
        RoleCode.MEMBER,
      ]),
    )
    .min(1, 'Sélectionnez au moins un rôle'),
  commissions: z
    .array(
      z.object({
        commissionId: z.string().uuid('Sélectionnez une commission'),
        role: z.string().min(1),
      }),
    )
    .min(1, 'Un membre doit être rattaché à au moins une commission'),
});

export type EditUserInput = z.infer<typeof editUserSchema>;

export const updateUserSchema = z.object({
  email: z.string().email().optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  roles: z
    .array(
      z.enum([
        RoleCode.ADMIN,
        RoleCode.PRESIDENT,
        RoleCode.SECRETARY,
        RoleCode.TREASURER,
        RoleCode.COMMISSION_LEAD,
        RoleCode.MEMBER,
      ]),
    )
    .optional(),
  commissions: z
    .array(
      z.object({
        commissionId: z.string().uuid(),
        role: z.string().min(1),
      }),
    )
    .optional(),
  isActive: z.boolean().optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const COMMISSION_POSTS = [
  'Président de commission',
  'Vice-président',
  'Secrétaire',
  'Rapporteur',
  'Membre',
] as const;

export type CommissionPost = (typeof COMMISSION_POSTS)[number];
