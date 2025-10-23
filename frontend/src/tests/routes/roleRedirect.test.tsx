import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import RoleRedirect from '../../components/auth/RoleRedirect';
import authSlice from '../../store/slices/authSlice';

// Mock store setup
const createMockStore = (authState: any) => {
  return configureStore({
    reducer: {
      auth: authSlice,
    },
    preloadedState: {
      auth: authState,
    },
  });
};

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Navigate: ({ to }: { to: string }) => <div data-testid="navigate" data-to={to}>Navigate to {to}</div>,
}));

describe('RoleRedirect Component', () => {
  const renderWithProviders = (authState: any) => {
    const store = createMockStore(authState);
    return render(
      <Provider store={store}>
        <BrowserRouter>
          <RoleRedirect />
        </BrowserRouter>
      </Provider>
    );
  };

  it('should redirect to login when not authenticated', () => {
    const authState = {
      isAuthenticated: false,
      user: null,
    };

    renderWithProviders(authState);
    
    expect(screen.getByTestId('navigate')).toBeInTheDocument();
    expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/login');
  });

  it('should redirect to admin dashboard when user is admin', () => {
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
    
    expect(screen.getByTestId('navigate')).toBeInTheDocument();
    expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/admin/dashboard');
  });

  it('should redirect to owner dashboard when user is owner', () => {
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
    
    expect(screen.getByTestId('navigate')).toBeInTheDocument();
    expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/owner/dashboard');
  });

  it('should redirect to service provider dashboard when user is service', () => {
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
    
    expect(screen.getByTestId('navigate')).toBeInTheDocument();
    expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/sp/dashboard');
  });

  it('should redirect to fallback route for unknown role', () => {
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
    
    expect(screen.getByTestId('navigate')).toBeInTheDocument();
    expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/login');
  });

  it('should redirect to custom fallback route when provided', () => {
    const authState = {
      isAuthenticated: false,
      user: null,
    };

    render(
      <Provider store={createMockStore(authState)}>
        <BrowserRouter>
          <RoleRedirect fallbackRoute="/custom-login" />
        </BrowserRouter>
      </Provider>
    );
    
    expect(screen.getByTestId('navigate')).toBeInTheDocument();
    expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/custom-login');
  });
});
