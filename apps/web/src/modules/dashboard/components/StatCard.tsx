import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: number | string;
  sublabel?: string;
  icon?: LucideIcon;
  variant?: 'default' | 'accent' | 'primary';
  className?: string;
}

const variantStyles = {
  default: 'border-neutral-100 bg-neutral-0',
  accent: 'border-accent-200/60 bg-gradient-to-br from-accent-50/80 to-neutral-0',
  primary: 'border-primary-100 bg-gradient-to-br from-primary-50/80 to-neutral-0',
};

const iconVariantStyles = {
  default: 'bg-primary-50 text-primary-700',
  accent: 'bg-accent-100 text-accent-700',
  primary: 'bg-primary-100 text-primary-700',
};

export function StatCard({
  label,
  value,
  sublabel,
  icon: Icon,
  variant = 'default',
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border p-5 shadow-soft sm:p-6',
        variantStyles[variant],
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-neutral-500">{label}</p>
        {Icon && (
          <div
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
              iconVariantStyles[variant],
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
          </div>
        )}
      </div>
      <p className="mt-3 font-display text-3xl font-bold tracking-tight text-primary-900">
        {value}
      </p>
      {sublabel && (
        <p className="mt-1.5 text-xs leading-relaxed text-neutral-400">{sublabel}</p>
      )}
    </div>
  );
}
