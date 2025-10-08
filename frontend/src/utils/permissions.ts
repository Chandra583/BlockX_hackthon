import { USER_ROLES } from '../types/auth';

export interface Permission {
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'manage';
}

export interface RolePermissions {
  [key: string]: Permission[];
}

// Define permissions for each role
export const ROLE_PERMISSIONS: RolePermissions = {
  [USER_ROLES.ADMIN]: [
    { resource: 'users', action: 'manage' },
    { resource: 'vehicles', action: 'manage' },
    { resource: 'fraud-cases', action: 'manage' },
    { resource: 'system-logs', action: 'read' },
    { resource: 'dashboard', action: 'read' },
    { resource: 'analytics', action: 'read' },
    { resource: 'settings', action: 'manage' },
  ],
  [USER_ROLES.OWNER]: [
    { resource: 'vehicles', action: 'manage' },
    { resource: 'odometer', action: 'update' },
    { resource: 'consent', action: 'manage' },
    { resource: 'devices', action: 'manage' },
    { resource: 'dashboard', action: 'read' },
    { resource: 'profile', action: 'manage' },
  ],
  [USER_ROLES.BUYER]: [
    { resource: 'marketplace', action: 'read' },
    { resource: 'favorites', action: 'manage' },
    { resource: 'purchases', action: 'manage' },
    { resource: 'watchlist', action: 'manage' },
    { resource: 'search', action: 'read' },
    { resource: 'dashboard', action: 'read' },
    { resource: 'profile', action: 'manage' },
  ],
  [USER_ROLES.SERVICE]: [
    { resource: 'services', action: 'manage' },
    { resource: 'certifications', action: 'manage' },
    { resource: 'customers', action: 'manage' },
    { resource: 'calendar', action: 'manage' },
    { resource: 'dashboard', action: 'read' },
    { resource: 'profile', action: 'manage' },
  ],
  [USER_ROLES.INSURANCE]: [
    { resource: 'policies', action: 'manage' },
    { resource: 'claims', action: 'manage' },
    { resource: 'risk-assessment', action: 'manage' },
    { resource: 'analytics', action: 'read' },
    { resource: 'dashboard', action: 'read' },
    { resource: 'profile', action: 'manage' },
  ],
  [USER_ROLES.GOVERNMENT]: [
    { resource: 'compliance', action: 'manage' },
    { resource: 'registrations', action: 'manage' },
    { resource: 'violations', action: 'manage' },
    { resource: 'reports', action: 'read' },
    { resource: 'dashboard', action: 'read' },
    { resource: 'profile', action: 'manage' },
  ],
};

// Define route permissions - which roles can access which routes
export const ROUTE_PERMISSIONS: { [key: string]: string[] } = {
  '/dashboard': [USER_ROLES.ADMIN, USER_ROLES.OWNER, USER_ROLES.BUYER, USER_ROLES.SERVICE, USER_ROLES.INSURANCE, USER_ROLES.GOVERNMENT],
  '/profile': [USER_ROLES.ADMIN, USER_ROLES.OWNER, USER_ROLES.BUYER, USER_ROLES.SERVICE, USER_ROLES.INSURANCE, USER_ROLES.GOVERNMENT],
  '/settings': [USER_ROLES.ADMIN, USER_ROLES.OWNER, USER_ROLES.BUYER, USER_ROLES.SERVICE, USER_ROLES.INSURANCE, USER_ROLES.GOVERNMENT],
  
  // Admin routes
  '/admin': [USER_ROLES.ADMIN],
  '/admin/users': [USER_ROLES.ADMIN],
  '/admin/fraud-cases': [USER_ROLES.ADMIN],
  '/admin/system-logs': [USER_ROLES.ADMIN],
  '/admin/analytics': [USER_ROLES.ADMIN],
  
  // Owner routes
  '/owner': [USER_ROLES.OWNER],
  '/owner/vehicles': [USER_ROLES.OWNER],
  '/owner/devices': [USER_ROLES.OWNER],
  '/owner/consent': [USER_ROLES.OWNER],
  
  // Buyer routes
  '/buyer': [USER_ROLES.BUYER],
  '/buyer/marketplace': [USER_ROLES.BUYER],
  '/buyer/favorites': [USER_ROLES.BUYER],
  '/buyer/purchases': [USER_ROLES.BUYER],
  '/buyer/watchlist': [USER_ROLES.BUYER],
  
  // Service routes
  '/service': [USER_ROLES.SERVICE],
  '/service/services': [USER_ROLES.SERVICE],
  '/service/certifications': [USER_ROLES.SERVICE],
  '/service/customers': [USER_ROLES.SERVICE],
  '/service/calendar': [USER_ROLES.SERVICE],
  
  // Insurance routes
  '/insurance': [USER_ROLES.INSURANCE],
  '/insurance/policies': [USER_ROLES.INSURANCE],
  '/insurance/claims': [USER_ROLES.INSURANCE],
  '/insurance/risk-assessment': [USER_ROLES.INSURANCE],
  '/insurance/analytics': [USER_ROLES.INSURANCE],
  
  // Government routes
  '/government': [USER_ROLES.GOVERNMENT],
  '/government/compliance': [USER_ROLES.GOVERNMENT],
  '/government/registrations': [USER_ROLES.GOVERNMENT],
  '/government/violations': [USER_ROLES.GOVERNMENT],
  '/government/reports': [USER_ROLES.GOVERNMENT],
};

