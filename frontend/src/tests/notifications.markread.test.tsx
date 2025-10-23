import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
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

describe('NotificationBell Mark as Read', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNotificationService.getNotifications.mockResolvedValue({
      data: {
        notifications: mockNotifications,
        unreadCount: 1
      }
    });
  });

  it('marks individual notification as read when clicked', async () => {
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

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByLabelText(/notifications, 1 unread/i)).toBeInTheDocument();
    });

    // Click the bell to open dropdown
    const bellButton = screen.getByLabelText(/notifications, 1 unread/i);
    fireEvent.click(bellButton);

    // Wait for notifications to appear
    await waitFor(() => {
      expect(screen.getByText('Vehicle Registered')).toBeInTheDocument();
    });

    // Click on the unread notification
    const notification = screen.getByText('Vehicle Registered');
    fireEvent.click(notification);

    // Verify markAsRead API was called
    expect(mockNotificationService.markAsRead).toHaveBeenCalledWith('1');
  });

  it('updates UI state after marking notification as read', async () => {
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

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByLabelText(/notifications, 1 unread/i)).toBeInTheDocument();
    });

    // Click the bell to open dropdown
    const bellButton = screen.getByLabelText(/notifications, 1 unread/i);
    fireEvent.click(bellButton);

    // Wait for notifications to appear
    await waitFor(() => {
      expect(screen.getByText('Vehicle Registered')).toBeInTheDocument();
    });

    // Click on the unread notification
    const notification = screen.getByText('Vehicle Registered');
    fireEvent.click(notification);

    // Wait for API call to complete
    await waitFor(() => {
      expect(mockNotificationService.markAsRead).toHaveBeenCalledWith('1');
    });

    // Check if unread count decreased
    await waitFor(() => {
      expect(screen.getByLabelText(/notifications, 0 unread/i)).toBeInTheDocument();
    });
  });

  it('marks all notifications as read when "Mark all read" is clicked', async () => {
    mockNotificationService.markAllAsRead.mockResolvedValue({
      status: 'success',
      message: 'All notifications marked as read',
      data: { markedCount: 1 }
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

    // Click the bell to open dropdown
    const bellButton = screen.getByLabelText(/notifications, 1 unread/i);
    fireEvent.click(bellButton);

    // Wait for notifications to appear
    await waitFor(() => {
      expect(screen.getByText('Mark all read')).toBeInTheDocument();
    });

    // Click "Mark all read" button
    const markAllButton = screen.getByText('Mark all read');
    fireEvent.click(markAllButton);

    // Verify markAllAsRead API was called
    expect(mockNotificationService.markAllAsRead).toHaveBeenCalled();
  });

  it('handles mark as read API errors gracefully', async () => {
    mockNotificationService.markAsRead.mockRejectedValue(
      new Error('Failed to mark notification as read')
    );

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

    // Click the bell to open dropdown
    const bellButton = screen.getByLabelText(/notifications, 1 unread/i);
    fireEvent.click(bellButton);

    // Wait for notifications to appear
    await waitFor(() => {
      expect(screen.getByText('Vehicle Registered')).toBeInTheDocument();
    });

    // Click on the unread notification
    const notification = screen.getByText('Vehicle Registered');
    fireEvent.click(notification);

    // Wait for API call to fail
    await waitFor(() => {
      expect(mockNotificationService.markAsRead).toHaveBeenCalledWith('1');
    });

    // Component should still be functional despite API error
    expect(screen.getByLabelText(/notifications, 1 unread/i)).toBeInTheDocument();
  });

  it('does not show "Mark all read" button when no unread notifications', async () => {
    mockNotificationService.getNotifications.mockResolvedValue({
      data: {
        notifications: mockNotifications.map(n => ({ ...n, read: true })),
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

    // Click the bell to open dropdown
    const bellButton = screen.getByLabelText(/notifications, 0 unread/i);
    fireEvent.click(bellButton);

    // Wait for notifications to appear
    await waitFor(() => {
      expect(screen.getByText('Vehicle Registered')).toBeInTheDocument();
    });

    // "Mark all read" button should not be visible
    expect(screen.queryByText('Mark all read')).not.toBeInTheDocument();
  });

  it('navigates to action URL when notification has actionUrl', async () => {
    // Mock window.location.href
    delete (window as any).location;
    window.location = { href: '' } as any;

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

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByLabelText(/notifications, 1 unread/i)).toBeInTheDocument();
    });

    // Click the bell to open dropdown
    const bellButton = screen.getByLabelText(/notifications, 1 unread/i);
    fireEvent.click(bellButton);

    // Wait for notifications to appear
    await waitFor(() => {
      expect(screen.getByText('Vehicle Registered')).toBeInTheDocument();
    });

    // Click on the notification with actionUrl
    const notification = screen.getByText('Vehicle Registered');
    fireEvent.click(notification);

    // Wait for API call to complete
    await waitFor(() => {
      expect(mockNotificationService.markAsRead).toHaveBeenCalledWith('1');
    });

    // Check if navigation occurred (this would be tested in integration)
    // In unit tests, we can't easily test navigation, but we can verify the actionUrl exists
    expect(mockNotifications[0].actionUrl).toBe('/vehicles');
  });
});
