import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, KeyRound, Loader2 } from 'lucide-react';
import { z } from 'zod';
import { useVerifyResetOtp } from '../hooks/use-auth';
import { useAuthSession } from '../context/AuthSessionProvider';
import { AuthShell } from '../components/AuthShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const otpFormSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Le code doit contenir exactement 6 chiffres'),
});

type OtpFormInput = z.infer<typeof otpFormSchema>;

interface LocationState {
  email?: string;
}

export function VerifyResetOtpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as LocationState | null)?.email;
  const verifyMutation = useVerifyResetOtp();
  const { isAuthReady, isAuthenticated } = useAuthSession();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OtpFormInput>({
    resolver: zodResolver(otpFormSchema),
    defaultValues: { code: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    if (!email) return;
    const result = await verifyMutation.mutateAsync({ email, code: values.code });
    navigate('/mot-de-passe-oublie/nouveau', {
      state: { resetToken: result.resetToken },
      replace: true,
    });
  });

  if (!isAuthReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-primary-700 border-t-transparent"
          role="status"
          aria-label="Chargement de la session"
        />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  if (!email) {
    return <Navigate to="/mot-de-passe-oublie" replace />;
  }

  return (
    <AuthShell
      eyebrow="Vérification"
      title="Saisir le code"
      description={`Un code à 6 chiffres a été envoyé à ${email} s’il existe un compte associé.`}
      footer={
        <p className="mt-8 text-center text-sm text-neutral-600">
          <Link
            to="/mot-de-passe-oublie"
            className="inline-flex items-center gap-1.5 font-semibold text-primary-700 transition-colors hover:text-primary-900"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            Changer d’adresse e-mail
          </Link>
        </p>
      }
    >
      <form className="space-y-5 p-8" onSubmit={onSubmit} noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="code" className="text-primary-900">
            Code de vérification
          </Label>
          <div className="relative">
            <KeyRound
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
              aria-hidden
            />
            <Input
              id="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              maxLength={6}
              className="pl-10 font-mono tracking-[0.35em]"
              aria-invalid={Boolean(errors.code)}
              {...register('code')}
            />
          </div>
          {errors.code && (
            <p className="text-sm text-red-600" role="alert">
              {errors.code.message}
            </p>
          )}
        </div>

        {verifyMutation.isError && (
          <div
            className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {verifyMutation.error.message}
          </div>
        )}

        <Button
          type="submit"
          className="h-12 w-full text-base"
          size="lg"
          disabled={verifyMutation.isPending}
        >
          {verifyMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Vérification…
            </>
          ) : (
            'Valider le code'
          )}
        </Button>
      </form>
    </AuthShell>
  );
}
