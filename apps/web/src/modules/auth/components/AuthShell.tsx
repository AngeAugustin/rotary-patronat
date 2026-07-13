import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { LoginBrandPanel, LoginMobileHeader } from './LoginBrandPanel';
import { AppLogo } from '@/components/AppLogo';
import { fadeInUp } from '@/design-system/motion';
import { motion } from 'framer-motion';

interface AuthShellProps {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  footer,
}: AuthShellProps) {
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
                  {eyebrow}
                </p>
                <h2 className="mt-2 font-display text-2xl font-bold text-primary-900">
                  {title}
                </h2>
                <p className="mt-2 text-sm text-neutral-600">{description}</p>
              </div>
              {children}
            </div>
            {footer}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
