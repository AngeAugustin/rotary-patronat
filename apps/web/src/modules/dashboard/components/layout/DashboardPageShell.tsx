import { cn } from '@/lib/utils';

type DashboardPageWidth = 'default' | 'narrow' | 'wide' | 'full';

interface DashboardPageShellProps {
  children: React.ReactNode;
  width?: DashboardPageWidth;
  className?: string;
}

const widthClasses: Record<DashboardPageWidth, string> = {
  default: 'max-w-7xl',
  narrow: 'max-w-3xl',
  wide: 'max-w-6xl',
  full: 'max-w-none',
};

export function DashboardPageShell({
  children,
  width = 'default',
  className,
}: DashboardPageShellProps) {
  return (
    <div className={cn('mx-auto w-full space-y-8', widthClasses[width], className)}>
      {children}
    </div>
  );
}
