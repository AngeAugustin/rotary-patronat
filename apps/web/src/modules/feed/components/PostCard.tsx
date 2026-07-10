import { Heart, MessageCircle, Megaphone, Calendar, FileText } from 'lucide-react';
import type { PostSummary } from '@rotary/shared-types';
import { POST_KIND_LABELS } from '@rotary/shared-types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const kindIcons = {
  MEMBER_POST: MessageCircle,
  ANNOUNCEMENT: Megaphone,
  EVENT: Calendar,
  COMMUNIQUE: FileText,
};

interface PostCardProps {
  post: PostSummary;
  onLike?: () => void;
  onComment?: () => void;
  liking?: boolean;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function PostCard({ post, onLike, onComment, liking }: PostCardProps) {
  const Icon = kindIcons[post.kind];

  return (
    <article className="rounded-2xl border border-neutral-100 bg-neutral-0 p-5 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 text-primary-700">
            <Icon className="h-4 w-4" aria-hidden />
          </div>
          <div>
            <p className="font-medium text-primary-900">
              {post.author.firstName} {post.author.lastName}
            </p>
            <p className="text-xs text-neutral-400">{formatDate(post.createdAt)}</p>
          </div>
        </div>
        <Badge>{POST_KIND_LABELS[post.kind]}</Badge>
      </div>

      {post.commissionName && (
        <p className="mt-3 text-xs text-neutral-500">Commission {post.commissionName}</p>
      )}

      <p className="mt-4 whitespace-pre-wrap text-neutral-800">{post.content}</p>

      {post.linkUrl && (
        <a
          href={post.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block text-sm text-primary-700 hover:underline"
        >
          {post.linkUrl}
        </a>
      )}

      <div className="mt-4 flex items-center gap-4 border-t border-neutral-50 pt-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onLike}
          disabled={liking}
          className={cn(post.likedByMe && 'text-red-600')}
        >
          <Heart className={cn('mr-1.5 h-4 w-4', post.likedByMe && 'fill-current')} />
          {post.likeCount}
        </Button>
        <Button variant="ghost" size="sm" onClick={onComment}>
          <MessageCircle className="mr-1.5 h-4 w-4" />
          {post.commentCount}
        </Button>
      </div>
    </article>
  );
}
