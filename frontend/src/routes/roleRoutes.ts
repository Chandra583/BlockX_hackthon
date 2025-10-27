import React, { Suspense, lazy } from 'react';
import LoadingSpinner from '../components/ui/LoadingSpinner';

// Lazy load all pages for better performance
const DashboardHome = lazy(() => import('../pages/DashboardHome'));
const NewOwnerDashboard = lazy(() => import('../pages/OwnerDashboard/Dashboard'));

const WalletDetails = lazy(() => import('../pages/Wallet/WalletDetails'));
const WalletPage = lazy(() => import('../pages/Wallet/WalletPage'));
const VehicleList = lazy(() => import('../pages/Vehicles/VehicleList'));
const VehicleDetails = lazy(() => import('../pages/Vehicles/VehicleDetails'));
const VehicleReport = lazy(() => import('../pages/Vehicles/VehicleReport'));
const RegisterVehicle = lazy(() => import('../pages/Vehicles/RegisterVehicle'));
const MileageHistory = lazy(() => import('../pages/Vehicles/MileageHistory'));
const DevicesList = lazy(() => import('../pages/Devices/DevicesList'));
const AdminInstalls = lazy(() => import('../pages/Admin/AdminInstalls'));
const SPInstalls = lazy(() => import('../pages/SP/SPInstalls'));
const History = lazy(() => import('../pages/History/History'));
const VehicleMarketplace = lazy(() => import('../components/marketplace/VehicleMarketplace'));

// Admin dashboard components
const EnhancedAdminDashboard = lazy(() => import('../components/dashboard/EnhancedAdminDashboard'));
const UserList = lazy(() => import('../components/admin/UserList'));
const ServiceProviderManagement = lazy(() => import('../components/admin/ServiceProviderManagement'));
const BatchProcessingDashboard = lazy(() => import('../components/admin/BatchProcessingDashboard'));
const AdminVehiclesPage = lazy(() => import('../components/admin/vehicles/AdminVehiclesPage'));

// Owner dashboard components
const OwnerDashboard = lazy(() => import('../components/dashboard/OwnerDashboard'));

// Service Provider dashboard components
const ServiceDashboard = lazy(() => import('../components/dashboard/ServiceDashboard'));

// Loading component for lazy routes
const PageLoader = () => React.createElement('div', {
  className: 'min-h-screen flex items-center justify-center'
}, React.createElement(LoadingSpinner, { size: 'lg' }));

// Admin Routes
export const adminRoutes: Array<{ path: string; element: React.ReactElement }> = [
  {
    path: '/admin/dashboard',
    element: React.createElement(Suspense, { fallback: React.createElement(PageLoader) },
      React.createElement(EnhancedAdminDashboard, { user: { id: '', email: '', firstName: '', lastName: '', role: 'admin' } })
    )
  },
  {
    path: '/admin/marketplace',
    element: React.createElement(Suspense, { fallback: React.createElement(PageLoader) },
      React.createElement(VehicleMarketplace)
    )
  },
  {
    path: '/admin/installs',
    element: React.createElement(Suspense, { fallback: React.createElement(PageLoader) },
      React.createElement(AdminInstalls)
    )
  },
  {
    path: '/admin/history',
    element: React.createElement(Suspense, { fallback: React.createElement(PageLoader) },
      React.createElement(History)
    )
  },
  {
    path: '/admin/users',
    element: React.createElement(Suspense, { fallback: React.createElement(PageLoader) },
      React.createElement(UserList)
    )
  },
  {
    path: '/admin/service-providers',
    element: React.createElement(Suspense, { fallback: React.createElement(PageLoader) },
      React.createElement(ServiceProviderManagement)
    )
  },
  {
    path: '/admin/batch-processing',
    element: React.createElement(Suspense, { fallback: React.createElement(PageLoader) },
      React.createElement(BatchProcessingDashboard)
    )
  },
  {
    path: '/admin/vehicles',
    element: React.createElement(Suspense, { fallback: React.createElement(PageLoader) },
      React.createElement(AdminVehiclesPage)
    )
  }
];

