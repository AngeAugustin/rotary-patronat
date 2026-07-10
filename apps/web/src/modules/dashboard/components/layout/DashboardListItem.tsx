import { cn } from '@/lib/utils';

interface DashboardListItemProps {
  title: string;
  subtitle?: string;
  meta?: string;
  children?: React.ReactNode;
  className?: string;
}

export function DashboardListItem({
  title,
  subtitle,
  meta,
  children,
  className,
}: DashboardListItemProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-neutral-100 bg-neutral-0 px-5 py-4 shadow-soft transition-colors hover:border-primary-200',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-primary-900">{title}</p>
          {subtitle && (
            <p className="mt-1 text-sm text-neutral-600">{subtitle}</p>
          )}
          {meta && (
            <p className="mt-1.5 text-xs text-neutral-400">{meta}</p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
