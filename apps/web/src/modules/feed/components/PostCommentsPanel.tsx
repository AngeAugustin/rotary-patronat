import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { X } from 'lucide-react';
import { addPostComment, fetchPost } from '../api';
import { queryKeys } from '@/lib/query-keys';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

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

export function PostCommentsPanel({ postId, onClose }: PostCommentsPanelProps) {
  const [draft, setDraft] = useState('');
  const queryClient = useQueryClient();

  const { data: post, isLoading } = useQuery({
    queryKey: queryKeys.feed.detail(postId),
    queryFn: () => fetchPost(postId),
  });

  const commentMutation = useMutation({
    mutationFn: (content: string) => addPostComment(postId, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.feed.detail(postId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.feed.list('') });
      setDraft('');
    },
  });

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
          <p className="mb-4 line-clamp-3 text-sm text-neutral-500">{post?.content}</p>

          <ul className="mb-4 max-h-64 space-y-3 overflow-y-auto">
            {post?.comments.map((comment) => (
              <li key={comment.id} className="rounded-xl bg-neutral-50 px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-primary-800">
                    {comment.author.firstName} {comment.author.lastName}
                  </span>
                  <span className="text-xs text-neutral-400">
                    {formatDate(comment.createdAt)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-neutral-800">{comment.content}</p>
              </li>
            ))}
            {post?.comments.length === 0 && (
              <li className="text-center text-sm text-neutral-400">
                Aucun commentaire. Soyez le premier !
              </li>
            )}
          </ul>

          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (draft.trim()) commentMutation.mutate(draft.trim());
            }}
          >
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Écrire un commentaire…"
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
    </div>
  );
}