// Owner Routes
export const ownerRoutes: Array<{ path: string; element: React.ReactElement }> = [
  {
    path: '/owner/dashboard',
    element: React.createElement(Suspense, { fallback: React.createElement(PageLoader) },
      React.createElement(NewOwnerDashboard)
    )
  },
  {
    path: '/owner/wallet',
    element: React.createElement(Suspense, { fallback: React.createElement(PageLoader) },
      React.createElement(WalletPage)
    )
  },
  {
    path: '/owner/wallet/details',
    element: React.createElement(Suspense, { fallback: React.createElement(PageLoader) },
      React.createElement(WalletDetails)
    )
  },
  {
    path: '/owner/vehicles',
    element: React.createElement(Suspense, { fallback: React.createElement(PageLoader) },
      React.createElement(VehicleList)
    )
  },
  {
    path: '/owner/vehicles/register',
    element: React.createElement(Suspense, { fallback: React.createElement(PageLoader) },
      React.createElement(RegisterVehicle)
    )
  },
  {
    path: '/owner/vehicles/:id',
    element: React.createElement(Suspense, { fallback: React.createElement(PageLoader) },
      React.createElement(VehicleDetails)
    )
  },
  {
    path: '/owner/vehicles/:id/mileage-history',
    element: React.createElement(Suspense, { fallback: React.createElement(PageLoader) },
      React.createElement(MileageHistory)
    )
  },
  {
    path: '/owner/vehicles/:id/report',
    element: React.createElement(Suspense, { fallback: React.createElement(PageLoader) },
      React.createElement(VehicleReport)
    )
  },
  {
    path: '/owner/devices',
    element: React.createElement(Suspense, { fallback: React.createElement(PageLoader) },
      React.createElement(DevicesList)
    )
  },
  {
    path: '/owner/history',
    element: React.createElement(Suspense, { fallback: React.createElement(PageLoader) },
      React.createElement(History)
    )
  },
  {
    path: '/owner/marketplace',
    element: React.createElement(Suspense, { fallback: React.createElement(PageLoader) },
      React.createElement(VehicleMarketplace)
    )
  }
];

// Service Provider Routes
export const spRoutes: Array<{ path: string; element: React.ReactElement }> = [
  {
    path: '/sp/dashboard',
    element: React.createElement(Suspense, { fallback: React.createElement(PageLoader) },
      React.createElement(ServiceDashboard, { user: { id: '', email: '', firstName: '', lastName: '', role: 'service' } })
    )
  },
  {
    path: '/sp/installs',
    element: React.createElement(Suspense, { fallback: React.createElement(PageLoader) },
      React.createElement(SPInstalls)
    )
  },
  {
    path: '/sp/devices',
    element: React.createElement(Suspense, { fallback: React.createElement(PageLoader) },
      React.createElement(DevicesList)
    )
  }
];

// Public routes (no role prefix needed)
export const publicRoutes: Array<{ path: string; element: React.ReactElement }> = [
  {
    path: '/login',
    element: React.createElement('div', null, 'Login Page') // Will be imported from actual component
  },
  {
    path: '/register',
    element: React.createElement('div', null, 'Register Page') // Will be imported from actual component
  },
  {
    path: '/forgot-password',
    element: React.createElement('div', null, 'Forgot Password Page') // Will be imported from actual component
  },
  {
    path: '/reset-password',
    element: React.createElement('div', null, 'Reset Password Page') // Will be imported from actual component
  }
];

// Route mapping for easy access
export const roleRouteMap = {
  admin: adminRoutes,
  owner: ownerRoutes,
  service: spRoutes,
  public: publicRoutes
};

export default {
  adminRoutes,
  ownerRoutes,
  spRoutes,
  publicRoutes,
  roleRouteMap
};
