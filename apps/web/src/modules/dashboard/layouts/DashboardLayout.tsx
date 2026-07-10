import { Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useCurrentUser, useLogout } from '@/modules/auth/hooks/use-auth';
import { useIsAdmin } from '@/hooks/use-role';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  dashboardContainerClass,
  dashboardContentClass,
  dashboardHeaderHeightClass,
  dashboardSidebarCollapsedWidthClass,
  dashboardSidebarExpandedWidthClass,
} from '@/modules/public/constants/layout';
import { NotificationBell } from '@/modules/notifications/components/NotificationBell';
import { GlobalSearchBar } from '@/modules/search/components/GlobalSearchBar';
import { SkipLink } from '@/components/SkipLink';
import { MobileDrawer } from '@/components/MobileDrawer';
import { DashboardSidebarNav } from '../components/DashboardSidebarNav';
import { DashboardUserMenu } from '../components/DashboardUserMenu';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { connectRealtime } from '@/lib/realtime-client';
import { useSidebarCollapsed } from '../hooks/use-sidebar-collapsed';

export function DashboardLayout() {
  const navigate = useNavigate();
  const { data: user } = useCurrentUser();
  const logoutMutation = useLogout();
  const isAdmin = useIsAdmin();
  const { collapsed: sidebarCollapsed, toggle: toggleSidebar } = useSidebarCollapsed();
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  useEffect(() => {
    connectRealtime();
  }, []);

  const requestLogout = () => {
    setMenuOpen(false);
    setLogoutConfirmOpen(true);
  };

  const confirmLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        setLogoutConfirmOpen(false);
        navigate('/connexion');
      },
    });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50">
      <SkipLink />

      <aside
        className={cn(
          'hidden h-full shrink-0 overflow-hidden border-r border-neutral-100 bg-neutral-0 transition-[width] duration-300 ease-in-out md:flex md:flex-col',
          sidebarCollapsed
            ? dashboardSidebarCollapsedWidthClass
            : dashboardSidebarExpandedWidthClass,
        )}
      >
        <DashboardSidebarNav
          collapsed={sidebarCollapsed}
          onLogout={requestLogout}
          logoutPending={logoutMutation.isPending}
        />
      </aside>

      <MobileDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        title="Menu"
        className="flex flex-col"
      >
        <DashboardSidebarNav
          onLogout={requestLogout}
          logoutPending={logoutMutation.isPending}
          onNavigate={() => setMenuOpen(false)}
          showLogo={false}
        />
      </MobileDrawer>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden transition-[margin] duration-300 ease-in-out">
        <header
          className={cn(
            'z-40 shrink-0 border-b border-neutral-100 bg-neutral-0/80 backdrop-blur-md',
            dashboardHeaderHeightClass,
          )}
        >
          <div className={cn(dashboardContainerClass, 'flex h-full items-center')}>
            <div className="flex w-full items-center gap-3 sm:gap-4">
              <Button
                variant="ghost"
                size="sm"
                className="h-10 w-10 shrink-0 p-0 md:hidden"
                onClick={() => setMenuOpen(true)}
                aria-label="Ouvrir le menu"
              >
                <Menu className="h-5 w-5" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="hidden h-10 w-10 shrink-0 p-0 md:inline-flex"
                onClick={toggleSidebar}
                aria-label={sidebarCollapsed ? 'Développer le menu latéral' : 'Réduire le menu latéral'}
                aria-expanded={!sidebarCollapsed}
              >
                {sidebarCollapsed ? (
                  <PanelLeftOpen className="h-5 w-5" />
                ) : (
                  <PanelLeftClose className="h-5 w-5" />
                )}
              </Button>

              <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3 md:justify-end">
                <GlobalSearchBar />
                <NotificationBell />
                <DashboardUserMenu
                  user={user}
                  isAdmin={isAdmin}
                  onLogout={requestLogout}
                  logoutPending={logoutMutation.isPending}
                />
              </div>
            </div>
          </div>
        </header>

        <main id="main-content" className="min-h-0 flex-1 overflow-y-auto py-6 sm:py-8">
          <div className={dashboardContentClass}>
            <Outlet />
          </div>
        </main>
      </div>

      <ConfirmDialog
        open={logoutConfirmOpen}
        onClose={() => setLogoutConfirmOpen(false)}
        onConfirm={confirmLogout}
        title="Confirmer la déconnexion"
        description="Vous allez quitter votre session. Souhaitez-vous continuer ?"
        confirmLabel="Se déconnecter"
        cancelLabel="Annuler"
        confirmPending={logoutMutation.isPending}
        destructive
      />
    </div>
  );
}
