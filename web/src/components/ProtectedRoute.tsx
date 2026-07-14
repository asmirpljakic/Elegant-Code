import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Array<'SUPER_ADMIN' | 'ADMIN' | 'PROFESOR' | 'UCENIK' | 'KLIJENT'>;
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const location = useLocation();

  if (!isAuthenticated || !user) {
    // Nije prijavljen, preusmeri na login stranicu sa return url-om
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Prijavljen je, ali nema ovlašćenje (npr. učenik pokušava da uđe u admin panel)
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
