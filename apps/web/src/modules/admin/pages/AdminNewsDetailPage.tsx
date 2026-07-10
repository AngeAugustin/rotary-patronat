import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Archive,
  Calendar,
  ExternalLink,
  FileText,
  FolderOpen,
  Link2,
  Newspaper,
  Pencil,
  Send,
  Trash2,
} from 'lucide-react';
import {
  PUBLISH_STATUS_LABELS,
  type CreateNewsInput,
  type PublishStatus,
} from '@rotary/shared-types';
import {
  deleteAdminNews,
  fetchAdminNewsArticle,
  fetchNewsCategoriesAdmin,
  updateAdminNews,
} from '../api';
import {
  AdminContentDetailShell,
  AdminDetailMetaChip,
  AdminDetailSection,
} from '../components/AdminContentDetailShell';
import { NewsFormSlideOver } from '../components/NewsFormSlideOver';
import { queryKeys } from '@/lib/query-keys';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { DashboardSkeleton } from '@/modules/dashboard/components/layout';
import { adminTabPath } from '../constants/admin-nav';
import { formatAdminDate, publishStatusBadgeClass } from '../utils/content';
import { cn } from '@/lib/utils';

export function AdminNewsDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<PublishStatus | null>(null);

  const { data: categories = [] } = useQuery({
    queryKey: queryKeys.public.newsCategories,
    queryFn: fetchNewsCategoriesAdmin,
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.admin.newsArticle(id),
    queryFn: () => fetchAdminNewsArticle(id),
    enabled: Boolean(id),
  });

  const invalidateNews = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.admin.newsArticle(id) });
    queryClient.invalidateQueries({ queryKey: ['admin', 'news'] });
  };

  const updateMutation = useMutation({
    mutationFn: (input: CreateNewsInput) => updateAdminNews(id, input),
    onSuccess: () => {
      invalidateNews();
      setShowEdit(false);
    },
  });

  const statusMutation = useMutation({
    mutationFn: (status: PublishStatus) => updateAdminNews(id, { status }),
    onSuccess: () => {
      invalidateNews();
      setPendingStatus(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteAdminNews(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'news'] });
      navigate(adminTabPath('actualites'));
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
        <p className="text-neutral-700">Actualité introuvable.</p>
        <Button asChild variant="outline">
          <Link to={adminTabPath('actualites')}>Retour aux actualités</Link>
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
      title: 'Publier cette actualité ?',
      description: `« ${data.title} » sera visible sur l’espace public Nos actualités.`,
      confirmLabel: 'Publier',
    },
    ARCHIVED: {
      title: 'Archiver cette actualité ?',
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
        backTo={adminTabPath('actualites')}
        backLabel="Retour aux actualités"
        coverImage={data.coverImage}
        coverFallbackIcon={Newspaper}
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
            <Badge
              className={cn(
                'bg-primary-50 text-primary-800',
                onCover && 'bg-white/15 text-neutral-0 ring-1 ring-white/25 backdrop-blur-sm',
              )}
            >
              {data.category.name}
            </Badge>
          </>
        }
        title={data.title}
        subtitle={
          <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>/{data.slug}</span>
            {data.publishedAt && (
              <>
                <span aria-hidden>·</span>
                <span>Publié le {formatAdminDate(data.publishedAt)}</span>
              </>
            )}
          </span>
        }
        metaChips={
          <>
            <AdminDetailMetaChip
              icon={FolderOpen}
              label="Catégorie"
              value={data.category.name}
            />
            <AdminDetailMetaChip
              icon={Calendar}
              label="Publication"
              value={formatAdminDate(data.publishedAt)}
            />
            <AdminDetailMetaChip
              icon={FileText}
              label="Créée le"
              value={formatAdminDate(data.createdAt)}
            />
            <AdminDetailMetaChip
              icon={Link2}
              label="Slug"
              value={
                <span className="truncate font-mono text-xs text-neutral-600">
                  /{data.slug}
                </span>
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
              description="Lien vers la vitrine Nos actualités"
            >
              {data.status === 'PUBLISHED' ? (
                <a
                  href={`/nos-actualites/${data.slug}`}
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
                      /nos-actualites/{data.slug}
                    </span>
                  </span>
                </a>
              ) : (
                <p className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50/60 px-3.5 py-3 text-sm text-neutral-500">
                  Disponible une fois l’actualité publiée.
                </p>
              )}
            </AdminDetailSection>

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
              </dl>
            </AdminDetailSection>
          </>
        }
      >
        <AdminDetailSection title="Chapô" description="Résumé affiché dans les listes">
          <p className="text-base leading-relaxed text-neutral-700 sm:text-lg">
            {data.excerpt}
          </p>
        </AdminDetailSection>

        <AdminDetailSection title="Contenu" description="Corps de l’article">
          <div className="border-l-2 border-primary-200 pl-4">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-700 sm:text-[15px]">
              {data.content}
            </p>
          </div>
        </AdminDetailSection>
      </AdminContentDetailShell>

      <NewsFormSlideOver
        open={showEdit}
        article={data}
        categories={categories}
        onClose={() => {
          if (!updateMutation.isPending) {
            setShowEdit(false);
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
        title="Supprimer cette actualité ?"
        description={`L’actualité « ${data.title} » sera définitivement supprimée.`}
        confirmLabel="Supprimer"
        confirmPending={deleteMutation.isPending}
        error={deleteMutation.error?.message}
        destructive
      />
    </>
  );
}
