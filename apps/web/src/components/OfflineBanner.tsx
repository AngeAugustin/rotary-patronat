import { useOnlineStatus } from '@/hooks/use-online-status';

export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-accent-600 px-4 py-2 text-center text-sm font-medium text-white"
    >
      Vous êtes hors ligne. Certaines pages mises en cache restent accessibles.
    </div>
  );
}
