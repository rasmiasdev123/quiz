import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores';
import { ROUTES } from '../utils/constants';
import { Spinner } from './ui';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { isAuthenticated, isLoading, userProfile, initializeAuth, logout } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    // Initialize auth on mount
    if (!isAuthenticated && !isLoading) {
      initializeAuth();
    }
  }, [isAuthenticated, isLoading, initializeAuth]);

  // Check if user is inactive (already authenticated but became inactive)
  useEffect(() => {
    if (isAuthenticated && userProfile) {
      const isActive = userProfile.is_active !== false; // Default to true if not set
      if (!isActive) {
        // User is inactive - logout and redirect
        logout();
      }
    }
  }, [isAuthenticated, userProfile, logout]);

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  // Check if user is inactive
  const isActive = userProfile?.is_active !== false;
  if (!isActive) {
    // Redirect to login with message
    return <Navigate to={ROUTES.LOGIN} state={{ from: location, inactive: true }} replace />;
  }

  // Check role if required
  if (requiredRole && userProfile?.role !== requiredRole) {
    // Redirect based on actual role
    if (userProfile?.role === 'admin') {
      return <Navigate to={ROUTES.ADMIN.DASHBOARD} replace />;
    } else {
      return <Navigate to={ROUTES.STUDENT.DASHBOARD} replace />;
    }
  }

  return children;
};

export default ProtectedRoute;

