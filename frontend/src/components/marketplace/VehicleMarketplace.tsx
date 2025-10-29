import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../hooks/redux';

const VehicleMarketplace: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const location = useLocation();
  
  // Determine the correct redirect path based on user role and current location
  const getRedirectPath = () => {
    const currentPath = location.pathname;
    
    // If already on a role-specific marketplace path, redirect to browse
    if (currentPath.includes('/owner/marketplace')) {
      return '/owner/marketplace/browse';
    }
    if (currentPath.includes('/admin/marketplace')) {
      return '/marketplace/browse';
    }
    
    // Default redirect based on role
    if (user?.role === 'owner') {
      return '/owner/marketplace/browse';
    }
    
    // For admin and others
    return '/marketplace/browse';
  };
  
  return <Navigate to={getRedirectPath()} replace />;
};

export default VehicleMarketplace;