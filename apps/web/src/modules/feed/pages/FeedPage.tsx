import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Newspaper, Plus } from 'lucide-react';
import {
  POST_KIND_LABELS,
  RoleCode,
  type PostKind,
  type PostSummary,
  type UpdatePostInput,
} from '@rotary/shared-types';
import {
  deletePost,
  fetchFeed,
  reportContent,
  togglePostLike,
  updatePost,
} from '../api';
import { CreatePostForm } from '../components/CreatePostForm';
import { PostCard } from '../components/PostCard';
import { PostCommentsPanel } from '../components/PostCommentsPanel';
import { queryKeys } from '@/lib/query-keys';
import { connectRealtime } from '@/lib/realtime-client';
import { useCurrentUser } from '@/modules/auth/hooks/use-auth';
import { fadeInUp, staggerChildren } from '@/design-system/motion';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { cn } from '@/lib/utils';
import {
  DashboardPageShell,
  DashboardPageHeader,
  DashboardEmptyState,
  DashboardSkeleton,
} from '@/modules/dashboard/components/layout';

const KIND_FILTERS: Array<{ id: string; label: string; value?: PostKind }> = [
  { id: 'all', label: 'Tout' },
  ...Object.entries(POST_KIND_LABELS).map(([value, label]) => ({
    id: value,
    label,
    value: value as PostKind,
  })),
];

export function FeedPage() {
  const [page, setPage] = useState(1);
  const [kind, setKind] = useState<PostKind | undefined>();
  const [openCommentsPostId, setOpenCommentsPostId] = useState<string | null>(null);
  const [repostOfId, setRepostOfId] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<PostSummary | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<PostSummary | null>(null);
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();

  const listKey = queryKeys.feed.list(`${page}-${kind ?? 'all'}`);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: listKey,
    queryFn: () => fetchFeed({ page, kind, limit: 10 }),
  });

  useEffect(() => {
    const socket = connectRealtime();
    const onFeedUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['feed', 'list'] });
    };
    socket.on('feed:updated', onFeedUpdate);
    return () => {
      socket.off('feed:updated', onFeedUpdate);
    };
  }, [queryClient]);

  const likeMutation = useMutation({
    mutationFn: togglePostLike,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed', 'list'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePostInput }) =>
      updatePost(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed', 'list'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deletePost,
    onSuccess: () => {
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ['feed', 'list'] });
    },
  });

  const reportMutation = useMutation({
    mutationFn: ({ postId, reason }: { postId: string; reason?: string }) =>
      reportContent({
        targetType: 'POST',
        targetId: postId,
        reason: reason?.trim() || undefined,
      }),
    onSuccess: () => {
      setReportTarget(null);
      setReportReason('');
    },
  });

  return (
    <DashboardPageShell width="narrow">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerChildren}
        className="space-y-6"
      >
        <motion.div variants={fadeInUp}>
          <DashboardPageHeader
            eyebrow="Vie du club"
            title="Fil d'actualité"
            description="Publications, annonces et événements du club."
            action={
              <Button type="button" onClick={() => setComposerOpen(true)}>
                <Plus className="h-4 w-4" aria-hidden />
                Créer une publication
              </Button>
            }
          />
        </motion.div>

        {(composerOpen || Boolean(repostOfId)) && (
          <motion.div variants={fadeInUp}>
            <CreatePostForm
              open={composerOpen || Boolean(repostOfId)}
              onOpenChange={(next) => {
                setComposerOpen(next);
                if (!next) setRepostOfId(null);
              }}
              repostOfId={repostOfId}
              onDone={() => {
                setComposerOpen(false);
                setRepostOfId(null);
              }}
            />
          </motion.div>
        )}

        <motion.div variants={fadeInUp} className="flex flex-wrap gap-1.5">
          {KIND_FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => {
                setKind(filter.value);
                setPage(1);
              }}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                (kind ?? undefined) === filter.value
                  ? 'bg-primary-700 text-neutral-0'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-primary-50 hover:text-primary-800',
              )}
            >
              {filter.label}
            </button>
          ))}
        </motion.div>

        <motion.div variants={fadeInUp} className="space-y-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <DashboardSkeleton key={i} className="h-40" />
            ))
          ) : (
            <>
              {data?.data.map((post) => (
                <div key={post.id} className="space-y-3">
                  <PostCard
                    post={post}
                    currentUserId={user?.id}
                    isAdmin={user?.roles.includes(RoleCode.ADMIN)}
                    onLike={() => likeMutation.mutate(post.id)}
                    onComment={() =>
                      setOpenCommentsPostId((current) =>
                        current === post.id ? null : post.id,
                      )
                    }
                    onRepost={() => {
                      setRepostOfId(post.id);
                      setComposerOpen(true);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    onDelete={() => setDeleteTarget(post)}
                    onReport={() => {
                      setReportReason('');
                      reportMutation.reset();
                      setReportTarget(post);
                    }}
                    onUpdate={(input) =>
                      updateMutation.mutateAsync({ id: post.id, input })
                    }
                    liking={likeMutation.isPending}
                    busy={updateMutation.isPending}
                  />
                  {openCommentsPostId === post.id && (
                    <PostCommentsPanel
                      postId={post.id}
                      onClose={() => setOpenCommentsPostId(null)}
                    />
                  )}
                </div>
              ))}
              {data?.data.length === 0 && (
                <DashboardEmptyState
                  message="Aucune publication pour le moment"
                  description="Soyez le premier à partager une actualité avec le club."
                  icon={Newspaper}
                />
              )}
            </>
          )}
        </motion.div>

        {data && data.meta.totalPages > 1 && (
          <motion.div
            variants={fadeInUp}
            className="flex items-center justify-center gap-3 border-t border-neutral-100 pt-6"
          >
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || isFetching}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Précédent
            </Button>
            <span className="text-sm text-neutral-500">
              Page {data.meta.page} / {data.meta.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.meta.totalPages || isFetching}
              onClick={() => setPage((p) => p + 1)}
            >
              Suivant
            </Button>
          </motion.div>
        )}
      </motion.div>

      <ConfirmDialog
        open={Boolean(reportTarget)}
        onClose={() => {
          if (!reportMutation.isPending) {
            setReportTarget(null);
            setReportReason('');
            reportMutation.reset();
          }
        }}
        onConfirm={() => {
          if (!reportTarget) return;
          reportMutation.mutate({
            postId: reportTarget.id,
            reason: reportReason,
          });
        }}
        title="Signaler cette publication ?"
        description={
          reportTarget
            ? `La publication de ${reportTarget.author.firstName} ${reportTarget.author.lastName} sera transmise à la modération.`
            : undefined
        }
        confirmLabel="Signaler"
        confirmPending={reportMutation.isPending}
        error={
          reportMutation.isError
            ? reportMutation.error.message ||
              'Impossible de signaler (peut-être déjà signalé).'
            : null
        }
      >
        <div className="space-y-2">
          <Label htmlFor="report-reason">Motif (optionnel)</Label>
          <Textarea
            id="report-reason"
            rows={3}
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            placeholder="Précisez pourquoi vous signalez cette publication…"
            disabled={reportMutation.isPending}
          />
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => {
          if (!deleteMutation.isPending) {
            setDeleteTarget(null);
            deleteMutation.reset();
          }
        }}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
        }}
        title="Supprimer cette publication ?"
        description="Cette action est définitive. La publication et ses commentaires associés seront retirés du fil."
        confirmLabel="Supprimer"
        confirmPending={deleteMutation.isPending}
        error={deleteMutation.isError ? deleteMutation.error.message : null}
        destructive
      />
    </DashboardPageShell>
  );
}
