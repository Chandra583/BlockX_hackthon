import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import AdminNotificationBell from '../components/notifications/AdminNotificationBell';
import { AdminNotificationService } from '../api/adminNotifications';

// Mock the admin notification service
jest.mock('../api/adminNotifications');
const mockAdminNotificationService = AdminNotificationService as jest.Mocked<typeof AdminNotificationService>;

// Mock socket
const mockSocket = {
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
  disconnect: jest.fn()
};

const mockOn = jest.fn();
const mockOff = jest.fn();

// Mock the socket hook
jest.mock('../hooks/useSocket', () => ({
  __esModule: true,
  default: () => ({ socket: mockSocket, on: mockOn, off: mockOff })
}));

// Mock store
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: () => ({
        isAuthenticated: true,
        user: { id: 'admin123', role: 'admin', firstName: 'Admin', lastName: 'User' }
      }),
    },
    preloadedState: initialState,
  });
};

const mockAdminNotifications = [
  {
    id: '1',
    title: 'System Alert',
    message: 'Database maintenance scheduled',
    type: 'system',
    priority: 'high',
    read: false,
    createdAt: '2023-01-01T10:00:00Z'
  },
  {
    id: '2',
    title: 'New User Registration',
    message: 'User john.doe@example.com registered',
    type: 'user_registration',
    priority: 'medium',
    read: false,
    createdAt: '2023-01-01T11:00:00Z'
  }
];

describe('AdminNotificationBell - Mark as Read', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAdminNotificationService.getNotifications.mockResolvedValue({
      status: 'success',
      message: 'Admin notifications retrieved successfully',
      data: {
        notifications: mockAdminNotifications,
        pagination: { currentPage: 1, totalPages: 1, totalNotifications: 2, limit: 5 },
        unreadCount: 2
      }
    });
    mockAdminNotificationService.markAsRead.mockResolvedValue({
      status: 'success',
      message: 'Notification marked as read'
    });
    mockAdminNotificationService.markAllAsRead.mockResolvedValue({
      status: 'success',
      message: 'All notifications marked as read',
      data: { markedCount: 2 }
    });
  });

  it('marks individual notification as read when clicked', async () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <AdminNotificationBell />
      </Provider>
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByLabelText(/admin notifications, 2 unread/i)).toBeInTheDocument();
    });

    // Click to open dropdown
    const bellButton = screen.getByLabelText(/admin notifications, 2 unread/i);
    fireEvent.click(bellButton);

    // Wait for dropdown to appear
    await waitFor(() => {
      expect(screen.getByText('System Alert')).toBeInTheDocument();
    });

    // Click on first notification
    const notification = screen.getByText('System Alert');
    fireEvent.click(notification);

    // Verify API call
    await waitFor(() => {
      expect(mockAdminNotificationService.markAsRead).toHaveBeenCalledWith('1');
    });
  });

  it('updates unread count after marking as read', async () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <AdminNotificationBell />
      </Provider>
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByLabelText(/admin notifications, 2 unread/i)).toBeInTheDocument();
    });

    // Click to open dropdown
    const bellButton = screen.getByLabelText(/admin notifications, 2 unread/i);
    fireEvent.click(bellButton);

    // Wait for dropdown to appear
    await waitFor(() => {
      expect(screen.getByText('System Alert')).toBeInTheDocument();
    });

    // Click on first notification
    const notification = screen.getByText('System Alert');
    fireEvent.click(notification);

    // Verify unread count decreased
    await waitFor(() => {
      expect(screen.getByLabelText(/admin notifications, 1 unread/i)).toBeInTheDocument();
    });
  });

  it('marks all notifications as read when "Mark all read" is clicked', async () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <AdminNotificationBell />
      </Provider>
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByLabelText(/admin notifications, 2 unread/i)).toBeInTheDocument();
    });

    // Click to open dropdown
    const bellButton = screen.getByLabelText(/admin notifications, 2 unread/i);
    fireEvent.click(bellButton);

    // Wait for dropdown to appear
    await waitFor(() => {
      expect(screen.getByText('Mark all read')).toBeInTheDocument();
    });

    // Click "Mark all read" button
    const markAllButton = screen.getByText('Mark all read');
    fireEvent.click(markAllButton);

    // Verify API call
    await waitFor(() => {
      expect(mockAdminNotificationService.markAllAsRead).toHaveBeenCalled();
    });

    // Verify unread count is zero
    await waitFor(() => {
      expect(screen.getByLabelText(/admin notifications, 0 unread/i)).toBeInTheDocument();
    });
  });

  it('handles mark as read errors gracefully', async () => {
    const store = createMockStore();
    
    mockAdminNotificationService.markAsRead.mockRejectedValue(
      new Error('Failed to mark as read')
    );

    render(
      <Provider store={store}>
        <AdminNotificationBell />
      </Provider>
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByLabelText(/admin notifications, 2 unread/i)).toBeInTheDocument();
    });

    // Click to open dropdown
    const bellButton = screen.getByLabelText(/admin notifications, 2 unread/i);
    fireEvent.click(bellButton);

    // Wait for dropdown to appear
    await waitFor(() => {
      expect(screen.getByText('System Alert')).toBeInTheDocument();
    });

    // Click on first notification
    const notification = screen.getByText('System Alert');
    fireEvent.click(notification);

    // Should not crash and should still show the notification
    await waitFor(() => {
      expect(screen.getByLabelText(/admin notifications, 2 unread/i)).toBeInTheDocument();
    });
  });

  it('navigates to admin notifications page when "View all" is clicked', async () => {
    const store = createMockStore();
    
    // Mock window.location
    delete (window as any).location;
    window.location = { href: '' } as any;

    render(
      <Provider store={store}>
        <AdminNotificationBell />
      </Provider>
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByLabelText(/admin notifications, 2 unread/i)).toBeInTheDocument();
    });

    // Click to open dropdown
    const bellButton = screen.getByLabelText(/admin notifications, 2 unread/i);
    fireEvent.click(bellButton);

    // Wait for dropdown to appear
    await waitFor(() => {
      expect(screen.getByText('View all admin notifications')).toBeInTheDocument();
    });

    // Click "View all" button
    const viewAllButton = screen.getByText('View all admin notifications');
    fireEvent.click(viewAllButton);

    // Verify navigation
    expect(window.location.href).toBe('/admin/notifications');
  });
});
