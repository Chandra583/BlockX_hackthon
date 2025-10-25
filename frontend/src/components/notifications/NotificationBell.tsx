import React, { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppSelector } from '../../hooks/redux';
import { NotificationService } from '../../services/notifications';
import useSocket from '../../hooks/useSocket';
import NotificationList from './NotificationList';

interface NotificationBellProps {
  className?: string;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ className = '' }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { socket, on, off } = useSocket();

  // Fetch initial notifications and unread count
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const [notificationsRes, unreadRes] = await Promise.all([
          NotificationService.getNotifications({ limit: 5, page: 1 }),
          NotificationService.getNotifications({ unread: true, limit: 1, page: 1 })
        ]);

        setNotifications(notificationsRes.data.notifications || []);
        setUnreadCount(unreadRes.data.unreadCount || 0);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [isAuthenticated, user]);

  // Listen for real-time notification updates
  useEffect(() => {
    if (!socket || !user) return;

    const handleNewNotification = (data: { notification: any }) => {
      setNotifications((prev) => [data.notification, ...prev.slice(0, 4)]);
      setUnreadCount((prev) => prev + 1);

      // Trigger animation
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 650);
    };

    const handleActivityUpdate = (data: { activity: any }) => {
      // Optionally react to activity updates
      // console.log('Activity update received:', data.activity);
    };

    on('notification_created', handleNewNotification);
    on('activity_created', handleActivityUpdate);

    return () => {
      off('notification_created', handleNewNotification);
      off('activity_created', handleActivityUpdate);
    };
  }, [socket, user, on, off]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await NotificationService.markAsRead(notificationId);
      setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await NotificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        className={`relative p-2 rounded-full text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors`}
        onClick={() => setShowDropdown(!showDropdown)}
        aria-label={`Notifications, ${unreadCount} unread`}
        aria-haspopup="true"
        aria-expanded={showDropdown}
      >
        <Bell className={`w-6 h-6 ${isAnimating ? 'animate-pulse-scale' : ''}`} />
        {unreadCount > 0 && (
          <motion.span
            key={unreadCount}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full transform translate-x-1/2 -translate-y-1/2"
          >
            {unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50"
          >
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
              <button
                onClick={() => setShowDropdown(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close notifications"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <NotificationList
              notifications={notifications}
              loading={loading}
              onMarkAsRead={handleMarkAsRead}
              onMarkAllAsRead={handleMarkAllAsRead}
              onViewAll={() => {
                setShowDropdown(false);
                window.location.href = '/notifications';
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;





