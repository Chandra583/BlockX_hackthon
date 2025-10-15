import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppSelector } from './hooks/redux';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DashboardPage from './pages/DashboardPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import SessionWarning from './components/common/SessionWarning';
import { config } from './config/env';
import { Toaster } from 'react-hot-toast';

// Import admin components
import { UserList } from './components/admin';
import AdminVehiclesPage from './components/admin/vehicles/AdminVehiclesPage';
import { Layout } from './components/layout/Layout';
// New feature pages/components
import ServiceProviderManagement from './components/admin/ServiceProviderManagement';
import BatchProcessingDashboard from './components/admin/BatchProcessingDashboard';
import VehicleMarketplace from './components/marketplace/VehicleMarketplace';

const HomePage = () => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  // If user is authenticated, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <h1 className="text-4xl font-bold text-primary-600 mb-4">
          Welcome to {config.APP_NAME}
        </h1>
        <p className="text-xl text-gray-600 mb-6">
          Anti-Fraud Vehicle Marketplace
        </p>
        <p className="text-gray-500 mb-8">
          Version {config.APP_VERSION}
        </p>
        <div className="space-x-4">
          <button 
            className="btn-primary"
            onClick={() => window.location.href = '/login'}
          >
            Get Started
          </button>
          <button className="btn-secondary">
            Learn More
          </button>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } 
        />
        
        {/* Admin Routes */}
        <Route 
          path="/admin/users" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Layout>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                  <UserList />
                </div>
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/service-providers" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Layout>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                  <ServiceProviderManagement />
                </div>
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/batch-processing" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Layout>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                  <BatchProcessingDashboard />
                </div>
              </Layout>
            </ProtectedRoute>
          } 
        />

        {/* Marketplace (owner/buyer accessible) */}
        <Route 
          path="/marketplace" 
          element={
            <ProtectedRoute allowedRoles={['owner','buyer','admin']}>
              <Layout>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                  <VehicleMarketplace />
                </div>
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/vehicles" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Layout>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                  <AdminVehiclesPage />
                </div>
              </Layout>
            </ProtectedRoute>
          } 
        />
        
        {/* Catch all route - redirect to dashboard if authenticated, otherwise to login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      
      {/* Global Session Warning Component */}
      <SessionWarning />
      
      {/* Toast Notifications */}
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#4ade80',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  );
}

export default App;
