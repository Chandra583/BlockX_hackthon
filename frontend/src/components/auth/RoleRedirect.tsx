import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../hooks/redux';

interface RoleRedirectProps {
  fallbackRoute?: string;
}

export const RoleRedirect: React.FC<RoleRedirectProps> = ({ 
  fallbackRoute = '/login' 
}) => {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const location = useLocation();
  const [hasRedirected, setHasRedirected] = useState(false);

  // If not authenticated, redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to={fallbackRoute} replace />;
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
        // Fallback to login if role is unknown
        console.error(`Unknown user role: ${role}`);
        return fallbackRoute;
    }
  };

  const dashboardRoute = getRoleDashboardRoute(user.role);
  
  // Prevent infinite redirects by checking if we're already on the target route
  if (location.pathname === dashboardRoute) {
    return null; // Don't redirect if already on the target route
  }

  // Only redirect once
  useEffect(() => {
    if (!hasRedirected) {
      setHasRedirected(true);
    }
  }, [hasRedirected]);
  
  return <Navigate to={dashboardRoute} replace />;
};

export default RoleRedirect;





