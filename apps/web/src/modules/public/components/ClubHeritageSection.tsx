import { ScrollReveal } from './ScrollReveal';
import { PageSection } from './PageSection';

interface ClubHeritageSectionProps {
  history: string;
}

/** Split the first sentence for a softer lead + body rhythm. */
function splitHistory(history: string): { lead: string; body: string } {
  const match = history.match(/^(.+?[.!?])(?:\s+|$)([\s\S]*)$/);
  if (!match?.[1] || !match[2]?.trim()) {
    return { lead: history, body: '' };
  }
  return { lead: match[1].trim(), body: match[2].trim() };
}

export function ClubHeritageSection({ history }: ClubHeritageSectionProps) {
  const { lead, body } = splitHistory(history);

  return (
    <PageSection tone="muted" className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-primary-100/50 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-16 bottom-0 h-64 w-64 rounded-full bg-accent-100/40 blur-3xl"
        aria-hidden
      />

      <div className="relative grid gap-12 lg:grid-cols-12 lg:gap-16 lg:items-start">
        <ScrollReveal className="lg:col-span-4">
          <div className="lg:sticky lg:top-28">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-700">
              Héritage
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-primary-900 sm:text-4xl">
              Notre histoire
            </h2>

            <div className="mt-8 flex items-stretch gap-4">
              <div
                className="w-px shrink-0 bg-gradient-to-b from-accent-400 via-primary-300 to-transparent"
                aria-hidden
              />
              <div className="space-y-5 py-0.5">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-400">
                    Fondation
                  </p>
                  <p className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-primary-800">
                    2 juin 2025
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-400">
                    District
                  </p>
                  <p className="mt-1.5 text-sm font-semibold text-primary-800">9103</p>
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-400">
                    Cadre
                  </p>
                  <p className="mt-1.5 text-sm leading-snug text-neutral-600">
                    Club Satellite Passeport
                  </p>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.06} className="lg:col-span-8">
          <div className="relative pl-0 sm:pl-2 lg:pt-1">
            <p className="font-display text-xl font-medium leading-relaxed tracking-tight text-primary-900 sm:text-2xl sm:leading-relaxed">
              {lead}
            </p>

            {body ? (
              <p className="mt-7 max-w-2xl text-base leading-[1.8] text-neutral-600 sm:text-[17px] sm:leading-[1.85]">
                {body}
              </p>
            ) : null}
          </div>
        </ScrollReveal>
      </div>
    </PageSection>
  );
}
