import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { fadeIn, fadeInUp, staggerChildren } from '@/design-system/motion';
import { publicContainerClass } from '../constants/layout';
import { cn } from '@/lib/utils';

interface HeroProps {
  eyebrow?: string;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaTo?: string;
  secondaryCtaLabel?: string;
  secondaryCtaTo?: string;
  imageUrl?: string;
}

export function Hero({
  eyebrow,
  title,
  description,
  ctaLabel,
  ctaTo,
  secondaryCtaLabel,
  secondaryCtaTo,
  imageUrl,
}: HeroProps) {
  return (
    <section className="relative overflow-hidden bg-primary-900 text-neutral-0">
      {imageUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${imageUrl})` }}
          aria-hidden
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-900/95 via-primary-700/80 to-primary-500/60" />

      <motion.div
        className={cn(publicContainerClass, 'relative flex flex-col gap-8 py-24 md:py-32')}
        initial="hidden"
        animate="visible"
        variants={staggerChildren}
      >
        {eyebrow && (
          <motion.p
            className="text-sm font-semibold uppercase tracking-[0.2em] text-accent-300"
            variants={fadeInUp}
          >
            {eyebrow}
          </motion.p>
        )}
        <motion.h1
          className="max-w-4xl font-display text-4xl font-bold leading-tight md:text-6xl lg:text-7xl"
          variants={fadeInUp}
        >
          {title}
        </motion.h1>
        <motion.p
          className="max-w-2xl text-lg text-primary-100 md:text-xl"
          variants={fadeIn}
        >
          {description}
        </motion.p>
        {(ctaLabel || secondaryCtaLabel) && (
          <motion.div className="flex flex-wrap gap-4" variants={fadeInUp}>
            {ctaLabel && ctaTo && (
              <Button asChild size="lg" className="bg-accent-500 text-primary-900 hover:bg-accent-300">
                <Link to={ctaTo}>{ctaLabel}</Link>
              </Button>
            )}
            {secondaryCtaLabel && secondaryCtaTo && (
              <Button asChild size="lg" variant="outline" className="border-primary-300 text-neutral-0 hover:bg-primary-700/50">
                <Link to={secondaryCtaTo}>{secondaryCtaLabel}</Link>
              </Button>
            )}
          </motion.div>
        )}
      </motion.div>
    </section>
  );
}
