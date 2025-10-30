import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../hooks/redux';
import { PermissionService } from '../../utils/permissions';
import { AlertCircle, Shield } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requiredPermission?: {
    resource: string;
    action: string;
  };
  fallbackComponent?: React.ComponentType;
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

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  requiredPermission,
  fallbackComponent: FallbackComponent = UnauthorizedAccess,
}) => {
  const { isAuthenticated, user, selectedRole } = useAppSelector((state) => state.auth);
  const location = useLocation();

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If no user data, redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Resolve effective role: selectedRole from state (which syncs with localStorage)
  const effectiveRole = selectedRole || user.role;
  
  // Get user's available roles
  const userRoles = user.roles || (user.role ? [user.role] : []);

  // Check role-based access
  if (allowedRoles) {
    // Check if effectiveRole is in allowedRoles OR if user has any of the allowedRoles
    const hasAccess = allowedRoles.includes(effectiveRole) || 
                      allowedRoles.some(role => userRoles.includes(role as any));
    
    if (!hasAccess) {
      return <FallbackComponent />;
    }
  }

  // Check permission-based access
  if (requiredPermission) {
    const hasPermission = PermissionService.hasPermission(
      effectiveRole,
      requiredPermission.resource,
      requiredPermission.action
    );

    if (!hasPermission) {
      return <FallbackComponent />;
    }
  }

  // Check route-based access
  const { canAccess, redirectTo } = PermissionService.validateRouteAccess(
    effectiveRole,
    location.pathname
  );

  if (!canAccess && redirectTo) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute; 