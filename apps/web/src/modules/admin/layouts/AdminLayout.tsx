import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import {
  DashboardPageShell,
  DashboardPageHeader,
} from '@/modules/dashboard/components/layout';
import { AdminTabNav } from '../components/AdminTabNav';

interface AdminLayoutContextValue {
  setPageActions: (node: ReactNode | null) => void;
}

const AdminLayoutContext = createContext<AdminLayoutContextValue | null>(null);

export function useAdminPageActions() {
  const context = useContext(AdminLayoutContext);
  if (!context) {
    throw new Error('useAdminPageActions must be used within AdminLayout');
  }
  return context;
}

export function AdminLayout() {
  const [pageActions, setPageActions] = useState<ReactNode | null>(null);
  const contextValue = useMemo(() => ({ setPageActions }), []);

  return (
    <AdminLayoutContext.Provider value={contextValue}>
      <DashboardPageShell>
        <DashboardPageHeader
          eyebrow="Gouvernance"
          title="Administration"
          description="Gestion du club, des membres et de la modération."
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="min-w-0 flex-1">
            <AdminTabNav />
          </div>
          {pageActions && (
            <div className="flex shrink-0 justify-end sm:self-center">{pageActions}</div>
          )}
        </div>
        <div className="mt-6">
          <Outlet />
        </div>
      </DashboardPageShell>
    </AdminLayoutContext.Provider>
  );
}
