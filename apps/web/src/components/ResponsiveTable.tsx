import { cn } from '@/lib/utils';

interface ResponsiveTableProps {
  children: React.ReactNode;
  className?: string;
}

/** Wrapper scrollable pour tableaux larges sur mobile/tablette. */
export function ResponsiveTable({ children, className }: ResponsiveTableProps) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-neutral-100 bg-neutral-0 shadow-soft',
        className,
      )}
    >
      <div className="overflow-x-auto">
        <div className="min-w-[640px]">{children}</div>
      </div>
    </div>
  );
}

/** Styles de tableau cohérents pour l'espace connecté. */
export const dashboardTableClass = 'w-full text-left text-sm';
export const dashboardTableHeadClass =
  'border-b border-neutral-100 bg-neutral-50/80 text-xs font-semibold uppercase tracking-wide text-neutral-500';
export const dashboardTableRowClass =
  'border-b border-neutral-50 transition-colors last:border-0 hover:bg-neutral-50/50';
