import { useAppSelector } from './redux';
import { PermissionService } from '../utils/permissions';

// Hook for checking permissions in components
export const usePermissions = () => {
  const { user } = useAppSelector((state) => state.auth);

  return {
    hasPermission: (resource: string, action: string) => {
      if (!user) return false;
      return PermissionService.hasPermission(user.role, resource, action);
    },
    canAccessRoute: (route: string) => {
      if (!user) return false;
      return PermissionService.canAccessRoute(user.role, route);
    },
    isAdmin: () => {
      if (!user) return false;
      return PermissionService.isAdmin(user.role);
    },
    hasElevatedPrivileges: () => {
      if (!user) return false;
      return PermissionService.hasElevatedPrivileges(user.role);
    },
    getUserPermissions: () => {
      if (!user) return [];
      return PermissionService.getUserPermissions(user.role);
    },
    getAccessibleRoutes: () => {
      if (!user) return [];
      return PermissionService.getAccessibleRoutes(user.role);
    },
  };
}; 