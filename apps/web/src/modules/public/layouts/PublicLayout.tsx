import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SkipLink } from '@/components/SkipLink';
import { AppLogo } from '@/components/AppLogo';
import { MobileDrawer } from '@/components/MobileDrawer';
import { cn } from '@/lib/utils';
import { PublicFooter } from '../components/PublicFooter';
import { publicNavLinks } from '../constants/navigation';
import { publicContainerClass } from '../constants/layout';

function PublicNavLinks({
  onNavigate,
  className,
}: {
  onNavigate?: () => void;
  className?: string;
}) {
  return (
    <>
      {publicNavLinks.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.to === '/'}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'rounded-xl px-4 py-2.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary-50 text-primary-700'
                : 'text-neutral-700 hover:bg-neutral-50 hover:text-primary-700',
              className,
            )
          }
        >
          {link.label}
        </NavLink>
      ))}
    </>
  );
}

export function PublicHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-neutral-100/80 bg-neutral-0/80 backdrop-blur-md">
        <div className={cn(publicContainerClass, 'flex items-center justify-between gap-3 py-3 sm:py-4')}>
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="h-10 w-10 shrink-0 p-0 md:hidden"
              onClick={() => setMenuOpen(true)}
              aria-label="Ouvrir le menu de navigation"
            >
              <Menu className="h-5 w-5" />
            </Button>

            <Link
              to="/"
              className="shrink-0 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700"
            >
              <AppLogo />
            </Link>
          </div>

          <nav
            className="hidden items-center gap-1 md:flex"
            aria-label="Navigation principale"
          >
            <PublicNavLinks />
          </nav>

          <Button asChild size="sm" className="shrink-0">
            <Link to="/connexion">
              <span className="hidden min-[400px]:inline">Espace membre</span>
              <span className="min-[400px]:hidden">Membre</span>
            </Link>
          </Button>
        </div>
      </header>

      <MobileDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        title="Navigation"
      >
        <nav className="flex flex-col gap-1 p-4" aria-label="Navigation mobile">
          <PublicNavLinks
            onNavigate={() => setMenuOpen(false)}
            className="block w-full text-left"
          />
        </nav>

        <div className="border-t border-neutral-100 p-4">
          <Button asChild className="w-full" onClick={() => setMenuOpen(false)}>
            <Link to="/connexion">Espace membre</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="mt-2 w-full"
            onClick={() => setMenuOpen(false)}
          >
            <Link to="/nous-rejoindre">Nous rejoindre</Link>
          </Button>
        </div>
      </MobileDrawer>
    </>
  );
}

export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <SkipLink />
      <PublicHeader />
      <main id="main-content" className="flex-1">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
}
