import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { useAppSelector } from '../hooks/redux';

// Import role-specific dashboard components
import { EnhancedAdminDashboard } from '../components/dashboard/EnhancedAdminDashboard';
import { BuyerDashboard } from '../components/dashboard/BuyerDashboard';
import OwnerDashboard from './OwnerDashboard/Dashboard';
import { ServiceDashboard } from '../components/dashboard/ServiceDashboard';
import { InsuranceDashboard } from '../components/dashboard/InsuranceDashboard';
import { GovernmentDashboard } from '../components/dashboard/GovernmentDashboard';
import { RoleDashboard } from '../components/dashboard/RoleDashboard';
import DashboardHome from './DashboardHome';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isAuthenticated && !isLoading) {
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Show loading state while authentication is being checked
  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900">Loading Dashboard...</h2>
            <p className="text-gray-600">Please wait while we prepare your personalized dashboard</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Show loading state if user data is not yet available
  if (!user) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-8 w-48 bg-gray-300 rounded mx-auto mb-4"></div>
              <div className="h-4 w-64 bg-gray-300 rounded mx-auto"></div>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mt-4">Setting up your dashboard...</h2>
            <p className="text-gray-600">Almost ready!</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Function to render the appropriate dashboard based on user role
  const renderRoleSpecificDashboard = () => {
    const userProps = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    };

    // For owners, use the new OwnerDashboard
    if (user.role === 'owner') {
      return <OwnerDashboard />;
    }

    switch (user.role) {
      case 'admin':
        return <EnhancedAdminDashboard user={userProps} />;
      case 'buyer':
        return <BuyerDashboard user={userProps} />;
      case 'service':
        return <ServiceDashboard user={userProps} />;
      case 'insurance':
        return <InsuranceDashboard user={userProps} />;
      case 'government':
        return <GovernmentDashboard user={userProps} />;
      default:
        // Default fallback for any unknown roles
        return <RoleDashboard userRole={user.role} userName={`${user.firstName} ${user.lastName}`} />;
    }
  };

  return (
    <Layout>
      {renderRoleSpecificDashboard()}
    </Layout>
  );
};

export default DashboardPage;