import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Briefcase,
  Building2,
  Calendar,
  HeartHandshake,
  KeyRound,
  Mail,
  Phone,
  Timer,
  UserPlus,
  Users,
} from 'lucide-react';
import {
  MEMBER_STATUS_LABELS,
  VOLUNTEERING_STATUS_LABELS,
} from '@rotary/shared-types';
import { fetchMember } from '../api';
import { queryKeys } from '@/lib/query-keys';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DashboardSkeleton } from '@/modules/dashboard/components/layout';
import { UserAvatar } from '@/modules/dashboard/components/UserAvatar';
import { adminTabPath } from '../constants/admin-nav';
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

export function AdminMemberDetailPage() {
  const { id = '' } = useParams();

  const { data: member, isLoading } = useQuery({
    queryKey: queryKeys.admin.member(id),
    queryFn: () => fetchMember(id),
    enabled: Boolean(id),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <DashboardSkeleton className="h-5 w-36" />
        <DashboardSkeleton className="h-40 w-full rounded-2xl" />
        <DashboardSkeleton className="h-28 w-full rounded-2xl" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-neutral-700">Membre introuvable.</p>
        <Button asChild variant="outline">
          <Link to={adminTabPath('membres')}>Retour aux membres</Link>
        </Button>
      </div>
    );
  }

  const fullName = `${member.firstName} ${member.lastName}`;
  const hasSponsor = Boolean(member.sponsorFirstName && member.sponsorLastName);
  const isActive = member.status === 'ACTIVE';

  return (
    <div className="space-y-4">
      <Link
        to={adminTabPath('membres')}
        className="group inline-flex items-center gap-2 text-sm font-medium text-neutral-400 transition-colors hover:text-primary-700"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" aria-hidden />
        Retour aux membres
      </Link>

      {/* En-tête */}
      <section className="overflow-hidden rounded-2xl border border-neutral-100 bg-neutral-0 shadow-soft">
        <div className="bg-gradient-to-br from-primary-50/90 via-neutral-0 to-neutral-0 px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <UserAvatar
                firstName={member.firstName}
                lastName={member.lastName}
                size="lg"
                className={cn(
                  'ring-2 shadow-soft',
                  isActive ? 'ring-emerald-200' : 'ring-red-200',
                )}
              />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-xl font-semibold tracking-tight text-primary-900 sm:text-2xl">
                    {fullName}
                  </h2>
                  <Badge variant={isActive ? 'success' : 'danger'}>
                    {MEMBER_STATUS_LABELS[member.status]}
                  </Badge>
                  <Badge variant={member.hasAccount ? 'success' : 'default'}>
                    {member.hasAccount ? 'Compte actif' : 'Sans compte'}
                  </Badge>
                </div>
                <p className="mt-0.5 text-sm text-neutral-600">
                  {member.profession ?? 'Profession non renseignée'}
                </p>
                <p className="mt-1 text-xs text-neutral-400">
                  Membre depuis le {formatDateShort(member.joinedAt)}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {member.membershipApplicationId && (
                <Button asChild variant="outline" size="sm" className="bg-neutral-0/80">
                  <Link to={`${adminTabPath('adhesions')}/${member.membershipApplicationId}`}>
                    Voir la candidature
                  </Link>
                </Button>
              )}
              {member.hasAccount ? (
                <Button asChild variant="outline" size="sm" className="bg-neutral-0/80">
                  <Link to={adminTabPath('utilisateurs')}>Gérer le compte</Link>
                </Button>
              ) : (
                <Button asChild size="sm">
                  <Link to={adminTabPath('utilisateurs')}>Créer un compte</Link>
                </Button>
              )}
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            <InfoChip icon={Mail} label="Email" value={member.email} />
            <InfoChip icon={Phone} label="Téléphone" value={member.phone ?? 'Non renseigné'} />
            <InfoChip
              icon={Briefcase}
              label="Profession"
              value={member.profession ?? 'Non renseignée'}
            />
            <InfoChip
              icon={Users}
              label="Parrain"
              value={
                hasSponsor
                  ? `${member.sponsorFirstName} ${member.sponsorLastName}`
                  : 'Non renseigné'
              }
            />
            <InfoChip
              icon={Timer}
              label="Heures validées"
              value={`${member.volunteering.validatedHours} h`}
            />
          </div>
        </div>
      </section>

      {/* Contenu */}
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="flex flex-col gap-4 lg:col-span-3">
          {member.motivation && (
            <section className="rounded-2xl border border-neutral-100 bg-neutral-0 p-5 shadow-soft">
              <h3 className="font-display text-sm font-semibold text-primary-900">Motivation</h3>
              <blockquote className="mt-3 border-l-2 border-primary-200 pl-4 text-sm leading-relaxed text-neutral-700">
                {member.motivation}
              </blockquote>
            </section>
          )}

          <section className="rounded-2xl border border-neutral-100 bg-neutral-0 p-5 shadow-soft">
            <div className="mb-3 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary-600" aria-hidden />
              <h3 className="font-display text-sm font-semibold text-primary-900">
                Commissions
                {member.commissions.length > 0 && (
                  <span className="ml-1.5 font-normal text-neutral-400">
                    ({member.commissions.length})
                  </span>
                )}
              </h3>
            </div>

            {member.commissions.length > 0 ? (
              <ul className="space-y-2">
                {member.commissions.map((commission) => (
                  <li key={commission.commissionId}>
                    <Link
                      to={`${adminTabPath('commissions')}/${commission.commissionId}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-neutral-100 px-4 py-3 transition-colors hover:border-primary-200 hover:bg-primary-50/40"
                    >
                      <span className="text-sm font-medium text-primary-900">
                        {commission.commissionName}
                      </span>
                      <span className="shrink-0 rounded-lg bg-neutral-50 px-2.5 py-1 text-xs font-medium text-neutral-600">
                        {commission.role}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-neutral-500">
                Ce membre n&apos;est rattaché à aucune commission pour le moment.
              </p>
            )}
          </section>

          <section className="rounded-2xl border border-neutral-100 bg-neutral-0 p-5 shadow-soft">
            <div className="mb-3 flex items-center gap-2">
              <HeartHandshake className="h-4 w-4 text-primary-600" aria-hidden />
              <h3 className="font-display text-sm font-semibold text-primary-900">
                Bénévolat
                {member.volunteering.declarationCount > 0 && (
                  <span className="ml-1.5 font-normal text-neutral-400">
                    ({member.volunteering.declarationCount})
                  </span>
                )}
              </h3>
            </div>

            {!member.hasAccount ? (
              <p className="text-sm text-neutral-500">
                Aucun compte utilisateur : les déclarations de bénévolat ne peuvent pas encore
                être rattachées.
              </p>
            ) : member.volunteeringDeclarations.length === 0 ? (
              <p className="text-sm text-neutral-500">
                Aucune déclaration de bénévolat pour ce membre.
              </p>
            ) : (
              <ul className="space-y-2">
                {member.volunteeringDeclarations.map((declaration) => (
                  <li key={declaration.id}>
                    <Link
                      to={`${adminTabPath('benevolat')}?status=${declaration.status}&declaration=${declaration.id}`}
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
              <h3 className="font-display text-sm font-semibold text-primary-900">
                Heures de bénévolat
              </h3>
            </div>
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-neutral-500">Heures validées</dt>
                <dd className="font-semibold tabular-nums text-emerald-700">
                  {member.volunteering.validatedHours} h
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-neutral-50 pt-3">
                <dt className="text-neutral-500">En attente</dt>
                <dd className="font-medium tabular-nums text-amber-700">
                  {member.volunteering.pendingHours} h
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-neutral-50 pt-3">
                <dt className="text-neutral-500">Total déclaré</dt>
                <dd className="font-medium tabular-nums text-neutral-900">
                  {member.volunteering.totalDeclaredHours} h
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-neutral-50 pt-3">
                <dt className="text-neutral-500">Déclarations</dt>
                <dd className="font-medium text-neutral-900">
                  {member.volunteering.validatedCount} validée
                  {member.volunteering.validatedCount > 1 ? 's' : ''}
                  {member.volunteering.pendingCount > 0
                    ? ` · ${member.volunteering.pendingCount} en attente`
                    : ''}
                  {member.volunteering.rejectedCount > 0
                    ? ` · ${member.volunteering.rejectedCount} refusée${member.volunteering.rejectedCount > 1 ? 's' : ''}`
                    : ''}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-neutral-100 bg-neutral-0 p-5 shadow-soft">
            <div className="mb-3 flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-primary-600" aria-hidden />
              <h3 className="font-display text-sm font-semibold text-primary-900">
                Compte et accès
              </h3>
            </div>

            {member.hasAccount && member.userId ? (
              <div className="space-y-3">
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-3.5 py-3">
                  <p className="text-sm font-medium text-emerald-800">Accès espace connecté</p>
                  <p className="mt-1 text-xs leading-relaxed text-emerald-700/80">
                    Un compte utilisateur est associé à ce membre.
                  </p>
                </div>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link to={adminTabPath('utilisateurs')}>Gérer les utilisateurs</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-xl border border-neutral-100 bg-neutral-50/80 px-3.5 py-3">
                  <p className="text-sm font-medium text-neutral-800">Aucun compte</p>
                  <p className="mt-1 text-xs leading-relaxed text-neutral-500">
                    Créez un compte pour lui donner accès à l&apos;espace connecté.
                  </p>
                </div>
                <Button asChild size="sm" className="w-full">
                  <Link to={adminTabPath('utilisateurs')}>
                    <UserPlus className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                    Créer un compte
                  </Link>
                </Button>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-neutral-100 bg-neutral-0 p-5 shadow-soft">
            <div className="mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary-600" aria-hidden />
              <h3 className="font-display text-sm font-semibold text-primary-900">Historique</h3>
            </div>
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-neutral-500">Adhésion</dt>
                <dd className="font-medium text-neutral-900">{formatDate(member.joinedAt)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-neutral-50 pt-3">
                <dt className="text-neutral-500">Fiche créée</dt>
                <dd className="font-medium text-neutral-900">{formatDateShort(member.createdAt)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-neutral-50 pt-3">
                <dt className="text-neutral-500">Dernière mise à jour</dt>
                <dd className="font-medium text-neutral-900">{formatDateShort(member.updatedAt)}</dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}
