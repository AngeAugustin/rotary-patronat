import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fadeIn, fadeInUp, staggerChildren } from '@/design-system/motion';
import { publicContainerClass } from '../../constants/layout';
import { cn } from '@/lib/utils';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&q=80';

interface HomeHeroProps {
  actionsCount?: number;
  meetingsCount?: number;
}

export function HomeHero({ actionsCount, meetingsCount }: HomeHeroProps) {
  return (
    <section className="relative overflow-hidden bg-primary-900 text-neutral-0">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-25"
        style={{ backgroundImage: `url(${HERO_IMAGE})` }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-gradient-to-br from-primary-900/95 via-primary-800/90 to-primary-600/70" />
      <div
        className="absolute -right-32 top-20 h-96 w-96 rounded-full bg-accent-500/15 blur-3xl"
        aria-hidden
      />
      <div
        className="absolute -bottom-24 left-1/4 h-80 w-80 rounded-full bg-primary-300/20 blur-3xl"
        aria-hidden
      />

      <motion.div
        className={cn(
          publicContainerClass,
          'relative grid min-h-[min(92vh,880px)] items-center gap-12 py-16 lg:grid-cols-2 lg:gap-16 lg:py-20',
        )}
        initial="hidden"
        animate="visible"
        variants={staggerChildren}
      >
        <div className="flex flex-col gap-8">
          <motion.div
            className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-sm font-medium text-accent-300 backdrop-blur-sm"
            variants={fadeInUp}
          >
            <Sparkles className="h-4 w-4" aria-hidden />
            Rotary Club Cotonou · Club Satellite Passeport
          </motion.div>

          <motion.h1
            className="font-display text-4xl font-bold leading-[1.08] tracking-tight md:text-5xl lg:text-6xl xl:text-7xl"
            variants={fadeInUp}
          >
            Le Nautile{' '}
            <span className="bg-gradient-to-r from-accent-300 to-accent-500 bg-clip-text text-transparent">
              Patronat
            </span>
          </motion.h1>

          <motion.p
            className="max-w-xl text-lg leading-relaxed text-primary-100 md:text-xl"
            variants={fadeIn}
          >
            Une plateforme digitale au service de notre engagement communautaire,
            de la gouvernance interne et du rayonnement du club.
          </motion.p>

          <motion.div className="flex flex-wrap gap-4" variants={fadeInUp}>
            <Button
              asChild
              size="lg"
              className="bg-accent-500 text-primary-900 shadow-lift hover:bg-accent-300"
            >
              <Link to="/nos-actions">
                Découvrir nos actions
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/25 bg-white/5 text-neutral-0 backdrop-blur-sm hover:bg-white/10"
            >
              <Link to="/le-club">Le Club</Link>
            </Button>
          </motion.div>

          <motion.dl
            className="grid grid-cols-1 gap-4 border-t border-white/10 pt-8 min-[480px]:grid-cols-3 sm:gap-6"
            variants={fadeInUp}
          >
            {[
              { label: 'Actions', value: actionsCount ?? '—' },
              { label: 'Réunions à venir', value: meetingsCount ?? '—' },
              { label: 'Depuis', value: 'Cotonou' },
            ].map((stat) => (
              <div key={stat.label}>
                <dt className="text-xs font-medium uppercase tracking-wider text-primary-300">
                  {stat.label}
                </dt>
                <dd className="mt-1 font-display text-2xl font-bold text-neutral-0 md:text-3xl">
                  {stat.value}
                </dd>
              </div>
            ))}
          </motion.dl>
        </div>

        <motion.div className="relative hidden lg:block" variants={fadeInUp}>
          <div className="relative mx-auto max-w-md">
            <div
              className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-accent-500/30 to-primary-300/20 blur-sm"
              aria-hidden
            />
            <div className="relative aspect-[4/5] overflow-hidden rounded-[1.75rem] shadow-lift ring-1 ring-white/20">
              <img
                src={HERO_IMAGE}
                alt=""
                className="h-full w-full object-cover"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary-900/80 via-transparent to-transparent" />
            </div>

            <div className="absolute -bottom-5 -left-8 max-w-[220px] rounded-2xl border border-white/10 bg-neutral-0/95 p-5 shadow-lift backdrop-blur-md">
              <p className="text-xs font-semibold uppercase tracking-wider text-accent-700">
                Notre devise
              </p>
              <p className="mt-1 font-display text-lg font-bold leading-snug text-primary-900">
                Servir plus, servir mieux
              </p>
            </div>

            <div className="absolute -right-6 top-8 rounded-2xl border border-white/10 bg-primary-800/90 px-4 py-3 shadow-soft backdrop-blur-md">
              <p className="text-sm font-medium text-neutral-0">Bénin · District 9103</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
