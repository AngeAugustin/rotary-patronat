import { NavLink } from 'react-router-dom';
import { adminTabPath, adminTabs } from '../constants/admin-nav';
import { cn } from '@/lib/utils';

export function AdminTabNav() {
  return (
    <nav
      className="scrollbar-none -mx-1 overflow-x-auto px-1"
      aria-label="Sections administration"
    >
      <div className="inline-flex min-w-full gap-1 rounded-xl border border-neutral-100 bg-neutral-0 p-1 shadow-soft sm:min-w-0">
        {adminTabs.map(({ segment, label, icon: Icon }) => (
          <NavLink
            key={segment}
            to={adminTabPath(segment)}
            end={segment !== 'commissions' && segment !== 'membres'}
            className={({ isActive }) =>
              cn(
                'flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors sm:text-sm',
                isActive
                  ? 'bg-primary-700 text-neutral-0 shadow-soft'
                  : 'text-neutral-700 hover:bg-neutral-50 hover:text-primary-700',
              )
            }
          >
            <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
