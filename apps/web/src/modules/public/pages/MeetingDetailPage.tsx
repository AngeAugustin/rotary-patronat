import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  MapPin,
  Share2,
  Users,
  Video,
} from 'lucide-react';
import { useMeeting } from '../hooks/use-public-content';
import { ScrollReveal } from '../components/ScrollReveal';
import { Button } from '@/components/ui/button';
import { fadeIn, fadeInUp, staggerChildren, viewportOnce } from '@/design-system/motion';
import { cn } from '@/lib/utils';
import { publicContainerClass } from '../constants/layout';

function parseMeetingDate(date: string) {
  const d = new Date(date);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function formatFullDate(date: Date) {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function isOnlineLocation(location: string) {
  return /^https?:\/\//i.test(location.trim()) || /^en ligne$/i.test(location.trim());
}

function formatLocationLabel(location: string) {
  if (/^https?:\/\//i.test(location.trim())) return 'En ligne';
  return location;
}

function agendaItems(agenda: string) {
  return agenda
    .split(/\n+/)
    .map((line) => line.replace(/^[-•*\d.)\s]+/, '').trim())
    .filter(Boolean);
}

export function MeetingDetailPage() {
  const { slug = '' } = useParams();
  const { data, isLoading, isError } = useMeeting(slug);

  if (isLoading) {
    return (
      <div>
        <div className="h-[min(52vh,420px)] animate-pulse bg-primary-900" />
        <div className={cn(publicContainerClass, 'max-w-5xl py-12')}>
          <div className="h-8 w-2/3 animate-pulse rounded-xl bg-neutral-100" />
          <div className="mt-6 h-40 animate-pulse rounded-2xl bg-neutral-100" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className={cn(publicContainerClass, 'max-w-3xl py-20 text-center')}>
        <p className="text-neutral-700">Réunion introuvable.</p>
        <Button asChild className="mt-6" variant="outline">
          <Link to="/nos-reunions">Retour à l’agenda</Link>
        </Button>
      </div>
    );
  }

  const meetingDate = parseMeetingDate(data.date);
  const day = new Intl.DateTimeFormat('fr-FR', { day: '2-digit' }).format(meetingDate);
  const month = new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(meetingDate);
  const year = meetingDate.getFullYear();
  const weekday = new Intl.DateTimeFormat('fr-FR', { weekday: 'long' }).format(meetingDate);
  const online = isOnlineLocation(data.location);
  const locationLabel = formatLocationLabel(data.location);
  const locationIsUrl = /^https?:\/\//i.test(data.location.trim());
  const items = data.agenda ? agendaItems(data.agenda) : [];

  const handleShare = async () => {
    if (!navigator.share) return;
    await navigator.share({
      title: data.title,
      text: data.description ?? data.title,
      url: window.location.href,
    });
  };

  return (
    <article>
      {/* Hero agenda */}
      <section className="relative overflow-hidden bg-primary-900 text-neutral-0">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700" />
        <div
          className="absolute -right-24 top-10 h-80 w-80 rounded-full bg-accent-500/20 blur-3xl"
          aria-hidden
        />
        <div
          className="absolute -left-16 bottom-0 h-64 w-64 rounded-full bg-primary-500/30 blur-3xl"
          aria-hidden
        />

        <motion.div
          className={cn(publicContainerClass, 'relative max-w-5xl pb-14 pt-8 sm:pb-16 sm:pt-10')}
          variants={staggerChildren}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={fadeIn} className="flex flex-wrap items-center justify-between gap-3">
            <Link
              to="/nos-reunions"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary-200 transition-colors hover:text-neutral-0"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Retour à l’agenda
            </Link>
            {'share' in navigator && (
              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center gap-2 text-sm font-medium text-primary-200 transition-colors hover:text-neutral-0"
              >
                <Share2 className="h-4 w-4" aria-hidden />
                Partager
              </button>
            )}
          </motion.div>

          <div className="mt-10 grid items-end gap-10 lg:grid-cols-[auto_minmax(0,1fr)] lg:gap-14">
            <motion.div
              variants={fadeInUp}
              className="flex flex-col items-start lg:items-center"
            >
              <div className="flex min-w-[9.5rem] flex-col items-center rounded-2xl bg-neutral-0/10 px-6 py-7 text-center ring-1 ring-white/15 backdrop-blur-sm sm:min-w-[11rem] sm:px-8 sm:py-8">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-200">
                  {weekday}
                </span>
                <span className="mt-2 font-display text-6xl font-semibold leading-none tracking-tight text-neutral-0 sm:text-7xl">
                  {day}
                </span>
                <span className="mt-3 text-sm font-semibold uppercase tracking-[0.18em] text-accent-300">
                  {month}
                </span>
                <span className="mt-1 text-xs text-primary-200">{year}</span>
              </div>
            </motion.div>

            <motion.div variants={fadeInUp} className="min-w-0 pb-1">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-300">
                Réunion publique
              </p>
              <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-neutral-0 sm:text-4xl lg:text-5xl">
                {data.title}
              </h1>
              <p className="mt-4 max-w-xl text-base capitalize text-primary-100 sm:text-lg">
                {formatFullDate(meetingDate)}
                <span className="mx-2 text-primary-300">·</span>
                {data.startTime}
              </p>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Infos pratiques */}
      <section className="border-b border-neutral-100 bg-neutral-0">
        <div
          className={cn(
            publicContainerClass,
            'max-w-5xl grid gap-6 py-6 sm:grid-cols-2 sm:gap-8',
          )}
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
              <Clock className="h-4 w-4" aria-hidden />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
                Horaire
              </p>
              <p className="mt-1 font-display text-lg font-semibold text-primary-900">
                {data.startTime}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
              {online ? (
                <Video className="h-4 w-4" aria-hidden />
              ) : (
                <MapPin className="h-4 w-4" aria-hidden />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
                {online ? 'Format' : 'Lieu'}
              </p>
              {locationIsUrl ? (
                <a
                  href={data.location.trim()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1.5 font-display text-lg font-semibold text-primary-900 underline-offset-4 hover:underline"
                >
                  En ligne
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </a>
              ) : (
                <p className="mt-1 font-display text-lg font-semibold text-primary-900">
                  {locationLabel}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Contenu */}
      <div className={cn(publicContainerClass, 'max-w-5xl space-y-16 py-14 sm:py-16')}>
        {data.description && (
          <ScrollReveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-700">
              À propos
            </p>
            <p className="mt-4 max-w-3xl text-lg leading-relaxed text-neutral-700 sm:text-xl sm:leading-relaxed">
              {data.description}
            </p>
          </ScrollReveal>
        )}

        {items.length > 0 && (
          <ScrollReveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-700">
              Ordre du jour
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-primary-900 sm:text-3xl">
              Au programme
            </h2>
            <ol className="mt-8 space-y-0 border-l border-primary-100">
              {items.map((item, index) => (
                <li key={`${index}-${item.slice(0, 24)}`} className="relative pl-8 pb-8 last:pb-0">
                  <span
                    className="absolute -left-[0.5625rem] top-1 flex h-[1.125rem] w-[1.125rem] items-center justify-center rounded-full bg-primary-700 text-[10px] font-semibold text-neutral-0"
                    aria-hidden
                  >
                    {index + 1}
                  </span>
                  <p className="text-base leading-relaxed text-neutral-700 sm:text-lg">{item}</p>
                </li>
              ))}
            </ol>
          </ScrollReveal>
        )}

        {data.speakers.length > 0 && (
          <ScrollReveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-700">
              Intervenants
            </p>
            <h2 className="mt-2 flex items-center gap-2.5 font-display text-2xl font-semibold text-primary-900 sm:text-3xl">
              <Users className="h-6 w-6 text-primary-500" aria-hidden />
              Qui prend la parole
            </h2>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2">
              {data.speakers.map((speaker) => (
                <li
                  key={speaker}
                  className="flex items-center gap-4 border-b border-neutral-100 pb-4"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-100 font-display text-sm font-semibold text-primary-800">
                    {speaker
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((part) => part[0]?.toUpperCase() ?? '')
                      .join('')}
                  </span>
                  <span className="font-medium text-primary-900">{speaker}</span>
                </li>
              ))}
            </ul>
          </ScrollReveal>
        )}

        <motion.div
          className="flex flex-col items-start justify-between gap-6 border-t border-neutral-100 pt-10 sm:flex-row sm:items-center"
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={fadeInUp}
        >
          <div>
            <p className="font-display text-xl font-semibold text-primary-900">
              Consulter l’agenda
            </p>
            <p className="mt-1 text-sm text-neutral-500">
              Retrouvez toutes les réunions publiques du club.
            </p>
          </div>
          <Button asChild>
            <Link to="/nos-reunions">
              Voir l’agenda
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
        </motion.div>
      </div>
    </article>
  );
}
