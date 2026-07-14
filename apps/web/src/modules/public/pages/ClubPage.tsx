import { Link } from 'react-router-dom';
import { ArrowRight, Eye, Target } from 'lucide-react';
import type { ExecutiveMember } from '@rotary/shared-types';
import { PageHero } from '../components/PageHero';
import { PageSection } from '../components/PageSection';
import { ClubHeritageSection } from '../components/ClubHeritageSection';
import { ClubRiPresidentSection } from '../components/ClubRiPresidentSection';
import { SectionHeader } from '../components/SectionHeader';
import { ScrollReveal } from '../components/ScrollReveal';
import { useClubProfile } from '../hooks/use-public-content';
import { publicCommissions } from '../constants/public-commissions';
import { cn } from '@/lib/utils';
import { publicContainerClass } from '../constants/layout';

const CLUB_HERO_IMAGE =
  'https://i.postimg.cc/90x6v9jn/PHOTO-2026-07-06-10-12-16.jpg';

function isPastPresidentRole(role: string) {
  return /past president/i.test(role);
}

function PortraitImage({
  name,
  photo,
  className,
  initialClassName,
}: {
  name: string;
  photo?: string | null;
  className?: string;
  initialClassName?: string;
}) {
  if (photo) {
    return (
      <img
        src={photo}
        alt={`Portrait de ${name}`}
        className={cn('h-full w-full object-cover object-top', className)}
        loading="lazy"
      />
    );
  }

  return (
    <div
      className={cn(
        'flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-100 to-primary-200',
        className,
      )}
    >
      <span
        className={cn(
          'font-display font-semibold text-primary-400/80',
          initialClassName,
        )}
      >
        {name.charAt(0)}
      </span>
    </div>
  );
}

function OfficerTile({
  member,
  className,
}: {
  member: ExecutiveMember;
  className?: string;
}) {
  return (
    <article className={cn('group', className)}>
      <div className="relative overflow-hidden rounded-2xl bg-neutral-100 shadow-soft">
        <div className="aspect-[4/5]">
          <PortraitImage
            name={member.name}
            photo={member.photo}
            className="transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
            initialClassName="text-5xl"
          />
        </div>
      </div>
      <div className="mt-5 space-y-1.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-700">
          {member.role}
        </p>
        <h3 className="font-display text-xl font-semibold tracking-tight text-primary-900">
          {member.name}
        </h3>
      </div>
    </article>
  );
}

