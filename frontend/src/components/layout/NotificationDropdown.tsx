import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  X, 
  CheckCircle, 
  AlertTriangle, 
  Shield, 
  Car,
  Eye,
  MoreHorizontal
} from 'lucide-react';
import { NotificationService } from '../../services/notifications';
import { useAppSelector } from '../../hooks/redux';

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
  readAt?: string;
  actionUrl?: string;
}

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onMarkAsRead: (id?: string) => void;
  onViewAll: () => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  isOpen,
  onClose,
  onMarkAsRead,
  onViewAll
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  const fetchNotifications = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const response = await NotificationService.getNotifications({ limit: 5, page: 1 });
      setNotifications(response.data?.notifications || []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'verification': return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'fraud_alert': return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'security': return <Shield className="w-4 h-4 text-purple-400" />;
      case 'vehicle': return <Car className="w-4 h-4 text-blue-400" />;
      default: return <Bell className="w-4 h-4 text-gray-400" />;
    }
  };

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const handleMarkAsRead = async (id?: string) => {
    try {
      if (id) {
        await NotificationService.markNotificationAsRead(id);
        setNotifications(prev => 
          prev.map(n => n._id === id ? { ...n, readAt: new Date().toISOString() } : n)
        );
      } else {
        await NotificationService.markAllNotificationsAsRead();
        setNotifications(prev => 
          prev.map(n => ({ ...n, readAt: new Date().toISOString() }))
        );
      }
      onMarkAsRead(id);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={dropdownRef}
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="absolute right-0 mt-3 w-96 bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl z-50 overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-700/50 bg-slate-800/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Bell className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Notifications</h3>
                  <p className="text-sm text-gray-400">
                    {notifications.filter(n => !n.readAt).length} unread
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 hover:bg-slate-700/50 rounded-lg transition-all duration-200"
                aria-label="Close notifications"
              >
                <X className="w-4 h-4 text-gray-400" />
              </motion.button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-400">Loading notifications...</p>
              </div>
            ) : notifications.length > 0 ? (
              <div className="p-2">
                {notifications.map((notification, index) => (
                  <motion.div
                    key={notification._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.2 }}
                    whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                    className={`p-4 rounded-xl transition-all duration-200 mb-2 ${
                      !notification.readAt ? 'bg-blue-500/10 border border-blue-500/30' : 'bg-slate-800/30'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold text-white mb-1">
                              {notification.title}
                            </h4>
                            <p className="text-sm text-gray-300 leading-relaxed">
                              {notification.message}
                            </p>
                          </div>
                          <div className="flex flex-col items-end space-y-1 ml-2">
                            <span className="text-xs text-gray-500">
                              {formatTimeAgo(notification.createdAt)}
                            </span>
                            {!notification.readAt && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                        </div>
                        
                        {notification.actionUrl && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="inline-flex items-center text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
                          >
                            View Details
                            <span className="ml-1">→</span>
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bell className="w-8 h-8 text-gray-400" />
                </div>
                <h4 className="text-lg font-semibold text-gray-300 mb-2">No Notifications</h4>
                <p className="text-sm text-gray-400">You're all caught up!</p>
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-6 py-4 border-t border-slate-700/50 bg-slate-800/30">
              <div className="flex space-x-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleMarkAsRead()}
                  className="flex-1 px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-xl text-gray-300 font-medium transition-all duration-300"
                >
                  Mark All Read
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onViewAll}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600/20 to-purple-600/20 hover:from-blue-600/30 hover:to-purple-600/30 border border-blue-500/30 rounded-xl text-blue-400 font-medium transition-all duration-300"
                >
                  <Eye className="w-4 h-4" />
                  <span>View All</span>
                </motion.button>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotificationDropdown;
