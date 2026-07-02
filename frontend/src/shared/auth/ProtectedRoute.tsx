import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';

interface ProtectedRouteProps {
  roles?: string[];
}

export function ProtectedRoute({ roles = [] }: ProtectedRouteProps) {
  const { user, hasRole } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!hasRole(roles)) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
