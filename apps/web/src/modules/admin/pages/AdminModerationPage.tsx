import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Flag, Shield, Trash2 } from 'lucide-react';
import {
  CONTENT_REPORT_TARGET_LABELS,
  POST_KIND_LABELS,
  type ModerationReport,
  type PostSummary,
} from '@rotary/shared-types';
import {
  deleteModerationComment,
  deleteModerationPost,
  dismissModerationReport,
  fetchModerationComments,
  fetchModerationPosts,
  fetchModerationReports,
} from '../api';
import { queryKeys } from '@/lib/query-keys';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import {
  DashboardFilterBar,
  DashboardPagination,
  DashboardEmptyState,
  DashboardSkeleton,
} from '@/modules/dashboard/components/layout';

type Tab = 'reports' | 'posts' | 'comments';

type ModerationComment = {
  id: string;
  content: string;
  createdAt: string;
  author: { firstName: string; lastName: string };
  postPreview: string;
};

type DeleteTarget =
  | { kind: 'post'; id: string; authorLabel: string }
  | { kind: 'comment'; id: string; authorLabel: string };

function formatDate(date: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

const TAB_OPTIONS = [
  { value: 'reports', label: 'Signalements' },
  { value: 'posts', label: 'Publications' },
  { value: 'comments', label: 'Commentaires' },
];

function invalidateModeration(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['admin', 'moderation'] });
  queryClient.invalidateQueries({ queryKey: ['feed', 'list'] });
}

