import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2, Shield } from 'lucide-react';
import { POST_KIND_LABELS } from '@rotary/shared-types';
import {
  deleteModerationComment,
  deleteModerationPost,
  fetchModerationComments,
  fetchModerationPosts,
} from '../api';
import { queryKeys } from '@/lib/query-keys';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DashboardFilterBar,
  DashboardPagination,
  DashboardEmptyState,
  DashboardSkeleton,
} from '@/modules/dashboard/components/layout';

type Tab = 'posts' | 'comments';

function formatDate(date: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

const TAB_OPTIONS = [
  { value: 'posts', label: 'Publications' },
  { value: 'comments', label: 'Commentaires' },
];

export function AdminModerationPage() {
  const [tab, setTab] = useState<Tab>('posts');
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

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
      queryClient.invalidateQueries({ queryKey: ['admin', 'moderation', 'posts'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.feed.list('') });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: deleteModerationComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'moderation', 'comments'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.feed.list('') });
    },
  });

  const activeData = tab === 'posts' ? postsQuery.data : commentsQuery.data;
  const isLoading = tab === 'posts' ? postsQuery.isLoading : commentsQuery.isLoading;

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
                  if (confirm('Supprimer cette publication ?')) {
                    deletePostMutation.mutate(post.id);
                  }
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
                  if (confirm('Supprimer ce commentaire ?')) {
                    deleteCommentMutation.mutate(comment.id);
                  }
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
          message="Rien à modérer pour le moment"
          description="Les publications et commentaires signalés apparaîtront ici."
          icon={Shield}
        />
      )}

      {activeData && (
        <DashboardPagination
          page={page}
          totalPages={activeData.meta.totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
