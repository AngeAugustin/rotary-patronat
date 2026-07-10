import { Button } from '@/components/ui/button';
import { ScrollReveal } from './ScrollReveal';
import { cn } from '@/lib/utils';

interface PublicPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function PublicPagination({
  page,
  totalPages,
  onPageChange,
  className,
}: PublicPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <ScrollReveal
      className={cn('mt-12 flex items-center justify-center gap-4', className)}
    >
      <Button
        variant="outline"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        Précédent
      </Button>
      <span className="rounded-xl bg-neutral-50 px-4 py-2 text-sm font-medium text-neutral-700">
        Page {page} / {totalPages}
      </span>
      <Button
        variant="outline"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Suivant
      </Button>
    </ScrollReveal>
  );
}
