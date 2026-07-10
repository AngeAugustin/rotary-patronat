import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createPostSchema, type CreatePostInput } from '@rotary/shared-types';
import { createPost } from '../api';
import { queryKeys } from '@/lib/query-keys';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export function CreatePostForm() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreatePostInput>({
    resolver: zodResolver(createPostSchema),
    defaultValues: { kind: 'MEMBER_POST', visibility: 'ALL_MEMBERS' },
  });

  const mutation = useMutation({
    mutationFn: createPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.feed.list('') });
      reset();
      setOpen(false);
    },
  });

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-2xl border border-dashed border-neutral-200 bg-neutral-0 px-5 py-4 text-left text-neutral-500 transition hover:border-primary-200 hover:text-neutral-700"
      >
        Partagez une actualité avec le club…
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit((values) => mutation.mutate(values))}
      className="rounded-2xl border border-neutral-100 bg-neutral-0 p-5 shadow-soft"
    >
      <Textarea
        {...register('content')}
        placeholder="Quoi de neuf au club ?"
        rows={4}
        className="mb-3"
      />
      {errors.content && (
        <p className="mb-3 text-sm text-red-600">{errors.content.message}</p>
      )}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Annuler
        </Button>
        <Button type="submit" size="sm" disabled={mutation.isPending}>
          Publier
        </Button>
      </div>
    </form>
  );
}
