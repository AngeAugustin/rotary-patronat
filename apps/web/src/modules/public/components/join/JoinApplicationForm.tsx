import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createMembershipApplicationSchema,
  type CreateMembershipApplicationInput,
} from '@rotary/shared-types';
import {
  Briefcase,
  FileText,
  Link2,
  Loader2,
  Mail,
  Phone,
  Send,
  User,
  UserCheck,
  X,
} from 'lucide-react';
import { submitMembershipApplication } from '../../api';
import { JoinFormField, JoinFormSection } from './JoinFormFields';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const MOTIVATION_MIN = 20;

interface JoinApplicationFormProps {
  onSuccess: () => void;
}

export function JoinApplicationForm({ onSuccess }: JoinApplicationFormProps) {
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [attachmentError, setAttachmentError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateMembershipApplicationInput>({
    resolver: zodResolver(createMembershipApplicationSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      profession: '',
      sponsorFirstName: '',
      sponsorLastName: '',
      motivation: '',
      attachmentUrls: [],
    },
  });

  const attachmentUrls = watch('attachmentUrls') ?? [];
  const motivation = watch('motivation') ?? '';
  const motivationLength = motivation.trim().length;

  const mutation = useMutation({
    mutationFn: submitMembershipApplication,
    onSuccess: () => onSuccess(),
  });

  const addAttachment = () => {
    const url = attachmentUrl.trim();
    if (!url) return;

    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error('invalid');
      }
      if (attachmentUrls.includes(url)) {
        setAttachmentError('Ce lien a déjà été ajouté.');
        return;
      }
      setValue('attachmentUrls', [...attachmentUrls, url]);
      setAttachmentUrl('');
      setAttachmentError(null);
    } catch {
      setAttachmentError('Veuillez saisir une URL valide (https://…).');
    }
  };

  const removeAttachment = (url: string) => {
    setValue(
      'attachmentUrls',
      attachmentUrls.filter((item) => item !== url),
    );
  };

  return (
    <form
      className="overflow-hidden rounded-3xl border border-neutral-100 bg-neutral-0 shadow-lift"
      onSubmit={handleSubmit((data) => mutation.mutate(data))}
      noValidate
    >
      <div className="border-b border-neutral-100 bg-gradient-to-r from-primary-50 via-neutral-0 to-accent-50 px-8 py-7 md:px-10">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-accent-700">
          Candidature
        </p>
        <h2 className="mt-2 font-display text-2xl font-bold text-primary-900 md:text-3xl">
          Formulaire d&apos;adhésion
        </h2>
        <p className="mt-2 max-w-xl text-sm text-neutral-600">
          Complétez les informations ci-dessous. Notre équipe examinera votre
          dossier et vous recontactera dans les meilleurs délais.
        </p>
      </div>

      <div className="space-y-6 p-6 md:p-8 lg:p-10">
        <JoinFormSection
          step={1}
          title="Vos coordonnées"
          description="Pour que nous puissions vous recontacter."
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <JoinFormField
              id="firstName"
              label="Prénom"
              required
              error={errors.firstName?.message}
            >
              <div className="relative">
                <User
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
                  aria-hidden
                />
                <Input
                  id="firstName"
                  autoComplete="given-name"
                  placeholder="Jean"
                  className="pl-10"
                  aria-invalid={Boolean(errors.firstName)}
                  {...register('firstName')}
                />
              </div>
            </JoinFormField>

            <JoinFormField
              id="lastName"
              label="Nom"
              required
              error={errors.lastName?.message}
            >
              <div className="relative">
                <User
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
                  aria-hidden
                />
                <Input
                  id="lastName"
                  autoComplete="family-name"
                  placeholder="Dupont"
                  className="pl-10"
                  aria-invalid={Boolean(errors.lastName)}
                  {...register('lastName')}
                />
              </div>
            </JoinFormField>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <JoinFormField
              id="email"
              label="Adresse email"
              required
              error={errors.email?.message}
            >
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
                  aria-hidden
                />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="vous@exemple.com"
                  className="pl-10"
                  aria-invalid={Boolean(errors.email)}
                  {...register('email')}
                />
              </div>
            </JoinFormField>

            <JoinFormField
              id="phone"
              label="Téléphone"
              required
              hint="Numéro joignable (WhatsApp accepté)"
              error={errors.phone?.message}
            >
              <div className="relative">
                <Phone
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
                  aria-hidden
                />
                <Input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+229 …"
                  className="pl-10"
                  aria-invalid={Boolean(errors.phone)}
                  {...register('phone')}
                />
              </div>
            </JoinFormField>
          </div>
        </JoinFormSection>

        <JoinFormSection
          step={2}
          title="Votre profil"
          description="Votre activité professionnelle nous aide à mieux vous connaître."
        >
          <JoinFormField
            id="profession"
            label="Profession / activité"
            required
            error={errors.profession?.message}
          >
            <div className="relative">
              <Briefcase
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
                aria-hidden
              />
              <Input
                id="profession"
                autoComplete="organization-title"
                placeholder="Ex. Chef de projet, médecin, entrepreneur…"
                className="pl-10"
                aria-invalid={Boolean(errors.profession)}
                {...register('profession')}
              />
            </div>
          </JoinFormField>

          <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/60 p-5">
            <p className="text-sm font-medium text-primary-900">Parrain (optionnel)</p>
            <p className="mt-1 text-sm text-neutral-500">
              Si un membre du club vous oriente, indiquez son nom et son prénom.
            </p>
            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              <JoinFormField
                id="sponsorFirstName"
                label="Prénom du parrain"
                error={errors.sponsorFirstName?.message}
              >
                <div className="relative">
                  <UserCheck
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
                    aria-hidden
                  />
                  <Input
                    id="sponsorFirstName"
                    placeholder="Prénom"
                    className="pl-10"
                    aria-invalid={Boolean(errors.sponsorFirstName)}
                    {...register('sponsorFirstName')}
                  />
                </div>
              </JoinFormField>

              <JoinFormField
                id="sponsorLastName"
                label="Nom du parrain"
                error={errors.sponsorLastName?.message}
              >
                <div className="relative">
                  <UserCheck
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
                    aria-hidden
                  />
                  <Input
                    id="sponsorLastName"
                    placeholder="Nom"
                    className="pl-10"
                    aria-invalid={Boolean(errors.sponsorLastName)}
                    {...register('sponsorLastName')}
                  />
                </div>
              </JoinFormField>
            </div>
          </div>
        </JoinFormSection>

        <JoinFormSection
          step={3}
          title="Votre motivation"
          description="Expliquez ce qui vous attire dans le Rotary et dans notre club."
        >
          <JoinFormField
            id="motivation"
            label="Lettre de motivation"
            required
            error={errors.motivation?.message}
          >
            <Textarea
              id="motivation"
              rows={6}
              placeholder="Présentez-vous, partagez vos motivations et ce que vous souhaitez apporter au club…"
              className="min-h-[160px] resize-y"
              aria-invalid={Boolean(errors.motivation)}
              aria-describedby="motivation-counter"
              {...register('motivation')}
            />
            <p
              id="motivation-counter"
              className={cn(
                'text-right text-xs',
                motivationLength >= MOTIVATION_MIN
                  ? 'text-primary-600'
                  : 'text-neutral-400',
              )}
            >
              {motivationLength} caractère{motivationLength > 1 ? 's' : ''}{' '}
              <span className="text-neutral-400">(minimum {MOTIVATION_MIN})</span>
            </p>
          </JoinFormField>
        </JoinFormSection>

        <JoinFormSection
          step={4}
          title="Documents complémentaires"
          description="Facultatif — liens vers votre CV, portfolio ou lettre de motivation."
        >
          <JoinFormField
            id="attachmentUrl"
            label="Ajouter un lien"
            hint="Google Drive, Dropbox, LinkedIn ou tout autre lien public."
            error={attachmentError ?? undefined}
          >
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Link2
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
                  aria-hidden
                />
                <Input
                  id="attachmentUrl"
                  value={attachmentUrl}
                  onChange={(e) => {
                    setAttachmentUrl(e.target.value);
                    setAttachmentError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addAttachment();
                    }
                  }}
                  placeholder="https://…"
                  className="pl-10"
                />
              </div>
              <Button type="button" variant="outline" onClick={addAttachment}>
                Ajouter
              </Button>
            </div>
          </JoinFormField>

          {attachmentUrls.length > 0 && (
            <ul className="space-y-2">
              {attachmentUrls.map((url) => (
                <li
                  key={url}
                  className="flex items-center gap-3 rounded-xl border border-primary-100 bg-primary-50/50 px-4 py-3"
                >
                  <FileText className="h-4 w-4 shrink-0 text-primary-600" aria-hidden />
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-w-0 flex-1 truncate text-sm text-primary-700 hover:underline"
                  >
                    {url}
                  </a>
                  <button
                    type="button"
                    onClick={() => removeAttachment(url)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-0 hover:text-red-600"
                    aria-label={`Retirer ${url}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </JoinFormSection>

        <div className="rounded-2xl border border-neutral-100 bg-neutral-50 px-5 py-4 text-xs leading-relaxed text-neutral-500">
          En soumettant ce formulaire, vous acceptez que vos données soient
          traitées par l&apos;administration du club dans le cadre de votre
          candidature. Elles ne seront pas partagées en dehors du processus
          d&apos;adhésion.
        </div>

        {mutation.isError && (
          <div
            className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
            role="alert"
          >
            {mutation.error instanceof Error
              ? mutation.error.message
              : "Erreur lors de l'envoi. Veuillez réessayer."}
          </div>
        )}

        <Button
          type="submit"
          disabled={mutation.isPending}
          className="h-12 w-full text-base"
          size="lg"
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Envoi en cours…
            </>
          ) : (
            <>
              <Send className="h-4 w-4" aria-hidden />
              Envoyer ma candidature
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
