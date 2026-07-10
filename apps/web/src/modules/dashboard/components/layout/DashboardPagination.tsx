import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DashboardPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function DashboardPagination({
  page,
  totalPages,
  onPageChange,
  className,
}: DashboardPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div
      className={cn(
        'flex items-center justify-center gap-4 rounded-2xl border border-neutral-100 bg-neutral-0 px-4 py-3 shadow-soft',
        className,
      )}
    >
      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        Précédent
      </Button>
      <span className="text-sm tabular-nums text-neutral-500">
        Page {page} / {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Suivant
      </Button>
    </div>
  );
}
