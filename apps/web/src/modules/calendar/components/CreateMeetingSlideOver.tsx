import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  CALENDAR_EVENT_FORMAT_LABELS,
  CALENDAR_EVENT_VISIBILITY_LABELS,
  CalendarEventFormat,
  CalendarEventType,
  CalendarEventVisibility,
  createCalendarEventSchema,
  type CalendarEventItem,
  type CreateCalendarEventInput,
} from '@rotary/shared-types';
import { createCalendarEvent, updateCalendarEvent } from '../api';
import { fetchCommissions } from '@/modules/admin/api';
import { queryKeys } from '@/lib/query-keys';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { SlideOver } from '@/components/SlideOver';
import { cn } from '@/lib/utils';

const MEETING_FORM_TYPES = [
  CalendarEventType.MEETING,
  CalendarEventType.EVENT,
] as const;

const MEETING_FORM_TYPE_LABELS: Record<(typeof MEETING_FORM_TYPES)[number], string> = {
  [CalendarEventType.MEETING]: 'Réunion',
  [CalendarEventType.EVENT]: 'Événement',
};

function todayInputValue() {
  return toDateInputValue(new Date());
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function combineDateAndTime(date: string, time: string) {
  return new Date(`${date}T${time}:00`).toISOString();
}

const createMeetingFormSchema = z
  .object({
    title: z.string().min(1, 'Le titre est requis'),
    description: z.string().optional(),
    type: z.enum(['MEETING', 'EVENT']),
    format: z.enum(['IN_PERSON', 'ONLINE']),
    visibility: z.enum(['PRIVATE', 'PUBLIC']),
    date: z.string().min(1, 'La date est requise'),
    startTime: z.string().min(1, 'L’heure de début est requise'),
    endTime: z.string().min(1, 'L’heure de fin est requise'),
    location: z.string().optional(),
    meetingUrl: z.string().optional(),
    commissionId: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    const start = new Date(`${values.date}T${values.startTime}:00`);
    const end = new Date(`${values.date}T${values.endTime}:00`);
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end <= start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endTime'],
        message: 'L’heure de fin doit être après l’heure de début',
      });
    }

    if (values.format === 'IN_PERSON' && !values.location?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['location'],
        message: 'Le lieu est requis pour une réunion en présentiel',
      });
    }

    if (values.format === 'ONLINE') {
      const url = values.meetingUrl?.trim() ?? '';
      if (!url) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['meetingUrl'],
          message: 'Le lien est requis pour une réunion en ligne',
        });
      } else {
        try {
          const parsed = new URL(url);
          if (!['http:', 'https:'].includes(parsed.protocol)) {
            throw new Error('invalid protocol');
          }
        } catch {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['meetingUrl'],
            message: 'Lien invalide',
          });
        }
      }
    }
  });

type CreateMeetingFormValues = z.infer<typeof createMeetingFormSchema>;

function toCreateInput(values: CreateMeetingFormValues): CreateCalendarEventInput {
  return createCalendarEventSchema.parse({
    title: values.title,
    description: values.description || undefined,
    type: values.type,
    format: values.format,
    visibility: values.visibility,
    startAt: combineDateAndTime(values.date, values.startTime),
    endAt: combineDateAndTime(values.date, values.endTime),
    location:
      values.format === CalendarEventFormat.IN_PERSON
        ? values.location?.trim()
        : undefined,
    meetingUrl:
      values.format === CalendarEventFormat.ONLINE
        ? values.meetingUrl?.trim()
        : undefined,
    commissionId: values.commissionId || undefined,
  });
}

