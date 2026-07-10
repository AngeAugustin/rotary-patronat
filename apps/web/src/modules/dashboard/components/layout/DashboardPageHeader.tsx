import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardPageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  backLink?: { to: string; label: string };
  className?: string;
}

export function DashboardPageHeader({
  eyebrow,
  title,
  description,
  action,
  backLink,
  className,
}: DashboardPageHeaderProps) {
  return (
    <header className={cn('space-y-4', className)}>
      {backLink && (
        <Link
          to={backLink.to}
          className="group inline-flex items-center gap-2 text-sm font-medium text-neutral-400 transition-colors hover:text-primary-700"
        >
          <ArrowLeft
            className="h-4 w-4 transition-transform group-hover:-translate-x-0.5"
            aria-hidden
          />
          {backLink.label}
        </Link>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          {eyebrow && (
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-accent-700">
              {eyebrow}
            </p>
          )}
          <h1 className="page-heading">{title}</h1>
          {description && (
            <p className="max-w-2xl text-sm leading-relaxed text-neutral-700 sm:text-base">
              {description}
            </p>
          )}
        </div>

        {action && <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>}
      </div>
    </header>
  );
}
