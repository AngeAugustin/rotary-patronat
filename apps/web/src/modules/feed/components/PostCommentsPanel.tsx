import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Flag, Reply, X } from 'lucide-react';
import type { PostComment } from '@rotary/shared-types';
import { addPostComment, fetchPost, reportContent } from '../api';
import { queryKeys } from '@/lib/query-keys';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ConfirmDialog } from '@/components/ConfirmDialog';

interface PostCommentsPanelProps {
  postId: string;
  onClose: () => void;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

function CommentItem({
  comment,
  onReply,
  onReport,
  isReply = false,
}: {
  comment: PostComment;
  onReply?: (id: string) => void;
  onReport?: (comment: PostComment) => void;
  isReply?: boolean;
}) {
  return (
    <li
      className={
        isReply
          ? 'ml-6 rounded-xl border border-neutral-100 bg-neutral-0 px-3 py-2.5'
          : 'rounded-xl bg-neutral-50 px-4 py-3'
      }
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-primary-800">
          {comment.author.firstName} {comment.author.lastName}
        </span>
        <span className="text-xs text-neutral-400">
          {formatDate(comment.createdAt)}
        </span>
      </div>
      <p className="mt-1 text-sm text-neutral-800">{comment.content}</p>
      {!isReply && (
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary-700 hover:underline"
            onClick={() => onReply?.(comment.id)}
          >
            <Reply className="h-3 w-3" />
            Répondre
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1 text-xs font-medium text-neutral-500 hover:text-red-700"
            onClick={() => onReport?.(comment)}
          >
            <Flag className="h-3 w-3" />
            Signaler
          </button>
        </div>
      )}
      {comment.replies && comment.replies.length > 0 && (
        <ul className="mt-3 space-y-2">
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} isReply />
          ))}
        </ul>
      )}
    </li>
  );
}

export function PostCommentsPanel({ postId, onClose }: PostCommentsPanelProps) {
  const [draft, setDraft] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [reportTarget, setReportTarget] = useState<PostComment | null>(null);
  const [reportReason, setReportReason] = useState('');
  const queryClient = useQueryClient();

  const { data: post, isLoading } = useQuery({
    queryKey: queryKeys.feed.detail(postId),
    queryFn: () => fetchPost(postId),
  });

  const commentMutation = useMutation({
    mutationFn: (payload: { content: string; parentId?: string }) =>
      addPostComment(postId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.feed.detail(postId) });
      queryClient.invalidateQueries({ queryKey: ['feed', 'list'] });
      setDraft('');
      setReplyTo(null);
    },
  });

  const reportMutation = useMutation({
    mutationFn: ({ commentId, reason }: { commentId: string; reason?: string }) =>
      reportContent({
        targetType: 'COMMENT',
        targetId: commentId,
        reason: reason?.trim() || undefined,
      }),
    onSuccess: () => {
      setReportTarget(null);
      setReportReason('');
    },
  });

  const replyTarget = post?.comments.find((c) => c.id === replyTo);

  return (
    <div className="rounded-2xl border border-neutral-100 bg-neutral-0 p-5 shadow-soft">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-medium text-primary-900">Commentaires</h3>
        <Button variant="ghost" size="sm" onClick={onClose} aria-label="Fermer">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {isLoading ? (
        <div className="h-20 animate-pulse rounded-xl bg-neutral-100" />
      ) : (
        <>
          <ul className="mb-4 max-h-80 space-y-3 overflow-y-auto">
            {post?.comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                onReply={setReplyTo}
                onReport={(target) => {
                  setReportReason('');
                  reportMutation.reset();
                  setReportTarget(target);
                }}
              />
            ))}
            {post?.comments.length === 0 && (
              <li className="text-center text-sm text-neutral-400">
                Aucun commentaire. Soyez le premier !
              </li>
            )}
          </ul>

          {replyTarget && (
            <div className="mb-2 flex items-center justify-between rounded-lg bg-primary-50 px-3 py-2 text-xs text-primary-800">
              <span>
                Réponse à {replyTarget.author.firstName}{' '}
                {replyTarget.author.lastName}
              </span>
              <button type="button" onClick={() => setReplyTo(null)}>
                Annuler
              </button>
            </div>
          )}

          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!draft.trim()) return;
              commentMutation.mutate({
                content: draft.trim(),
                parentId: replyTo ?? undefined,
              });
            }}
          >
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={
                replyTo ? 'Écrire une réponse…' : 'Écrire un commentaire…'
              }
              rows={2}
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={commentMutation.isPending || !draft.trim()}
              className="self-end"
            >
              Publier
            </Button>
          </form>
        </>
      )}

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
            commentId: reportTarget.id,
            reason: reportReason,
          });
        }}
        title="Signaler ce commentaire ?"
        description={
          reportTarget
            ? `Le commentaire de ${reportTarget.author.firstName} ${reportTarget.author.lastName} sera transmis à la modération.`
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
          <Label htmlFor="comment-report-reason">Motif (optionnel)</Label>
          <Textarea
            id="comment-report-reason"
            rows={3}
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            placeholder="Précisez pourquoi vous signalez ce commentaire…"
            disabled={reportMutation.isPending}
          />
        </div>
      </ConfirmDialog>
    </div>
  );
}
