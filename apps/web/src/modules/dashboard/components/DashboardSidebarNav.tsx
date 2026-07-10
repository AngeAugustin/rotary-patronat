import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  LogOut,
  ExternalLink,
  FolderKanban,
  Newspaper,
  MessageSquare,
  HeartHandshake,
  CalendarDays,
  Library,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppLogo } from '@/components/AppLogo';
import { cn } from '@/lib/utils';
import { dashboardHeaderHeightClass } from '@/modules/public/constants/layout';

export const mainNav = [
  { to: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard, end: true },
  { to: '/dashboard/fil', label: "Fil d'actualité", icon: Newspaper },
  { to: '/dashboard/messagerie', label: 'Messagerie', icon: MessageSquare },
  { to: '/dashboard/calendrier', label: 'Calendrier', icon: CalendarDays },
  { to: '/dashboard/benevolat', label: 'Bénévolat', icon: HeartHandshake },
  { to: '/dashboard/bibliotheque', label: 'Bibliothèque', icon: Library },
  { to: '/dashboard/projets', label: 'Projets', icon: FolderKanban },
] as const;

interface NavItemProps {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
  collapsed?: boolean;
  onNavigate?: () => void;
}

function NavItem({ to, label, icon: Icon, end, collapsed, onNavigate }: NavItemProps) {
  return (
    <NavLink
      to={to}
      end={end}
      title={collapsed ? label : undefined}
      aria-label={collapsed ? label : undefined}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center rounded-xl text-sm font-medium transition-colors',
          collapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3.5 py-2.5',
          isActive
            ? 'bg-primary-50 text-primary-700'
            : 'text-neutral-700 hover:bg-neutral-50 hover:text-primary-700',
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && !collapsed && (
            <span
              className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-accent-500"
              aria-hidden
            />
          )}
          <span
            className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors',
              isActive
                ? 'bg-primary-100 text-primary-700'
                : 'bg-neutral-50 text-neutral-500 group-hover:bg-primary-50 group-hover:text-primary-700',
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
          </span>
          {!collapsed && <span className="truncate">{label}</span>}
        </>
      )}
    </NavLink>
  );
}

interface DashboardSidebarNavProps {
  onLogout: () => void;
  logoutPending?: boolean;
  onNavigate?: () => void;
  showLogo?: boolean;
  collapsed?: boolean;
}

export function DashboardSidebarNav({
  onLogout,
  logoutPending,
  onNavigate,
  showLogo = true,
  collapsed = false,
}: DashboardSidebarNavProps) {
  return (
    <>
      {showLogo && (
        <div
          className={cn(
            dashboardHeaderHeightClass,
            'flex items-center border-b border-neutral-100',
            collapsed ? 'justify-center px-2' : 'px-5',
          )}
        >
          <Link
            to="/"
            onClick={onNavigate}
            className="block rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700"
            title={collapsed ? 'Rotary Club Cotonou Le Nautile Patronat' : undefined}
          >
            <AppLogo className={cn(collapsed ? 'h-8 w-8 object-contain' : 'h-9')} />
          </Link>
        </div>
      )}

      <nav
        className={cn('min-h-0 flex-1 space-y-1 overflow-y-auto', collapsed ? 'p-2' : 'p-4')}
        aria-label="Navigation espace connecté"
      >
        {mainNav.map((item) => (
          <NavItem key={item.to} {...item} collapsed={collapsed} onNavigate={onNavigate} />
        ))}
      </nav>

      <div
        className={cn(
          'border-t border-neutral-100 bg-neutral-50/50',
          collapsed ? 'space-y-1 p-2' : 'p-4',
        )}
      >
        <Button
          asChild
          variant="ghost"
          size="sm"
          className={cn(
            'text-neutral-600',
            collapsed ? 'h-10 w-full justify-center p-0' : 'mb-1 w-full justify-start',
          )}
        >
          <Link
            to="/"
            onClick={onNavigate}
            title={collapsed ? 'Site public' : undefined}
            aria-label={collapsed ? 'Site public' : undefined}
          >
            <ExternalLink className={cn('h-4 w-4', !collapsed && 'mr-2')} aria-hidden />
            {!collapsed && 'Site public'}
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'text-red-600 hover:bg-red-50 hover:text-red-700',
            collapsed ? 'h-10 w-full justify-center p-0' : 'w-full justify-start',
          )}
          onClick={onLogout}
          disabled={logoutPending}
          title={collapsed ? 'Déconnexion' : undefined}
          aria-label={collapsed ? 'Déconnexion' : undefined}
        >
          <LogOut className={cn('h-4 w-4', !collapsed && 'mr-2')} aria-hidden />
          {!collapsed && 'Déconnexion'}
        </Button>
      </div>
    </>
  );
}
