import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import NotificationDropdown from '../../components/layout/NotificationDropdown';
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
const mockNotifications = [
  {
    _id: '1',
    title: 'Vehicle Approved',
    message: 'Your vehicle has been approved for verification',
    type: 'verification',
    priority: 'high' as const,
    createdAt: new Date().toISOString(),
    readAt: undefined,
    actionUrl: '/vehicles/1'
  },
  {
    _id: '2',
    title: 'Fraud Alert',
    message: 'Suspicious activity detected on your vehicle',
    type: 'fraud_alert',
    priority: 'high' as const,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    readAt: new Date().toISOString(),
    actionUrl: '/vehicles/1'
  }
];

jest.mock('../../services/notifications', () => ({
  NotificationService: {
    getNotifications: jest.fn().mockResolvedValue({
      data: {
        notifications: mockNotifications,
        unreadCount: 1
      }
    }),
    markNotificationAsRead: jest.fn().mockResolvedValue({ status: 'success' }),
    markAllNotificationsAsRead: jest.fn().mockResolvedValue({ status: 'success' })
  }
}));

describe('NotificationDropdown Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onMarkAsRead: jest.fn(),
    onViewAll: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders notification dropdown when open', () => {
    renderWithProviders(<NotificationDropdown {...defaultProps} />);
    
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('1 unread')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    renderWithProviders(<NotificationDropdown {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByText('Notifications')).not.toBeInTheDocument();
  });

  it('displays notifications correctly', async () => {
    renderWithProviders(<NotificationDropdown {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Vehicle Approved')).toBeInTheDocument();
      expect(screen.getByText('Your vehicle has been approved for verification')).toBeInTheDocument();
      expect(screen.getByText('Fraud Alert')).toBeInTheDocument();
    });
  });

  it('shows unread indicator for unread notifications', async () => {
    renderWithProviders(<NotificationDropdown {...defaultProps} />);
    
    await waitFor(() => {
      const unreadIndicator = screen.getByText('Vehicle Approved').closest('div')?.querySelector('.bg-blue-500');
      expect(unreadIndicator).toBeInTheDocument();
    });
  });

  it('calls onClose when close button is clicked', () => {
    renderWithProviders(<NotificationDropdown {...defaultProps} />);
    
    const closeButton = screen.getByLabelText('Close notifications');
    fireEvent.click(closeButton);
    
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onViewAll when View All button is clicked', () => {
    renderWithProviders(<NotificationDropdown {...defaultProps} />);
    
    const viewAllButton = screen.getByText('View All');
    fireEvent.click(viewAllButton);
    
    expect(defaultProps.onViewAll).toHaveBeenCalledTimes(1);
  });

  it('calls onMarkAsRead when Mark All Read button is clicked', () => {
    renderWithProviders(<NotificationDropdown {...defaultProps} />);
    
    const markAllReadButton = screen.getByText('Mark All Read');
    fireEvent.click(markAllReadButton);
    
    expect(defaultProps.onMarkAsRead).toHaveBeenCalledTimes(1);
  });

  it('shows loading state initially', () => {
    renderWithProviders(<NotificationDropdown {...defaultProps} />);
    
    expect(screen.getByText('Loading notifications...')).toBeInTheDocument();
  });

  it('shows empty state when no notifications', async () => {
    // Mock empty notifications
    jest.doMock('../../services/notifications', () => ({
      NotificationService: {
        getNotifications: jest.fn().mockResolvedValue({
          data: {
            notifications: [],
            unreadCount: 0
          }
        })
      }
    }));

    renderWithProviders(<NotificationDropdown {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('No Notifications')).toBeInTheDocument();
      expect(screen.getByText("You're all caught up!")).toBeInTheDocument();
    });
  });

  it('closes when clicking outside', () => {
    renderWithProviders(<NotificationDropdown {...defaultProps} />);
    
    // Click outside the dropdown
    fireEvent.mouseDown(document.body);
    
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('shows correct notification icons based on type', async () => {
    renderWithProviders(<NotificationDropdown {...defaultProps} />);
    
    await waitFor(() => {
      // Check for verification icon (CheckCircle)
      const verificationIcon = screen.getByText('Vehicle Approved').closest('div')?.querySelector('svg');
      expect(verificationIcon).toBeInTheDocument();
    });
  });

  it('formats time correctly', async () => {
    renderWithProviders(<NotificationDropdown {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Just now')).toBeInTheDocument();
      expect(screen.getByText('1h ago')).toBeInTheDocument();
    });
  });
});
