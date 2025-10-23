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

// Import role-based routes
import { adminRoutes, ownerRoutes, spRoutes } from './routes/roleRoutes';

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
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        
        {/* Role-based redirect for /dashboard */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <RoleRedirect />
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
        
        {/* Legacy route compatibility - redirect to role-specific routes */}
        <Route 
          path="/wallet" 
          element={
            <ProtectedRoute>
              <RoleRedirect fallbackRoute="/login" />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/vehicles" 
          element={
            <ProtectedRoute>
              <RoleRedirect fallbackRoute="/login" />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/devices" 
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