import { Check, Circle, UserCheck, X } from 'lucide-react';
import type { MembershipApplicationSummary } from '@rotary/shared-types';
import { cn } from '@/lib/utils';
import { formatApplicationDateShort } from './membership-application.utils';

type StepVisualState = 'completed' | 'current' | 'upcoming' | 'rejected';

interface WorkflowStep {
  key: string;
  label: string;
  caption: string;
  state: StepVisualState;
  date?: string | null;
  meta?: string | null;
}

function buildWorkflowSteps(application: MembershipApplicationSummary): WorkflowStep[] {
  const { status, createdAt, reviewedAt, reviewedByName, memberId } = application;

  const reception: WorkflowStep = {
    key: 'reception',
    label: 'Réception',
    caption: 'Candidature déposée',
    state: 'completed',
    date: createdAt,
  };

  let examen: WorkflowStep;
  if (status === 'PENDING') {
    examen = {
      key: 'review',
      label: 'Examen',
      caption: 'En cours de traitement',
      state: 'current',
    };
  } else if (status === 'REVIEWED') {
    examen = {
      key: 'review',
      label: 'Examen',
      caption: 'Dossier examiné',
      state: 'completed',
      date: reviewedAt,
      meta: reviewedByName,
    };
  } else {
    examen = {
      key: 'review',
      label: 'Examen',
      caption: status === 'ACCEPTED' ? 'Dossier validé' : 'Dossier traité',
      state: 'completed',
      date: reviewedAt,
      meta: reviewedByName,
    };
  }

  let decision: WorkflowStep;
  if (status === 'PENDING' || status === 'REVIEWED') {
    decision = {
      key: 'decision',
      label: 'Décision',
      caption: status === 'REVIEWED' ? 'Décision à prendre' : 'En attente',
      state: status === 'REVIEWED' ? 'current' : 'upcoming',
    };
  } else if (status === 'ACCEPTED') {
    decision = {
      key: 'decision',
      label: 'Acceptée',
      caption: 'Candidature retenue',
      state: 'completed',
      date: reviewedAt,
      meta: reviewedByName,
    };
  } else {
    decision = {
      key: 'decision',
      label: 'Refusée',
      caption: application.adminNotes ?? 'Candidature non retenue',
      state: 'rejected',
      date: reviewedAt,
      meta: reviewedByName,
    };
  }

  let integration: WorkflowStep;
  if (status !== 'ACCEPTED') {
    integration = {
      key: 'member',
      label: 'Intégration',
      caption: 'Non applicable',
      state: 'upcoming',
    };
  } else if (memberId) {
    integration = {
      key: 'member',
      label: 'Membre',
      caption: 'Fiche membre créée',
      state: 'completed',
      date: reviewedAt,
    };
  } else {
    integration = {
      key: 'member',
      label: 'Intégration',
      caption: 'Création en attente',
      state: 'current',
    };
  }

  return [reception, examen, decision, integration];
}

function StepIcon({ state }: { state: StepVisualState }) {
  if (state === 'completed') {
    return <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />;
  }
  if (state === 'rejected') {
    return <X className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />;
  }
  if (state === 'current') {
    return <Circle className="h-2 w-2 fill-current" aria-hidden />;
  }
  return <Circle className="h-2 w-2" aria-hidden />;
}

const nodeClasses: Record<StepVisualState, string> = {
  completed: 'border-emerald-500 bg-emerald-500 text-neutral-0 shadow-[0_0_0_4px_rgba(16,185,129,0.15)]',
  current: 'border-primary-500 bg-neutral-0 text-primary-600 shadow-[0_0_0_4px_rgba(59,130,246,0.12)]',
  upcoming: 'border-neutral-200 bg-neutral-50 text-neutral-300',
  rejected: 'border-red-500 bg-red-500 text-neutral-0 shadow-[0_0_0_4px_rgba(239,68,68,0.12)]',
};

const labelClasses: Record<StepVisualState, string> = {
  completed: 'text-primary-900',
  current: 'text-primary-700',
  upcoming: 'text-neutral-400',
  rejected: 'text-red-700',
};

function isLineActive(from: StepVisualState) {
  return from === 'completed' || from === 'rejected';
}

interface MembershipApplicationWorkflowProps {
  application: MembershipApplicationSummary;
  className?: string;
}

export function MembershipApplicationWorkflow({
  application,
  className,
}: MembershipApplicationWorkflowProps) {
  const steps = buildWorkflowSteps(application);

  return (
    <div className={cn('overflow-x-auto pb-1', className)}>
      <div className="flex min-w-[38rem] items-start">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;

          return (
            <div key={step.key} className="flex flex-1 items-start">
              <div className="flex w-24 shrink-0 flex-col items-center text-center sm:w-auto sm:min-w-0 sm:flex-1">
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors',
                    nodeClasses[step.state],
                    step.state === 'current' && 'animate-pulse',
                  )}
                >
                  <StepIcon state={step.state} />
                </div>

                <p
                  className={cn(
                    'mt-2.5 text-xs font-semibold tracking-tight',
                    labelClasses[step.state],
                  )}
                >
                  {step.label}
                </p>
                <p className="mt-0.5 line-clamp-2 max-w-[6.5rem] text-[11px] leading-snug text-neutral-500 sm:max-w-[7.5rem]">
                  {step.caption}
                </p>
                {step.date && (
                  <p className="mt-1 text-[10px] font-medium text-neutral-400">
                    {formatApplicationDateShort(step.date)}
                  </p>
                )}
                {step.meta && (
                  <p className="mt-0.5 line-clamp-1 max-w-[6.5rem] text-[10px] text-neutral-400 sm:max-w-[7.5rem]">
                    {step.meta}
                  </p>
                )}
              </div>

              {!isLast && (
                <div
                  className={cn(
                    'mx-1 mt-4 h-0.5 min-w-[1rem] flex-1 rounded-full',
                    isLineActive(step.state)
                      ? step.state === 'rejected'
                        ? 'bg-gradient-to-r from-red-400 to-neutral-200'
                        : 'bg-gradient-to-r from-emerald-400 to-primary-200'
                      : step.state === 'current'
                        ? 'bg-gradient-to-r from-primary-300 to-neutral-200'
                        : 'bg-neutral-200',
                  )}
                  aria-hidden
                />
              )}
            </div>
          );
        })}
      </div>

      {application.adminNotes && application.status !== 'REJECTED' && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-neutral-100 bg-neutral-50/80 px-3 py-2.5">
          <UserCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400" aria-hidden />
          <p className="text-xs leading-relaxed text-neutral-600">
            <span className="font-medium text-neutral-700">Note : </span>
            {application.adminNotes}
          </p>
        </div>
      )}
    </div>
  );
}
