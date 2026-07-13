import { useState } from 'react';
import {
  Calendar,
  ExternalLink,
  FileText,
  Flag,
  Heart,
  Megaphone,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Repeat2,
  Trash2,
} from 'lucide-react';
import type { PostSummary, UpdatePostInput } from '@rotary/shared-types';
import { POST_KIND_LABELS } from '@rotary/shared-types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const kindIcons = {
  MEMBER_POST: MessageCircle,
  ANNOUNCEMENT: Megaphone,
  EVENT: Calendar,
  COMMUNIQUE: FileText,
};

interface PostCardProps {
  post: PostSummary;
  currentUserId?: string;
  isAdmin?: boolean;
  onLike?: () => void;
  onComment?: () => void;
  onRepost?: () => void;
  onDelete?: () => void;
  onReport?: () => void;
  onUpdate?: (input: UpdatePostInput) => Promise<unknown> | void;
  liking?: boolean;
  busy?: boolean;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

function renderContentWithMentions(content: string) {
  const parts = content.split(/(@[A-Za-zÀ-ÿ'-]+(?:\s+[A-Za-zÀ-ÿ'-]+)?)/g);
  return parts.map((part, index) =>
    part.startsWith('@') ? (
      <span key={index} className="font-medium text-primary-700">
        {part}
      </span>
    ) : (
      <span key={index}>{part}</span>
    ),
  );
}

export function PostCard({
  post,
  currentUserId,
  isAdmin,
  onLike,
  onComment,
  onRepost,
  onDelete,
  onReport,
  onUpdate,
  liking,
  busy,
}: PostCardProps) {
  const Icon = kindIcons[post.kind];
  const canManage = Boolean(
    currentUserId && (post.author.id === currentUserId || isAdmin),
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(post.content);

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
        <div className="flex items-center gap-2">
          <Badge>{POST_KIND_LABELS[post.kind]}</Badge>
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              aria-label="Actions"
              onClick={() => setMenuOpen((v) => !v)}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
            {menuOpen && (
              <div className="absolute right-0 z-10 mt-1 w-44 overflow-hidden rounded-xl border border-neutral-100 bg-neutral-0 py-1 shadow-lift">
                {canManage && (
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-neutral-50"
                    onClick={() => {
                      setEditing(true);
                      setDraft(post.content);
                      setMenuOpen(false);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Modifier
                  </button>
                )}
                {canManage && (
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50"
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete?.();
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Supprimer
                  </button>
                )}
                {post.author.id !== currentUserId && (
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-neutral-50"
                    onClick={() => {
                      setMenuOpen(false);
                      onReport?.();
                    }}
                  >
                    <Flag className="h-3.5 w-3.5" />
                    Signaler
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {post.commissionName && (
        <p className="mt-3 text-xs text-neutral-500">
          Commission {post.commissionName}
          {post.visibility === 'COMMISSION' ? ' · Visibilité limitée' : ''}
        </p>
      )}

      {post.repostOfId && (
        <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary-600">
          <Repeat2 className="h-3.5 w-3.5" />
          Republication
        </p>
      )}

      {editing ? (
        <div className="mt-4 space-y-3">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={4}
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setEditing(false)}
            >
              Annuler
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={busy || !draft.trim()}
              onClick={async () => {
                await onUpdate?.({ content: draft.trim() });
                setEditing(false);
              }}
            >
              Enregistrer
            </Button>
          </div>
        </div>
      ) : (
        <p className="mt-4 whitespace-pre-wrap text-neutral-800">
          {renderContentWithMentions(post.content)}
        </p>
      )}

      {post.attachments && post.attachments.length > 0 && (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {post.attachments.map((attachment) => (
            <a
              key={attachment.url}
              href={attachment.url}
              target="_blank"
              rel="noopener noreferrer"
              className="overflow-hidden rounded-xl border border-neutral-100 bg-neutral-50"
            >
              {attachment.type === 'image' ? (
                <img
                  src={attachment.url}
                  alt={attachment.name ?? ''}
                  className="aspect-[16/10] w-full object-cover"
                  loading="lazy"
                />
              ) : attachment.type === 'video' ? (
                <div className="flex aspect-[16/10] items-center justify-center text-sm text-primary-700">
                  Voir la vidéo
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-3 text-sm text-primary-800">
                  <FileText className="h-4 w-4" />
                  <span className="truncate">
                    {attachment.name ?? attachment.url}
                  </span>
                </div>
              )}
            </a>
          ))}
        </div>
      )}

      {post.linkUrl && (
        <a
          href={post.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary-700 hover:underline"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          {post.linkUrl}
        </a>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-neutral-50 pt-4">
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
        <Button variant="ghost" size="sm" onClick={onRepost}>
          <Repeat2 className="mr-1.5 h-4 w-4" />
          Republier
        </Button>
      </div>
    </article>
  );
}
