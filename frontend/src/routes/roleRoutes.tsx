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
const MyVehicles = lazy(() => import('../pages/vehicles/MyVehicles'));
const DevicesList = lazy(() => import('../pages/Devices/DevicesList'));
const AdminInstalls = lazy(() => import('../pages/Admin/AdminInstalls'));
const SPInstalls = lazy(() => import('../pages/SP/SPInstalls'));
const History = lazy(() => import('../pages/History/History'));
const VehicleMarketplace = lazy(() => import('../components/marketplace/VehicleMarketplace'));
const MarketplaceBrowse = lazy(() => import('../pages/marketplace/MarketplaceBrowse'));

// Admin dashboard components
const EnhancedAdminDashboard = lazy(() => import('../components/dashboard/EnhancedAdminDashboard'));
const UserList = lazy(() => import('../components/admin/UserList'));
const ServiceProviderManagement = lazy(() => import('../components/admin/ServiceProviderManagement'));
const BatchProcessingDashboard = lazy(() => import('../components/admin/BatchProcessingDashboard'));
const AdminVehiclesPage = lazy(() => import('../components/admin/vehicles/AdminVehiclesPage'));

// Owner dashboard components
const OwnerDashboard = lazy(() => import('../components/dashboard/OwnerDashboard'));

// Buyer dashboard components
const BuyerDashboard = lazy(() => import('../components/dashboard/BuyerDashboard'));

// Service Provider dashboard components
const ServiceDashboard = lazy(() => import('../components/dashboard/ServiceDashboard'));

// Loading component for lazy routes
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <LoadingSpinner size="lg" />
  </div>
);

// Admin Routes
export const adminRoutes: Array<{ path: string; element: React.ReactElement }> = [
  {
    path: '/admin/dashboard',
    element: (
      <Suspense fallback={<PageLoader />}>
        <EnhancedAdminDashboard user={{ id: '', email: '', firstName: '', lastName: '', role: 'admin' }} />
      </Suspense>
    )
  },
  {
    path: '/admin/marketplace',
    element: (
      <Suspense fallback={<PageLoader />}>
        <VehicleMarketplace />
      </Suspense>
    )
  },
  {
    path: '/admin/installs',
    element: (
      <Suspense fallback={<PageLoader />}>
        <AdminInstalls />
      </Suspense>
    )
  },
  {
    path: '/admin/history',
    element: (
      <Suspense fallback={<PageLoader />}>
        <History />
      </Suspense>
    )
  },
  {
    path: '/admin/users',
    element: (
      <Suspense fallback={<PageLoader />}>
        <UserList />
      </Suspense>
    )
  },
  {
    path: '/admin/service-providers',
    element: (
      <Suspense fallback={<PageLoader />}>
        <ServiceProviderManagement />
      </Suspense>
    )
  },
  {
    path: '/admin/batch-processing',
    element: (
      <Suspense fallback={<PageLoader />}>
        <BatchProcessingDashboard />
      </Suspense>
    )
  },
  {
    path: '/admin/vehicles',
    element: (
      <Suspense fallback={<PageLoader />}>
        <AdminVehiclesPage />
      </Suspense>
    )
  }
];

// Owner Routes
export const ownerRoutes: Array<{ path: string; element: React.ReactElement }> = [
  {
    path: '/owner/dashboard',
    element: (
      <Suspense fallback={<PageLoader />}>
        <NewOwnerDashboard />
      </Suspense>
    )
  },
  {
    path: '/owner/wallet',
    element: (
      <Suspense fallback={<PageLoader />}>
        <WalletPage />
      </Suspense>
    )
  },
  {
    path: '/owner/wallet/details',
    element: (
      <Suspense fallback={<PageLoader />}>
        <WalletDetails />
      </Suspense>
    )
  },
  {
    path: '/owner/vehicles',
    element: (
      <Suspense fallback={<PageLoader />}>
        <VehicleList />
      </Suspense>
    )
  },
  {
    path: '/owner/vehicles/register',
    element: (
      <Suspense fallback={<PageLoader />}>
        <RegisterVehicle />
      </Suspense>
    )
  },
  {
    path: '/owner/vehicles/:id',
    element: (
      <Suspense fallback={<PageLoader />}>
        <VehicleDetails />
      </Suspense>
    )
  },
  {
    path: '/owner/vehicles/:id/mileage-history',
    element: (
      <Suspense fallback={<PageLoader />}>
        <MileageHistory />
      </Suspense>
    )
  },
  {
    path: '/owner/vehicles/:id/report',
    element: (
      <Suspense fallback={<PageLoader />}>
        <VehicleReport />
      </Suspense>
    )
  },
  {
    path: '/owner/devices',
    element: (
      <Suspense fallback={<PageLoader />}>
        <DevicesList />
      </Suspense>
    )
  },
  {
    path: '/owner/history',
    element: (
      <Suspense fallback={<PageLoader />}>
        <History />
      </Suspense>
    )
  },
  {
    path: '/owner/marketplace',
    element: (
      <Suspense fallback={<PageLoader />}>
        <VehicleMarketplace />
      </Suspense>
    )
  },
  {
    path: '/owner/marketplace/browse',
    element: (
      <Suspense fallback={<PageLoader />}>
        <MarketplaceBrowse />
      </Suspense>
    )
  }
];

// Service Provider Routes
export const spRoutes: Array<{ path: string; element: React.ReactElement }> = [
  {
    path: '/sp/dashboard',
    element: (
      <Suspense fallback={<PageLoader />}>
        <ServiceDashboard user={{ id: '', email: '', firstName: '', lastName: '', role: 'service' }} />
      </Suspense>
    )
  },
  {
    path: '/sp/installs',
    element: (
      <Suspense fallback={<PageLoader />}>
        <SPInstalls />
      </Suspense>
    )
  },
  {
    path: '/sp/devices',
    element: (
      <Suspense fallback={<PageLoader />}>
        <DevicesList />
      </Suspense>
    )
  }
];

// Buyer Routes
export const buyerRoutes: Array<{ path: string; element: React.ReactElement }> = [
  {
    path: '/buyer/dashboard',
    element: (
      <Suspense fallback={<PageLoader />}>
        <BuyerDashboard />
      </Suspense>
    )
  },
  {
    path: '/buyer/marketplace',
    element: (
      <Suspense fallback={<PageLoader />}>
        <MarketplaceBrowse />
      </Suspense>
    )
  },
  {
    path: '/buyer/my-vehicles',
    element: (
      <Suspense fallback={<PageLoader />}>
        <MyVehicles />
      </Suspense>
    )
  }
];

// Public routes (no role prefix needed)
export const publicRoutes: Array<{ path: string; element: React.ReactElement }> = [
  {
    path: '/login',
    element: <div>Login Page</div> // Will be imported from actual component
  },
  {
    path: '/register',
    element: <div>Register Page</div> // Will be imported from actual component
  },
  {
    path: '/forgot-password',
    element: <div>Forgot Password Page</div> // Will be imported from actual component
  },
  {
    path: '/reset-password',
    element: <div>Reset Password Page</div> // Will be imported from actual component
  }
];

// Route mapping for easy access
export const roleRouteMap = {
  admin: adminRoutes,
  owner: ownerRoutes,
  buyer: buyerRoutes,
  service: spRoutes,
  public: publicRoutes
};

export default {
  adminRoutes,
  ownerRoutes,
  buyerRoutes,
  spRoutes,
  publicRoutes,
  roleRouteMap
};


