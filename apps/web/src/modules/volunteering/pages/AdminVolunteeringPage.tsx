import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { HeartHandshake } from 'lucide-react';
import {
  VOLUNTEERING_STATUS_LABELS,
  type VolunteeringStatus,
  type VolunteeringSummary,
} from '@rotary/shared-types';
import { fetchVolunteering, reviewVolunteering } from '../api';
import { DeclarationCard } from '../components/DeclarationCard';
import { queryKeys } from '@/lib/query-keys';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  DashboardEmptyState,
  DashboardSkeleton,
} from '@/modules/dashboard/components/layout';
import { cn } from '@/lib/utils';

type ReviewAction = {
  declaration: VolunteeringSummary;
  status: 'VALIDATED' | 'REJECTED';
};

const STATUS_FILTERS: { value: VolunteeringStatus; label: string }[] = [
  { value: 'PENDING', label: VOLUNTEERING_STATUS_LABELS.PENDING },
  { value: 'VALIDATED', label: VOLUNTEERING_STATUS_LABELS.VALIDATED },
  { value: 'REJECTED', label: VOLUNTEERING_STATUS_LABELS.REJECTED },
];

const EMPTY_COPY: Record<
  VolunteeringStatus,
  { message: string; description: string }
> = {
  PENDING: {
    message: 'Aucune déclaration en attente',
    description: 'Les nouvelles déclarations de bénévolat apparaîtront ici.',
  },
  VALIDATED: {
    message: 'Aucune déclaration validée',
    description: 'Les déclarations validées apparaîtront dans ce filtre.',
  },
  REJECTED: {
    message: 'Aucune déclaration refusée',
    description: 'Les déclarations refusées apparaîtront dans ce filtre.',
  },
};

function isVolunteeringStatus(value: string | null): value is VolunteeringStatus {
  return value === 'PENDING' || value === 'VALIDATED' || value === 'REJECTED';
}

export function AdminVolunteeringPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const declarationParam = searchParams.get('declaration');
  const statusParam = searchParams.get('status');

  const [statusFilter, setStatusFilter] = useState<VolunteeringStatus>(() =>
    isVolunteeringStatus(statusParam) ? statusParam : 'PENDING',
  );
  const [highlightedId, setHighlightedId] = useState<string | null>(declarationParam);
  const [reviewAction, setReviewAction] = useState<ReviewAction | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    if (isVolunteeringStatus(statusParam) && statusParam !== statusFilter) {
      setStatusFilter(statusParam);
    }
  }, [statusParam, statusFilter]);

  useEffect(() => {
    setHighlightedId(declarationParam);
  }, [declarationParam]);

  const { data, isLoading } = useQuery({
    queryKey: [...queryKeys.volunteering.admin, statusFilter, highlightedId ? 'focus' : 'list'],
    queryFn: () =>
      fetchVolunteering({
        status: statusFilter,
        limit: highlightedId ? 50 : 20,
        scope: 'all',
      }),
  });

  useEffect(() => {
    if (!highlightedId || isLoading || !data?.data.some((item) => item.id === highlightedId)) {
      return;
    }

    const timer = window.setTimeout(() => {
      document
        .getElementById(`declaration-${highlightedId}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 80);

    return () => window.clearTimeout(timer);
  }, [highlightedId, isLoading, data]);

  const reviewMutation = useMutation({
    mutationFn: ({
      id,
      status,
      rejectionReason,
    }: {
      id: string;
      status: 'VALIDATED' | 'REJECTED';
      rejectionReason?: string;
    }) => reviewVolunteering(id, { status, rejectionReason }),
    onSuccess: () => {
      setReviewAction(null);
      setRejectionReason('');
      queryClient.invalidateQueries({ queryKey: queryKeys.volunteering.admin });
      queryClient.invalidateQueries({ queryKey: queryKeys.volunteering.list });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stats });
    },
  });

  const closeReviewDialog = () => {
    if (reviewMutation.isPending) return;
    setReviewAction(null);
    setRejectionReason('');
    reviewMutation.reset();
  };

  const openReview = (
    declaration: VolunteeringSummary,
    status: 'VALIDATED' | 'REJECTED',
  ) => {
    reviewMutation.reset();
    setRejectionReason('');
    setReviewAction({ declaration, status });
  };

  const confirmReview = () => {
    if (!reviewAction) return;
    if (reviewAction.status === 'REJECTED' && !rejectionReason.trim()) return;

    reviewMutation.mutate({
      id: reviewAction.declaration.id,
      status: reviewAction.status,
      rejectionReason:
        reviewAction.status === 'REJECTED' ? rejectionReason.trim() : undefined,
    });
  };

  const changeFilter = (status: VolunteeringStatus) => {
    setStatusFilter(status);
    setHighlightedId(null);
    const next = new URLSearchParams(searchParams);
    next.set('status', status);
    next.delete('declaration');
    setSearchParams(next, { replace: true });
  };

  const isReject = reviewAction?.status === 'REJECTED';
  const declaration = reviewAction?.declaration;
  const count = data?.data.length ?? 0;
  const empty = EMPTY_COPY[statusFilter];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-1.5 border-b border-neutral-100 pb-4">
        {STATUS_FILTERS.map((filter) => {
          const isActive = statusFilter === filter.value;
          return (
            <button
              key={filter.value}
              type="button"
              onClick={() => changeFilter(filter.value)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm transition-colors',
                isActive
                  ? 'bg-primary-900 text-neutral-0'
                  : 'text-neutral-500 hover:bg-neutral-50 hover:text-primary-800',
              )}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <DashboardSkeleton key={i} className="h-64" />
          ))}
        </div>
      ) : count === 0 ? (
        <DashboardEmptyState
          message={empty.message}
          description={empty.description}
          icon={HeartHandshake}
        />
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-neutral-500">
            {count} déclaration{count > 1 ? 's' : ''} ·{' '}
            {VOLUNTEERING_STATUS_LABELS[statusFilter].toLowerCase()}
            {statusFilter === 'PENDING' ? ' de validation' : ''}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data?.data.map((item) => (
              <DeclarationCard
                key={item.id}
                declaration={item}
                showUser
                highlighted={item.id === highlightedId}
                onReview={
                  statusFilter === 'PENDING'
                    ? (_, status) => openReview(item, status)
                    : undefined
                }
                reviewing={reviewMutation.isPending}
              />
            ))}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(reviewAction)}
        onClose={closeReviewDialog}
        onConfirm={confirmReview}
        title={isReject ? 'Refuser cette déclaration ?' : 'Valider cette déclaration ?'}
        description={
          declaration
            ? isReject
              ? `La déclaration de ${declaration.userName} pour « ${declaration.visitedClub} » sera refusée.`
              : `La déclaration de ${declaration.userName} pour « ${declaration.visitedClub} » (${declaration.hours} h) sera validée.`
            : undefined
        }
        error={reviewMutation.isError ? reviewMutation.error.message : null}
        confirmLabel={isReject ? 'Refuser' : 'Valider'}
        confirmPending={reviewMutation.isPending}
        confirmDisabled={isReject && !rejectionReason.trim()}
        destructive={isReject}
      >
        {isReject && (
          <div className="space-y-2">
            <Label htmlFor="rejection-reason">Motif du refus</Label>
            <Textarea
              id="rejection-reason"
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Indiquez la raison du refus…"
              disabled={reviewMutation.isPending}
            />
          </div>
        )}
      </ConfirmDialog>
    </div>
  );
}
