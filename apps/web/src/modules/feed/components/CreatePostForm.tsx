import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  POST_KIND_LABELS,
  POST_VISIBILITY_LABELS,
  ROLE_HIERARCHY,
  RoleCode,
  createPostSchema,
  type CreatePostInput,
  type PostAttachment,
  type PostKind,
} from '@rotary/shared-types';
import { createPost } from '../api';
import { fetchMyProfile } from '@/modules/dashboard/api';
import { fetchMessagingRecipients } from '@/modules/messaging/api';
import { useCurrentUser } from '@/modules/auth/hooks/use-auth';
import { queryKeys } from '@/lib/query-keys';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, X } from 'lucide-react';

interface CreatePostFormProps {
  repostOfId?: string | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onDone?: () => void;
}

function canCreateOfficial(roles: RoleCode[] = []) {
  const level = Math.max(...roles.map((r) => ROLE_HIERARCHY[r] ?? 0), 0);
  return level >= ROLE_HIERARCHY[RoleCode.SECRETARY];
}

export function CreatePostForm({
  repostOfId,
  open: openProp,
  onOpenChange,
  onDone,
}: CreatePostFormProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(Boolean(repostOfId));
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : uncontrolledOpen;
  const setOpen = (next: boolean) => {
    if (!isControlled) setUncontrolledOpen(next);
    onOpenChange?.(next);
  };
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [attachmentType, setAttachmentType] =
    useState<PostAttachment['type']>('image');
  const [mentionQuery, setMentionQuery] = useState('');
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();
  const { data: profile } = useQuery({
    queryKey: queryKeys.dashboard.profile,
    queryFn: fetchMyProfile,
    enabled: open,
  });

  const form = useForm<CreatePostInput>({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      kind: 'MEMBER_POST',
      visibility: 'ALL_MEMBERS',
      content: '',
      linkUrl: '',
      commissionId: '',
      attachments: [],
      repostOfId: repostOfId ?? undefined,
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = form;

  const visibility = useWatch({ control, name: 'visibility' });
  const attachments = useWatch({ control, name: 'attachments' }) ?? [];
  const content = useWatch({ control, name: 'content' }) ?? '';

  useEffect(() => {
    if (repostOfId) {
      setOpen(true);
      setValue('repostOfId', repostOfId);
    }
  }, [repostOfId, setValue]);

  useEffect(() => {
    const match = content.match(/@([A-Za-zÀ-ÿ'-]*)$/);
    setMentionQuery(match?.[1] ?? '');
  }, [content]);

  const { data: mentionSuggestions = [] } = useQuery({
    queryKey: queryKeys.messaging.recipients(mentionQuery),
    queryFn: () => fetchMessagingRecipients(mentionQuery),
    enabled: open && mentionQuery.length >= 1,
  });

  const kindOptions = useMemo(() => {
    const all = Object.entries(POST_KIND_LABELS) as [PostKind, string][];
    if (canCreateOfficial(user?.roles)) return all;
    return all.filter(([kind]) => kind === 'MEMBER_POST');
  }, [user?.roles]);

  const mutation = useMutation({
    mutationFn: createPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed', 'list'] });
      reset({
        kind: 'MEMBER_POST',
        visibility: 'ALL_MEMBERS',
        content: '',
        linkUrl: '',
        commissionId: '',
        attachments: [],
        repostOfId: undefined,
      });
      setOpen(false);
      onDone?.();
    },
  });

  const addAttachment = () => {
    const url = attachmentUrl.trim();
    if (!url) return;
    setValue('attachments', [
      ...attachments,
      { type: attachmentType, url, name: undefined },
    ]);
    setAttachmentUrl('');
  };

  const removeAttachment = (index: number) => {
    setValue(
      'attachments',
      attachments.filter((_, i) => i !== index),
    );
  };

  const insertMention = (firstName: string, lastName: string) => {
    const next = content.replace(/@([A-Za-zÀ-ÿ'-]*)$/, `@${firstName} ${lastName} `);
    setValue('content', next, { shouldDirty: true });
    setMentionQuery('');
  };

  if (!open) {
    return null;
  }

  return (
    <form
      onSubmit={handleSubmit((values) => {
        const payload: CreatePostInput = {
          ...values,
          linkUrl: values.linkUrl?.trim() || undefined,
          commissionId:
            values.visibility === 'COMMISSION' && values.commissionId
              ? values.commissionId
              : undefined,
          attachments: values.attachments?.length ? values.attachments : undefined,
          repostOfId: values.repostOfId || undefined,
        };
        mutation.mutate(payload);
      })}
      className="space-y-4 rounded-2xl border border-neutral-100 bg-neutral-0 p-5 shadow-soft"
    >
      {repostOfId && (
        <p className="rounded-lg bg-primary-50 px-3 py-2 text-sm text-primary-800">
          Vous republiez une publication existante.
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="post-kind">Type</Label>
          <Select id="post-kind" className="mt-1.5" {...register('kind')}>
            {kindOptions.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="post-visibility">Visibilité</Label>
          <Select id="post-visibility" className="mt-1.5" {...register('visibility')}>
            {Object.entries(POST_VISIBILITY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {visibility === 'COMMISSION' && (
        <div>
          <Label htmlFor="post-commission">Commission</Label>
          <Select
            id="post-commission"
            className="mt-1.5"
            {...register('commissionId')}
          >
            <option value="">Sélectionner…</option>
            {profile?.commissions.map((c) => (
              <option key={c.commissionId} value={c.commissionId}>
                {c.commissionName}
              </option>
            ))}
          </Select>
          {errors.commissionId && (
            <p className="mt-1 text-sm text-red-600">{errors.commissionId.message}</p>
          )}
        </div>
      )}

      <div className="relative">
        <Label htmlFor="post-content">Contenu</Label>
        <Textarea
          id="post-content"
          {...register('content')}
          placeholder="Quoi de neuf au club ? Utilisez @Nom pour mentionner quelqu’un."
          rows={4}
          className="mt-1.5"
        />
        {errors.content && (
          <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
        )}
        {mentionQuery && mentionSuggestions.length > 0 && (
          <ul className="absolute z-10 mt-1 max-h-40 w-full overflow-auto rounded-xl border border-neutral-100 bg-neutral-0 py-1 shadow-lift">
            {mentionSuggestions.slice(0, 5).map((person) => (
              <li key={person.id}>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-primary-50"
                  onClick={() => insertMention(person.firstName, person.lastName)}
                >
                  @{person.firstName} {person.lastName}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <Label htmlFor="post-link">Lien (optionnel)</Label>
        <Input
          id="post-link"
          type="url"
          placeholder="https://…"
          className="mt-1.5"
          {...register('linkUrl')}
        />
        {errors.linkUrl && (
          <p className="mt-1 text-sm text-red-600">{errors.linkUrl.message}</p>
        )}
      </div>

      <div className="rounded-xl border border-neutral-100 bg-neutral-50/70 p-3">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
          Pièces jointes
        </p>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <Select
            value={attachmentType}
            onChange={(e) =>
              setAttachmentType(e.target.value as PostAttachment['type'])
            }
            className="sm:w-36"
          >
            <option value="image">Image</option>
            <option value="video">Vidéo</option>
            <option value="document">Document</option>
            <option value="link">Lien</option>
          </Select>
          <Input
            value={attachmentUrl}
            onChange={(e) => setAttachmentUrl(e.target.value)}
            placeholder="URL du fichier ou média"
            className="flex-1"
          />
          <Button type="button" variant="outline" size="sm" onClick={addAttachment}>
            <Plus className="h-4 w-4" />
            Ajouter
          </Button>
        </div>
        {attachments.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {attachments.map((item, index) => (
              <li
                key={`${item.url}-${index}`}
                className="flex items-center justify-between gap-2 rounded-lg bg-neutral-0 px-3 py-2 text-sm"
              >
                <span className="truncate text-neutral-700">
                  <span className="font-medium text-primary-800">{item.type}</span>
                  {' · '}
                  {item.url}
                </span>
                <button
                  type="button"
                  onClick={() => removeAttachment(index)}
                  className="text-neutral-400 hover:text-red-600"
                  aria-label="Retirer"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {mutation.isError && (
        <p className="text-sm text-red-600">
          Impossible de publier. Vérifiez vos droits et les champs renseignés.
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setOpen(false);
            onDone?.();
          }}
        >
          Annuler
        </Button>
        <Button type="submit" size="sm" disabled={mutation.isPending}>
          Publier
        </Button>
      </div>
    </form>
  );
}