function toTimeInputValue(iso: string) {
  const date = new Date(iso);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function eventToFormValues(event: CalendarEventItem): CreateMeetingFormValues {
  return {
    title: event.title,
    description: event.description ?? '',
    type: event.type === CalendarEventType.EVENT ? CalendarEventType.EVENT : CalendarEventType.MEETING,
    format: event.format,
    visibility: event.visibility,
    date: toDateInputValue(new Date(event.startAt)),
    startTime: toTimeInputValue(event.startAt),
    endTime: toTimeInputValue(event.endAt),
    location: event.location ?? '',
    meetingUrl: event.meetingUrl ?? '',
    commissionId: event.commissionId ?? '',
  };
}

interface CreateMeetingSlideOverProps {
  open: boolean;
  onClose: () => void;
  defaultDate?: Date | null;
  event?: CalendarEventItem | null;
  onSaved?: (event: CalendarEventItem) => void;
}

export function CreateMeetingSlideOver({
  open,
  onClose,
  defaultDate,
  event = null,
  onSaved,
}: CreateMeetingSlideOverProps) {
  const queryClient = useQueryClient();
  const isEdit = Boolean(event);

  const { data: commissions } = useQuery({
    queryKey: queryKeys.admin.commissions(1),
    queryFn: () => fetchCommissions(1),
    enabled: open,
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateMeetingFormValues>({
    resolver: zodResolver(createMeetingFormSchema),
    defaultValues: {
      title: '',
      description: '',
      type: CalendarEventType.MEETING,
      format: CalendarEventFormat.IN_PERSON,
      visibility: CalendarEventVisibility.PRIVATE,
      date: todayInputValue(),
      startTime: '18:00',
      endTime: '20:00',
      location: '',
      meetingUrl: '',
      commissionId: '',
    },
  });

  const format = watch('format');
  const visibility = watch('visibility');

  useEffect(() => {
    if (!open) return;
    if (event) {
      reset(eventToFormValues(event));
      return;
    }
    const dateValue = defaultDate ? toDateInputValue(defaultDate) : todayInputValue();
    reset({
      title: '',
      description: '',
      type: CalendarEventType.MEETING,
      format: CalendarEventFormat.IN_PERSON,
      visibility: CalendarEventVisibility.PRIVATE,
      date: dateValue,
      startTime: '18:00',
      endTime: '20:00',
      location: '',
      meetingUrl: '',
      commissionId: '',
    });
  }, [open, defaultDate, event, reset]);

  const saveMutation = useMutation({
    mutationFn: (values: CreateMeetingFormValues) => {
      const payload = toCreateInput(values);
      if (event) return updateCalendarEvent(event.id, payload);
      return createCalendarEvent(payload);
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['calendar', 'range'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.overview });
      onSaved?.(saved);
      onClose();
    },
  });

  const closeForm = () => {
    if (saveMutation.isPending) return;
    onClose();
  };

  const onSubmit = handleSubmit((values) => {
    saveMutation.mutate(values);
  });

  return (
    <SlideOver
      open={open}
      onClose={closeForm}
      eyebrow="Calendrier"
      title={isEdit ? 'Modifier la réunion' : 'Ajouter une réunion'}
      description={
        isEdit
          ? 'Mettez à jour les informations de cette réunion.'
          : 'Planifiez une réunion en présentiel ou en ligne.'
      }
      closeDisabled={saveMutation.isPending}
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={closeForm}
            disabled={saveMutation.isPending}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            form="create-meeting-form"
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending
              ? isEdit
                ? 'Enregistrement…'
                : 'Création…'
              : isEdit
                ? 'Enregistrer'
                : 'Créer la réunion'}
          </Button>
        </div>
      }
    >
      <form id="create-meeting-form" className="space-y-6" onSubmit={onSubmit}>
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="h-4 w-0.5 rounded-full bg-accent-500" aria-hidden />
            <h3 className="text-xs font-semibold uppercase tracking-wide text-accent-700">
              Identité
            </h3>
          </div>
          <div className="space-y-4 rounded-xl border border-accent-100/80 bg-accent-50/20 p-4">
            <div className="space-y-2">
              <Label htmlFor="create-meeting-title">Titre</Label>
              <Input
                id="create-meeting-title"
                placeholder="Ex. Réunion statutaire mensuelle"
                {...register('title')}
              />
              {errors.title && (
                <p className="text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-meeting-type">Type</Label>
              <Select id="create-meeting-type" {...register('type')}>
                {MEETING_FORM_TYPES.map((value) => (
                  <option key={value} value={value}>
                    {MEETING_FORM_TYPE_LABELS[value]}
                  </option>
                ))}
              </Select>
              {errors.type && (
                <p className="text-sm text-red-600">{errors.type.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-meeting-description">Description</Label>
              <Textarea
                id="create-meeting-description"
                rows={3}
                placeholder="Ordre du jour, précisions…"
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
              Planning
            </h3>
          </div>
          <div className="space-y-4 rounded-xl border border-primary-100/70 bg-primary-50/20 p-4">
            <div className="space-y-2">
              <Label htmlFor="create-meeting-date">Date</Label>
              <Input id="create-meeting-date" type="date" {...register('date')} />
              {errors.date && (
                <p className="text-sm text-red-600">{errors.date.message}</p>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="create-meeting-start">Heure de début</Label>
                <Input id="create-meeting-start" type="time" {...register('startTime')} />
                {errors.startTime && (
                  <p className="text-sm text-red-600">{errors.startTime.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-meeting-end">Heure de fin</Label>
                <Input id="create-meeting-end" type="time" {...register('endTime')} />
                {errors.endTime && (
                  <p className="text-sm text-red-600">{errors.endTime.message}</p>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="h-4 w-0.5 rounded-full bg-primary-500" aria-hidden />
            <h3 className="text-xs font-semibold uppercase tracking-wide text-primary-700">
              Modalité
            </h3>
          </div>
          <div className="space-y-4 rounded-xl border border-primary-100/70 bg-primary-50/20 p-4">
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(CALENDAR_EVENT_FORMAT_LABELS) as Array<
                keyof typeof CALENDAR_EVENT_FORMAT_LABELS
              >).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    setValue('format', value, {
                      shouldValidate: true,
                      shouldDirty: true,
                    })
                  }
                  className={cn(
                    'rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors',
                    format === value
                      ? 'border-primary-600 bg-primary-700 text-neutral-0'
                      : 'border-neutral-200 bg-neutral-0 text-neutral-700 hover:border-primary-200 hover:bg-primary-50/40',
                  )}
                >
                  {CALENDAR_EVENT_FORMAT_LABELS[value]}
                </button>
              ))}
            </div>
            <input type="hidden" {...register('format')} />

            {format === CalendarEventFormat.IN_PERSON ? (
              <div className="space-y-2">
                <Label htmlFor="create-meeting-location">Lieu</Label>
                <Input
                  id="create-meeting-location"
                  placeholder="Ex. Siège du club, Cotonou"
                  {...register('location')}
                />
                {errors.location && (
                  <p className="text-sm text-red-600">{errors.location.message}</p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="create-meeting-url">Lien de la réunion</Label>
                <Input
                  id="create-meeting-url"
                  type="url"
                  placeholder="https://meet.google.com/…"
                  {...register('meetingUrl')}
                />
                {errors.meetingUrl && (
                  <p className="text-sm text-red-600">{errors.meetingUrl.message}</p>
                )}
              </div>
            )}
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="h-4 w-0.5 rounded-full bg-primary-500" aria-hidden />
            <h3 className="text-xs font-semibold uppercase tracking-wide text-primary-700">
              Visibilité
            </h3>
          </div>
          <div className="space-y-3 rounded-xl border border-primary-100/70 bg-primary-50/20 p-4">
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(CALENDAR_EVENT_VISIBILITY_LABELS) as Array<
                keyof typeof CALENDAR_EVENT_VISIBILITY_LABELS
              >).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    setValue('visibility', value, {
                      shouldValidate: true,
                      shouldDirty: true,
                    })
                  }
                  className={cn(
                    'rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors',
                    visibility === value
                      ? 'border-primary-600 bg-primary-700 text-neutral-0'
                      : 'border-neutral-200 bg-neutral-0 text-neutral-700 hover:border-primary-200 hover:bg-primary-50/40',
                  )}
                >
                  {CALENDAR_EVENT_VISIBILITY_LABELS[value]}
                </button>
              ))}
            </div>
            <input type="hidden" {...register('visibility')} />
            <p className="text-xs leading-relaxed text-neutral-500">
              {visibility === CalendarEventVisibility.PUBLIC
                ? 'Visible dans l’espace connecté et sur la page publique Nos réunions.'
                : 'Visible uniquement par les membres dans l’espace connecté.'}
            </p>
            {errors.visibility && (
              <p className="text-sm text-red-600">{errors.visibility.message}</p>
            )}
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="h-4 w-0.5 rounded-full bg-primary-500" aria-hidden />
            <h3 className="text-xs font-semibold uppercase tracking-wide text-primary-700">
              Organisation
            </h3>
          </div>
          <div className="space-y-4 rounded-xl border border-primary-100/70 bg-primary-50/20 p-4">
            <div className="space-y-2">
              <Label htmlFor="create-meeting-commission">Commission (optionnel)</Label>
              <Select id="create-meeting-commission" {...register('commissionId')}>
                <option value="">Aucune</option>
                {commissions?.data.map((commission) => (
                  <option key={commission.id} value={commission.id}>
                    {commission.name}
                  </option>
                ))}
              </Select>
              {errors.commissionId && (
                <p className="text-sm text-red-600">{errors.commissionId.message}</p>
              )}
            </div>
          </div>
        </section>

        {saveMutation.isError && (
          <p className="rounded-xl border border-red-100 bg-red-50/60 px-3 py-2.5 text-sm text-red-600">
            {saveMutation.error.message}
          </p>
        )}
      </form>
    </SlideOver>
  );
}
