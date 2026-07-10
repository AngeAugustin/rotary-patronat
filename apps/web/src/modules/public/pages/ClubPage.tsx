import { Eye, Heart, Landmark, Target, Users } from 'lucide-react';
import { PageHero } from '../components/PageHero';
import { PageSection } from '../components/PageSection';
import { ClubHistoryTimeline } from '../components/ClubHistoryTimeline';
import { SectionHeader } from '../components/SectionHeader';
import { ScrollReveal } from '../components/ScrollReveal';
import { useClubProfile } from '../hooks/use-public-content';
import { cn } from '@/lib/utils';
import { publicContainerClass } from '../constants/layout';

const valueIcons = [Heart, Target, Users, Eye, Landmark];

const CLUB_HERO_IMAGE =
  'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=1200&q=80';

export function ClubPage() {
  const { data, isLoading, isError } = useClubProfile();

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-10 w-56 animate-pulse rounded-2xl bg-neutral-100" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className={cn(publicContainerClass, 'max-w-3xl py-20 text-center text-neutral-700')}>
        Impossible de charger le profil du club. Vérifiez que l&apos;API est démarrée.
      </div>
    );
  }

  return (
    <>
      <PageHero
        eyebrow="Le Club"
        title="Rotary Club Cotonou Le Nautile Patronat"
        description="Découvrez notre histoire, nos valeurs et l'organisation qui porte nos actions au quotidien."
        imageUrl={CLUB_HERO_IMAGE}
      />

      <PageSection>
        <SectionHeader
          align="left"
          eyebrow="Héritage"
          title="Notre histoire"
          className="mx-0 max-w-2xl text-left"
        />
        <ScrollReveal className="mt-10 max-w-4xl">
          <p className="text-xl leading-relaxed text-neutral-700 md:text-2xl md:leading-relaxed">
            {data.history}
          </p>
        </ScrollReveal>
      </PageSection>

      <ClubHistoryTimeline events={data.timeline} />

      <PageSection tone="muted">
        <div className="grid gap-6 lg:grid-cols-2">
          <ScrollReveal>
            <div className="h-full rounded-3xl border border-primary-100 bg-neutral-0 p-8 shadow-soft">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100 text-primary-700">
                <Eye className="h-6 w-6" aria-hidden />
              </div>
              <h2 className="mt-6 font-display text-2xl font-bold text-primary-900">Vision</h2>
              <p className="mt-4 leading-relaxed text-neutral-700">{data.vision}</p>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={0.08}>
            <div className="h-full rounded-3xl border border-accent-100 bg-neutral-0 p-8 shadow-soft">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-100 text-accent-700">
                <Target className="h-6 w-6" aria-hidden />
              </div>
              <h2 className="mt-6 font-display text-2xl font-bold text-primary-900">Mission</h2>
              <p className="mt-4 leading-relaxed text-neutral-700">{data.mission}</p>
            </div>
          </ScrollReveal>
        </div>
      </PageSection>

      <PageSection tone="accent">
        <SectionHeader
          align="left"
          title="Nos valeurs"
          description="Les principes qui guident chacune de nos actions."
          className="mx-0 max-w-2xl text-left"
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.values.map((value, i) => {
            const Icon = valueIcons[i % valueIcons.length];
            return (
              <ScrollReveal key={value} delay={i * 0.05}>
                <div className="flex items-start gap-4 rounded-2xl border border-white/60 bg-neutral-0/80 p-6 shadow-soft backdrop-blur-sm">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-700 text-neutral-0">
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <p className="font-medium text-primary-900">{value}</p>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </PageSection>

      <PageSection tone="primary">
        <SectionHeader
          align="left"
          title="Organisation"
          className="mx-0 max-w-2xl text-left"
        />
        <ScrollReveal className="mt-8 max-w-3xl">
          <p className="text-lg leading-relaxed text-neutral-700">{data.organization}</p>
        </ScrollReveal>
      </PageSection>

      <PageSection>
        <SectionHeader
          align="left"
          eyebrow="Gouvernance"
          title="Bureau exécutif"
          className="mx-0 max-w-none"
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {data.executive.map((member, i) => (
            <ScrollReveal key={member.id} delay={i * 0.05}>
              <article className="group overflow-hidden rounded-3xl border border-neutral-100 bg-neutral-0 shadow-soft transition-shadow hover:shadow-lift">
                <div className="relative aspect-square overflow-hidden bg-primary-50">
                  {member.photo ? (
                    <img
                      src={member.photo}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center font-display text-5xl font-bold text-primary-200">
                      {member.name.charAt(0)}
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-primary-900/80 to-transparent p-4 pt-12">
                    <p className="text-xs font-semibold uppercase tracking-wider text-accent-300">
                      {member.role}
                    </p>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-display text-lg font-semibold text-primary-900">
                    {member.name}
                  </h3>
                </div>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </PageSection>

      <PageSection tone="muted">
        <SectionHeader
          align="left"
          title="Commissions"
          description="Les pôles d'action qui structurent la vie du club."
          className="mx-0 max-w-none"
        />
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {data.commissions.map((commission, i) => (
            <ScrollReveal key={commission.id} delay={i * 0.05}>
              <article className="h-full rounded-3xl border border-neutral-100 bg-neutral-0 p-7 shadow-soft transition-all hover:border-primary-200 hover:shadow-lift">
                <div className="h-1 w-12 rounded-full bg-accent-500" />
                <h3 className="mt-5 font-display text-xl font-semibold text-primary-900">
                  {commission.name}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-neutral-700">
                  {commission.description}
                </p>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </PageSection>

      {data.gallery.length > 0 && (
        <PageSection>
          <SectionHeader
            align="left"
            eyebrow="Moments forts"
            title="Galerie photos"
            className="mx-0 max-w-none"
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.gallery.map((image, i) => (
              <ScrollReveal
                key={image.id}
                delay={i * 0.04}
                className={cn(i === 0 && 'sm:col-span-2 sm:row-span-2')}
              >
                <figure className="group h-full overflow-hidden rounded-3xl">
                  <img
                    src={image.url}
                    alt={image.caption ?? ''}
                    className={cn(
                      'w-full object-cover transition-transform duration-500 group-hover:scale-105',
                      i === 0 ? 'aspect-[16/10] sm:aspect-auto sm:h-full sm:min-h-[320px]' : 'aspect-[4/3]',
                    )}
                    loading="lazy"
                  />
                  {image.caption && (
                    <figcaption className="mt-3 text-sm text-neutral-400">
                      {image.caption}
                    </figcaption>
                  )}
                </figure>
              </ScrollReveal>
            ))}
          </div>
        </PageSection>
      )}
    </>
  );
}
