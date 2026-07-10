import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { ScrollReveal } from './ScrollReveal';
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
  align?: 'left' | 'center';
  action?: { label: string; to: string };
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  className,
  align = 'center',
  action,
}: SectionHeaderProps) {
  const isLeft = align === 'left';

  return (
    <ScrollReveal
      className={cn(
        'mx-auto max-w-3xl',
        isLeft ? 'text-left' : 'text-center',
        className,
      )}
    >
      <div
        className={cn(
          'flex flex-col gap-6',
          !isLeft && action && 'md:flex-row md:items-end md:justify-between md:text-left',
          isLeft && action && 'sm:flex-row sm:items-end sm:justify-between',
        )}
      >
        <div className={cn(isLeft ? '' : 'md:flex-1', !isLeft && !action && '')}>
          {eyebrow && (
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.15em] text-accent-700">
              {eyebrow}
            </p>
          )}
          <h2 className="font-display text-3xl font-bold text-primary-900 md:text-4xl lg:text-[2.75rem] lg:leading-tight">
            {title}
          </h2>
          {description && (
            <p className="mt-4 text-neutral-700 md:text-lg">{description}</p>
          )}
        </div>

        {action && (
          <Link
            to={action.to}
            className="group inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-primary-700 transition-colors hover:text-primary-900"
          >
            {action.label}
            <ArrowRight
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
        )}
      </div>
    </ScrollReveal>
  );
}
