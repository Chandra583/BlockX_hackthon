import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../hooks/redux';
import { AlertCircle, Shield } from 'lucide-react';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
  fallbackRoute?: string;
}

const UnauthorizedAccess: React.FC<{ message?: string }> = ({ 
  message = "You don't have permission to access this page." 
}) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
      <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
        <Shield className="w-8 h-8 text-red-600" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
      <p className="text-gray-600 mb-6">{message}</p>
      <div className="flex items-center justify-center p-4 bg-red-50 border border-red-200 rounded-lg">
        <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
        <span className="text-red-700 text-sm">
          Please contact your administrator if you believe this is an error.
        </span>
      </div>
    </div>
  </div>
);

export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  allowedRoles,
  fallbackRoute
}) => {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const location = useLocation();

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If no user data, redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Normalize role for comparison
  const userRole = (user.role || '').toLowerCase();
  const normalizedAllowedRoles = allowedRoles.map(role => role.toLowerCase());

  // Check if user's role is in allowed roles
  if (!normalizedAllowedRoles.includes(userRole)) {
    // If fallback route is provided, redirect there
    if (fallbackRoute) {
      return <Navigate to={fallbackRoute} replace />;
    }
    
    // Otherwise show unauthorized access
    return <UnauthorizedAccess />;
  }

  return <>{children}</>;
};

export default RoleGuard;






