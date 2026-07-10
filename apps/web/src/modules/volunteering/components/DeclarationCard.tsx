import {
  Calendar,
  Clock,
  ExternalLink,
  MapPin,
  Timer,
  Waypoints,
} from 'lucide-react';
import {
  VOLUNTEERING_STATUS_LABELS,
  type VolunteeringSummary,
} from '@rotary/shared-types';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/modules/dashboard/components/UserAvatar';
import { cn } from '@/lib/utils';

const statusStyles = {
  PENDING: 'bg-amber-50 text-amber-800 ring-amber-100',
  VALIDATED: 'bg-emerald-50 text-emerald-800 ring-emerald-100',
  REJECTED: 'bg-red-50 text-red-800 ring-red-100',
} as const;

function formatDate(date: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));
}

function MetaItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Calendar;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <div className="mb-1 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.06em] text-neutral-400">
        <Icon className="h-3 w-3" aria-hidden />
        {label}
      </div>
      <p className="truncate text-sm font-medium text-neutral-800">{value}</p>
    </div>
  );
}

interface DeclarationCardProps {
  declaration: VolunteeringSummary;
  showUser?: boolean;
  onReview?: (id: string, status: 'VALIDATED' | 'REJECTED') => void;
  onEdit?: () => void;
  onDelete?: () => void;
  reviewing?: boolean;
  highlighted?: boolean;
}

export function DeclarationCard({
  declaration,
  showUser,
  onReview,
  onEdit,
  onDelete,
  reviewing,
  highlighted = false,
}: DeclarationCardProps) {
  const [firstName, ...lastNameParts] = declaration.userName.split(' ');
  const lastName = lastNameParts.join(' ');
  const canReview = Boolean(onReview) && declaration.status === 'PENDING';
  const canManage =
    declaration.status === 'PENDING' && (Boolean(onEdit) || Boolean(onDelete));

  return (
    <article
      id={`declaration-${declaration.id}`}
      className={cn(
        'flex h-full scroll-mt-24 flex-col border bg-neutral-0 transition-colors',
        highlighted
          ? 'border-primary-400 ring-2 ring-primary-200'
          : 'border-neutral-200/80 hover:border-neutral-300',
      )}
    >
      <div className="flex flex-col gap-3 p-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-base font-semibold tracking-tight text-primary-900">
              {declaration.visitedClub}
            </h3>
            <span
              className={cn(
                'inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset',
                statusStyles[declaration.status],
              )}
            >
              {VOLUNTEERING_STATUS_LABELS[declaration.status]}
            </span>
          </div>
          <p className="mt-1.5 flex items-center gap-1.5 text-sm text-neutral-500">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {declaration.city}, {declaration.country}
          </p>
        </div>

        {showUser && (
          <div className="flex items-center gap-2.5">
            <UserAvatar
              firstName={firstName}
              lastName={lastName}
              size="sm"
              className="h-8 w-8 rounded-lg text-[10px] ring-1 ring-neutral-100"
            />
            <div className="min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">
                Déclarant
              </p>
              <p className="truncate text-sm font-medium text-neutral-800">
                {declaration.userName}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 border-t border-neutral-100 px-5 py-4">
        <MetaItem icon={Waypoints} label="Activité" value={declaration.activity} />
        <MetaItem icon={Calendar} label="Date" value={formatDate(declaration.date)} />
        <MetaItem icon={Clock} label="Heure" value={declaration.startTime} />
        <MetaItem icon={Timer} label="Durée" value={`${declaration.hours} h`} />
      </div>

      <div className="flex flex-1 flex-col border-t border-neutral-100 px-5 py-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-neutral-400">
          Description
        </p>
        <p className="mt-1.5 line-clamp-4 text-sm leading-relaxed text-neutral-700">
          {declaration.description}
        </p>

        {declaration.proofUrl && (
          <a
            href={declaration.proofUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary-700 transition-colors hover:text-accent-700"
          >
            Voir la preuve
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </a>
        )}

        {declaration.rejectionReason && (
          <div className="mt-3 border border-red-100 bg-red-50/60 px-3.5 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-red-700">
              Motif du refus
            </p>
            <p className="mt-1 text-sm text-red-800">{declaration.rejectionReason}</p>
          </div>
        )}

        {declaration.status === 'VALIDATED' && declaration.validatedByName && (
          <p className="mt-auto pt-3 text-xs text-neutral-400">
            Validée par {declaration.validatedByName}
            {declaration.validatedAt
              ? ` · ${formatDate(declaration.validatedAt)}`
              : ''}
          </p>
        )}
      </div>

      {canManage && (
        <div className="mt-auto flex flex-col-reverse gap-2 border-t border-neutral-100 bg-neutral-50/50 px-5 py-3.5 sm:flex-row sm:justify-end">
          {onDelete && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onDelete}
              className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
            >
              Supprimer
            </Button>
          )}
          {onEdit && (
            <Button type="button" variant="outline" size="sm" onClick={onEdit}>
              Modifier
            </Button>
          )}
        </div>
      )}

      {canReview && (
        <div className="mt-auto flex flex-col-reverse gap-2 border-t border-neutral-100 bg-neutral-50/50 px-5 py-3.5 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={reviewing}
            onClick={() => onReview?.(declaration.id, 'REJECTED')}
            className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
          >
            Refuser
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={reviewing}
            onClick={() => onReview?.(declaration.id, 'VALIDATED')}
          >
            Valider
          </Button>
        </div>
      )}
    </article>
  );
}