function ExecutiveBureau({ members }: { members: ExecutiveMember[] }) {
  const president = members.find((m) => m.role === 'Président');
  const officers = members.filter(
    (m) => m.role !== 'Président' && !isPastPresidentRole(m.role),
  );
  const pastPresidents = members.filter((m) => isPastPresidentRole(m.role));
  const officersTop = officers.slice(0, 3);
  const officersBottom = officers.slice(3);

  return (
    <div className="mt-14 space-y-20 lg:space-y-24">
      {president && (
        <ScrollReveal>
          <div className="relative overflow-hidden rounded-[1.75rem] bg-primary-900 text-neutral-0">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700" />
            <div
              className="absolute -right-20 top-0 h-72 w-72 rounded-full bg-accent-500/15 blur-3xl"
              aria-hidden
            />
            <div
              className="absolute -left-16 bottom-0 h-56 w-56 rounded-full bg-primary-500/25 blur-3xl"
              aria-hidden
            />

            <div className="relative grid items-stretch lg:grid-cols-12">
              <div className="relative lg:col-span-5">
                <div className="aspect-[4/5] sm:aspect-[5/6] lg:aspect-auto lg:h-full lg:min-h-[28rem]">
                  <PortraitImage
                    name={president.name}
                    photo={president.photo}
                    className="lg:absolute lg:inset-0"
                    initialClassName="text-7xl text-primary-300/50"
                  />
                </div>
              </div>

              <div className="flex flex-col justify-end px-6 py-10 sm:px-10 sm:py-12 lg:col-span-7 lg:px-14 lg:py-16">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent-300">
                  {president.role}
                </p>
                <div className="mt-5 h-px w-14 bg-accent-500/80" aria-hidden />
                <h3 className="mt-6 font-display text-3xl font-semibold tracking-tight text-neutral-0 sm:text-4xl lg:text-5xl lg:leading-[1.1]">
                  {president.name}
                </h3>
                {president.bio && (
                  <p className="mt-5 max-w-md text-base leading-relaxed text-primary-100/90">
                    {president.bio}
                  </p>
                )}
              </div>
            </div>
          </div>
        </ScrollReveal>
      )}

      {officers.length > 0 && (
        <div>
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-neutral-200" aria-hidden />
            <p className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
              Composition du bureau
            </p>
            <div className="h-px flex-1 bg-neutral-200" aria-hidden />
          </div>

          <ul className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-14">
            {officersTop.map((member, i) => (
              <li key={member.id}>
                <ScrollReveal delay={i * 0.05}>
                  <OfficerTile member={member} />
                </ScrollReveal>
              </li>
            ))}
          </ul>

          {officersBottom.length > 0 && (
            <ul
              className={cn(
                'mt-10 grid gap-10 sm:grid-cols-2 lg:gap-x-8 lg:gap-y-14',
                officersBottom.length === 2 &&
                  'lg:mx-auto lg:max-w-3xl lg:grid-cols-2',
                officersBottom.length === 1 && 'mx-auto max-w-sm',
              )}
            >
              {officersBottom.map((member, i) => (
                <li key={member.id}>
                  <ScrollReveal delay={(officersTop.length + i) * 0.05}>
                    <OfficerTile member={member} />
                  </ScrollReveal>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {pastPresidents.length > 0 && (
        <div className="rounded-[1.75rem] border border-neutral-100 bg-neutral-0/70 px-5 py-10 sm:px-8 sm:py-12 lg:px-12">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
              Continuité
            </p>
            <h3 className="mt-2 font-display text-2xl font-semibold tracking-tight text-primary-900">
              Ancienne présidence
            </h3>
          </div>

          <ul className="mt-10 grid gap-8 sm:grid-cols-2 lg:gap-12">
            {pastPresidents.map((member, i) => (
              <li key={member.id}>
                <ScrollReveal delay={i * 0.05}>
                  <div className="flex items-center gap-5 sm:gap-6">
                    <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-neutral-100 shadow-soft sm:h-36 sm:w-36">
                      <PortraitImage
                        name={member.name}
                        photo={member.photo}
                        initialClassName="text-4xl"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-700">
                        {member.role}
                      </p>
                      <h4 className="mt-2 font-display text-xl font-semibold tracking-tight text-primary-900 sm:text-2xl">
                        {member.name}
                      </h4>
                    </div>
                  </div>
                </ScrollReveal>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

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

      <ClubHeritageSection history={data.history} />

      <PageSection>
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

      {data.riPresidentName &&
        data.riPresidentTitle &&
        data.riPresidentBio &&
        data.riPresidentMessage && (
          <ClubRiPresidentSection
            name={data.riPresidentName}
            title={data.riPresidentTitle}
            bio={data.riPresidentBio}
            message={data.riPresidentMessage}
            photo={data.riPresidentPhoto}
          />
        )}

      <PageSection tone="muted">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16 lg:items-start">
          <SectionHeader
            align="left"
            eyebrow="Fondements"
            title="Nos valeurs"
            description="Les principes qui guident chacune de nos actions."
            className="mx-0 max-w-md text-left lg:col-span-4 lg:sticky lg:top-28"
          />

          <ul className="lg:col-span-8">
            {data.values.map((value, i) => (
              <li key={value}>
                <ScrollReveal delay={i * 0.04}>
                  <div
                    className={cn(
                      'group flex items-baseline gap-6 py-6 sm:gap-8 sm:py-7',
                      i < data.values.length - 1 && 'border-b border-neutral-200/80',
                    )}
                  >
                    <span className="w-8 shrink-0 font-display text-sm font-semibold tabular-nums tracking-wide text-primary-300 transition-colors group-hover:text-accent-500 sm:w-10">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <p className="font-display text-xl font-semibold tracking-tight text-primary-900 sm:text-2xl">
                      {value}
                    </p>
                  </div>
                </ScrollReveal>
              </li>
            ))}
          </ul>
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

      <PageSection tone="muted">
        <SectionHeader
          align="left"
          eyebrow="Gouvernance"
          title="Bureau exécutif"
          description="L’équipe qui anime et représente le club."
          className="mx-0 max-w-2xl text-left"
        />

        <ExecutiveBureau members={data.executive} />
      </PageSection>

      <PageSection>
        <SectionHeader
          align="left"
          title="Commissions"
          description="Les pôles d'action qui structurent la vie du club."
          className="mx-0 max-w-none"
        />
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {publicCommissions.map((commission, i) => (
            <ScrollReveal key={commission.slug} delay={i * 0.05}>
              <article className="group flex h-full flex-col rounded-3xl border border-neutral-100 bg-neutral-0 p-7 shadow-soft transition-all hover:border-primary-200 hover:shadow-lift">
                <div className="h-1 w-12 rounded-full bg-accent-500" />
                <h3 className="mt-5 font-display text-xl font-semibold text-primary-900">
                  {commission.name}
                </h3>
                <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-accent-700">
                  {commission.contact.name}
                </p>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-neutral-700">
                  {commission.shortDescription}
                </p>
                <Link
                  to={`/le-club/commissions/${commission.slug}`}
                  className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary-700 transition-colors hover:text-accent-700"
                >
                  Voir la fiche
                  <ArrowRight
                    className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </Link>
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
