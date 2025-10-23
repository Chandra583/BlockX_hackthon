import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Car, 
  DollarSign, 
  Shield, 
  TrendingUp, 
  CheckCircle,
  AlertTriangle,
  Bell,
  Smartphone
} from 'lucide-react';
import { useAppSelector } from '../hooks/redux';
import QuickActionsDropdown from '../components/dashboard/QuickActionsDropdown';
import { MetricCardSkeleton } from '../components/common/LoadingSkeleton';
import NotificationBell from '../components/notifications/NotificationBell';
import RecentActivity from '../components/activity/RecentActivity';
import { NotificationService } from '../services/notifications';
import useSocket from '../hooks/useSocket';

interface DashboardStat {
  title: string;
  value: number | string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: React.ComponentType<any>;
  description: string;
}

const DashboardHome: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { socket, on, off } = useSocket();

  // Fetch initial data
  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch notifications for the dashboard
        const notificationsRes = await NotificationService.getNotifications({ 
          limit: 3, 
          page: 1 
        });
        setNotifications(notificationsRes.data.notifications || []);
        
        // Fetch unread count
        const unreadRes = await NotificationService.getNotifications({ 
          unread: true, 
          limit: 1, 
          page: 1 
        });
        setUnreadCount(unreadRes.data.unreadCount || 0);
        
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  // Listen for real-time updates
  useEffect(() => {
    if (!socket || !user) return;

    const handleNewNotification = (data: { notification: any }) => {
      setNotifications(prev => [data.notification, ...prev.slice(0, 2)]);
      setUnreadCount(prev => prev + 1);
    };

    on('notification_created', handleNewNotification);

    return () => {
      off('notification_created', handleNewNotification);
    };
  }, [socket, user, on, off]);

  const ownerStats: DashboardStat[] = [
    {
      title: 'My Vehicles',
      value: 12,
      change: '+2 this month',
      changeType: 'positive',
      icon: Car,
      description: 'Total owned vehicles'
    },
    {
      title: 'Total Earnings',
      value: 48250,
      change: '+18.7%',
      changeType: 'positive',
      icon: DollarSign,
      description: 'From vehicle sales'
    },
    {
      title: 'Active Listings',
      value: 8,
      change: '+3 new',
      changeType: 'positive',
      icon: Car,
      description: 'Currently for sale'
    },
    {
      title: 'Verified Status',
      value: '100%',
      change: 'All verified',
      changeType: 'neutral',
      icon: CheckCircle,
      description: 'Vehicle verification'
    }
  ];

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await NotificationService.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      default: return <Bell className="w-5 h-5 text-blue-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'success': return 'bg-green-50 border-green-200';
      default: return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.firstName} {user?.lastName}</p>
        </div>
        <div className="flex items-center space-x-4">
          <NotificationBell />
          <QuickActionsDropdown />
        </div>
      </div>

      {/* Stats Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, index) => (
            <MetricCardSkeleton key={index} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {ownerStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-semibold text-gray-900 mt-2">{stat.value}</p>
                    <p className="text-sm mt-1">
                      <span className={`inline-flex items-center ${
                        stat.changeType === 'positive' ? 'text-green-600' : 
                        stat.changeType === 'negative' ? 'text-red-600' : 'text-gray-500'
                      }`}>
                        {stat.changeType === 'positive' ? '↑' : stat.changeType === 'negative' ? '↓' : ''}
                        {stat.change}
                      </span>
                      <span className="text-gray-500 ml-1">· {stat.description}</span>
                    </p>
                  </div>
                  <div className="p-3 bg-primary-100 rounded-lg">
                    <Icon className="w-6 h-6 text-primary-600" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Notifications and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Notifications</h3>
            <button 
              onClick={() => window.location.href = '/notifications'}
              className="text-sm text-primary-600 hover:text-primary-800"
            >
              View all
            </button>
          </div>
          <div className="space-y-4">
            {notifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`p-4 rounded-lg border ${getNotificationColor(notification.type)} ${
                    !notification.read ? 'ring-1 ring-blue-100' : ''
                  } cursor-pointer hover:bg-gray-50 transition-colors`}
                  onClick={() => handleMarkAsRead(notification.id)}
                >
                  <div className="flex items-start space-x-3">
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                      <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <RecentActivity limit={6} />
      </div>
    </div>
  );
};

export default DashboardHome;