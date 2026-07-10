import {
  CheckCircle2,
  ClipboardList,
  HandHeart,
  Mail,
  MessageCircle,
  Users,
} from 'lucide-react';
import { ScrollReveal } from '../ScrollReveal';
import { cn } from '@/lib/utils';

const benefits = [
  {
    icon: HandHeart,
    title: 'Servir la communauté',
    description: 'Participez à des actions concrètes à impact local et international.',
  },
  {
    icon: Users,
    title: 'Réseau d\'excellence',
    description: 'Rejoignez des professionnels engagés partageant les valeurs Rotary.',
  },
  {
    icon: CheckCircle2,
    title: 'Développement personnel',
    description: 'Développez votre leadership au sein d\'un Club Satellite Passeport dynamique.',
  },
] as const;

const steps = [
  {
    icon: ClipboardList,
    title: 'Remplissez le formulaire',
    description: 'Présentez-vous et partagez votre motivation en quelques minutes.',
  },
  {
    icon: MessageCircle,
    title: 'Échange avec le club',
    description: 'Notre équipe étudie votre dossier et vous recontacte.',
  },
  {
    icon: Users,
    title: 'Intégration',
    description: 'Après validation, vous rejoignez les activités du club.',
  },
] as const;

export function JoinSidebar() {
  return (
    <div className="space-y-6 lg:sticky lg:top-24">
      <ScrollReveal>
        <div className="overflow-hidden rounded-3xl border border-primary-100 bg-gradient-to-br from-primary-900 to-primary-700 p-7 text-neutral-0 shadow-lift">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-accent-300">
            Club Satellite Passeport
          </p>
          <h2 className="mt-3 font-display text-2xl font-bold leading-tight">
            Pourquoi nous rejoindre ?
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-primary-100">
            Le Nautile Patronat accueille les professionnels motivés par le
            service, l&apos;amitié et l&apos;excellence — au cœur de Cotonou.
          </p>
          <ul className="mt-7 space-y-5">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <li key={benefit.title} className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-accent-300">
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <div>
                    <p className="font-semibold text-neutral-0">{benefit.title}</p>
                    <p className="mt-0.5 text-sm text-primary-200">{benefit.description}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </ScrollReveal>

      <ScrollReveal delay={0.06}>
        <div className="rounded-3xl border border-neutral-100 bg-neutral-0 p-7 shadow-soft">
          <h3 className="font-display text-lg font-semibold text-primary-900">
            Comment ça se passe ?
          </h3>
          <ol className="mt-6 space-y-5">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <li key={step.title} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <span
                      className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold',
                        index === 0
                          ? 'bg-accent-500 text-primary-900'
                          : 'bg-primary-50 text-primary-700',
                      )}
                    >
                      {index + 1}
                    </span>
                    {index < steps.length - 1 && (
                      <span className="mt-2 h-full w-px bg-neutral-100" aria-hidden />
                    )}
                  </div>
                  <div className="pb-1">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-primary-500" aria-hidden />
                      <p className="font-medium text-primary-900">{step.title}</p>
                    </div>
                    <p className="mt-1 text-sm text-neutral-600">{step.description}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </ScrollReveal>

      <ScrollReveal delay={0.1}>
        <div className="rounded-3xl border border-accent-200 bg-accent-50 p-6">
          <div className="flex gap-3">
            <Mail className="mt-0.5 h-5 w-5 shrink-0 text-accent-700" aria-hidden />
            <div>
              <p className="font-semibold text-primary-900">Une question ?</p>
              <p className="mt-1 text-sm text-neutral-700">
                Écrivez-nous à{' '}
                <a
                  href="mailto:contact@nautile-patronat.rotary.bj"
                  className="font-medium text-primary-700 underline-offset-2 hover:underline"
                >
                  contact@nautile-patronat.rotary.bj
                </a>{' '}
                avant de candidater.
              </p>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
}
