import { motion } from 'framer-motion';
import { fadeIn, fadeInUp, staggerChildren } from '@/design-system/motion';
import { publicContainerClass } from '../constants/layout';
import { cn } from '@/lib/utils';

interface PageHeroProps {
  eyebrow?: string;
  title: string;
  description?: string;
  imageUrl?: string;
  children?: React.ReactNode;
  className?: string;
  /** Réduit le padding vertical pour les pages index. */
  compact?: boolean;
}

export function PageHero({
  eyebrow,
  title,
  description,
  imageUrl,
  children,
  className,
  compact = false,
}: PageHeroProps) {
  return (
    <section
      className={cn('relative overflow-hidden bg-primary-900 text-neutral-0', className)}
    >
      {imageUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${imageUrl})` }}
          aria-hidden
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-900/95 via-primary-800/88 to-primary-600/75" />
      <div
        className="absolute -right-20 top-0 h-72 w-72 rounded-full bg-accent-500/15 blur-3xl"
        aria-hidden
      />

      <motion.div
        className={cn(
          publicContainerClass,
          'relative',
          compact ? 'py-12 md:py-14 lg:py-16' : 'py-16 md:py-20 lg:py-24',
          imageUrl && 'lg:grid lg:grid-cols-2 lg:items-center lg:gap-12',
        )}
        initial="hidden"
        animate="visible"
        variants={staggerChildren}
      >
        <div className="max-w-2xl">
          {eyebrow && (
            <motion.p
              className="text-sm font-semibold uppercase tracking-[0.2em] text-accent-300"
              variants={fadeInUp}
            >
              {eyebrow}
            </motion.p>
          )}
          <motion.h1
            className={cn(
              'mt-3 font-display font-bold leading-tight',
              compact
                ? 'text-3xl md:text-4xl lg:text-[2.75rem]'
                : 'text-3xl md:text-4xl lg:text-5xl xl:text-6xl',
            )}
            variants={fadeInUp}
          >
            {title}
          </motion.h1>
          {description && (
            <motion.p
              className={cn(
                'mt-4 leading-relaxed text-primary-100',
                compact ? 'text-base md:text-lg' : 'mt-5 text-lg md:text-xl',
              )}
              variants={fadeIn}
            >
              {description}
            </motion.p>
          )}
          {children && (
            <motion.div className="mt-8" variants={fadeInUp}>
              {children}
            </motion.div>
          )}
        </div>

        {imageUrl && (
          <motion.div
            className={cn('relative hidden lg:block', compact ? 'mt-0' : 'mt-10')}
            variants={fadeInUp}
          >
            <div
              className="absolute -inset-3 rounded-3xl bg-gradient-to-br from-accent-500/25 to-primary-300/20 blur-sm"
              aria-hidden
            />
            <div
              className={cn(
                'relative overflow-hidden rounded-3xl shadow-lift ring-1 ring-white/15',
                compact ? 'aspect-[16/11]' : 'aspect-[5/4]',
              )}
            >
              <img
                src={imageUrl}
                alt=""
                className="h-full w-full object-cover"
                loading="eager"
              />
            </div>
          </motion.div>
        )}
      </motion.div>
    </section>
  );
}
