import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import Sidebar from '../../components/layout/Sidebar';
import authSlice from '../../store/slices/authSlice';
import uiSlice from '../../store/slices/uiSlice';

// Mock store setup
const createMockStore = (authState: any, uiState: any = { activeSidebarItem: 'dashboard' }) => {
  return configureStore({
    reducer: {
      auth: authSlice,
      ui: uiSlice,
    },
    preloadedState: {
      auth: authState,
      ui: uiState,
    },
  });
};

describe('Sidebar Navigation Links', () => {
  const renderWithProviders = (authState: any, uiState?: any) => {
    const store = createMockStore(authState, uiState);
    return render(
      <Provider store={store}>
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      </Provider>
    );
  };

  it('should render admin navigation links for admin user', () => {
    const authState = {
      isAuthenticated: true,
      user: {
        id: '1',
        email: 'admin@test.com',
        role: 'admin',
        firstName: 'Admin',
        lastName: 'User',
      },
    };

    renderWithProviders(authState);
    
    // Check for admin-specific links
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Marketplace')).toBeInTheDocument();
    expect(screen.getByText('Install Requests')).toBeInTheDocument();
    expect(screen.getByText('History')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();
    
    // Check that links have correct href attributes
    const dashboardLink = screen.getByText('Dashboard').closest('button');
    expect(dashboardLink).toHaveAttribute('data-href', '/admin/dashboard');
  });

  it('should render owner navigation links for owner user', () => {
    const authState = {
      isAuthenticated: true,
      user: {
        id: '2',
        email: 'owner@test.com',
        role: 'owner',
        firstName: 'Owner',
        lastName: 'User',
      },
    };

    renderWithProviders(authState);
    
    // Check for owner-specific links
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Wallet')).toBeInTheDocument();
    expect(screen.getByText('Vehicles')).toBeInTheDocument();
    expect(screen.getByText('Devices')).toBeInTheDocument();
    expect(screen.getByText('History')).toBeInTheDocument();
    expect(screen.getByText('Marketplace')).toBeInTheDocument();
    
    // Check that links have correct href attributes
    const walletLink = screen.getByText('Wallet').closest('button');
    expect(walletLink).toHaveAttribute('data-href', '/owner/wallet');
  });

  it('should render service provider navigation links for service user', () => {
    const authState = {
      isAuthenticated: true,
      user: {
        id: '3',
        email: 'service@test.com',
        role: 'service',
        firstName: 'Service',
        lastName: 'Provider',
      },
    };

    renderWithProviders(authState);
    
    // Check for service provider-specific links
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Assigned Installs')).toBeInTheDocument();
    expect(screen.getByText('Devices')).toBeInTheDocument();
    
    // Check that links have correct href attributes
    const installsLink = screen.getByText('Assigned Installs').closest('button');
    expect(installsLink).toHaveAttribute('data-href', '/sp/installs');
  });

  it('should not render sidebar when user is not authenticated', () => {
    const authState = {
      isAuthenticated: false,
      user: null,
    };

    const { container } = renderWithProviders(authState);
    
    expect(container.firstChild).toBeNull();
  });

  it('should not render sidebar when user is null', () => {
    const authState = {
      isAuthenticated: true,
      user: null,
    };

    const { container } = renderWithProviders(authState);
    
    expect(container.firstChild).toBeNull();
  });

  it('should render fallback navigation for unknown role', () => {
    const authState = {
      isAuthenticated: true,
      user: {
        id: '4',
        email: 'unknown@test.com',
        role: 'unknown',
        firstName: 'Unknown',
        lastName: 'User',
      },
    };

    renderWithProviders(authState);
    
    // Should only show dashboard with fallback href
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Wallet')).not.toBeInTheDocument();
    expect(screen.queryByText('Users')).not.toBeInTheDocument();
  });

  it('should handle case insensitive role matching', () => {
    const authState = {
      isAuthenticated: true,
      user: {
        id: '1',
        email: 'admin@test.com',
        role: 'ADMIN',
        firstName: 'Admin',
        lastName: 'User',
      },
    };

    renderWithProviders(authState);
    
    // Should render admin links even with uppercase role
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();
  });
});











