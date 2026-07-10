import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  Building2,
  Calendar,
  HeartHandshake,
  KeyRound,
  Mail,
  Phone,
  Shield,
  Timer,
  Users,
} from 'lucide-react';
import {
  MEMBER_STATUS_LABELS,
  ROLE_LABELS,
  VOLUNTEERING_STATUS_LABELS,
} from '@rotary/shared-types';
import { fetchMyProfile } from '../api';
import { queryKeys } from '@/lib/query-keys';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '../components/UserAvatar';
import { DashboardPageShell, DashboardSkeleton } from '../components/layout';
import { cn } from '@/lib/utils';

function formatDate(date: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));
}

function formatDateShort(date: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

function InfoChip({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2.5 rounded-xl border border-neutral-100/80 bg-neutral-0/60 px-3 py-2">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
        <Icon className="h-3.5 w-3.5" aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">{label}</p>
        <p className="truncate text-sm font-medium text-primary-900">{value}</p>
      </div>
    </div>
  );
}

export function ProfilePage() {
  const { data: profile, isLoading } = useQuery({
    queryKey: queryKeys.dashboard.profile,
    queryFn: fetchMyProfile,
  });

  if (isLoading) {
    return (
      <DashboardPageShell width="wide">
        <div className="space-y-4">
          <DashboardSkeleton className="h-40 w-full rounded-2xl" />
          <DashboardSkeleton className="h-28 w-full rounded-2xl" />
          <DashboardSkeleton className="h-48 w-full rounded-2xl" />
        </div>
      </DashboardPageShell>
    );
  }

  if (!profile) {
    return (
      <DashboardPageShell width="wide">
        <p className="text-center text-neutral-700">Impossible de charger votre profil.</p>
      </DashboardPageShell>
    );
  }

  const fullName = `${profile.firstName} ${profile.lastName}`;
  const hasSponsor = Boolean(profile.sponsorFirstName && profile.sponsorLastName);
  const hasMember = Boolean(profile.memberId);
  const isMemberActive = profile.memberStatus === 'ACTIVE';

  return (
    <DashboardPageShell width="wide" className="space-y-4">
      {/* En-tête */}
      <section className="overflow-hidden rounded-2xl border border-neutral-100 bg-neutral-0 shadow-soft">
        <div className="bg-gradient-to-br from-primary-50/90 via-neutral-0 to-neutral-0 px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <UserAvatar
                firstName={profile.firstName}
                lastName={profile.lastName}
                size="lg"
                className={cn(
                  'ring-2 shadow-soft',
                  profile.isActive ? 'ring-emerald-200' : 'ring-red-200',
                )}
              />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-xl font-semibold tracking-tight text-primary-900 sm:text-2xl">
                    {fullName}
                  </h1>
                  <Badge variant={profile.isActive ? 'success' : 'danger'}>
                    {profile.isActive ? 'Compte actif' : 'Compte inactif'}
                  </Badge>
                  {hasMember && profile.memberStatus && (
                    <Badge variant={isMemberActive ? 'success' : 'danger'}>
                      {MEMBER_STATUS_LABELS[profile.memberStatus]}
                    </Badge>
                  )}
                </div>
                <p className="mt-0.5 text-sm text-neutral-600">
                  {profile.profession ?? 'Profession non renseignée'}
                </p>
                {profile.joinedAt && (
                  <p className="mt-1 text-xs text-neutral-400">
                    Membre depuis le {formatDateShort(profile.joinedAt)}
                  </p>
                )}
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Button asChild variant="outline" size="sm" className="bg-neutral-0/80">
                <Link to="/dashboard/benevolat">Mon bénévolat</Link>
              </Button>
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            <InfoChip icon={Mail} label="Email" value={profile.email} />
            <InfoChip icon={Phone} label="Téléphone" value={profile.phone ?? 'Non renseigné'} />
            <InfoChip
              icon={Briefcase}
              label="Profession"
              value={profile.profession ?? 'Non renseignée'}
            />
            <InfoChip
              icon={Users}
              label="Parrain"
              value={
                hasSponsor
                  ? `${profile.sponsorFirstName} ${profile.sponsorLastName}`
                  : 'Non renseigné'
              }
            />
            <InfoChip
              icon={Timer}
              label="Heures validées"
              value={`${profile.volunteering.validatedHours} h`}
            />
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="flex flex-col gap-4 lg:col-span-3">
          {profile.motivation && (
            <section className="rounded-2xl border border-neutral-100 bg-neutral-0 p-5 shadow-soft">
              <h2 className="font-display text-sm font-semibold text-primary-900">Motivation</h2>
              <blockquote className="mt-3 border-l-2 border-primary-200 pl-4 text-sm leading-relaxed text-neutral-700">
                {profile.motivation}
              </blockquote>
            </section>
          )}

          <section className="rounded-2xl border border-neutral-100 bg-neutral-0 p-5 shadow-soft">
            <div className="mb-3 flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary-600" aria-hidden />
              <h2 className="font-display text-sm font-semibold text-primary-900">Rôles</h2>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {profile.roles.map((role) => (
                <Badge key={role}>{ROLE_LABELS[role]}</Badge>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-neutral-100 bg-neutral-0 p-5 shadow-soft">
            <div className="mb-3 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary-600" aria-hidden />
              <h2 className="font-display text-sm font-semibold text-primary-900">
                Commissions
                {profile.commissions.length > 0 && (
                  <span className="ml-1.5 font-normal text-neutral-400">
                    ({profile.commissions.length})
                  </span>
                )}
              </h2>
            </div>

            {profile.commissions.length > 0 ? (
              <ul className="space-y-2">
                {profile.commissions.map((commission) => (
                  <li
                    key={commission.commissionId}
                    className="flex items-center justify-between gap-3 rounded-xl border border-neutral-100 px-4 py-3"
                  >
                    <span className="text-sm font-medium text-primary-900">
                      {commission.commissionName}
                    </span>
                    <span className="shrink-0 rounded-lg bg-neutral-50 px-2.5 py-1 text-xs font-medium text-neutral-600">
                      {commission.role}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-neutral-500">
                Vous n&apos;êtes rattaché à aucune commission pour le moment.
              </p>
            )}
          </section>

          <section className="rounded-2xl border border-neutral-100 bg-neutral-0 p-5 shadow-soft">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <HeartHandshake className="h-4 w-4 text-primary-600" aria-hidden />
                <h2 className="font-display text-sm font-semibold text-primary-900">
                  Bénévolat
                  {profile.volunteering.declarationCount > 0 && (
                    <span className="ml-1.5 font-normal text-neutral-400">
                      ({profile.volunteering.declarationCount})
                    </span>
                  )}
                </h2>
              </div>
              <Button asChild variant="ghost" size="sm" className="h-8 text-xs">
                <Link to="/dashboard/benevolat">Voir tout</Link>
              </Button>
            </div>

            {profile.volunteeringDeclarations.length === 0 ? (
              <p className="text-sm text-neutral-500">
                Aucune déclaration de bénévolat pour le moment.
              </p>
            ) : (
              <ul className="space-y-2">
                {profile.volunteeringDeclarations.map((declaration) => (
                  <li key={declaration.id}>
                    <Link
                      to="/dashboard/benevolat"
                      className="block rounded-xl border border-neutral-100 px-4 py-3 transition-colors hover:border-primary-200 hover:bg-primary-50/40"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-primary-900">
                            {declaration.visitedClub}
                          </p>
                          <p className="mt-0.5 text-xs text-neutral-500">
                            {declaration.activity} · {declaration.city}, {declaration.country}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <Badge
                            variant={
                              declaration.status === 'VALIDATED'
                                ? 'success'
                                : declaration.status === 'REJECTED'
                                  ? 'danger'
                                  : 'warning'
                            }
                          >
                            {VOLUNTEERING_STATUS_LABELS[declaration.status]}
                          </Badge>
                          <span className="text-xs font-semibold tabular-nums text-neutral-700">
                            {declaration.hours} h
                          </span>
                        </div>
                      </div>
                      <p className="mt-2 text-xs text-neutral-400">
                        {formatDateShort(declaration.date)}
                        {declaration.status === 'VALIDATED' && declaration.validatedByName
                          ? ` · Validée par ${declaration.validatedByName}`
                          : ''}
                      </p>
                      {declaration.rejectionReason && (
                        <p className="mt-2 text-xs text-red-700">
                          Motif : {declaration.rejectionReason}
                        </p>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="flex flex-col gap-4 lg:col-span-2">
          <section className="rounded-2xl border border-neutral-100 bg-neutral-0 p-5 shadow-soft">
            <div className="mb-3 flex items-center gap-2">
              <Timer className="h-4 w-4 text-primary-600" aria-hidden />
              <h2 className="font-display text-sm font-semibold text-primary-900">
                Heures de bénévolat
              </h2>
            </div>
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-neutral-500">Heures validées</dt>
                <dd className="font-semibold tabular-nums text-emerald-700">
                  {profile.volunteering.validatedHours} h
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-neutral-50 pt-3">
                <dt className="text-neutral-500">En attente</dt>
                <dd className="font-medium tabular-nums text-amber-700">
                  {profile.volunteering.pendingHours} h
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-neutral-50 pt-3">
                <dt className="text-neutral-500">Total déclaré</dt>
                <dd className="font-medium tabular-nums text-neutral-900">
                  {profile.volunteering.totalDeclaredHours} h
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-neutral-50 pt-3">
                <dt className="text-neutral-500">Déclarations</dt>
                <dd className="font-medium text-neutral-900">
                  {profile.volunteering.validatedCount} validée
                  {profile.volunteering.validatedCount > 1 ? 's' : ''}
                  {profile.volunteering.pendingCount > 0
                    ? ` · ${profile.volunteering.pendingCount} en attente`
                    : ''}
                  {profile.volunteering.rejectedCount > 0
                    ? ` · ${profile.volunteering.rejectedCount} refusée${profile.volunteering.rejectedCount > 1 ? 's' : ''}`
                    : ''}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-neutral-100 bg-neutral-0 p-5 shadow-soft">
            <div className="mb-3 flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-primary-600" aria-hidden />
              <h2 className="font-display text-sm font-semibold text-primary-900">
                Compte et accès
              </h2>
            </div>
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-3.5 py-3">
              <p className="text-sm font-medium text-emerald-800">
                {profile.isActive ? 'Accès espace connecté' : 'Compte désactivé'}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-emerald-700/80">
                {hasMember
                  ? 'Votre fiche membre est liée à ce compte.'
                  : 'Aucune fiche membre n\u2019est encore associée à ce compte.'}
              </p>
            </div>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-neutral-500">Email de connexion</dt>
                <dd className="truncate font-medium text-neutral-900">{profile.email}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-neutral-50 pt-3">
                <dt className="text-neutral-500">Statut du compte</dt>
                <dd className="font-medium text-neutral-900">
                  {profile.isActive ? 'Actif' : 'Inactif'}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-neutral-100 bg-neutral-0 p-5 shadow-soft">
            <div className="mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary-600" aria-hidden />
              <h2 className="font-display text-sm font-semibold text-primary-900">Historique</h2>
            </div>
            <dl className="space-y-3 text-sm">
              {profile.joinedAt && (
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-neutral-500">Adhésion</dt>
                  <dd className="font-medium text-neutral-900">{formatDate(profile.joinedAt)}</dd>
                </div>
              )}
              <div
                className={cn(
                  'flex items-center justify-between gap-3',
                  profile.joinedAt && 'border-t border-neutral-50 pt-3',
                )}
              >
                <dt className="text-neutral-500">Compte créé</dt>
                <dd className="font-medium text-neutral-900">
                  {formatDateShort(profile.createdAt)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-neutral-50 pt-3">
                <dt className="text-neutral-500">Dernière mise à jour</dt>
                <dd className="font-medium text-neutral-900">
                  {formatDateShort(profile.updatedAt)}
                </dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
    </DashboardPageShell>
  );
}
