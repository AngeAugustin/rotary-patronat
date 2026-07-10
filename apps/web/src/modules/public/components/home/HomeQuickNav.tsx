import { Link } from 'react-router-dom';
import {
  BookOpen,
  Calendar,
  HandHeart,
  Landmark,
  Newspaper,
  UserPlus,
} from 'lucide-react';
import { ScrollReveal } from '../ScrollReveal';
import { publicContainerClass } from '../../constants/layout';
import { cn } from '@/lib/utils';

const quickLinks = [
  { to: '/le-club', label: 'Le Club', icon: Landmark },
  { to: '/nos-actions', label: 'Nos actions', icon: HandHeart },
  { to: '/nos-actualites', label: 'Actualités', icon: Newspaper },
  { to: '/nos-reunions', label: 'Réunions', icon: Calendar },
  { to: '/bibliotheque', label: 'Bibliothèque', icon: BookOpen },
  { to: '/nous-rejoindre', label: 'Nous rejoindre', icon: UserPlus },
] as const;

export function HomeQuickNav() {
  return (
    <ScrollReveal>
      <div className="relative z-10 -mt-8 lg:-mt-10">
        <div className={publicContainerClass}>
          <nav
            className="flex gap-3 overflow-x-auto rounded-2xl border border-neutral-100 bg-neutral-0 p-3 shadow-lift scrollbar-none"
            aria-label="Accès rapide"
          >
            {quickLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={cn(
                  'flex shrink-0 items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-colors',
                  'text-neutral-700 hover:bg-primary-50 hover:text-primary-700',
                  to === '/nous-rejoindre' &&
                    'bg-accent-50 text-accent-700 hover:bg-accent-100 hover:text-accent-700',
                )}
              >
                <Icon className="h-4 w-4 shrink-0 text-primary-500" aria-hidden />
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </ScrollReveal>
  );
}
