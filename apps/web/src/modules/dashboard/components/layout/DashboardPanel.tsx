import { cn } from '@/lib/utils';

interface DashboardPanelProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function DashboardPanel({
  title,
  description,
  action,
  children,
  className,
  noPadding = false,
}: DashboardPanelProps) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-neutral-100 bg-neutral-0 shadow-soft',
        className,
      )}
    >
      {(title || action) && (
        <div className="flex flex-col gap-2 border-b border-neutral-100 bg-neutral-50/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            {title && (
              <h3 className="font-display text-base font-semibold text-primary-900">{title}</h3>
            )}
            {description && (
              <p className="mt-0.5 text-sm text-neutral-500">{description}</p>
            )}
          </div>
          {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
        </div>
      )}
      <div className={cn(!noPadding && 'p-5 sm:p-6')}>{children}</div>
    </div>
  );
}
