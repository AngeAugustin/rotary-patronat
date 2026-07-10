import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppRouter } from './router';
import { OfflineBanner } from '@/components/OfflineBanner';
import { AuthSessionProvider } from '@/modules/auth/context/AuthSessionProvider';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  },
});

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthSessionProvider>{children}</AuthSessionProvider>
    </QueryClientProvider>
  );
}

export function App() {
  return (
    <AppProviders>
      <OfflineBanner />
      <AppRouter />
    </AppProviders>
  );
}