export class PermissionService {
  // Check if user has permission for a specific resource and action
  static hasPermission(userRole: string, resource: string, action: string): boolean {
    const permissions = ROLE_PERMISSIONS[userRole];
    if (!permissions) return false;
    
    return permissions.some(permission => 
      permission.resource === resource && 
      (permission.action === action || permission.action === 'manage')
    );
  }

  // Check if user can access a specific route
  static canAccessRoute(userRole: string, route: string): boolean {
    const allowedRoles = ROUTE_PERMISSIONS[route];
    if (!allowedRoles) return true; // Allow access to routes without restrictions
    
    return allowedRoles.includes(userRole);
  }

  // Get user's dashboard route based on their role
  static getDashboardRoute(userRole: string): string {
    const roleRoutes: Record<string, string> = {
      [USER_ROLES.ADMIN]: '/admin',
      [USER_ROLES.OWNER]: '/owner',
      [USER_ROLES.BUYER]: '/buyer',
      [USER_ROLES.SERVICE]: '/service',
      [USER_ROLES.INSURANCE]: '/insurance',
      [USER_ROLES.GOVERNMENT]: '/government',
    };

    return roleRoutes[userRole] || '/dashboard';
  }

  // Get all accessible routes for a user role
  static getAccessibleRoutes(userRole: string): string[] {
    return Object.entries(ROUTE_PERMISSIONS)
      .filter(([, allowedRoles]) => allowedRoles.includes(userRole))
      .map(([route]) => route);
  }

  // Check if user can perform any action on a resource
  static canAccessResource(userRole: string, resource: string): boolean {
    const permissions = ROLE_PERMISSIONS[userRole];
    if (!permissions) return false;
    
    return permissions.some(permission => permission.resource === resource);
  }

  // Get all permissions for a user role
  static getUserPermissions(userRole: string): Permission[] {
    return ROLE_PERMISSIONS[userRole] || [];
  }

  // Check if user has admin privileges
  static isAdmin(userRole: string): boolean {
    return userRole === USER_ROLES.ADMIN;
  }

  // Check if user has elevated privileges (admin or government)
  static hasElevatedPrivileges(userRole: string): boolean {
    const elevatedRoles = [USER_ROLES.ADMIN, USER_ROLES.GOVERNMENT];
    return elevatedRoles.includes(userRole as typeof USER_ROLES.ADMIN | typeof USER_ROLES.GOVERNMENT);
  }

  // Validate route access with fallback
  static validateRouteAccess(userRole: string, route: string): {
    canAccess: boolean;
    redirectTo?: string;
  } {
    const canAccess = this.canAccessRoute(userRole, route);
    
    if (!canAccess) {
      return {
        canAccess: false,
        redirectTo: this.getDashboardRoute(userRole),
      };
    }
    
    return { canAccess: true };
  }
}

export default PermissionService; 