import { cn } from '@/lib/utils';

interface DashboardSkeletonProps {
  className?: string;
}

export function DashboardSkeleton({ className }: DashboardSkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-2xl bg-gradient-to-r from-neutral-100 via-neutral-50 to-neutral-100',
        className,
      )}
    />
  );
}

export function DashboardStatSkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <DashboardSkeleton key={i} className="h-28" />
      ))}
    </div>
  );
}
