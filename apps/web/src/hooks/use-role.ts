import { useCurrentUser } from '@/modules/auth/hooks/use-auth';
import { ROLE_HIERARCHY, RoleCode } from '@rotary/shared-types';

export function useHasMinRole(minRole: RoleCode): boolean {
  const { data: user } = useCurrentUser();
  if (!user) return false;

  const userLevel = Math.max(
    ...user.roles.map((role) => ROLE_HIERARCHY[role] ?? 0),
    0,
  );

  return userLevel >= (ROLE_HIERARCHY[minRole] ?? 0);
}

export function usePrimaryRole(): RoleCode | null {
  const { data: user } = useCurrentUser();
  if (!user || user.roles.length === 0) return null;

  return user.roles.reduce((best, role) =>
    ROLE_HIERARCHY[role] > ROLE_HIERARCHY[best] ? role : best,
  );
}

export function useIsAdmin(): boolean {
  return useHasMinRole(RoleCode.ADMIN);
}
