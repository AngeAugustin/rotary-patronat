import { cn } from '@/lib/utils';

interface PublicEmptyStateProps {
  message: string;
  className?: string;
}

export function PublicEmptyState({ message, className }: PublicEmptyStateProps) {
  return (
    <div
      className={cn(
        'rounded-3xl border border-dashed border-neutral-200 bg-neutral-50 px-8 py-16 text-center',
        className,
      )}
    >
      <p className="text-neutral-500">{message}</p>
    </div>
  );
}
