import { Navigate, Outlet } from 'react-router-dom';
import { useAuthSession } from '@/modules/auth/context/AuthSessionProvider';

function AuthLoadingScreen() {
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

export function ProtectedRoute() {
  const { isAuthReady, isAuthenticated } = useAuthSession();

  if (!isAuthReady) {
    return <AuthLoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/connexion" replace />;
  }

  return <Outlet />;
}
