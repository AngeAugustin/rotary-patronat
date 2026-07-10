import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardEmptyStateProps {
  message: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  className?: string;
}

export function DashboardEmptyState({
  message,
  description,
  icon: Icon,
  action,
  className,
}: DashboardEmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-neutral-0/60 px-8 py-14 text-center shadow-soft',
        className,
      )}
    >
      {Icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
          <Icon className="h-6 w-6" aria-hidden />
        </div>
      )}
      <p className="font-medium text-neutral-700">{message}</p>
      {description && (
        <p className="mt-2 max-w-sm text-sm text-neutral-400">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
