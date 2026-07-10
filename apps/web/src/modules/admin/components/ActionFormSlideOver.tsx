import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  createActionSchema,
  type ActionAdmin,
  type CreateActionInput,
} from '@rotary/shared-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SlideOver } from '@/components/SlideOver';
import {
  fromDateInputValue,
  linesToList,
  listToLines,
  slugify,
  toDateInputValue,
} from '../utils/content';

const formSchema = z.object({
  title: z.string().min(1, 'Le titre est requis'),
  slug: z
    .string()
    .min(1, 'Le slug est requis')
    .regex(/^[a-z0-9-]+$/, 'Slug invalide'),
  summary: z.string().optional(),
  description: z.string().min(1, 'La description est requise'),
  date: z.string().min(1, 'La date est requise'),
  location: z.string().min(1, 'Le lieu est requis'),
  coverImage: z.string().optional(),
  galleryText: z.string().optional(),
  partnersText: z.string().optional(),
  results: z.string().optional(),
  featured: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

function toFormValues(action?: ActionAdmin | null): FormValues {
  if (!action) {
    return {
      title: '',
      slug: '',
      summary: '',
      description: '',
      date: toDateInputValue(new Date().toISOString()),
      location: '',
      coverImage: '',
      galleryText: '',
      partnersText: '',
      results: '',
      featured: false,
    };
  }
  return {
    title: action.title,
    slug: action.slug,
    summary: action.summary ?? '',
    description: action.description,
    date: toDateInputValue(action.date),
    location: action.location,
    coverImage: action.coverImage ?? '',
    galleryText: listToLines(action.gallery),
    partnersText: listToLines(action.partners),
    results: action.results ?? '',
    featured: action.featured,
  };
}

function toApiInput(values: FormValues, isEdit: boolean): CreateActionInput {
  const gallery = linesToList(values.galleryText ?? '').filter((url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  });

  return createActionSchema.parse({
    title: values.title,
    slug: values.slug,
    summary: values.summary || undefined,
    description: values.description,
    date: fromDateInputValue(values.date),
    location: values.location,
    coverImage: values.coverImage?.trim() || undefined,
    gallery,
    partners: linesToList(values.partnersText ?? ''),
    results: values.results || undefined,
    featured: values.featured,
    ...(isEdit ? {} : { status: 'DRAFT' as const }),
  });
}

interface ActionFormSlideOverProps {
  open: boolean;
  onClose: () => void;
  action?: ActionAdmin | null;
  onSubmit: (input: CreateActionInput) => Promise<unknown>;
  isPending?: boolean;
  errorMessage?: string | null;
}

export function ActionFormSlideOver({
  open,
  onClose,
  action = null,
  onSubmit,
  isPending = false,
  errorMessage,
}: ActionFormSlideOverProps) {
  const isEdit = Boolean(action);
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
    defaultValues: toFormValues(action),
  });

  const titleValue = watch('title');
  const slugRegister = register('slug');

  // Reset only when the panel opens — not when `action` updates after a successful
  // save/refetch (that would look like the modal "reloading" while still open).
  useEffect(() => {
    if (!open) return;
    setSlugTouched(Boolean(action));
    reset(toFormValues(action));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally only on open
  }, [open]);

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
    await onSubmit(toApiInput(values, isEdit));
    // Parent also closes on mutation success; call here so the panel always dismisses
    // even if a refetch races with the parent's state update.
    onClose();
  });

  return (
    <SlideOver
      open={open}
      onClose={closeForm}
      size="lg"
      eyebrow="Espace public"
      title={isEdit ? 'Modifier l’action' : 'Nouvelle action'}
      description={
        isEdit
          ? 'Mettez à jour le contenu de la fiche. Le statut se gère depuis la page détail.'
          : 'Créez une action en brouillon. Vous pourrez la publier depuis sa fiche.'
      }
      closeDisabled={isPending}
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={closeForm} disabled={isPending}>
            Annuler
          </Button>
          <Button type="submit" form="admin-action-form" disabled={isPending}>
            {isPending ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Créer l’action'}
          </Button>
        </div>
      }
    >
      <form id="admin-action-form" className="space-y-6" onSubmit={submit}>
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="h-4 w-0.5 rounded-full bg-accent-500" aria-hidden />
            <h3 className="text-xs font-semibold uppercase tracking-wide text-accent-700">
              Identité
            </h3>
          </div>
          <div className="space-y-4 rounded-xl border border-accent-100/80 bg-accent-50/20 p-4">
            <div className="space-y-2">
              <Label htmlFor="action-title">Titre</Label>
              <Input id="action-title" {...register('title')} />
              {errors.title && <p className="text-sm text-red-600">{errors.title.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="action-slug">Slug</Label>
              <Input
                id="action-slug"
                {...slugRegister}
                onChange={(event) => {
                  setSlugTouched(true);
                  void slugRegister.onChange(event);
                }}
              />
              {errors.slug && <p className="text-sm text-red-600">{errors.slug.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="action-summary">Résumé</Label>
              <Textarea id="action-summary" rows={2} {...register('summary')} />
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
              <Label htmlFor="action-description">Description</Label>
              <Textarea id="action-description" rows={5} {...register('description')} />
              {errors.description && (
                <p className="text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="action-results">Résultats</Label>
              <Textarea id="action-results" rows={3} {...register('results')} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="action-date">Date</Label>
                <Input id="action-date" type="date" {...register('date')} />
                {errors.date && <p className="text-sm text-red-600">{errors.date.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="action-location">Lieu</Label>
                <Input id="action-location" {...register('location')} />
                {errors.location && (
                  <p className="text-sm text-red-600">{errors.location.message}</p>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="h-4 w-0.5 rounded-full bg-primary-500" aria-hidden />
            <h3 className="text-xs font-semibold uppercase tracking-wide text-primary-700">
              Médias & partenaires
            </h3>
          </div>
          <div className="space-y-4 rounded-xl border border-primary-100/70 bg-primary-50/20 p-4">
            <div className="space-y-2">
              <Label htmlFor="action-cover">Image de couverture (URL)</Label>
              <Input
                id="action-cover"
                type="url"
                placeholder="https://…"
                {...register('coverImage')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="action-gallery">Galerie (une URL par ligne)</Label>
              <Textarea id="action-gallery" rows={3} {...register('galleryText')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="action-partners">Partenaires (un par ligne)</Label>
              <Textarea id="action-partners" rows={3} {...register('partnersText')} />
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="h-4 w-0.5 rounded-full bg-primary-500" aria-hidden />
            <h3 className="text-xs font-semibold uppercase tracking-wide text-primary-700">
              Mise en avant
            </h3>
          </div>
          <div className="space-y-4 rounded-xl border border-primary-100/70 bg-primary-50/20 p-4">
            <label className="flex items-center gap-2 text-sm text-neutral-700">
              <input
                type="checkbox"
                className="rounded border-neutral-300"
                {...register('featured')}
              />
              Mettre en avant sur l’accueil
            </label>
          </div>
        </section>

        {errorMessage && (
          <p className="rounded-xl border border-red-100 bg-red-50/60 px-3 py-2.5 text-sm text-red-600">
            {errorMessage}
          </p>
        )}
      </form>
    </SlideOver>
  );
}
