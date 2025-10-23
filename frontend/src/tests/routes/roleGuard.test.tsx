import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import RoleGuard from '../../components/auth/RoleGuard';
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
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Navigate: ({ to }: { to: string }) => <div data-testid="navigate" data-to={to}>Navigate to {to}</div>,
}));

describe('RoleGuard Component', () => {
  const renderWithProviders = (authState: any, allowedRoles: string[], fallbackRoute?: string) => {
    const store = createMockStore(authState);
    return render(
      <Provider store={store}>
        <BrowserRouter>
          <RoleGuard allowedRoles={allowedRoles} fallbackRoute={fallbackRoute}>
            <div data-testid="protected-content">Protected Content</div>
          </RoleGuard>
        </BrowserRouter>
      </Provider>
    );
  };

  it('should redirect to login when not authenticated', () => {
    const authState = {
      isAuthenticated: false,
      user: null,
    };

    renderWithProviders(authState, ['admin']);
    
    expect(screen.getByTestId('navigate')).toBeInTheDocument();
    expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/login');
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('should redirect to login when user is null', () => {
    const authState = {
      isAuthenticated: true,
      user: null,
    };

    renderWithProviders(authState, ['admin']);
    
    expect(screen.getByTestId('navigate')).toBeInTheDocument();
    expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/login');
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('should allow access when user role is in allowed roles', () => {
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

    renderWithProviders(authState, ['admin']);
    
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
  });

  it('should allow access when user role matches (case insensitive)', () => {
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

    renderWithProviders(authState, ['admin']);
    
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
  });

  it('should deny access when user role is not in allowed roles', () => {
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

    renderWithProviders(authState, ['admin']);
    
    expect(screen.getByText('Access Denied')).toBeInTheDocument();
    expect(screen.getByText("You don't have permission to access this page.")).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('should redirect to fallback route when user role is not allowed and fallback is provided', () => {
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

    renderWithProviders(authState, ['admin'], '/owner/dashboard');
    
    expect(screen.getByTestId('navigate')).toBeInTheDocument();
    expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/owner/dashboard');
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('should allow access for multiple allowed roles', () => {
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

    renderWithProviders(authState, ['admin', 'owner']);
    
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
  });

  it('should handle empty allowed roles array', () => {
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

    renderWithProviders(authState, []);
    
    expect(screen.getByText('Access Denied')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });
});
