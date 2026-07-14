import { Link } from 'react-router-dom';
import { Facebook, Instagram, Linkedin } from 'lucide-react';
import { HomeHero } from '../components/home/HomeHero';
import { HomeQuickNav } from '../components/home/HomeQuickNav';
import { HomePresidentSection } from '../components/home/HomePresidentSection';
import { SectionHeader } from '../components/SectionHeader';
import { ScrollReveal } from '../components/ScrollReveal';
import { ActionCard, ActionCardSkeleton } from '../components/ActionCard';
import { NewsCard, NewsCardSkeleton } from '../components/NewsCard';
import { MeetingCard } from '../components/MeetingCard';
import { useHomepage } from '../hooks/use-public-content';
import { publicContainerClass } from '../constants/layout';
import { cn } from '@/lib/utils';

const socialIcons: Record<string, typeof Facebook> = {
  Facebook,
  LinkedIn: Linkedin,
  Instagram,
};

export function HomePage() {
  const { data, isLoading, isError } = useHomepage();
  const featuredActions = data?.featuredActions ?? [];

  return (
    <>
      <HomeHero
        actionsCount={data?.featuredActions.length}
        meetingsCount={data?.upcomingMeetings.length}
      />
      <HomeQuickNav />

      <HomePresidentSection
        isLoading={isLoading}
        isError={isError}
        message={data?.presidentMessage}
        name={data?.presidentName}
        title={data?.presidentTitle}
        photo={data?.presidentPhoto}
      />

      {/* Actions */}
      <section className="relative overflow-hidden bg-neutral-50 py-20 lg:py-28">
        <div
          className="absolute right-0 top-0 h-64 w-64 rounded-full bg-primary-100/60 blur-3xl"
          aria-hidden
        />
        <div className={cn(publicContainerClass, 'relative')}>
          <SectionHeader
            align="left"
            eyebrow="Impact"
            title="Actions mises en avant"
            description="Des initiatives concrètes au service des communautés locales."
            action={{ label: 'Toutes les actions', to: '/nos-actions' }}
            className="mx-0 max-w-none"
          />

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <ActionCardSkeleton key={i} />
                ))
              : featuredActions.length > 0
                ? featuredActions.slice(0, 3).map((action, index) => (
                    <ScrollReveal key={action.id} delay={index * 0.06}>
                      <ActionCard action={action} className="h-full" />
                    </ScrollReveal>
                  ))
                : (
                  <p className="sm:col-span-2 lg:col-span-3 text-center text-neutral-700">
                    Aucune action mise en avant pour le moment.
                  </p>
                )}
          </div>
        </div>
      </section>

      {/* Actualités + agenda — layout split */}
      <section className={cn(publicContainerClass, 'py-20 lg:py-28')}>
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-8">
            <SectionHeader
              align="left"
              eyebrow="Actualités"
              title="Dernières nouvelles du club"
              action={{ label: 'Toutes les actualités', to: '/nos-actualites' }}
              className="mx-0 max-w-none"
            />
            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              {isLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <NewsCardSkeleton key={i} />
                  ))
                : data?.recentNews.slice(0, 4).map((article, index) => (
                    <ScrollReveal key={article.id} delay={index * 0.06}>
                      <NewsCard article={article} className="h-full" />
                    </ScrollReveal>
                  ))}
            </div>
          </div>

          <aside className="lg:col-span-4">
            <div className="lg:sticky lg:top-24 overflow-hidden rounded-3xl bg-primary-900 text-primary-100 shadow-lift">
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage:
                    'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                  backgroundSize: '20px 20px',
                }}
                aria-hidden
              />
              <div className="relative border-b border-white/10 p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-accent-300">
                  Agenda
                </p>
                <h2 className="mt-2 font-display text-2xl font-bold text-neutral-0">
                  Prochaines réunions
                </h2>
                <Link
                  to="/nos-reunions"
                  className="mt-3 inline-flex text-sm font-medium text-primary-200 transition-colors hover:text-accent-300"
                >
                  Voir tout l&apos;agenda →
                </Link>
              </div>
              <div className="relative space-y-3 p-4">
                {isLoading
                  ? Array.from({ length: 2 }).map((_, i) => (
                      <div
                        key={i}
                        className="animate-pulse rounded-2xl border border-white/10 bg-white/5 p-5"
                      >
                        <div className="h-4 w-2/3 rounded bg-white/10" />
                        <div className="mt-4 space-y-2">
                          <div className="h-3 w-full rounded bg-white/10" />
                          <div className="h-3 w-4/5 rounded bg-white/10" />
                        </div>
                      </div>
                    ))
                  : data?.upcomingMeetings.slice(0, 3).map((meeting) => (
                        <MeetingCard
                          key={meeting.id}
                          title={meeting.title}
                          date={meeting.date}
                          startTime={meeting.startTime}
                          location={meeting.location}
                          slug={meeting.slug}
                          variant="compact"
                          tone="dark"
                          className="border border-white/10 bg-white/5 backdrop-blur-sm"
                        />
                    ))}
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* Bandeau adhésion */}
      <section className="bg-gradient-to-r from-accent-100 via-accent-50 to-primary-100 py-16">
        <ScrollReveal className={cn(publicContainerClass, 'text-center')}>
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-accent-700">
            Rejoignez-nous
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold text-primary-900 md:text-4xl">
            Devenez acteur du changement à Cotonou
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-neutral-700">
            Intégrez le Rotary Club Le Nautile Patronat et participez à des
            actions qui transforment les communautés.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              to="/nous-rejoindre"
              className="inline-flex h-12 items-center rounded-2xl bg-primary-700 px-8 text-sm font-medium text-neutral-0 shadow-soft transition-colors hover:bg-primary-900"
            >
              Candidater à l&apos;adhésion
            </Link>
            <Link
              to="/le-club"
              className="inline-flex h-12 items-center rounded-2xl border border-primary-200 bg-neutral-0 px-8 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-50"
            >
              Découvrir le club
            </Link>
          </div>
        </ScrollReveal>
      </section>

      {data?.socialLinks && data.socialLinks.length > 0 && (
        <section className={cn(publicContainerClass, 'py-14')}>
          <ScrollReveal className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-neutral-400">
                Suivez-nous
              </p>
              <p className="mt-1 text-neutral-700">
                Restez connectés à la vie du club
              </p>
            </div>
            <div className="flex gap-3">
              {data.socialLinks.map((link) => {
                const Icon = socialIcons[link.platform] ?? Facebook;
                return (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-12 w-12 items-center justify-center rounded-xl border border-neutral-100 bg-neutral-0 text-primary-700 shadow-soft transition-all hover:border-primary-200 hover:bg-primary-50 hover:shadow-lift"
                    aria-label={link.platform}
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                );
              })}
            </div>
          </ScrollReveal>
        </section>
      )}
    </>
  );
}
