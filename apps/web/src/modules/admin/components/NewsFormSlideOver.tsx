import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  createNewsSchema,
  type CreateNewsInput,
  type NewsAdmin,
  type NewsCategory,
} from '@rotary/shared-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { SlideOver } from '@/components/SlideOver';
import { slugify } from '../utils/content';

const formSchema = z.object({
  title: z.string().min(1, 'Le titre est requis'),
  slug: z
    .string()
    .min(1, 'Le slug est requis')
    .regex(/^[a-z0-9-]+$/, 'Slug invalide'),
  excerpt: z.string().min(1, 'L’extrait est requis'),
  content: z.string().min(1, 'Le contenu est requis'),
  coverImage: z.string().optional(),
  categoryId: z.string().uuid('Catégorie requise'),
});

type FormValues = z.infer<typeof formSchema>;

function toFormValues(
  article: NewsAdmin | null | undefined,
  categories: NewsCategory[],
): FormValues {
  if (!article) {
    return {
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      coverImage: '',
      categoryId: categories[0]?.id ?? '',
    };
  }
  return {
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt,
    content: article.content,
    coverImage: article.coverImage ?? '',
    categoryId: article.category.id,
  };
}

interface NewsFormSlideOverProps {
  open: boolean;
  onClose: () => void;
  article?: NewsAdmin | null;
  categories: NewsCategory[];
  onSubmit: (input: CreateNewsInput) => Promise<unknown>;
  isPending?: boolean;
  errorMessage?: string | null;
}

export function NewsFormSlideOver({
  open,
  onClose,
  article = null,
  categories,
  onSubmit,
  isPending = false,
  errorMessage,
}: NewsFormSlideOverProps) {
  const isEdit = Boolean(article);
  const [slugTouched, setSlugTouched] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: toFormValues(article, categories),
  });

  const titleValue = watch('title');
  const slugRegister = register('slug');

  useEffect(() => {
    if (!open) return;
    setSlugTouched(isEdit);
    reset(toFormValues(article, categories));
  }, [open, article, categories, reset, isEdit]);

  useEffect(() => {
    if (!open || slugTouched) return;
    setValue('slug', slugify(titleValue ?? ''), {
      shouldValidate: Boolean(titleValue),
    });
  }, [titleValue, open, slugTouched, setValue]);

  const closeForm = () => {
    if (isPending) return;
    onClose();
  };

  const submit = handleSubmit(async (values) => {
    const payload = createNewsSchema.parse({
      title: values.title,
      slug: values.slug,
      excerpt: values.excerpt,
      content: values.content,
      coverImage: values.coverImage?.trim() || undefined,
      categoryId: values.categoryId,
      ...(isEdit ? {} : { status: 'DRAFT' as const }),
    });
    await onSubmit(payload);
  });

  return (
    <SlideOver
      open={open}
      onClose={closeForm}
      size="lg"
      eyebrow="Espace public"
      title={isEdit ? 'Modifier l’actualité' : 'Nouvelle actualité'}
      description={
        isEdit
          ? 'Mettez à jour l’article visible sur Nos actualités.'
          : 'Rédigez une actualité pour la vitrine publique.'
      }
      closeDisabled={isPending}
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={closeForm} disabled={isPending}>
            Annuler
          </Button>
          <Button type="submit" form="admin-news-form" disabled={isPending}>
            {isPending
              ? 'Enregistrement…'
              : isEdit
                ? 'Enregistrer'
                : 'Créer l’actualité'}
          </Button>
        </div>
      }
    >
      <form id="admin-news-form" className="space-y-6" onSubmit={submit}>
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="h-4 w-0.5 rounded-full bg-accent-500" aria-hidden />
            <h3 className="text-xs font-semibold uppercase tracking-wide text-accent-700">
              Identité
            </h3>
          </div>
          <div className="space-y-4 rounded-xl border border-accent-100/80 bg-accent-50/20 p-4">
            <div className="space-y-2">
              <Label htmlFor="news-title">Titre</Label>
              <Input id="news-title" {...register('title')} />
              {errors.title && <p className="text-sm text-red-600">{errors.title.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="news-slug">Slug</Label>
              <Input
                id="news-slug"
                {...slugRegister}
                onChange={(event) => {
                  setSlugTouched(true);
                  void slugRegister.onChange(event);
                }}
              />
              {errors.slug && <p className="text-sm text-red-600">{errors.slug.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="news-category">Catégorie</Label>
              <Select id="news-category" {...register('categoryId')}>
                <option value="">Sélectionner…</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
              {errors.categoryId && (
                <p className="text-sm text-red-600">{errors.categoryId.message}</p>
              )}
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="h-4 w-0.5 rounded-full bg-primary-500" aria-hidden />
            <h3 className="text-xs font-semibold uppercase tracking-wide text-primary-700">
              Contenu
            </h3>
          </div>
          <div className="space-y-4 rounded-xl border border-primary-100/70 bg-primary-50/20 p-4">
            <div className="space-y-2">
              <Label htmlFor="news-excerpt">Extrait</Label>
              <Textarea id="news-excerpt" rows={2} {...register('excerpt')} />
              {errors.excerpt && (
                <p className="text-sm text-red-600">{errors.excerpt.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="news-content">Corps de l’article</Label>
              <Textarea id="news-content" rows={8} {...register('content')} />
              {errors.content && (
                <p className="text-sm text-red-600">{errors.content.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="news-cover">Image de couverture (URL)</Label>
              <Input
                id="news-cover"
                type="url"
                placeholder="https://…"
                {...register('coverImage')}
              />
            </div>
          </div>
        </section>

        {!isEdit && (
          <p className="rounded-xl border border-amber-100 bg-amber-50/60 px-3 py-2.5 text-sm text-amber-900">
            L’actualité sera créée en <strong>brouillon</strong>. Vous pourrez la
            publier ou l’archiver depuis sa fiche.
          </p>
        )}

        {errorMessage && (
          <p className="rounded-xl border border-red-100 bg-red-50/60 px-3 py-2.5 text-sm text-red-600">
            {errorMessage}
          </p>
        )}
      </form>
    </SlideOver>
  );
}
