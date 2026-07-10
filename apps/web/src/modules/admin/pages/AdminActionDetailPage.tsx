import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Archive,
  Calendar,
  ExternalLink,
  HandHeart,
  Images,
  Link2,
  MapPin,
  Pencil,
  Send,
  Star,
  Trash2,
  Users,
} from 'lucide-react';
import {
  PUBLISH_STATUS_LABELS,
  type CreateActionInput,
  type PublishStatus,
  type UpdateActionInput,
} from '@rotary/shared-types';
import {
  deleteAdminAction,
  fetchAdminAction,
  updateAdminAction,
} from '../api';
import {
  AdminContentDetailShell,
  AdminDetailMetaChip,
  AdminDetailSection,
} from '../components/AdminContentDetailShell';
import { ActionFormSlideOver } from '../components/ActionFormSlideOver';
import { queryKeys } from '@/lib/query-keys';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { DashboardSkeleton } from '@/modules/dashboard/components/layout';
import { adminTabPath } from '../constants/admin-nav';
import { formatAdminDate, publishStatusBadgeClass } from '../utils/content';
import { cn } from '@/lib/utils';

export function AdminActionDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<PublishStatus | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.admin.action(id),
    queryFn: () => fetchAdminAction(id),
    enabled: Boolean(id),
  });

  const invalidateActions = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.admin.action(id) });
    queryClient.invalidateQueries({ queryKey: ['admin', 'actions'] });
  };

  const updateMutation = useMutation({
    mutationFn: (input: CreateActionInput) => updateAdminAction(id, input),
    onSuccess: (updated) => {
      setShowEdit(false);
      queryClient.setQueryData(queryKeys.admin.action(id), updated);
      queryClient.invalidateQueries({ queryKey: ['admin', 'actions'] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: (status: PublishStatus) =>
      updateAdminAction(id, { status } satisfies UpdateActionInput),
    onSuccess: () => {
      invalidateActions();
      setPendingStatus(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteAdminAction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'actions'] });
      navigate(adminTabPath('actions'));
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <DashboardSkeleton className="h-5 w-36" />
        <DashboardSkeleton className="h-56 w-full rounded-2xl" />
        <div className="grid gap-4 lg:grid-cols-5">
          <DashboardSkeleton className="h-64 rounded-2xl lg:col-span-3" />
          <DashboardSkeleton className="h-48 rounded-2xl lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-neutral-700">Action introuvable.</p>
        <Button asChild variant="outline">
          <Link to={adminTabPath('actions')}>Retour aux actions</Link>
        </Button>
      </div>
    );
  }

  const statusBusy = statusMutation.isPending;
  const statusConfirmCopy: Record<
    PublishStatus,
    { title: string; description: string; confirmLabel: string }
  > = {
    PUBLISHED: {
      title: 'Publier cette action ?',
      description: `« ${data.title} » sera visible sur l’espace public Nos actions.`,
      confirmLabel: 'Publier',
    },
    ARCHIVED: {
      title: 'Archiver cette action ?',
      description: `« ${data.title} » ne sera plus visible sur le site public.`,
      confirmLabel: 'Archiver',
    },
    DRAFT: {
      title: 'Remettre en brouillon ?',
      description: `« ${data.title} » repassera en brouillon et disparaîtra de l’espace public.`,
      confirmLabel: 'Remettre en brouillon',
    },
  };

  const closeStatusDialog = () => {
    if (statusBusy) return;
    setPendingStatus(null);
    statusMutation.reset();
  };

  const onCover = Boolean(data.coverImage);

  return (
    <>
      <AdminContentDetailShell
        backTo={adminTabPath('actions')}
        backLabel="Retour aux actions"
        coverImage={data.coverImage}
        coverFallbackIcon={HandHeart}
        badges={
          <>
            <Badge
              className={cn(
                publishStatusBadgeClass(data.status),
                onCover && 'shadow-sm ring-1 ring-white/20',
              )}
            >
              {PUBLISH_STATUS_LABELS[data.status]}
            </Badge>
            {data.featured && (
              <Badge
                className={cn(
                  'bg-accent-50 text-accent-800',
                  onCover &&
                    'bg-accent-500/90 text-primary-950 ring-1 ring-white/20 backdrop-blur-sm',
                )}
              >
                <Star className="mr-1 h-3 w-3" aria-hidden />
                À la une
              </Badge>
            )}
          </>
        }
        title={data.title}
        subtitle={
          <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>/{data.slug}</span>
            <span aria-hidden>·</span>
            <span>{data.location}</span>
          </span>
        }
        metaChips={
          <>
            <AdminDetailMetaChip
              icon={Calendar}
              label="Date de l’action"
              value={formatAdminDate(data.date)}
            />
            <AdminDetailMetaChip icon={MapPin} label="Lieu" value={data.location} />
            <AdminDetailMetaChip
              icon={Users}
              label="Partenaires"
              value={
                data.partners.length > 0
                  ? `${data.partners.length} partenaire${data.partners.length > 1 ? 's' : ''}`
                  : 'Aucun'
              }
            />
            <AdminDetailMetaChip
              icon={Images}
              label="Galerie"
              value={
                data.gallery.length > 0
                  ? `${data.gallery.length} image${data.gallery.length > 1 ? 's' : ''}`
                  : 'Aucune'
              }
            />
          </>
        }
        toolbar={
          <>
            {data.status !== 'PUBLISHED' && (
              <Button
                type="button"
                size="sm"
                disabled={statusBusy}
                onClick={() => {
                  statusMutation.reset();
                  setPendingStatus('PUBLISHED');
                }}
              >
                <Send className="h-3.5 w-3.5" aria-hidden />
                Publier
              </Button>
            )}
            {data.status !== 'ARCHIVED' && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={statusBusy}
                onClick={() => {
                  statusMutation.reset();
                  setPendingStatus('ARCHIVED');
                }}
              >
                <Archive className="h-3.5 w-3.5" aria-hidden />
                Archiver
              </Button>
            )}
            {data.status !== 'DRAFT' && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={statusBusy}
                onClick={() => {
                  statusMutation.reset();
                  setPendingStatus('DRAFT');
                }}
              >
                Remettre en brouillon
              </Button>
            )}
            <div className="mx-1 hidden h-6 w-px bg-neutral-100 sm:block" aria-hidden />
            <Button type="button" variant="outline" size="sm" onClick={() => setShowEdit(true)}>
              <Pencil className="h-3.5 w-3.5" aria-hidden />
              Modifier
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-red-700 hover:bg-red-50 hover:text-red-800"
              onClick={() => setShowDelete(true)}
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
              Supprimer
            </Button>
          </>
        }
        sidebar={
          <>
            <AdminDetailSection
              title="Aperçu public"
              description="Lien vers la vitrine Nos actions"
            >
              {data.status === 'PUBLISHED' ? (
                <a
                  href={`/nos-actions/${data.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center gap-3 rounded-xl border border-primary-100 bg-primary-50/40 px-3.5 py-3 transition-colors hover:border-primary-200 hover:bg-primary-50"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-700 transition-colors group-hover:bg-primary-200/70">
                    <ExternalLink className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-primary-900">
                      Voir sur le site
                    </span>
                    <span className="block truncate text-xs text-neutral-500">
                      /nos-actions/{data.slug}
                    </span>
                  </span>
                </a>
              ) : (
                <p className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50/60 px-3.5 py-3 text-sm text-neutral-500">
                  Disponible une fois l’action publiée.
                </p>
              )}
            </AdminDetailSection>

            {data.partners.length > 0 && (
              <AdminDetailSection title="Partenaires">
                <ul className="flex flex-wrap gap-2">
                  {data.partners.map((partner) => (
                    <li
                      key={partner}
                      className="rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-1.5 text-sm font-medium text-neutral-700"
                    >
                      {partner}
                    </li>
                  ))}
                </ul>
              </AdminDetailSection>
            )}

            <AdminDetailSection title="Historique">
              <dl className="space-y-3 text-sm">
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-neutral-500">Créée</dt>
                  <dd className="font-medium text-primary-900">
                    {formatAdminDate(data.createdAt)}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-3 border-t border-neutral-100 pt-3">
                  <dt className="text-neutral-500">Modifiée</dt>
                  <dd className="font-medium text-primary-900">
                    {formatAdminDate(data.updatedAt)}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-3 border-t border-neutral-100 pt-3">
                  <dt className="text-neutral-500">Publiée</dt>
                  <dd className="font-medium text-primary-900">
                    {formatAdminDate(data.publishedAt)}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-3 border-t border-neutral-100 pt-3">
                  <dt className="flex items-center gap-1.5 text-neutral-500">
                    <Link2 className="h-3.5 w-3.5" aria-hidden />
                    Slug
                  </dt>
                  <dd className="max-w-[60%] truncate text-right font-mono text-xs text-neutral-600">
                    /{data.slug}
                  </dd>
                </div>
              </dl>
            </AdminDetailSection>
          </>
        }
      >
        {data.summary && (
          <AdminDetailSection title="Résumé" description="Accroche affichée dans les listes">
            <p className="text-base leading-relaxed text-neutral-700 sm:text-lg">
              {data.summary}
            </p>
          </AdminDetailSection>
        )}

        <AdminDetailSection title="Description" description="Détail de l’action">
          <div className="border-l-2 border-primary-200 pl-4">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-700 sm:text-[15px]">
              {data.description}
            </p>
          </div>
        </AdminDetailSection>

        {data.results && (
          <AdminDetailSection title="Résultats obtenus">
            <div className="rounded-xl border border-accent-100 bg-accent-50/50 px-4 py-3.5">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-700">
                {data.results}
              </p>
            </div>
          </AdminDetailSection>
        )}

        {data.gallery.length > 0 && (
          <AdminDetailSection
            title="Galerie"
            description={`${data.gallery.length} image${data.gallery.length > 1 ? 's' : ''}`}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {data.gallery.map((url, index) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(
                    'group relative overflow-hidden rounded-xl bg-neutral-100',
                    index === 0 && data.gallery.length % 2 === 1
                      ? 'aspect-[16/10] sm:col-span-2'
                      : 'aspect-[4/3]',
                  )}
                >
                  <img
                    src={url}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
                    loading="lazy"
                  />
                </a>
              ))}
            </div>
          </AdminDetailSection>
        )}
      </AdminContentDetailShell>

      <ActionFormSlideOver
        open={showEdit}
        action={data}
        onClose={() => {
          setShowEdit(false);
          if (!updateMutation.isPending) {
            updateMutation.reset();
          }
        }}
        onSubmit={(input) => updateMutation.mutateAsync(input)}
        isPending={updateMutation.isPending}
        errorMessage={updateMutation.error?.message}
      />

      {pendingStatus && (
        <ConfirmDialog
          open={Boolean(pendingStatus)}
          onClose={closeStatusDialog}
          onConfirm={() => statusMutation.mutate(pendingStatus)}
          title={statusConfirmCopy[pendingStatus].title}
          description={statusConfirmCopy[pendingStatus].description}
          confirmLabel={statusConfirmCopy[pendingStatus].confirmLabel}
          confirmPending={statusBusy}
          error={statusMutation.error?.message}
          destructive={pendingStatus === 'ARCHIVED' || pendingStatus === 'DRAFT'}
        />
      )}

      <ConfirmDialog
        open={showDelete}
        onClose={() => {
          if (!deleteMutation.isPending) setShowDelete(false);
        }}
        onConfirm={() => deleteMutation.mutate()}
        title="Supprimer cette action ?"
        description={`L’action « ${data.title} » sera définitivement supprimée.`}
        confirmLabel="Supprimer"
        confirmPending={deleteMutation.isPending}
        error={deleteMutation.error?.message}
        destructive
      />
    </>
  );
}
