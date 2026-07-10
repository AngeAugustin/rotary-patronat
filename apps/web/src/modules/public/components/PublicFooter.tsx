import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppLogo } from '@/components/AppLogo';
import { cn } from '@/lib/utils';
import { footerLinkGroups } from '../constants/navigation';
import { publicContainerClass } from '../constants/layout';

const socialLinks = [
  { platform: 'Facebook', href: 'https://facebook.com', icon: Facebook },
  { platform: 'LinkedIn', href: 'https://linkedin.com', icon: Linkedin },
  { platform: 'Instagram', href: 'https://instagram.com', icon: Instagram },
] as const;

export function PublicFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-auto">
      {/* Bandeau CTA — fond clair chaud accentué, transition vers le footer sombre */}
      <div className="relative overflow-hidden border-b border-primary-200/90 bg-gradient-to-br from-accent-100 via-accent-50 to-primary-100">
        <div
          className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent-300/25 blur-3xl"
          aria-hidden
        />
        <div
          className="absolute -bottom-16 left-1/3 h-56 w-56 rounded-full bg-primary-300/20 blur-3xl"
          aria-hidden
        />
        <div
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgb(23 69 143 / 0.12) 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
          aria-hidden
        />
        <div
          className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-accent-500 via-accent-300 to-primary-500"
          aria-hidden
        />
        <div className={cn(publicContainerClass, 'relative flex flex-col items-start justify-between gap-6 py-10 md:flex-row md:items-center')}>
          <div className="max-w-xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent-700">
              Rejoignez l&apos;aventure
            </p>
            <p className="mt-2 font-display text-2xl font-bold text-primary-900 md:text-3xl">
              Engagez-vous au service des communautés
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              asChild
              size="lg"
              className="bg-accent-500 text-primary-900 shadow-soft hover:bg-accent-300"
            >
              <Link to="/nous-rejoindre">
                Nous rejoindre
                <ArrowUpRight className="ml-1 h-4 w-4" aria-hidden />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-primary-200 bg-neutral-0/80 text-primary-700 hover:border-primary-300 hover:bg-primary-50"
            >
              <Link to="/connexion">Espace membre</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Corps principal */}
      <div className="relative bg-primary-900 text-primary-100">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-500 to-transparent" />

        <div className={cn(publicContainerClass, 'py-16')}>
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
            {/* Identité */}
            <div className="lg:col-span-4">
              <Link
                to="/"
                className="inline-block rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-300"
              >
                <AppLogo className="brightness-0 invert" />
              </Link>
              <p className="mt-5 max-w-xs text-sm leading-relaxed text-primary-300">
                Club Satellite Passeport au service de Cotonou et du Bénin.
                Servir plus, servir mieux.
              </p>

              <div className="mt-6 flex gap-2">
                {socialLinks.map(({ platform, href, icon: Icon }) => (
                  <a
                    key={platform}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary-700/80 bg-primary-800/50 text-primary-100 transition-colors hover:border-accent-500/50 hover:bg-primary-700 hover:text-accent-300"
                    aria-label={platform}
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* Navigation groupée */}
            {footerLinkGroups.map((group) => (
              <nav
                key={group.title}
                className="lg:col-span-2"
                aria-label={group.title}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-accent-300">
                  {group.title}
                </p>
                <ul className="mt-4 space-y-3">
                  {group.links.map((link) => (
                    <li key={link.to}>
                      <Link
                        to={link.to}
                        className="text-sm text-primary-200 transition-colors hover:text-neutral-0"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}

            {/* Contact */}
            <div className="lg:col-span-4">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-accent-300">
                Contact
              </p>
              <ul className="mt-4 space-y-4">
                <li className="flex gap-3 text-sm text-primary-200">
                  <MapPin
                    className="mt-0.5 h-4 w-4 shrink-0 text-accent-500"
                    aria-hidden
                  />
                  <span>Cotonou, République du Bénin</span>
                </li>
                <li>
                  <a
                    href="mailto:contact@nautile-patronat.rotary.bj"
                    className="flex gap-3 text-sm text-primary-200 transition-colors hover:text-neutral-0"
                  >
                    <Mail
                      className="mt-0.5 h-4 w-4 shrink-0 text-accent-500"
                      aria-hidden
                    />
                    contact@nautile-patronat.rotary.bj
                  </a>
                </li>
              </ul>

              <div className="mt-8 rounded-2xl border border-primary-700/60 bg-primary-800/40 p-5 backdrop-blur-sm">
                <p className="text-sm font-medium text-neutral-0">
                  Membre Rotary International
                </p>
                <p className="mt-1 text-xs leading-relaxed text-primary-300">
                  District 9103 — Rotary Club Cotonou Le Nautile Patronat
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Barre inférieure */}
        <div className="border-t border-primary-700/50">
          <div className={cn(publicContainerClass, 'flex flex-col items-center justify-between gap-4 py-6 text-xs text-primary-400 md:flex-row')}>
            <p>
              © {year} Rotary Club Cotonou Le Nautile Patronat. Tous droits
              réservés.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              <Link
                to="/nous-rejoindre"
                className="transition-colors hover:text-accent-300"
              >
                Adhésion
              </Link>
              <a
                href="https://www.rotary.org"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 transition-colors hover:text-accent-300"
              >
                Rotary International
                <ArrowUpRight className="h-3 w-3" aria-hidden />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
