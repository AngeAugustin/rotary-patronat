import { Link } from 'react-router-dom';
import { CalendarDays, Users } from 'lucide-react';
import type { ProjectStatus, ProjectSummary } from '@rotary/shared-types';
import { PROJECT_STATUS_LABELS } from '@rotary/shared-types';
import { cn } from '@/lib/utils';

interface ProjectCardProps {
  project: ProjectSummary;
  className?: string;
}

function formatDateShort(date: string | null) {
  if (!date) return null;
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

function statusAccentClass(status: ProjectStatus) {
  switch (status) {
    case 'COMPLETED':
      return 'bg-emerald-500';
    case 'IN_PROGRESS':
      return 'bg-accent-500';
    case 'SUSPENDED':
      return 'bg-red-400';
    default:
      return 'bg-primary-400';
  }
}

function statusTextClass(status: ProjectStatus) {
  switch (status) {
    case 'COMPLETED':
      return 'text-emerald-700';
    case 'IN_PROGRESS':
      return 'text-accent-700';
    case 'SUSPENDED':
      return 'text-red-600';
    default:
      return 'text-primary-600';
  }
}

export function ProjectCard({ project, className }: ProjectCardProps) {
  const periodLabel = [
    formatDateShort(project.startDate),
    formatDateShort(project.endDate),
  ]
    .filter(Boolean)
    .join(' — ');

  return (
    <Link
      to={`/dashboard/projets/${project.id}`}
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-xl border border-neutral-200/80 bg-neutral-0',
        'transition-[border-color,box-shadow] duration-200',
        'hover:border-primary-300 hover:shadow-[0_8px_24px_-12px_rgba(15,40,80,0.18)]',
        className,
      )}
    >
      <span
        className={cn(
          'absolute inset-y-0 left-0 w-[3px]',
          statusAccentClass(project.status),
        )}
        aria-hidden
      />

      <div className="flex flex-1 flex-col py-5 pl-5 pr-5 sm:py-6 sm:pl-6 sm:pr-6">
        <div className="flex items-start justify-between gap-3">
          <p className="truncate text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-400">
            {project.commissionName}
          </p>
          <span
            className={cn(
              'shrink-0 text-[11px] font-semibold uppercase tracking-wide',
              statusTextClass(project.status),
            )}
          >
            {PROJECT_STATUS_LABELS[project.status]}
          </span>
        </div>

        <h3 className="mt-2.5 font-display text-lg font-semibold leading-snug tracking-tight text-primary-900 transition-colors group-hover:text-primary-700">
          {project.title}
        </h3>

        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-neutral-500">
          {project.description}
        </p>

        <div className="mt-6">
          <div className="mb-2 flex items-baseline justify-between gap-3">
            <span className="text-[11px] font-medium uppercase tracking-wider text-neutral-400">
              Avancement
            </span>
            <span className="text-xs font-semibold tabular-nums text-primary-900">
              {project.progressPercent}%
            </span>
          </div>
          <div className="h-px overflow-hidden bg-neutral-100">
            <div
              className="h-full bg-primary-700 transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, project.progressPercent))}%` }}
            />
          </div>
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-neutral-100 pt-4">
          <div className="flex items-center gap-1.5 text-xs text-neutral-500">
            <Users className="h-3.5 w-3.5 shrink-0 text-neutral-400" aria-hidden />
            <span className="tabular-nums">
              {project.memberCount} membre{project.memberCount > 1 ? 's' : ''}
            </span>
          </div>
          {periodLabel && (
            <div className="flex min-w-0 items-center gap-1.5 text-xs text-neutral-500">
              <CalendarDays className="h-3.5 w-3.5 shrink-0 text-neutral-400" aria-hidden />
              <span className="truncate">{periodLabel}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

export function ProjectCardSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-neutral-200/80 bg-neutral-0">
      <span className="absolute inset-y-0 left-0 w-[3px] bg-neutral-200" aria-hidden />
      <div className="space-y-4 py-5 pl-5 pr-5 sm:py-6 sm:pl-6 sm:pr-6">
        <div className="flex justify-between gap-3">
          <div className="h-2.5 w-28 animate-pulse rounded bg-neutral-100" />
          <div className="h-2.5 w-14 animate-pulse rounded bg-neutral-100" />
        </div>
        <div className="h-5 w-3/4 animate-pulse rounded bg-neutral-100" />
        <div className="space-y-2">
          <div className="h-3.5 w-full animate-pulse rounded bg-neutral-50" />
          <div className="h-3.5 w-5/6 animate-pulse rounded bg-neutral-50" />
        </div>
        <div className="h-px w-full animate-pulse bg-neutral-100" />
        <div className="flex gap-4 border-t border-neutral-100 pt-4">
          <div className="h-3 w-16 animate-pulse rounded bg-neutral-100" />
          <div className="h-3 w-28 animate-pulse rounded bg-neutral-100" />
        </div>
      </div>
    </div>
  );
}
