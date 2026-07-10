import { cn } from '@/lib/utils';

interface AppLogoProps {
  className?: string;
}

export function AppLogo({ className }: AppLogoProps) {
  return (
    <img
      src="/logo.png"
      alt="Rotary Club Cotonou Le Nautile Patronat"
      className={cn('h-10 w-auto object-contain md:h-12', className)}
    />
  );
}
