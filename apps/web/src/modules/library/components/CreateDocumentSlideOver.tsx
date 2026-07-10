import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  DOCUMENT_FILE_TYPE_LABELS,
  DocumentFileType,
  DocumentVisibility,
  createDocumentSchema,
  type CreateDocumentInput,
} from '@rotary/shared-types';
import { createDocument, fetchDocumentCategories } from '../api';
import { queryKeys } from '@/lib/query-keys';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { SlideOver } from '@/components/SlideOver';

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

interface CreateDocumentSlideOverProps {
  open: boolean;
  onClose: () => void;
}

export function CreateDocumentSlideOver({
  open,
  onClose,
}: CreateDocumentSlideOverProps) {
  const queryClient = useQueryClient();
  const [slugTouched, setSlugTouched] = useState(false);

  const { data: categories } = useQuery({
    queryKey: queryKeys.library.categories,
    queryFn: fetchDocumentCategories,
    enabled: open,
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateDocumentInput>({
    resolver: zodResolver(createDocumentSchema),
    defaultValues: {
      title: '',
      slug: '',
      description: '',
      fileUrl: '',
      categoryId: '',
      visibility: DocumentVisibility.PRIVATE,
      fileType: DocumentFileType.PDF,
    },
  });

  const titleValue = watch('title');
  const slugRegister = register('slug');

  useEffect(() => {
    if (!open) return;
    reset({
      title: '',
      slug: '',
      description: '',
      fileUrl: '',
      categoryId: '',
      visibility: DocumentVisibility.PRIVATE,
      fileType: DocumentFileType.PDF,
    });
    setSlugTouched(false);
  }, [open, reset]);

  useEffect(() => {
    if (!open || slugTouched) return;
    setValue('slug', slugify(titleValue ?? ''), {
      shouldValidate: Boolean(titleValue),
    });
  }, [titleValue, open, slugTouched, setValue]);

  const createMutation = useMutation({
    mutationFn: createDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.library.list('') });
      queryClient.invalidateQueries({ queryKey: queryKeys.library.categories });
      onClose();
    },
  });

  const closeForm = () => {
    if (createMutation.isPending) return;
    onClose();
  };

  const onSubmit = handleSubmit((values) => {
    createMutation.mutate(values);
  });

  return (
    <SlideOver
      open={open}
      onClose={closeForm}
      eyebrow="Bibliothèque"
      title="Ajouter un document"
      description="Publiez un document classé par catégorie, accessible aux membres ou au public."
      closeDisabled={createMutation.isPending}
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={closeForm}
            disabled={createMutation.isPending}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            form="create-document-form"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? 'Enregistrement…' : 'Ajouter le document'}
          </Button>
        </div>
      }
    >
      <form id="create-document-form" className="space-y-6" onSubmit={onSubmit}>
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="h-4 w-0.5 rounded-full bg-accent-500" aria-hidden />
            <h3 className="text-xs font-semibold uppercase tracking-wide text-accent-700">
              Identité
            </h3>
          </div>
          <div className="space-y-4 rounded-xl border border-accent-100/80 bg-accent-50/20 p-4">
            <div className="space-y-2">
              <Label htmlFor="create-document-title">Titre</Label>
              <Input
                id="create-document-title"
                placeholder="Ex. Guide d’accueil des nouveaux membres"
                {...register('title')}
              />
              {errors.title && (
                <p className="text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-document-slug">Slug</Label>
              <Input
                id="create-document-slug"
                placeholder="ex: guide-accueil-membres"
                {...slugRegister}
                onChange={(event) => {
                  setSlugTouched(true);
                  void slugRegister.onChange(event);
                }}
              />
              <p className="text-xs text-neutral-500">
                Généré automatiquement à partir du titre — vous pouvez le modifier.
              </p>
              {errors.slug && (
                <p className="text-sm text-red-600">{errors.slug.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-document-description">Description</Label>
              <Textarea
                id="create-document-description"
                rows={3}
                placeholder="Résumé optionnel du document…"
                {...register('description')}
              />
              {errors.description && (
                <p className="text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="h-4 w-0.5 rounded-full bg-primary-500" aria-hidden />
            <h3 className="text-xs font-semibold uppercase tracking-wide text-primary-700">
              Fichier
            </h3>
          </div>
          <div className="space-y-4 rounded-xl border border-primary-100/70 bg-primary-50/20 p-4">
            <div className="space-y-2">
              <Label htmlFor="create-document-file-url">URL du fichier</Label>
              <Input
                id="create-document-file-url"
                placeholder="https://…"
                {...register('fileUrl')}
              />
              {errors.fileUrl && (
                <p className="text-sm text-red-600">{errors.fileUrl.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-document-file-type">Type de fichier</Label>
              <Select id="create-document-file-type" {...register('fileType')}>
                {Object.values(DocumentFileType).map((type) => (
                  <option key={type} value={type}>
                    {DOCUMENT_FILE_TYPE_LABELS[type]}
                  </option>
                ))}
              </Select>
              {errors.fileType && (
                <p className="text-sm text-red-600">{errors.fileType.message}</p>
              )}
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="h-4 w-0.5 rounded-full bg-primary-500" aria-hidden />
            <h3 className="text-xs font-semibold uppercase tracking-wide text-primary-700">
              Classement
            </h3>
          </div>
          <div className="space-y-4 rounded-xl border border-primary-100/70 bg-primary-50/20 p-4">
            <div className="space-y-2">
              <Label htmlFor="create-document-category">Catégorie</Label>
              <Select id="create-document-category" {...register('categoryId')}>
                <option value="">Sélectionner…</option>
                {categories?.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
              {errors.categoryId && (
                <p className="text-sm text-red-600">{errors.categoryId.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-document-visibility">Visibilité</Label>
              <Select id="create-document-visibility" {...register('visibility')}>
                <option value={DocumentVisibility.PRIVATE}>Privé (membres)</option>
                <option value={DocumentVisibility.PUBLIC}>Public</option>
              </Select>
              {errors.visibility && (
                <p className="text-sm text-red-600">{errors.visibility.message}</p>
              )}
            </div>
          </div>
        </section>

        {createMutation.isError && (
          <p className="rounded-xl border border-red-100 bg-red-50/60 px-3 py-2.5 text-sm text-red-600">
            {createMutation.error.message}
          </p>
        )}
      </form>
    </SlideOver>
  );
}
