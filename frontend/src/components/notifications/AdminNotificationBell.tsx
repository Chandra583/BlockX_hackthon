import React, { useState, useEffect } from 'react';
import { Bell, X, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppSelector } from '../../hooks/redux';
import { AdminNotificationService } from '../../api/adminNotifications';
import useSocket from '../../hooks/useSocket';
import AdminNotificationList from './AdminNotificationList';

interface AdminNotificationBellProps {
  className?: string;
}

const AdminNotificationBell: React.FC<AdminNotificationBellProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { socket, on, off } = useSocket();

  // Fetch initial notifications and unread count
  useEffect(() => {
    if (!isAuthenticated || !user || user.role !== 'admin') return;

    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const [notificationsRes, unreadRes] = await Promise.all([
          AdminNotificationService.getNotifications({ limit: 5, page: 1 }),
          AdminNotificationService.getNotifications({ unread: true, limit: 1, page: 1 })
        ]);
        
        setNotifications(notificationsRes.data.notifications || []);
        setUnreadCount(unreadRes.data.unreadCount || 0);
      } catch (error) {
        console.error('Failed to fetch admin notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [isAuthenticated, user]);

  // Listen for real-time notification updates
  useEffect(() => {
    if (!socket || !user || user.role !== 'admin') return;

    const handleNewNotification = (data: { notification: any }) => {
      setNotifications(prev => [data.notification, ...prev.slice(0, 4)]);
      setUnreadCount(prev => prev + 1);
      
      // Trigger animation
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 650);
    };

    const handleActivityUpdate = (data: { activity: any }) => {
      // Activity updates don't affect notification count but may trigger UI updates
      console.log('Admin activity update received:', data.activity);
    };

    on('notification_created_admin', handleNewNotification);
    on('activity_created_admin', handleActivityUpdate);

    return () => {
      off('notification_created_admin', handleNewNotification);
      off('activity_created_admin', handleActivityUpdate);
    };
  }, [socket, user, on, off]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await AdminNotificationService.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark admin notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await AdminNotificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all admin notifications as read:', error);
    }
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Admin Notification Bell Button */}
      <button
        onClick={toggleDropdown}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-lg transition-colors"
        aria-label={`Admin Notifications, ${unreadCount} unread`}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <div className="relative">
          <Bell className="w-6 h-6" />
          <Crown className="w-3 h-3 absolute -top-1 -right-1 text-yellow-500" />
        </div>
        
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
                <div className="flex items-center space-x-2">
                  <Crown className="w-5 h-5 text-yellow-500" />
                  <h3 className="text-lg font-semibold text-gray-900">Admin Notifications</h3>
                </div>
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

            <AdminNotificationList
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

export default AdminNotificationBell;
