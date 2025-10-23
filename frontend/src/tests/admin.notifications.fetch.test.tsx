import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
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

describe('AdminNotificationBell - Data Fetching', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAdminNotificationService.getNotifications.mockResolvedValue({
      status: 'success',
      message: 'Admin notifications retrieved successfully',
      data: {
        notifications: mockAdminNotifications,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalNotifications: 2,
          limit: 5
        },
        unreadCount: 2
      }
    });
  });

  it('renders admin notification bell with crown icon', async () => {
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

    // Check for crown icon (admin-specific)
    expect(screen.getByTestId('crown-icon')).toBeInTheDocument();
  });

  it('displays unread count badge', async () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <AdminNotificationBell />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  it('fetches admin notifications on mount', async () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <AdminNotificationBell />
      </Provider>
    );

    await waitFor(() => {
      expect(mockAdminNotificationService.getNotifications).toHaveBeenCalledWith({
        limit: 5,
        page: 1
      });
    });
  });

  it('handles loading state', async () => {
    const store = createMockStore();
    
    // Mock loading state
    mockAdminNotificationService.getNotifications.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );

    render(
      <Provider store={store}>
        <AdminNotificationBell />
      </Provider>
    );

    // Should show loading state initially
    expect(screen.getByLabelText(/admin notifications/i)).toBeInTheDocument();
  });

  it('handles fetch errors gracefully', async () => {
    const store = createMockStore();
    
    mockAdminNotificationService.getNotifications.mockRejectedValue(
      new Error('Failed to fetch notifications')
    );

    render(
      <Provider store={store}>
        <AdminNotificationBell />
      </Provider>
    );

    // Should still render the bell even if fetch fails
    await waitFor(() => {
      expect(screen.getByLabelText(/admin notifications/i)).toBeInTheDocument();
    });
  });

  it('does not render for non-admin users', () => {
    const store = configureStore({
      reducer: {
        auth: () => ({
          isAuthenticated: true,
          user: { id: 'user123', role: 'owner', firstName: 'User', lastName: 'Name' }
        }),
      },
    });

    render(
      <Provider store={store}>
        <AdminNotificationBell />
      </Provider>
    );

    // Should not call the service for non-admin users
    expect(mockAdminNotificationService.getNotifications).not.toHaveBeenCalled();
  });
});
