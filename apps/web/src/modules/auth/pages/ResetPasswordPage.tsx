import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, Loader2, Lock } from 'lucide-react';
import { z } from 'zod';
import { useResetPassword } from '../hooks/use-auth';
import { useAuthSession } from '../context/AuthSessionProvider';
import { AuthShell } from '../components/AuthShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const resetFormSchema = z
  .object({
    password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
    confirmPassword: z.string().min(8, 'Confirmez votre mot de passe'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

type ResetFormInput = z.infer<typeof resetFormSchema>;

interface LocationState {
  resetToken?: string;
}

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const resetToken = (location.state as LocationState | null)?.resetToken;
  const resetMutation = useResetPassword();
  const { isAuthReady, isAuthenticated } = useAuthSession();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetFormInput>({
    resolver: zodResolver(resetFormSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    if (!resetToken) return;
    await resetMutation.mutateAsync({
      resetToken,
      password: values.password,
      confirmPassword: values.confirmPassword,
    });
    navigate('/connexion', {
      replace: true,
      state: { passwordResetSuccess: true },
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

  if (!resetToken) {
    return <Navigate to="/mot-de-passe-oublie" replace />;
  }

  return (
    <AuthShell
      eyebrow="Sécurité"
      title="Nouveau mot de passe"
      description="Choisissez un nouveau mot de passe sécurisé pour votre compte."
      footer={
        <p className="mt-8 text-center text-sm text-neutral-600">
          <Link
            to="/connexion"
            className="font-semibold text-primary-700 transition-colors hover:text-primary-900"
          >
            Retour à la connexion
          </Link>
        </p>
      }
    >
      <form className="space-y-5 p-8" onSubmit={onSubmit} noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-primary-900">
            Nouveau mot de passe
          </Label>
          <div className="relative">
            <Lock
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
              aria-hidden
            />
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              className="pl-10"
              aria-invalid={Boolean(errors.password)}
              {...register('password')}
            />
          </div>
          {errors.password && (
            <p className="text-sm text-red-600" role="alert">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword" className="text-primary-900">
            Confirmer le mot de passe
          </Label>
          <div className="relative">
            <Lock
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
              aria-hidden
            />
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              className="pl-10"
              aria-invalid={Boolean(errors.confirmPassword)}
              {...register('confirmPassword')}
            />
          </div>
          {errors.confirmPassword && (
            <p className="text-sm text-red-600" role="alert">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {resetMutation.isError && (
          <div
            className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {resetMutation.error.message}
          </div>
        )}

        <Button
          type="submit"
          className="h-12 w-full text-base"
          size="lg"
          disabled={resetMutation.isPending}
        >
          {resetMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Enregistrement…
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" aria-hidden />
              Enregistrer le mot de passe
            </>
          )}
        </Button>
      </form>
    </AuthShell>
  );
}
