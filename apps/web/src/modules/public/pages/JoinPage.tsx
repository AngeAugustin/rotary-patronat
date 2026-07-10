import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { PageHero } from '../components/PageHero';
import { PageSection } from '../components/PageSection';
import { JoinApplicationForm } from '../components/join/JoinApplicationForm';
import { JoinSidebar } from '../components/join/JoinSidebar';
import { ScrollReveal } from '../components/ScrollReveal';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { publicContainerClass } from '../constants/layout';

const JOIN_HERO_IMAGE =
  'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=1200&q=80';

export function JoinPage() {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <>
        <PageHero
          eyebrow="Adhésion"
          title="Merci pour votre candidature"
          description="Votre demande a été transmise à l'administration du club. Nous vous recontacterons prochainement."
        />
        <div className={cn(publicContainerClass, 'max-w-2xl py-16')}>
          <ScrollReveal>
            <div className="rounded-3xl border border-neutral-100 bg-neutral-0 p-10 text-center shadow-lift">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent-100 text-accent-700">
                <CheckCircle2 className="h-8 w-8" aria-hidden />
              </div>
              <h2 className="mt-6 font-display text-2xl font-bold text-primary-900">
                Dossier bien reçu
              </h2>
              <p className="mx-auto mt-3 max-w-md text-neutral-600">
                Notre équipe va examiner votre candidature. Vous recevrez une
                réponse par email dans les prochains jours.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Button asChild variant="outline">
                  <Link to="/le-club">
                    Découvrir le club
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </Button>
                <Button onClick={() => setSubmitted(false)} variant="ghost">
                  Soumettre une autre candidature
                </Button>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHero
        eyebrow="Rejoignez-nous"
        title="Nous rejoindre"
        description="Intégrez le Rotary Club Cotonou Le Nautile Patronat et engagez-vous aux côtés de membres passionnés par le service et l'impact social."
        imageUrl={JOIN_HERO_IMAGE}
      />

      <PageSection tone="muted" className="pt-10">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12 xl:gap-16">
          <aside className="lg:col-span-4 xl:col-span-4">
            <JoinSidebar />
          </aside>

          <div className="lg:col-span-8 xl:col-span-8">
            <ScrollReveal delay={0.05}>
              <JoinApplicationForm onSuccess={() => setSubmitted(true)} />
            </ScrollReveal>
          </div>
        </div>
      </PageSection>
    </>
  );
}
