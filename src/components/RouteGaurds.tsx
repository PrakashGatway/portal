import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../context/UserContext';
import FullScreenLoader from './fullScreeLoader';

// Protected Route - only for authenticated users
export const ProtectedRoute = ({ roles }: any) => {
  const { user, loading } = useAuth() as any;

  if (loading) return <FullScreenLoader />;

  if (!user) {
    const hostParts = window.location.hostname.split('.');

    if (hostParts.length > 2) {
      hostParts.shift(); // remove first subdomain (e.g., "portal")
    }

    window.location.href =
      `${window.location.protocol}//${hostParts.join('.')}`;
    return null
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

// Auth Route - only for non-authenticated users
export const AuthRoute = () => {
  const { user } = useAuth() as any;

  if (user) return <Navigate to="/" replace />;

  return <Outlet />;
};