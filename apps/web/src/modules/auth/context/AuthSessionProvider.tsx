import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authQueryKeys, refreshSession } from '../api';
import { connectRealtime } from '@/lib/realtime-client';

interface AuthSessionContextValue {
  isAuthReady: boolean;
  isAuthenticated: boolean;
  setAuthenticated: (value: boolean) => void;
}

const AuthSessionContext = createContext<AuthSessionContextValue>({
  isAuthReady: false,
  isAuthenticated: false,
  setAuthenticated: () => undefined,
});

export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const queryClient = useQueryClient();

  const setAuthenticated = useCallback((value: boolean) => {
    setIsAuthenticated(value);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const session = await refreshSession();
        if (cancelled) return;

        if (session) {
          queryClient.setQueryData(authQueryKeys.auth.me, session.user);
          setIsAuthenticated(true);
          connectRealtime();
        } else {
          setIsAuthenticated(false);
        }
      } finally {
        if (!cancelled) {
          setIsAuthReady(true);
        }
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [queryClient]);

  const value = useMemo(
    () => ({ isAuthReady, isAuthenticated, setAuthenticated }),
    [isAuthReady, isAuthenticated, setAuthenticated],
  );

  return (
    <AuthSessionContext.Provider value={value}>
      {children}
    </AuthSessionContext.Provider>
  );
}

export function useAuthSession() {
  return useContext(AuthSessionContext);
}
