import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { BrowserRouter } from 'react-router-dom';
import NotificationBell from '../components/notifications/NotificationBell';
import { NotificationService } from '../services/notifications';
import authReducer from '../store/slices/authSlice';

// Mock the notification service
jest.mock('../services/notifications');
const mockNotificationService = NotificationService as jest.Mocked<typeof NotificationService>;

// Mock the socket hook
jest.mock('../hooks/useSocket', () => ({
  __esModule: true,
  default: () => ({ socket: null, on: jest.fn(), off: jest.fn() })
}));

// Mock store
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: authReducer
    },
    preloadedState: {
      auth: {
        user: {
          id: '1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          role: 'owner',
          isVerified: true,
          createdAt: '2023-01-01',
          updatedAt: '2023-01-01'
        },
        isAuthenticated: true,
        token: 'mock-token',
        refreshToken: 'mock-refresh-token',
        isLoading: false,
        error: null
      },
      ...initialState
    }
  });
};

const mockNotifications = [
  {
    id: '1',
    title: 'Vehicle Registered',
    message: 'Your Honda Civic has been successfully registered',
    type: 'success',
    priority: 'medium',
    read: false,
    createdAt: '2023-01-01T10:00:00Z',
    actionUrl: '/vehicles',
    actionLabel: 'View vehicles'
  },
  {
    id: '2',
    title: 'TrustScore Update',
    message: 'Your Toyota Camry TrustScore decreased to 85',
    type: 'warning',
    priority: 'high',
    read: true,
    createdAt: '2023-01-01T09:00:00Z',
    actionUrl: '/vehicles/2',
    actionLabel: 'View details'
  }
];

describe('NotificationBell Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders notification bell with unread count', async () => {
    mockNotificationService.getNotifications.mockResolvedValue({
      data: {
        notifications: mockNotifications,
        unreadCount: 1
      }
    });

    const store = createMockStore();
    
    render(
      <Provider store={store}>
        <BrowserRouter>
          <NotificationBell />
        </BrowserRouter>
      </Provider>
    );

    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByLabelText(/notifications, 1 unread/i)).toBeInTheDocument();
    });

    // Check if unread badge is displayed
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('displays notifications when bell is clicked', async () => {
    mockNotificationService.getNotifications.mockResolvedValue({
      data: {
        notifications: mockNotifications,
        unreadCount: 1
      }
    });

    const store = createMockStore();
    
    render(
      <Provider store={store}>
        <BrowserRouter>
          <NotificationBell />
        </BrowserRouter>
      </Provider>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByLabelText(/notifications, 1 unread/i)).toBeInTheDocument();
    });

    // Click the bell
    const bellButton = screen.getByLabelText(/notifications, 1 unread/i);
    bellButton.click();

    // Check if notifications are displayed
    await waitFor(() => {
      expect(screen.getByText('Vehicle Registered')).toBeInTheDocument();
      expect(screen.getByText('TrustScore Update')).toBeInTheDocument();
    });
  });

  it('marks notification as read when clicked', async () => {
    mockNotificationService.getNotifications.mockResolvedValue({
      data: {
        notifications: mockNotifications,
        unreadCount: 1
      }
    });

    mockNotificationService.markAsRead.mockResolvedValue({
      status: 'success',
      message: 'Notification marked as read'
    });

    const store = createMockStore();
    
    render(
      <Provider store={store}>
        <BrowserRouter>
          <NotificationBell />
        </BrowserRouter>
      </Provider>
    );

    // Wait for initial load and open dropdown
    await waitFor(() => {
      expect(screen.getByLabelText(/notifications, 1 unread/i)).toBeInTheDocument();
    });

    const bellButton = screen.getByLabelText(/notifications, 1 unread/i);
    bellButton.click();

    await waitFor(() => {
      expect(screen.getByText('Vehicle Registered')).toBeInTheDocument();
    });

    // Click on the first notification
    const notification = screen.getByText('Vehicle Registered');
    notification.click();

    // Verify markAsRead was called
    expect(mockNotificationService.markAsRead).toHaveBeenCalledWith('1');
  });

  it('shows empty state when no notifications', async () => {
    mockNotificationService.getNotifications.mockResolvedValue({
      data: {
        notifications: [],
        unreadCount: 0
      }
    });

    const store = createMockStore();
    
    render(
      <Provider store={store}>
        <BrowserRouter>
          <NotificationBell />
        </BrowserRouter>
      </Provider>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByLabelText(/notifications, 0 unread/i)).toBeInTheDocument();
    });

    // Click the bell
    const bellButton = screen.getByLabelText(/notifications, 0 unread/i);
    bellButton.click();

    // Check if empty state is displayed
    await waitFor(() => {
      expect(screen.getByText('No notifications yet')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    mockNotificationService.getNotifications.mockRejectedValue(
      new Error('Failed to fetch notifications')
    );

    const store = createMockStore();
    
    render(
      <Provider store={store}>
        <BrowserRouter>
          <NotificationBell />
        </BrowserRouter>
      </Provider>
    );

    // Component should still render without crashing
    await waitFor(() => {
      expect(screen.getByLabelText(/notifications, 0 unread/i)).toBeInTheDocument();
    });
  });
});
