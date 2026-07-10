import { z } from 'zod';
import { RoleCode } from './roles.js';
import { commissionMembershipSchema } from './users.js';
import { memberVolunteeringStatsSchema } from './members.js';
import { volunteeringSummarySchema } from './volunteering.js';

export const userProfileSchema = z.object({
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
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  memberId: z.string().uuid().nullable(),
  phone: z.string().nullable(),
  profession: z.string().nullable(),
  motivation: z.string().nullable(),
  sponsorFirstName: z.string().nullable(),
  sponsorLastName: z.string().nullable(),
  memberStatus: z.enum(['ACTIVE', 'INACTIVE']).nullable(),
  joinedAt: z.string().datetime().nullable(),
  commissions: z.array(commissionMembershipSchema),
  volunteering: memberVolunteeringStatsSchema,
  volunteeringDeclarations: z.array(volunteeringSummarySchema),
});

export type UserProfile = z.infer<typeof userProfileSchema>;