export function AdminModerationPage() {
  const [tab, setTab] = useState<Tab>('reports');
  const [page, setPage] = useState(1);
  const [deletePostTarget, setDeletePostTarget] = useState<PostSummary | null>(null);
  const [deleteCommentTarget, setDeleteCommentTarget] =
    useState<ModerationComment | null>(null);
  const [deleteFromReport, setDeleteFromReport] = useState<DeleteTarget | null>(null);
  const [dismissTarget, setDismissTarget] = useState<ModerationReport | null>(null);
  const queryClient = useQueryClient();

  const reportsQuery = useQuery({
    queryKey: queryKeys.admin.moderationReports(page),
    queryFn: () => fetchModerationReports(page),
    enabled: tab === 'reports',
  });

  const postsQuery = useQuery({
    queryKey: queryKeys.admin.moderationPosts(page),
    queryFn: () => fetchModerationPosts(page),
    enabled: tab === 'posts',
  });

  const commentsQuery = useQuery({
    queryKey: queryKeys.admin.moderationComments(page),
    queryFn: () => fetchModerationComments(page),
    enabled: tab === 'comments',
  });

  const deletePostMutation = useMutation({
    mutationFn: deleteModerationPost,
    onSuccess: () => {
      setDeletePostTarget(null);
      setDeleteFromReport(null);
      invalidateModeration(queryClient);
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: deleteModerationComment,
    onSuccess: () => {
      setDeleteCommentTarget(null);
      setDeleteFromReport(null);
      invalidateModeration(queryClient);
    },
  });

  const dismissMutation = useMutation({
    mutationFn: dismissModerationReport,
    onSuccess: () => {
      setDismissTarget(null);
      invalidateModeration(queryClient);
    },
  });

  const activeData =
    tab === 'reports'
      ? reportsQuery.data
      : tab === 'posts'
        ? postsQuery.data
        : commentsQuery.data;
  const isLoading =
    tab === 'reports'
      ? reportsQuery.isLoading
      : tab === 'posts'
        ? postsQuery.isLoading
        : commentsQuery.isLoading;

  const deleteFromReportPending =
    deletePostMutation.isPending || deleteCommentMutation.isPending;

  return (
    <div className="space-y-6">
      <DashboardFilterBar
        options={TAB_OPTIONS}
        value={tab}
        onChange={(value) => {
          setTab(value as Tab);
          setPage(1);
        }}
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <DashboardSkeleton key={i} className="h-24" />
          ))}
        </div>
      ) : tab === 'reports' ? (
        <ul className="space-y-3">
          {reportsQuery.data?.data.map((report) => (
            <li
              key={report.id}
              className="rounded-2xl border border-neutral-100 bg-neutral-0 p-5 shadow-soft transition-colors hover:border-primary-200"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{CONTENT_REPORT_TARGET_LABELS[report.targetType]}</Badge>
                    <span className="text-xs text-neutral-400">
                      {formatDate(report.createdAt)}
                    </span>
                    {!report.targetExists && (
                      <Badge variant="warning">Contenu déjà retiré</Badge>
                    )}
                  </div>

                  <p className="mt-2 text-sm text-neutral-500">
                    Signalé par{' '}
                    <span className="font-medium text-primary-900">
                      {report.reporter.firstName} {report.reporter.lastName}
                    </span>
                    {report.targetAuthor && (
                      <>
                        {' '}
                        · Auteur du contenu :{' '}
                        <span className="font-medium text-primary-900">
                          {report.targetAuthor.firstName} {report.targetAuthor.lastName}
                        </span>
                      </>
                    )}
                  </p>

                  <p className="mt-3 line-clamp-4 text-neutral-800">
                    {report.targetContent ??
                      'Le contenu signalé n’est plus disponible.'}
                  </p>

                  {report.reason && (
                    <p className="mt-3 rounded-xl border border-amber-100 bg-amber-50/60 px-3 py-2 text-sm text-amber-900">
                      <span className="font-medium">Motif : </span>
                      {report.reason}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={dismissMutation.isPending}
                    onClick={() => {
                      dismissMutation.reset();
                      setDismissTarget(report);
                    }}
                  >
                    <Check className="h-4 w-4" />
                    Ignorer
                  </Button>
                  {report.targetExists && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:bg-red-50"
                      disabled={deleteFromReportPending}
                      onClick={() => {
                        deletePostMutation.reset();
                        deleteCommentMutation.reset();
                        setDeleteFromReport({
                          kind: report.targetType === 'POST' ? 'post' : 'comment',
                          id: report.targetId,
                          authorLabel: report.targetAuthor
                            ? `${report.targetAuthor.firstName} ${report.targetAuthor.lastName}`
                            : 'un membre',
                        });
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      Supprimer
                    </Button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : tab === 'posts' ? (
        <ul className="space-y-3">
          {postsQuery.data?.data.map((post) => (
            <li
              key={post.id}
              className="flex items-start justify-between gap-4 rounded-2xl border border-neutral-100 bg-neutral-0 p-5 shadow-soft transition-colors hover:border-primary-200"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{POST_KIND_LABELS[post.kind]}</Badge>
                  <span className="text-sm text-neutral-500">
                    {post.author.firstName} {post.author.lastName}
                  </span>
                  <span className="text-xs text-neutral-400">{formatDate(post.createdAt)}</span>
                </div>
                <p className="mt-2 line-clamp-3 text-neutral-800">{post.content}</p>
                <p className="mt-2 text-xs text-neutral-400">
                  {post.likeCount} j&apos;aime · {post.commentCount} commentaire(s)
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:bg-red-50"
                disabled={deletePostMutation.isPending}
                onClick={() => {
                  deletePostMutation.reset();
                  setDeletePostTarget(post);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="space-y-3">
          {commentsQuery.data?.data.map((comment) => (
            <li
              key={comment.id}
              className="flex items-start justify-between gap-4 rounded-2xl border border-neutral-100 bg-neutral-0 p-5 shadow-soft transition-colors hover:border-primary-200"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-primary-900">
                    {comment.author.firstName} {comment.author.lastName}
                  </span>
                  <span className="text-xs text-neutral-400">{formatDate(comment.createdAt)}</span>
                </div>
                <p className="mt-2 text-neutral-800">{comment.content}</p>
                <p className="mt-2 text-xs text-neutral-400">
                  Sur : {comment.postPreview}…
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:bg-red-50"
                disabled={deleteCommentMutation.isPending}
                onClick={() => {
                  deleteCommentMutation.reset();
                  setDeleteCommentTarget(comment);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {activeData && activeData.data.length === 0 && (
        <DashboardEmptyState
          message={
            tab === 'reports'
              ? 'Aucun signalement en attente'
              : 'Rien à modérer pour le moment'
          }
          description={
            tab === 'reports'
              ? 'Les signalements des membres apparaîtront ici pour traitement.'
              : 'Parcourez les publications et commentaires, ou consultez l’onglet Signalements.'
          }
          icon={tab === 'reports' ? Flag : Shield}
        />
      )}

      {activeData && (
        <DashboardPagination
          page={page}
          totalPages={activeData.meta.totalPages}
          onPageChange={setPage}
        />
      )}

      <ConfirmDialog
        open={Boolean(dismissTarget)}
        onClose={() => {
          if (!dismissMutation.isPending) {
            setDismissTarget(null);
            dismissMutation.reset();
          }
        }}
        onConfirm={() => {
          if (dismissTarget) dismissMutation.mutate(dismissTarget.id);
        }}
        title="Ignorer ce signalement ?"
        description="Le signalement sera retiré de la file. Le contenu signalé ne sera pas modifié."
        confirmLabel="Ignorer"
        confirmPending={dismissMutation.isPending}
        error={dismissMutation.isError ? dismissMutation.error.message : null}
      />

      <ConfirmDialog
        open={Boolean(deleteFromReport)}
        onClose={() => {
          if (!deleteFromReportPending) {
            setDeleteFromReport(null);
            deletePostMutation.reset();
            deleteCommentMutation.reset();
          }
        }}
        onConfirm={() => {
          if (!deleteFromReport) return;
          if (deleteFromReport.kind === 'post') {
            deletePostMutation.mutate(deleteFromReport.id);
          } else {
            deleteCommentMutation.mutate(deleteFromReport.id);
          }
        }}
        title={
          deleteFromReport?.kind === 'comment'
            ? 'Supprimer ce commentaire ?'
            : 'Supprimer cette publication ?'
        }
        description={
          deleteFromReport
            ? `Le contenu de ${deleteFromReport.authorLabel} sera définitivement retiré. Les signalements associés seront également fermés.`
            : undefined
        }
        confirmLabel="Supprimer"
        confirmPending={deleteFromReportPending}
        error={
          deletePostMutation.isError
            ? deletePostMutation.error.message
            : deleteCommentMutation.isError
              ? deleteCommentMutation.error.message
              : null
        }
        destructive
      />

      <ConfirmDialog
        open={Boolean(deletePostTarget)}
        onClose={() => {
          if (!deletePostMutation.isPending) {
            setDeletePostTarget(null);
            deletePostMutation.reset();
          }
        }}
        onConfirm={() => {
          if (deletePostTarget) deletePostMutation.mutate(deletePostTarget.id);
        }}
        title="Supprimer cette publication ?"
        description={
          deletePostTarget
            ? `La publication de ${deletePostTarget.author.firstName} ${deletePostTarget.author.lastName} sera définitivement retirée du fil.`
            : undefined
        }
        confirmLabel="Supprimer"
        confirmPending={deletePostMutation.isPending}
        error={deletePostMutation.isError ? deletePostMutation.error.message : null}
        destructive
      />

      <ConfirmDialog
        open={Boolean(deleteCommentTarget)}
        onClose={() => {
          if (!deleteCommentMutation.isPending) {
            setDeleteCommentTarget(null);
            deleteCommentMutation.reset();
          }
        }}
        onConfirm={() => {
          if (deleteCommentTarget) {
            deleteCommentMutation.mutate(deleteCommentTarget.id);
          }
        }}
        title="Supprimer ce commentaire ?"
        description={
          deleteCommentTarget
            ? `Le commentaire de ${deleteCommentTarget.author.firstName} ${deleteCommentTarget.author.lastName} sera définitivement supprimé.`
            : undefined
        }
        confirmLabel="Supprimer"
        confirmPending={deleteCommentMutation.isPending}
        error={
          deleteCommentMutation.isError ? deleteCommentMutation.error.message : null
        }
        destructive
      />
    </div>
  );
}
