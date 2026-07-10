import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, type LucideIcon } from 'lucide-react';
import { fadeInUp, staggerChildren } from '@/design-system/motion';
import { cn } from '@/lib/utils';

export function AdminDetailMetaChip({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-start gap-2.5 rounded-xl border border-neutral-100/80 bg-neutral-0/70 px-3 py-2.5 backdrop-blur-sm">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
        <Icon className="h-3.5 w-3.5" aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">
          {label}
        </p>
        <div className="mt-0.5 text-sm font-medium text-primary-900">{value}</div>
      </div>
    </div>
  );
}

export function AdminDetailSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        'rounded-2xl border border-neutral-100 bg-neutral-0 p-5 shadow-soft sm:p-6',
        className,
      )}
    >
      <div className="mb-4">
        <h3 className="font-display text-sm font-semibold text-primary-900">{title}</h3>
        {description && (
          <p className="mt-0.5 text-xs text-neutral-500">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

interface AdminContentDetailShellProps {
  backTo: string;
  backLabel: string;
  coverImage?: string | null;
  coverFallbackIcon: LucideIcon;
  badges: ReactNode;
  title: string;
  subtitle?: ReactNode;
  metaChips?: ReactNode;
  toolbar: ReactNode;
  sidebar: ReactNode;
  children: ReactNode;
}

export function AdminContentDetailShell({
  backTo,
  backLabel,
  coverImage,
  coverFallbackIcon: FallbackIcon,
  badges,
  title,
  subtitle,
  metaChips,
  toolbar,
  sidebar,
  children,
}: AdminContentDetailShellProps) {
  return (
    <motion.div
      className="space-y-4"
      initial="hidden"
      animate="visible"
      variants={staggerChildren}
    >
      <motion.div variants={fadeInUp}>
        <Link
          to={backTo}
          className="group inline-flex items-center gap-2 text-sm font-medium text-neutral-400 transition-colors hover:text-primary-700"
        >
          <ArrowLeft
            className="h-4 w-4 transition-transform group-hover:-translate-x-0.5"
            aria-hidden
          />
          {backLabel}
        </Link>
      </motion.div>

      <motion.section
        variants={fadeInUp}
        className="overflow-hidden rounded-2xl border border-neutral-100 bg-neutral-0 shadow-soft"
      >
        <div className="relative">
          {coverImage ? (
            <div className="relative aspect-[2.4/1] min-h-[160px] w-full overflow-hidden bg-primary-900 sm:min-h-[200px]">
              <img
                src={coverImage}
                alt=""
                className="h-full w-full object-cover"
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-primary-950/85 via-primary-900/35 to-primary-900/10"
                aria-hidden
              />
              <div className="absolute inset-x-0 bottom-0 px-5 pb-5 sm:px-6 sm:pb-6">
                <div className="flex flex-wrap items-center gap-2">{badges}</div>
                <h1 className="mt-3 max-w-3xl font-display text-2xl font-semibold tracking-tight text-neutral-0 sm:text-3xl">
                  {title}
                </h1>
                {subtitle && (
                  <div className="mt-2 text-sm text-primary-100/90">{subtitle}</div>
                )}
              </div>
            </div>
          ) : (
            <div className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-neutral-0 to-accent-50/40 px-5 py-6 sm:px-6 sm:py-7">
              <div
                className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary-100/50 blur-3xl"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute -bottom-20 left-1/3 h-40 w-40 rounded-full bg-accent-100/40 blur-3xl"
                aria-hidden
              />
              <div className="relative flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-100 text-primary-700 shadow-soft">
                  <FallbackIcon className="h-6 w-6" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">{badges}</div>
                  <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight text-primary-900 sm:text-3xl">
                    {title}
                  </h1>
                  {subtitle && (
                    <div className="mt-1.5 text-sm text-neutral-500">{subtitle}</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {metaChips && (
          <div className="border-t border-neutral-100/80 bg-neutral-50/40 px-5 py-4 sm:px-6">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{metaChips}</div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 border-t border-neutral-100 px-5 py-3.5 sm:px-6">
          {toolbar}
        </div>
      </motion.section>

      <motion.div
        variants={fadeInUp}
        className="grid gap-4 lg:grid-cols-5"
      >
        <div className="space-y-4 lg:col-span-3">{children}</div>
        <aside className="space-y-4 lg:col-span-2">{sidebar}</aside>
      </motion.div>
    </motion.div>
  );
}
