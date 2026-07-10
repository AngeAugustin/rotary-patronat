import { Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Shield, Sparkles } from 'lucide-react';
import { AppLogo } from '@/components/AppLogo';
import { fadeIn, fadeInUp, staggerChildren } from '@/design-system/motion';
import { motion } from 'framer-motion';

const LOGIN_IMAGE =
  'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&q=80';

export function LoginBrandPanel() {
  return (
    <div className="relative hidden min-h-screen overflow-hidden lg:grid lg:grid-cols-[1fr_42%]">
      {/* ── Colonne contenu ── */}
      <div className="relative flex flex-col bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700">
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
          aria-hidden
        />
        <div
          className="absolute -left-16 top-1/4 h-72 w-72 rounded-full bg-accent-500/12 blur-3xl"
          aria-hidden
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-500/30 to-transparent"
          aria-hidden
        />

        <div className="relative flex min-h-0 flex-1 flex-col px-10 py-10 xl:px-14 xl:py-12">
          <motion.header
            className="flex shrink-0 items-center justify-between"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <AppLogo className="h-11 brightness-0 invert" />
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-primary-100 backdrop-blur-sm">
              <Shield className="h-3.5 w-3.5 text-accent-400" aria-hidden />
              Accès sécurisé
            </span>
          </motion.header>

          <motion.div
            className="flex min-h-0 flex-1 flex-col justify-center py-10"
            initial="hidden"
            animate="visible"
            variants={staggerChildren}
          >
            <div className="max-w-md">
              <motion.span
                className="inline-flex items-center gap-2 rounded-full border border-accent-500/30 bg-accent-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.13em] text-accent-300"
                variants={fadeInUp}
              >
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                Espace connecté
              </motion.span>

              <motion.h1
                className="mt-7 font-display text-[2.125rem] font-bold leading-[1.08] tracking-tight text-neutral-0 xl:text-[2.75rem] xl:leading-[1.06]"
                variants={fadeInUp}
              >
                Le Nautile{' '}
                <span className="bg-gradient-to-r from-accent-300 to-accent-500 bg-clip-text text-transparent">
                  Patronat
                </span>
              </motion.h1>

              <motion.p
                className="mt-5 text-[0.9375rem] leading-relaxed text-primary-100 xl:text-base"
                variants={fadeIn}
              >
                Plateforme collaborative réservée aux membres du Rotary Club
                Cotonou Le Nautile Patronat.
              </motion.p>

              <motion.div
                className="mt-9 rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm"
                variants={fadeInUp}
              >
                <p className="font-display text-lg font-semibold leading-snug text-neutral-0 xl:text-xl">
                  « Servir plus, servir mieux »
                </p>
                <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.13em] text-primary-300">
                  Devise Rotary International
                </p>
              </motion.div>

              <motion.div
                className="mt-7 flex flex-col gap-2 text-xs text-primary-200 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5"
                variants={fadeInUp}
              >
                <span className="inline-flex items-center gap-2">
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent-500"
                    aria-hidden
                  />
                  Club Satellite Passeport
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-accent-400" aria-hidden />
                  Cotonou · District 9103
                </span>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Colonne visuelle ── */}
      <div className="relative hidden overflow-hidden lg:block">
        <img
          src={LOGIN_IMAGE}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
        />
        <div
          className="absolute inset-0 bg-gradient-to-l from-transparent via-primary-900/20 to-primary-900/60"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-primary-900/50 via-transparent to-primary-900/20"
          aria-hidden
        />

        {/* Carte flottante sur l'image */}
        <motion.div
          className="absolute bottom-12 left-8 right-8 rounded-2xl border border-white/15 bg-primary-900/75 p-5 backdrop-blur-md xl:bottom-14 xl:left-10 xl:right-10 xl:p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-accent-300">
            Engagement communautaire
          </p>
          <p className="mt-2 text-sm leading-relaxed text-primary-100">
            Servir les communautés locales avec impact, amitié et excellence
            au cœur de chaque action.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export function LoginMobileHeader() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-primary-900 to-primary-700 px-4 py-7 lg:hidden">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-[0.12]"
        style={{ backgroundImage: `url(${LOGIN_IMAGE})` }}
        aria-hidden
      />
      <div
        className="absolute inset-y-0 left-0 w-0.5 bg-gradient-to-b from-transparent via-accent-500/50 to-transparent"
        aria-hidden
      />

      <div className="relative">
        <Link
          to="/"
          className="mb-5 inline-flex items-center gap-2 text-sm text-primary-200 transition-colors hover:text-neutral-0"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Retour au site
        </Link>

        <div className="flex items-center justify-between gap-4">
          <AppLogo className="h-9 brightness-0 invert" />
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-medium text-accent-300">
            <Shield className="h-3 w-3" aria-hidden />
            Accès sécurisé
          </span>
        </div>

        <div className="mt-7">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-accent-400">
            Espace connecté
          </p>
          <p className="mt-2 font-display text-2xl font-bold text-neutral-0">
            Le Nautile{' '}
            <span className="text-accent-300">Patronat</span>
          </p>
          <p className="mt-1.5 text-sm text-primary-200">
            Club Satellite Passeport · Cotonou
          </p>
        </div>
      </div>
    </div>
  );
}
