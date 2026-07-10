import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Lock, LogIn, Mail } from 'lucide-react';
import { loginSchema, type LoginInput } from '@rotary/shared-types';
import { useLogin } from '../hooks/use-auth';
import { useAuthSession } from '../context/AuthSessionProvider';
import { LoginBrandPanel, LoginMobileHeader } from '../components/LoginBrandPanel';
import { AppLogo } from '@/components/AppLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fadeInUp } from '@/design-system/motion';
import { motion } from 'framer-motion';

export function LoginPage() {
  const navigate = useNavigate();
  const loginMutation = useLogin();
  const { isAuthReady, isAuthenticated } = useAuthSession();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    await loginMutation.mutateAsync(values);
    navigate('/dashboard');
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
    <div className="flex min-h-screen flex-col lg:grid lg:grid-cols-2">
      <LoginMobileHeader />
      <LoginBrandPanel />

      <div className="flex flex-1 flex-col bg-neutral-50">
        <div className="hidden items-center justify-between px-8 pt-8 lg:flex xl:px-12">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 transition-colors hover:text-primary-700"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Retour au site public
          </Link>
          <AppLogo className="h-9" />
        </div>

        <div className="flex flex-1 items-center justify-center px-4 py-10 lg:px-8 xl:px-12">
          <motion.div
            className="w-full max-w-md"
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
          >
            <div className="overflow-hidden rounded-3xl border border-neutral-100 bg-neutral-0 shadow-lift">
              <div className="border-b border-neutral-100 bg-gradient-to-r from-primary-50 via-neutral-0 to-accent-50 px-8 py-7">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-accent-700">
                  Membres
                </p>
                <h2 className="mt-2 font-display text-2xl font-bold text-primary-900">
                  Connexion
                </h2>
                <p className="mt-2 text-sm text-neutral-600">
                  Identifiez-vous pour accéder à votre espace privé.
                </p>
              </div>

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

                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-primary-900">
                    Mot de passe
                  </Label>
                  <div className="relative">
                    <Lock
                      className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
                      aria-hidden
                    />
                    <Input
                      id="password"
                      type="password"
                      autoComplete="current-password"
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

                {loginMutation.isError && (
                  <div
                    className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                    role="alert"
                  >
                    {loginMutation.error.message}
                  </div>
                )}

                <Button
                  type="submit"
                  className="h-12 w-full text-base"
                  size="lg"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      Connexion…
                    </>
                  ) : (
                    <>
                      <LogIn className="h-4 w-4" aria-hidden />
                      Se connecter
                    </>
                  )}
                </Button>
              </form>
            </div>

            <p className="mt-8 text-center text-sm text-neutral-600">
              Pas encore membre ?{' '}
              <Link
                to="/nous-rejoindre"
                className="font-semibold text-primary-700 transition-colors hover:text-primary-900"
              >
                Candidater à l&apos;adhésion
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
