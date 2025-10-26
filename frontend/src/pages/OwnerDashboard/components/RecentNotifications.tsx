import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  CheckCircle, 
  AlertTriangle, 
  Shield, 
  Car, 
  DollarSign,
  Eye,
  MoreHorizontal
} from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
  readAt?: string;
  actionUrl?: string;
}

interface RecentNotificationsProps {
  notifications: Notification[];
  unreadCount: number;
}

const RecentNotifications: React.FC<RecentNotificationsProps> = ({ 
  notifications, 
  unreadCount 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'verification':
        return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case 'fraud_alert':
        return <AlertTriangle className="w-5 h-5 text-red-400" />;
      case 'security':
        return <Shield className="w-5 h-5 text-blue-400" />;
      case 'vehicle':
        return <Car className="w-5 h-5 text-purple-400" />;
      case 'transaction':
        return <DollarSign className="w-5 h-5 text-green-400" />;
      default:
        return <Bell className="w-5 h-5 text-gray-400" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-red-500/30 bg-red-500/10';
      case 'medium':
        return 'border-yellow-500/30 bg-yellow-500/10';
      case 'low':
        return 'border-blue-500/30 bg-blue-500/10';
      default:
        return 'border-gray-500/30 bg-gray-500/10';
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

  const visibleNotifications = isExpanded ? notifications : notifications.slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl"
            >
              <Bell className="w-5 h-5 text-white" />
            </motion.div>
            <div>
              <h3 className="text-lg font-bold text-white">Recent Notifications</h3>
              <p className="text-sm text-gray-400">
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
              </p>
            </div>
          </div>
          
          {unreadCount > 0 && (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="w-3 h-3 bg-red-500 rounded-full"
            />
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="p-6">
        <AnimatePresence>
          {visibleNotifications.length > 0 ? (
            <div className="space-y-4">
              {visibleNotifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.1, duration: 0.4 }}
                  whileHover={{ scale: 1.02, x: 5 }}
                  className={`p-4 rounded-xl border ${getPriorityColor(notification.priority)} ${
                    !notification.readAt ? 'ring-2 ring-blue-500/30' : ''
                  } transition-all duration-300`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-semibold text-white truncate">
                          {notification.title}
                        </h4>
                        <span className="text-xs text-gray-400">
                          {formatTimeAgo(notification.createdAt)}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-300 line-clamp-2">
                        {notification.message}
                      </p>
                      
                      {notification.actionUrl && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="mt-2 text-xs text-blue-400 hover:text-blue-300 font-medium"
                        >
                          View Details →
                        </motion.button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-gray-300 mb-2">No Notifications</h4>
              <p className="text-sm text-gray-400">You're all caught up!</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* View All Button */}
        {notifications.length > 3 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 pt-4 border-t border-white/10"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium transition-all duration-300"
            >
              <Eye className="w-4 h-4" />
              <span>{isExpanded ? 'Show Less' : 'View All'}</span>
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <MoreHorizontal className="w-4 h-4" />
              </motion.div>
            </motion.button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default RecentNotifications;
