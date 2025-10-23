import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppSelector } from '../hooks/redux';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import { Layout } from '../components/layout/Layout';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

// Lazy load all pages for better performance
const DashboardHome = lazy(() => import('../pages/DashboardHome'));
const WalletCreate = lazy(() => import('../pages/Wallet/WalletCreate'));
const WalletDetails = lazy(() => import('../pages/Wallet/WalletDetails'));
const VehicleList = lazy(() => import('../pages/Vehicles/VehicleList'));
const VehicleDetails = lazy(() => import('../pages/Vehicles/VehicleDetails'));
const MileageHistory = lazy(() => import('../pages/Vehicles/MileageHistory'));
const DevicesList = lazy(() => import('../pages/Devices/DevicesList'));
const AdminInstalls = lazy(() => import('../pages/Admin/AdminInstalls'));
const SPInstalls = lazy(() => import('../pages/SP/SPInstalls'));
const History = lazy(() => import('../pages/History/History'));
const VehicleMarketplace = lazy(() => import('../components/marketplace/VehicleMarketplace'));

// Loading component for lazy routes
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <LoadingSpinner size="lg" />
  </div>
);

export const AppRouter: React.FC = () => {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Layout>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Dashboard Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardHome />
              </ProtectedRoute>
            } 
          />
          
          {/* Wallet Routes */}
          <Route 
            path="/wallet" 
            element={
              <ProtectedRoute>
                <WalletCreate />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/wallet/details" 
            element={
              <ProtectedRoute>
                <WalletDetails />
              </ProtectedRoute>
            } 
          />
          
          {/* Vehicle Routes */}
          <Route 
            path="/vehicles" 
            element={
              <ProtectedRoute>
                <VehicleList />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/vehicles/:id" 
            element={
              <ProtectedRoute>
                <VehicleDetails />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/vehicles/:id/mileage-history" 
            element={
              <ProtectedRoute>
                <MileageHistory />
              </ProtectedRoute>
            } 
          />
          
          {/* Device Routes */}
          <Route 
            path="/devices" 
            element={
              <ProtectedRoute>
                <DevicesList />
              </ProtectedRoute>
            } 
          />
          
          {/* Admin Routes */}
          <Route 
            path="/admin/installs" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminInstalls />
              </ProtectedRoute>
            } 
          />
          
          {/* Service Provider Routes */}
          <Route 
            path="/sp/installs" 
            element={
              <ProtectedRoute allowedRoles={['service']}>
                <SPInstalls />
              </ProtectedRoute>
            } 
          />
          
          {/* History Route */}
          <Route 
            path="/history" 
            element={
              <ProtectedRoute>
                <History />
              </ProtectedRoute>
            } 
          />
          
          {/* Marketplace Route */}
          <Route 
            path="/marketplace" 
            element={
              <ProtectedRoute allowedRoles={['owner', 'buyer', 'admin']}>
                <VehicleMarketplace />
              </ProtectedRoute>
            } 
          />
          
          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </Layout>
  );
};

export default AppRouter;



