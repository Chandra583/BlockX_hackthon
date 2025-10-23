import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { BrowserRouter } from 'react-router-dom';
import NotificationBell from '../components/notifications/NotificationBell';
import { NotificationService } from '../services/notifications';
import authReducer from '../store/slices/authSlice';

// Mock the notification service
jest.mock('../services/notifications');
const mockNotificationService = NotificationService as jest.Mocked<typeof NotificationService>;

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
    createdAt: '2023-01-01T10:00:00Z'
  }
];

const newNotification = {
  id: '2',
  title: 'New Vehicle Alert',
  message: 'A new vehicle has been added to your account',
  type: 'info',
  priority: 'medium',
  read: false,
  createdAt: '2023-01-01T11:00:00Z'
};

describe('NotificationBell Socket Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNotificationService.getNotifications.mockResolvedValue({
      data: {
        notifications: mockNotifications,
        unreadCount: 1
      }
    });
    mockOn.mockClear();
    mockOff.mockClear();
  });

  it('listens for notification_created socket events', async () => {
    const store = createMockStore();
    
    render(
      <Provider store={store}>
        <BrowserRouter>
          <NotificationBell />
        </BrowserRouter>
      </Provider>
    );

    // Wait for component to mount
    await waitFor(() => {
      expect(screen.getByLabelText(/notifications, 1 unread/i)).toBeInTheDocument();
    });

    // Verify socket event listeners are set up
    expect(mockOn).toHaveBeenCalledWith('notification_created', expect.any(Function));
    expect(mockOn).toHaveBeenCalledWith('activity_created', expect.any(Function));
  });

  it('updates UI when new notification is received via socket', async () => {
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

    // Simulate receiving a new notification via socket
    const notificationHandler = mockOn.mock.calls.find(
      call => call[0] === 'notification_created'
    )?.[1];

    expect(notificationHandler).toBeDefined();

    act(() => {
      notificationHandler({ notification: newNotification });
    });

    // Check if unread count increased
    await waitFor(() => {
      expect(screen.getByLabelText(/notifications, 2 unread/i)).toBeInTheDocument();
    });
  });

  it('applies animation class when new notification arrives', async () => {
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

    // Simulate receiving a new notification
    const notificationHandler = mockOn.mock.calls.find(
      call => call[0] === 'notification_created'
    )?.[1];

    act(() => {
      notificationHandler({ notification: newNotification });
    });

    // Check if animation class is applied (this would be tested in integration)
    await waitFor(() => {
      const badge = screen.getByText('2');
      expect(badge).toHaveClass('animate-pulse-scale');
    });
  });

  it('cleans up socket listeners on unmount', async () => {
    const store = createMockStore();
    
    const { unmount } = render(
      <Provider store={store}>
        <BrowserRouter>
          <NotificationBell />
        </BrowserRouter>
      </Provider>
    );

    // Wait for component to mount
    await waitFor(() => {
      expect(screen.getByLabelText(/notifications, 1 unread/i)).toBeInTheDocument();
    });

    // Unmount component
    unmount();

    // Verify socket listeners are cleaned up
    expect(mockOff).toHaveBeenCalledWith('notification_created', expect.any(Function));
    expect(mockOff).toHaveBeenCalledWith('activity_created', expect.any(Function));
  });

  it('handles activity_created socket events', async () => {
    const store = createMockStore();
    
    render(
      <Provider store={store}>
        <BrowserRouter>
          <NotificationBell />
        </BrowserRouter>
      </Provider>
    );

    // Wait for component to mount
    await waitFor(() => {
      expect(screen.getByLabelText(/notifications, 1 unread/i)).toBeInTheDocument();
    });

    // Simulate receiving an activity update
    const activityHandler = mockOn.mock.calls.find(
      call => call[0] === 'activity_created'
    )?.[1];

    expect(activityHandler).toBeDefined();

    const activityData = {
      activity: {
        id: '3',
        title: 'Vehicle Activity',
        subtext: 'New activity detected',
        icon: 'car',
        entityId: 'vehicle-123',
        createdAt: '2023-01-01T12:00:00Z',
        type: 'update'
      }
    };

    act(() => {
      activityHandler(activityData);
    });

    // Activity updates don't affect notification count but should be handled gracefully
    expect(console.log).toHaveBeenCalledWith('Activity update received:', activityData.activity);
  });

  it('handles socket connection errors gracefully', async () => {
    const store = createMockStore();
    
    // Mock socket with error
    const errorSocket = {
      on: jest.fn().mockImplementation((event, handler) => {
        if (event === 'connect_error') {
          // Simulate connection error
          setTimeout(() => handler(new Error('Connection failed')), 100);
        }
      }),
      off: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn()
    };

    jest.doMock('../hooks/useSocket', () => ({
      useSocket: () => errorSocket
    }));

    render(
      <Provider store={store}>
        <BrowserRouter>
          <NotificationBell />
        </BrowserRouter>
      </Provider>
    );

    // Component should still render without crashing
    await waitFor(() => {
      expect(screen.getByLabelText(/notifications, 1 unread/i)).toBeInTheDocument();
    });
  });
});
