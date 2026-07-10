import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Briefcase,
  CheckCircle2,
  ClipboardCheck,
  Mail,
  Paperclip,
  Phone,
  Trash2,
  UserRound,
  Users,
  XCircle,
} from 'lucide-react';
import {
  MEMBERSHIP_APPLICATION_STATUS_LABELS,
  type ReviewMembershipApplicationInput,
} from '@rotary/shared-types';
import {
  deleteMembershipApplication,
  fetchMembershipApplication,
  reviewMembershipApplication,
} from '../api';
import { queryKeys } from '@/lib/query-keys';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { DashboardSkeleton } from '@/modules/dashboard/components/layout';
import { UserAvatar } from '@/modules/dashboard/components/UserAvatar';
import { adminTabPath } from '../constants/admin-nav';
import { MembershipApplicationWorkflow } from '../components/membership/MembershipApplicationWorkflow';
import {
  applicationStatusBadgeVariant,
  applicationStatusRing,
  formatApplicationDateShort,
} from '../components/membership/membership-application.utils';
import { cn } from '@/lib/utils';

function ContactChip({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2.5 rounded-xl border border-neutral-100/80 bg-neutral-0/60 px-3 py-2 backdrop-blur-sm">
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

export function AdminMembershipDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [reviewConfirm, setReviewConfirm] = useState<
    'REVIEWED' | 'ACCEPTED' | 'REJECTED' | null
  >(null);

  const { data: application, isLoading } = useQuery({
    queryKey: queryKeys.admin.membershipApplication(id),
    queryFn: () => fetchMembershipApplication(id),
    enabled: Boolean(id),
  });

  const reviewMutation = useMutation({
    mutationFn: ({
      applicationId,
      input,
    }: {
      applicationId: string;
      input: ReviewMembershipApplicationInput;
    }) => reviewMembershipApplication(applicationId, input),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.admin.membershipApplication(id), updated);
      queryClient.invalidateQueries({ queryKey: ['admin', 'membership'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'members'] });
      setReviewConfirm(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMembershipApplication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'membership'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'members'] });
      navigate(adminTabPath('adhesions'));
    },
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

  if (!application) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-neutral-700">Candidature introuvable.</p>
        <Button asChild variant="outline">
          <Link to={adminTabPath('adhesions')}>Retour aux adhésions</Link>
        </Button>
      </div>
    );
  }

  const fullName = `${application.firstName} ${application.lastName}`;
  const hasSponsor = Boolean(application.sponsorFirstName && application.sponsorLastName);
  const canReview = application.status === 'PENDING' || application.status === 'REVIEWED';
  const actionsDisabled = reviewMutation.isPending || deleteMutation.isPending;

  const deleteDescription = application.memberId
    ? `La candidature de ${fullName} sera supprimée. La fiche membre associée sera conservée.`
    : `La candidature de ${fullName} sera définitivement supprimée.`;

  const reviewConfirmConfig = {
    REVIEWED: {
      title: 'Marquer cette candidature comme examinée ?',
      description: `La candidature de ${fullName} passera au statut « Examinée ». Vous pourrez ensuite l'accepter ou la refuser.`,
      confirmLabel: 'Marquer examinée',
      destructive: false,
      input: { status: 'REVIEWED' as const },
    },
    ACCEPTED: {
      title: 'Accepter cette candidature ?',
      description: `La candidature de ${fullName} sera acceptée. Une fiche membre sera créée et un e-mail de notification sera envoyé au demandeur.`,
      confirmLabel: 'Accepter',
      destructive: false,
      input: { status: 'ACCEPTED' as const },
    },
    REJECTED: {
      title: 'Refuser cette candidature ?',
      description: `La candidature de ${fullName} sera refusée. Cette action mettra fin au traitement du dossier.`,
      confirmLabel: 'Refuser',
      destructive: true,
      input: { status: 'REJECTED' as const, adminNotes: 'Candidature refusée' },
    },
  } as const;

  const activeReviewConfirm = reviewConfirm ? reviewConfirmConfig[reviewConfirm] : null;

  return (
    <div className="space-y-4">
      <Link
        to={adminTabPath('adhesions')}
        className="group inline-flex items-center gap-2 text-sm font-medium text-neutral-400 transition-colors hover:text-primary-700"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" aria-hidden />
        Retour aux adhésions
      </Link>

      {/* Hero compact */}
      <section className="overflow-hidden rounded-2xl border border-neutral-100 bg-neutral-0 shadow-soft">
        <div className="bg-gradient-to-br from-primary-50/90 via-neutral-0 to-neutral-0 px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <UserAvatar
                firstName={application.firstName}
                lastName={application.lastName}
                size="lg"
                className={cn('ring-2 shadow-soft', applicationStatusRing[application.status])}
              />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-xl font-semibold tracking-tight text-primary-900 sm:text-2xl">
                    {fullName}
                  </h2>
                  <Badge variant={applicationStatusBadgeVariant[application.status]}>
                    {MEMBERSHIP_APPLICATION_STATUS_LABELS[application.status]}
                  </Badge>
                </div>
                <p className="mt-0.5 text-sm text-neutral-600">{application.profession}</p>
                <p className="mt-1 text-xs text-neutral-400">
                  Reçue le {formatApplicationDateShort(application.createdAt)}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-1">
              {application.status === 'ACCEPTED' && application.memberId && (
                <Link
                  to={`${adminTabPath('membres')}/${application.memberId}`}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-100 bg-neutral-0/80 text-primary-700 transition-colors hover:border-primary-200 hover:bg-primary-50"
                  aria-label="Voir la fiche membre"
                  title="Voir la fiche membre"
                >
                  <UserRound className="h-4 w-4" aria-hidden />
                </Link>
              )}
              {application.status === 'PENDING' && (
                <button
                  type="button"
                  disabled={actionsDisabled}
                  onClick={() => setReviewConfirm('REVIEWED')}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-100 bg-neutral-0/80 text-primary-700 transition-colors hover:border-primary-200 hover:bg-primary-50 disabled:opacity-50"
                  aria-label="Marquer examinée"
                  title="Marquer examinée"
                >
                  <ClipboardCheck className="h-4 w-4" aria-hidden />
                </button>
              )}
              {application.status === 'REVIEWED' && (
                <button
                  type="button"
                  disabled={actionsDisabled}
                  onClick={() => setReviewConfirm('ACCEPTED')}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-100 bg-neutral-0/80 text-emerald-700 transition-colors hover:border-emerald-200 hover:bg-emerald-50 disabled:opacity-50"
                  aria-label="Accepter"
                  title="Accepter"
                >
                  <CheckCircle2 className="h-4 w-4" aria-hidden />
                </button>
              )}
              {canReview && (
                <button
                  type="button"
                  disabled={actionsDisabled}
                  onClick={() => setReviewConfirm('REJECTED')}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-100 bg-neutral-0/80 text-red-600 transition-colors hover:border-red-200 hover:bg-red-50 disabled:opacity-50"
                  aria-label="Refuser"
                  title="Refuser"
                >
                  <XCircle className="h-4 w-4" aria-hidden />
                </button>
              )}
              <button
                type="button"
                disabled={actionsDisabled}
                onClick={() => setDeleteOpen(true)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-100 bg-neutral-0/80 text-red-600 transition-colors hover:border-red-200 hover:bg-red-50 disabled:opacity-50"
                aria-label="Supprimer"
                title="Supprimer"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </div>          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <ContactChip icon={Mail} label="Email" value={application.email} />
            <ContactChip icon={Phone} label="Téléphone" value={application.phone} />
            <ContactChip icon={Briefcase} label="Profession" value={application.profession} />
            {hasSponsor ? (
              <ContactChip
                icon={Users}
                label="Parrain"
                value={`${application.sponsorFirstName} ${application.sponsorLastName}`}
              />
            ) : (
              <ContactChip icon={Users} label="Parrain" value="Non renseigné" />
            )}
          </div>
        </div>
      </section>

      {/* Workflow horizontal */}
      <section className="rounded-2xl border border-neutral-100 bg-neutral-0 px-5 py-5 shadow-soft sm:px-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-sm font-semibold text-primary-900">Suivi du dossier</h3>
            <p className="mt-0.5 text-xs text-neutral-500">
              Progression de la candidature de la réception à l&apos;intégration
            </p>
          </div>
        </div>
        <MembershipApplicationWorkflow application={application} />
      </section>

      {/* Contenu principal */}
      <div className="grid gap-4 lg:grid-cols-5">
        <section className="rounded-2xl border border-neutral-100 bg-neutral-0 p-5 shadow-soft lg:col-span-3">
          <h3 className="font-display text-sm font-semibold text-primary-900">Motivation</h3>
          <blockquote className="mt-3 border-l-2 border-primary-200 pl-4 text-sm leading-relaxed text-neutral-700">
            {application.motivation}
          </blockquote>
        </section>

        <section className="flex flex-col gap-4 lg:col-span-2">
          {application.attachmentUrls && application.attachmentUrls.length > 0 && (
            <div className="rounded-2xl border border-neutral-100 bg-neutral-0 p-5 shadow-soft">
              <h3 className="font-display text-sm font-semibold text-primary-900">
                Pièces jointes
                <span className="ml-1.5 font-normal text-neutral-400">
                  ({application.attachmentUrls.length})
                </span>
              </h3>
              <ul className="mt-3 space-y-2">
                {application.attachmentUrls.map((url, index) => (
                  <li key={url}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-2.5 rounded-xl border border-neutral-100 px-3 py-2.5 text-sm transition-colors hover:border-primary-200 hover:bg-primary-50/40"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-50 text-primary-600 transition-colors group-hover:bg-primary-100">
                        <Paperclip className="h-3.5 w-3.5" aria-hidden />
                      </span>
                      <span className="min-w-0 truncate font-medium text-primary-800">
                        Document {application.attachmentUrls!.length > 1 ? index + 1 : ''}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {application.adminNotes && application.status === 'REJECTED' && (
            <div className="rounded-2xl border border-red-100 bg-red-50/50 p-5">
              <h3 className="font-display text-sm font-semibold text-red-800">Motif du refus</h3>
              <p className="mt-2 text-sm leading-relaxed text-red-700/90">{application.adminNotes}</p>
            </div>
          )}
        </section>
      </div>

      <ConfirmDialog
        open={Boolean(activeReviewConfirm)}
        onClose={() => setReviewConfirm(null)}
        onConfirm={() => {
          if (!activeReviewConfirm) return;
          reviewMutation.mutate({
            applicationId: application.id,
            input: activeReviewConfirm.input,
          });
        }}
        title={activeReviewConfirm?.title ?? ''}
        description={activeReviewConfirm?.description}
        confirmLabel={activeReviewConfirm?.confirmLabel}
        cancelLabel="Annuler"
        confirmPending={reviewMutation.isPending}
        destructive={activeReviewConfirm?.destructive}
      />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => deleteMutation.mutate(application.id)}
        title="Supprimer cette candidature ?"
        description={deleteDescription}
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        confirmPending={deleteMutation.isPending}
        destructive
      />
    </div>
  );
}
