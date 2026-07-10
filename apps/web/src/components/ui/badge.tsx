import { cn } from '@/lib/utils';

export function Badge({
  className,
  variant = 'default',
  children,
}: {
  className?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variant === 'default' && 'bg-primary-50 text-primary-700',
        variant === 'success' && 'bg-green-50 text-green-700',
        variant === 'warning' && 'bg-accent-50 text-accent-700',
        variant === 'danger' && 'bg-red-50 text-red-700',
        className,
      )}
    >
      {children}
    </span>
  );
}
