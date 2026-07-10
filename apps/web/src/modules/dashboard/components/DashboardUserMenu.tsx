import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { LogOut, Shield, User } from 'lucide-react';
import type { AuthUser } from '@rotary/shared-types';
import { Button } from '@/components/ui/button';
import { UserAvatar } from './UserAvatar';
import { cn } from '@/lib/utils';
import { ADMIN_BASE_PATH } from '@/modules/admin/constants/admin-nav';

interface DashboardUserMenuProps {
  user?: AuthUser;
  isAdmin?: boolean;
  onLogout: () => void;
  logoutPending?: boolean;
}

export function DashboardUserMenu({ user, isAdmin, onLogout, logoutPending }: DashboardUserMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  if (!user) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'rounded-xl transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
          open && 'bg-neutral-50',
        )}
        aria-label="Menu du compte"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <UserAvatar firstName={user.firstName} lastName={user.lastName} size="md" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-1.5 w-52 rounded-xl border border-neutral-100 bg-neutral-0 p-1 shadow-lift"
        >
          <div className="border-b border-neutral-100 px-2.5 py-2">
            <p className="truncate text-sm font-medium text-primary-900">
              {user.firstName} {user.lastName}
            </p>
            <p className="mt-0.5 truncate text-xs text-neutral-500">{user.email}</p>
          </div>

          <div className="py-0.5">
            {isAdmin && (
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="h-8 w-full justify-start px-2 text-xs"
                onClick={() => setOpen(false)}
              >
                <Link to={ADMIN_BASE_PATH} role="menuitem">
                  <Shield className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                  Administration
                </Link>
              </Button>
            )}
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="h-8 w-full justify-start px-2 text-xs"
              onClick={() => setOpen(false)}
            >
              <Link to="/dashboard/profil" role="menuitem">
                <User className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                Profil
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-full justify-start px-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              disabled={logoutPending}
              role="menuitem"
            >
              <LogOut className="mr-1.5 h-3.5 w-3.5" aria-hidden />
              Déconnexion
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
