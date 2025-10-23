import React from 'react';
import { render, screen, waitFor, act, cleanup } from '@testing-library/react';
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
  { id: '1', title: 'Test Notification 1', message: 'Message 1', type: 'system', read: false, createdAt: '2023-01-01T10:00:00Z' }
];

const newAdminNotification = {
  id: '2',
  title: 'New Admin Notification',
  message: 'This came from socket',
  type: 'security',
  priority: 'high',
  read: false,
  createdAt: '2023-01-01T11:00:00Z'
};

describe('AdminNotificationBell - Socket Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAdminNotificationService.getNotifications.mockResolvedValue({
      status: 'success',
      message: 'Admin notifications retrieved successfully',
      data: {
        notifications: mockAdminNotifications,
        pagination: { currentPage: 1, totalPages: 1, totalNotifications: 1, limit: 5 },
        unreadCount: 1
      }
    });
    mockOn.mockClear();
    mockOff.mockClear();
  });

  it('listens for notification_created_admin socket events', async () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <AdminNotificationBell />
      </Provider>
    );

    // Wait for component to mount
    await waitFor(() => {
      expect(screen.getByLabelText(/admin notifications, 1 unread/i)).toBeInTheDocument();
    });

    // Verify socket event listeners are set up
    expect(mockOn).toHaveBeenCalledWith('notification_created_admin', expect.any(Function));
    expect(mockOn).toHaveBeenCalledWith('activity_created_admin', expect.any(Function));
  });

  it('updates UI when new admin notification is received via socket', async () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <AdminNotificationBell />
      </Provider>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByLabelText(/admin notifications, 1 unread/i)).toBeInTheDocument();
    });

    // Simulate receiving a new admin notification via socket
    const notificationHandler = mockOn.mock.calls.find(
      call => call[0] === 'notification_created_admin'
    )?.[1];

    expect(notificationHandler).toBeDefined();

    act(() => {
      notificationHandler({ notification: newAdminNotification });
    });

    // Check if unread count increased
    await waitFor(() => {
      expect(screen.getByLabelText(/admin notifications, 2 unread/i)).toBeInTheDocument();
    });
  });

  it('applies animation class when new admin notification is received', async () => {
    const store = createMockStore();

    const { unmount } = render(
      <Provider store={store}>
        <AdminNotificationBell />
      </Provider>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByLabelText(/admin notifications, 1 unread/i)).toBeInTheDocument();
    });

    // Simulate receiving a new admin notification
    const notificationHandler = mockOn.mock.calls.find(
      call => call[0] === 'notification_created_admin'
    )?.[1];

    act(() => {
      notificationHandler({ notification: newAdminNotification });
    });

    // Check if animation class is applied
    await waitFor(() => {
      const badge = screen.getByText('2');
      expect(badge).toHaveClass('animate-pulse-scale');
    });
  });

  it('cleans up socket listeners on unmount', async () => {
    const store = createMockStore();

    const { unmount } = render(
      <Provider store={store}>
        <AdminNotificationBell />
      </Provider>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByLabelText(/admin notifications, 1 unread/i)).toBeInTheDocument();
    });

    // Unmount component
    unmount();

    // Verify socket listeners are cleaned up
    expect(mockOff).toHaveBeenCalledWith('notification_created_admin', expect.any(Function));
    expect(mockOff).toHaveBeenCalledWith('activity_created_admin', expect.any(Function));
  });

  it('handles activity_created_admin socket events', async () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <AdminNotificationBell />
      </Provider>
    );

    // Wait for component to mount
    await waitFor(() => {
      expect(screen.getByLabelText(/admin notifications, 1 unread/i)).toBeInTheDocument();
    });

    // Simulate receiving an admin activity update
    const activityHandler = mockOn.mock.calls.find(
      call => call[0] === 'activity_created_admin'
    )?.[1];

    expect(activityHandler).toBeDefined();

    const activityData = {
      activity: {
        id: '3',
        title: 'Admin System Activity',
        subtext: 'System health check completed',
        icon: 'shield',
        entityType: 'system',
        entityId: 'system123',
        createdAt: '2023-01-01T12:00:00Z',
        type: 'system'
      }
    };

    act(() => {
      activityHandler(activityData);
    });

    // Verify that notification count does not change for activity updates
    await waitFor(() => {
      expect(screen.getByLabelText(/admin notifications, 1 unread/i)).toBeInTheDocument();
    });
  });
});
