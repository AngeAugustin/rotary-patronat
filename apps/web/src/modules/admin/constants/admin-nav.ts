import { HandHeart, Newspaper, type LucideIcon } from 'lucide-react';
import {
  Users,
  Building2,
  ScrollText,
  HeartHandshake,
  Shield,
  UserPlus,
  UserCircle,
} from 'lucide-react';

export const ADMIN_BASE_PATH = '/dashboard/administration';

export const adminTabs = [
  { segment: 'utilisateurs', label: 'Utilisateurs', icon: Users },
  { segment: 'membres', label: 'Membres', icon: UserCircle },
  { segment: 'commissions', label: 'Commissions', icon: Building2 },
  { segment: 'actions', label: 'Actions', icon: HandHeart },
  { segment: 'actualites', label: 'Actualités', icon: Newspaper },
  { segment: 'journal', label: 'Journal', icon: ScrollText },
  { segment: 'benevolat', label: 'Bénévolat', icon: HeartHandshake },
  { segment: 'moderation', label: 'Modération', icon: Shield },
  { segment: 'adhesions', label: 'Adhésions', icon: UserPlus },
] as const satisfies ReadonlyArray<{
  segment: string;
  label: string;
  icon: LucideIcon;
}>;

export type AdminTabSegment = (typeof adminTabs)[number]['segment'];

export function adminTabPath(segment: string) {
  return `${ADMIN_BASE_PATH}/${segment}`;
}
