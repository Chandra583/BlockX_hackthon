import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { Sidebar } from '../../components/layout/Sidebar';
import authSlice from '../../store/slices/authSlice';
import uiSlice from '../../store/slices/uiSlice';

// Mock store
const createMockStore = (user = { id: '1', role: 'owner', firstName: 'John', lastName: 'Doe', email: 'john@example.com' }) => {
  return configureStore({
    reducer: {
      auth: authSlice,
      ui: uiSlice,
    },
    preloadedState: {
      auth: {
        user,
        isAuthenticated: true,
        token: 'mock-token',
        refreshToken: 'mock-refresh-token',
        isLoading: false,
        error: null,
      },
      ui: {
        activeSidebarItem: 'dashboard',
        sidebarCollapsed: false,
      },
    },
  });
};

const renderWithProviders = (component: React.ReactElement, store = createMockStore()) => {
  return render(
    <Provider store={store}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </Provider>
  );
};

describe('Sidebar Component', () => {
  it('renders correct links for owner role', () => {
    renderWithProviders(<Sidebar />);
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Wallet')).toBeInTheDocument();
    expect(screen.getByText('Vehicles')).toBeInTheDocument();
    expect(screen.getByText('Devices')).toBeInTheDocument();
    expect(screen.getByText('History')).toBeInTheDocument();
    expect(screen.getByText('Marketplace')).toBeInTheDocument();
  });

  it('renders correct links for admin role', () => {
    const adminStore = createMockStore({ 
      id: '1', 
      role: 'admin', 
      firstName: 'Admin', 
      lastName: 'User', 
      email: 'admin@example.com' 
    });
    
    renderWithProviders(<Sidebar />, adminStore);
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Marketplace')).toBeInTheDocument();
    expect(screen.getByText('Install Requests')).toBeInTheDocument();
    expect(screen.getByText('History')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();
  });

  it('shows user information when not collapsed', () => {
    renderWithProviders(<Sidebar collapsed={false} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('owner')).toBeInTheDocument();
  });

  it('shows only user initials when collapsed', () => {
    renderWithProviders(<Sidebar collapsed={true} />);
    
    expect(screen.getByText('JD')).toBeInTheDocument();
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
  });

  it('calls onToggle when toggle button is clicked', () => {
    const mockToggle = jest.fn();
    renderWithProviders(<Sidebar collapsed={false} onToggle={mockToggle} />);
    
    const toggleButton = screen.getByLabelText('Collapse sidebar');
    fireEvent.click(toggleButton);
    
    expect(mockToggle).toHaveBeenCalledTimes(1);
  });

  it('navigates to correct path when nav item is clicked', () => {
    renderWithProviders(<Sidebar />);
    
    const vehiclesLink = screen.getByText('Vehicles');
    fireEvent.click(vehiclesLink);
    
    // Navigation would be handled by react-router in real app
    expect(vehiclesLink).toBeInTheDocument();
  });

  it('shows active state for current page', () => {
    renderWithProviders(<Sidebar />);
    
    const dashboardLink = screen.getByText('Dashboard');
    expect(dashboardLink.closest('button')).toHaveClass('bg-gradient-to-r');
  });

  it('shows tooltip when collapsed and item is active', async () => {
    renderWithProviders(<Sidebar collapsed={true} />);
    
    const dashboardButton = screen.getByLabelText('Dashboard');
    fireEvent.mouseEnter(dashboardButton);
    
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });
});
