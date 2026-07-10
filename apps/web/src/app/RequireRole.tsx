import { Navigate, Outlet } from 'react-router-dom';
import { RoleCode } from '@rotary/shared-types';
import { useHasMinRole } from '@/hooks/use-role';
import { useCurrentUser } from '@/modules/auth/hooks/use-auth';

interface RequireRoleProps {
  minRole: RoleCode;
  redirectTo?: string;
}

export function RequireRole({ minRole, redirectTo = '/dashboard' }: RequireRoleProps) {
  const { data: user, isLoading } = useCurrentUser();
  const hasRole = useHasMinRole(minRole);

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-48 animate-pulse rounded-xl bg-neutral-100" />
      </div>
    );
  }

  if (!user || !hasRole) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}
