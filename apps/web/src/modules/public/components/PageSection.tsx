import { cn } from '@/lib/utils';
import { publicContainerClass } from '../constants/layout';

type PageSectionTone = 'default' | 'muted' | 'accent' | 'primary';

interface PageSectionProps {
  children: React.ReactNode;
  tone?: PageSectionTone;
  className?: string;
  containerClassName?: string;
}

const toneClasses: Record<PageSectionTone, string> = {
  default: 'bg-neutral-0',
  muted: 'bg-neutral-50',
  accent: 'bg-gradient-to-br from-accent-50 via-neutral-50 to-primary-50',
  primary: 'bg-primary-50',
};

export function PageSection({
  children,
  tone = 'default',
  className,
  containerClassName,
}: PageSectionProps) {
  return (
    <section className={cn(toneClasses[tone], 'py-12 sm:py-16 lg:py-24', className)}>
      <div className={cn(publicContainerClass, containerClassName)}>{children}</div>
    </section>
  );
}
