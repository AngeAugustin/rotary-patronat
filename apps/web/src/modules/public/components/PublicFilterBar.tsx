import { ScrollReveal } from './ScrollReveal';
import { publicContainerClass } from '../constants/layout';
import { cn } from '@/lib/utils';

interface FilterOption {
  id: string;
  label: string;
  active: boolean;
  onClick: () => void;
}

interface PublicFilterBarProps {
  children?: React.ReactNode;
  filters?: FilterOption[];
  className?: string;
}

export function PublicFilterBar({
  children,
  filters,
  className,
}: PublicFilterBarProps) {
  return (
    <ScrollReveal className={cn('relative z-10 -mt-6', className)}>
      <div className={publicContainerClass}>
        <div className="rounded-2xl border border-neutral-100 bg-neutral-0 p-4 shadow-lift md:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {children && <div className="flex-1">{children}</div>}
            {filters && filters.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {filters.map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={filter.onClick}
                    className={cn(
                      'rounded-xl px-4 py-2 text-sm font-medium transition-colors',
                      filter.active
                        ? 'bg-primary-700 text-neutral-0 shadow-soft'
                        : 'bg-neutral-50 text-neutral-700 hover:bg-primary-50 hover:text-primary-700',
                    )}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ScrollReveal>
  );
}
