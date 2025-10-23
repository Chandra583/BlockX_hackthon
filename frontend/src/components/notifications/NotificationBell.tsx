import React, { useState, useEffect } from 'react';
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
  const [isOpen, setIsOpen] = useState(false);
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
      setNotifications(prev => [data.notification, ...prev.slice(0, 4)]);
      setUnreadCount(prev => prev + 1);
      
      // Trigger animation
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 650);
    };

    const handleActivityUpdate = (data: { activity: any }) => {
      // Activity updates don't affect notification count but may trigger UI updates
      console.log('Activity update received:', data.activity);
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
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await NotificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Notification Bell Button */}
      <button
        onClick={toggleDropdown}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-lg transition-colors"
        aria-label={`Notifications, ${unreadCount} unread`}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <Bell className="w-6 h-6" />
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <motion.div
            className={`absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 ${
              isAnimating ? 'animate-pulse-scale' : ''
            }`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.div>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
          >
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                <div className="flex items-center space-x-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-sm text-primary-600 hover:text-primary-800"
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-gray-600"
                    aria-label="Close notifications"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <NotificationList
              notifications={notifications}
              loading={loading}
              onMarkAsRead={handleMarkAsRead}
              onClose={() => setIsOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
