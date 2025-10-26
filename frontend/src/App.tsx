import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppSelector } from './hooks/redux';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import RoleGuard from './components/auth/RoleGuard';
import RoleRedirect from './components/auth/RoleRedirect';
import SessionWarning from './components/common/SessionWarning';
import { config } from './config/env';
import { Toaster } from 'react-hot-toast';
import { Layout } from './components/layout/Layout';
import HeroWithBackground from './components/Hero/HeroWithBackground';
import { motion } from 'framer-motion';

// Import common components
import VehicleList from './pages/Vehicles/VehicleList';
import VehicleDetails from './pages/Vehicles/VehicleDetails';
import MileageHistory from './pages/Vehicles/MileageHistory';
import DevicesList from './pages/Devices/DevicesList';
import { DashboardRedirect } from './components/auth/DashboardRedirect';

// Import role-based routes
import { adminRoutes, ownerRoutes, spRoutes } from './routes/roleRoutes';

const HomePage = () => {
  const { isAuthenticated, user, isLoading } = useAppSelector((state) => state.auth);

  // Debug logging
  console.log('HomePage render:', { isAuthenticated, user: user?.role, isLoading });

  // Show loading if auth is still loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated, redirect to role-specific dashboard
  if (isAuthenticated && user) {
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
    console.log('Redirecting to:', dashboardRoute);
    return <Navigate to={dashboardRoute} replace />;
  }

  return (
    <HeroWithBackground>
      <motion.h1 
        className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8 }}
      >
        Trust every kilometre.
      </motion.h1>
      
      <motion.p 
        className="text-xl sm:text-2xl lg:text-3xl text-gray-200 mb-8 max-w-3xl mx-auto"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.8 }}
      >
        BlockX — real-time, tamper-proof vehicle mileage verification using IoT + blockchain.
      </motion.p>
      
      <motion.p 
        className="text-lg sm:text-xl text-gray-300 mb-12 max-w-2xl mx-auto"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.8 }}
      >
        Stop odometer fraud. Restore value and trust in every resale, fleet audit, and insurance claim.
      </motion.p>
      
      <motion.div 
        className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.8 }}
      >
        <button 
          className="px-8 py-4 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white/50"
          onClick={() => window.location.href = '/login'}
        >
          Get Started
        </button>
        <button 
          className="px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white/50"
        >
          Learn More
        </button>
      </motion.div>
    </HeroWithBackground>
  );
};

function App() {
  return (
    <div className="App">
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        
        {/* Dashboard redirect */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardRedirect />
            </ProtectedRoute>
          } 
        />
        
        {/* Admin Routes */}
        {adminRoutes.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['admin']}>
                  <Layout>
                    {route.element}
                  </Layout>
                </RoleGuard>
              </ProtectedRoute>
            }
          />
        ))}
        
        {/* Owner Routes */}
        {ownerRoutes.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['owner']}>
                  <Layout>
                    {route.element}
                  </Layout>
                </RoleGuard>
              </ProtectedRoute>
            }
          />
        ))}
        
        {/* Service Provider Routes */}
        {spRoutes.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['service']}>
                  <Layout>
                    {route.element}
                  </Layout>
                </RoleGuard>
              </ProtectedRoute>
            }
          />
        ))}
        
        {/* Common routes that work for all roles */}
        <Route 
          path="/vehicles" 
          element={
            <ProtectedRoute>
              <Layout>
                <VehicleList />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/vehicles/:id" 
          element={
            <ProtectedRoute>
              <Layout>
                <VehicleDetails />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/vehicles/:id/mileage-history" 
          element={
            <ProtectedRoute>
              <Layout>
                <MileageHistory />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/devices" 
          element={
            <ProtectedRoute>
              <Layout>
                <DevicesList />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/wallet" 
          element={
            <ProtectedRoute>
              <RoleRedirect fallbackRoute="/login" />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/history" 
          element={
            <ProtectedRoute>
              <RoleRedirect fallbackRoute="/login" />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/marketplace" 
          element={
            <ProtectedRoute>
              <RoleRedirect fallbackRoute="/login" />
            </ProtectedRoute>
          } 
        />
        
        
        {/* Catch all route - redirect to role-specific dashboard or login */}
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