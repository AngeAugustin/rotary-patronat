import { cn } from '@/lib/utils';

interface FilterOption {
  value: string;
  label: string;
}

interface DashboardFilterBarProps {
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function DashboardFilterBar({
  options,
  value,
  onChange,
  className,
}: DashboardFilterBarProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap gap-2 rounded-2xl border border-neutral-100 bg-neutral-0 p-2 shadow-soft',
        className,
      )}
      role="group"
    >
      {options.map((option) => {
        const isActive = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              'rounded-xl px-4 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary-700 text-neutral-0 shadow-soft'
                : 'text-neutral-700 hover:bg-neutral-50 hover:text-primary-700',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
