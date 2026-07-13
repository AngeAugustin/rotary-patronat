import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Mail, Send } from 'lucide-react';
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from '@rotary/shared-types';
import { useForgotPassword } from '../hooks/use-auth';
import { useAuthSession } from '../context/AuthSessionProvider';
import { AuthShell } from '../components/AuthShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const forgotMutation = useForgotPassword();
  const { isAuthReady, isAuthenticated } = useAuthSession();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    await forgotMutation.mutateAsync(values);
    navigate('/mot-de-passe-oublie/otp', { state: { email: values.email } });
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

  return (
    <AuthShell
      eyebrow="Sécurité"
      title="Mot de passe oublié"
      description="Saisissez l’adresse e-mail de votre compte. Nous vous enverrons un code de vérification."
      footer={
        <p className="mt-8 text-center text-sm text-neutral-600">
          <Link
            to="/connexion"
            className="inline-flex items-center gap-1.5 font-semibold text-primary-700 transition-colors hover:text-primary-900"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            Retour à la connexion
          </Link>
        </p>
      }
    >
      <form className="space-y-5 p-8" onSubmit={onSubmit} noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-primary-900">
            Adresse e-mail
          </Label>
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
          {errors.email && (
            <p className="text-sm text-red-600" role="alert">
              {errors.email.message}
            </p>
          )}
        </div>

        {forgotMutation.isError && (
          <div
            className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {forgotMutation.error.message}
          </div>
        )}

        <Button
          type="submit"
          className="h-12 w-full text-base"
          size="lg"
          disabled={forgotMutation.isPending}
        >
          {forgotMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Envoi…
            </>
          ) : (
            <>
              <Send className="h-4 w-4" aria-hidden />
              Envoyer le code
            </>
          )}
        </Button>
      </form>
    </AuthShell>
  );
}
