import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { Header } from '../../components/layout/Header';
import authSlice from '../../store/slices/authSlice';

// Mock store
const createMockStore = (user = { id: '1', role: 'owner', firstName: 'John', lastName: 'Doe', email: 'john@example.com' }) => {
  return configureStore({
    reducer: {
      auth: authSlice,
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

// Mock notification service
jest.mock('../../services/notifications', () => ({
  NotificationService: {
    getNotifications: jest.fn().mockResolvedValue({
      data: {
        notifications: [],
        unreadCount: 0
      }
    })
  }
}));

describe('Header Component', () => {
  it('renders user information correctly', () => {
    renderWithProviders(<Header />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Owner')).toBeInTheDocument();
  });

  it('shows notification bell with unread count', async () => {
    const storeWithNotifications = createMockStore();
    renderWithProviders(<Header />, storeWithNotifications);
    
    const bellButton = screen.getByLabelText('Notifications');
    expect(bellButton).toBeInTheDocument();
  });

  it('opens notification dropdown when bell is clicked', async () => {
    renderWithProviders(<Header />);
    
    const bellButton = screen.getByLabelText('Notifications');
    fireEvent.click(bellButton);
    
    await waitFor(() => {
      expect(screen.getByText('Notifications')).toBeInTheDocument();
    });
  });

  it('opens profile menu when profile button is clicked', async () => {
    renderWithProviders(<Header />);
    
    const profileButton = screen.getByText('John Doe');
    fireEvent.click(profileButton);
    
    await waitFor(() => {
      expect(screen.getByText('Profile Settings')).toBeInTheDocument();
      expect(screen.getByText('Wallet')).toBeInTheDocument();
      expect(screen.getByText('Account Settings')).toBeInTheDocument();
    });
  });

  it('shows mobile menu on mobile screens', () => {
    // Mock mobile screen size
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 768,
    });
    
    renderWithProviders(<Header />);
    
    const mobileMenuButton = screen.getByRole('button', { name: /menu/i });
    expect(mobileMenuButton).toBeInTheDocument();
  });

  it('handles logout correctly', () => {
    const store = createMockStore();
    const dispatch = jest.fn();
    store.dispatch = dispatch;
    
    renderWithProviders(<Header />, store);
    
    const profileButton = screen.getByText('John Doe');
    fireEvent.click(profileButton);
    
    const logoutButton = screen.getByText('Sign Out');
    fireEvent.click(logoutButton);
    
    expect(dispatch).toHaveBeenCalled();
  });

  it('shows correct role icon and color', () => {
    renderWithProviders(<Header />);
    
    const profileSection = screen.getByText('John Doe').closest('div');
    expect(profileSection).toHaveClass('text-blue-400');
  });

  it('closes dropdowns when clicking outside', async () => {
    renderWithProviders(<Header />);
    
    const profileButton = screen.getByText('John Doe');
    fireEvent.click(profileButton);
    
    await waitFor(() => {
      expect(screen.getByText('Profile Settings')).toBeInTheDocument();
    });
    
    // Click outside
    fireEvent.click(document.body);
    
    await waitFor(() => {
      expect(screen.queryByText('Profile Settings')).not.toBeInTheDocument();
    });
  });
});
