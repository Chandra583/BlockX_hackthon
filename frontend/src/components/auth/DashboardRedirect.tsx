import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../../hooks/redux';

export const DashboardRedirect: React.FC = () => {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  // If not authenticated, redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Get role-specific dashboard route
  const getRoleDashboardRoute = (role: string): string => {
    const normalizedRole = role.toLowerCase();
    
    switch (normalizedRole) {
      case 'admin':
        return '/admin/dashboard';
      case 'owner':
        return '/owner/dashboard';
      case 'service':
        return '/sp/dashboard';
      case 'buyer':
        return '/buyer/dashboard';
      case 'insurance':
        return '/insurance/dashboard';
      case 'government':
        return '/government/dashboard';
      default:
        return '/login';
    }
  };

  const dashboardRoute = getRoleDashboardRoute(user.role);
  return <Navigate to={dashboardRoute} replace />;
};

export default DashboardRedirect;
