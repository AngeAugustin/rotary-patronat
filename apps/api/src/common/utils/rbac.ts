import { ROLE_HIERARCHY, RoleCode } from '@rotary/shared-types';

export function hasMinimumRole(
  userRoles: RoleCode[],
  requiredRoles: RoleCode[],
): boolean {
  if (requiredRoles.length === 0) return true;

  const userLevel = Math.max(
    ...userRoles.map((role) => ROLE_HIERARCHY[role] ?? 0),
    0,
  );
  const requiredLevel = Math.min(
    ...requiredRoles.map((role) => ROLE_HIERARCHY[role] ?? 0),
  );

  return userLevel >= requiredLevel;
}
