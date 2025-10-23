import React from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  Clock,
  ExternalLink
} from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
  actionLabel?: string;
}

interface NotificationListProps {
  notifications: Notification[];
  loading: boolean;
  onMarkAsRead: (id: string) => void;
  onClose: () => void;
}

const NotificationList: React.FC<NotificationListProps> = ({
  notifications,
  loading,
  onMarkAsRead,
  onClose
}) => {
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'warning':
      case 'fraud_alert':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'success':
      case 'verification':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'reminder':
        return <Clock className="w-5 h-5 text-blue-500" />;
      case 'info':
      case 'system':
        return <Info className="w-5 h-5 text-blue-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getNotificationColor = (type: string, read: boolean) => {
    const baseColors = {
      warning: 'bg-yellow-50 border-yellow-200',
      fraud_alert: 'bg-red-50 border-red-200',
      success: 'bg-green-50 border-green-200',
      verification: 'bg-blue-50 border-blue-200',
      reminder: 'bg-purple-50 border-purple-200',
      system: 'bg-gray-50 border-gray-200',
      default: 'bg-blue-50 border-blue-200'
    };

    const color = baseColors[type as keyof typeof baseColors] || baseColors.default;
    const unreadStyle = !read ? 'ring-1 ring-blue-100 bg-blue-50/50' : '';
    
    return `${color} ${unreadStyle}`;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
    
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="space-y-3">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="p-6 text-center">
        <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">No notifications yet</p>
      </div>
    );
  }

  return (
    <div className="max-h-96 overflow-y-auto">
      {notifications.map((notification, index) => (
        <motion.div
          key={notification.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
          className={`p-4 border-b border-gray-100 last:border-b-0 cursor-pointer hover:bg-gray-50 transition-colors ${getNotificationColor(notification.type, notification.read)}`}
          onClick={() => handleNotificationClick(notification)}
        >
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-0.5">
              {getNotificationIcon(notification.type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className={`text-sm font-medium ${notification.read ? 'text-gray-700' : 'text-gray-900'}`}>
                    {notification.title}
                  </p>
                  <p className={`text-sm mt-1 ${notification.read ? 'text-gray-500' : 'text-gray-600'}`}>
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    {formatTimeAgo(notification.createdAt)}
                  </p>
                </div>
                
                <div className="flex items-center space-x-2 ml-2">
                  {!notification.read && (
                    <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></div>
                  )}
                  {notification.actionUrl && (
                    <ExternalLink className="w-3 h-3 text-gray-400 flex-shrink-0" />
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
      
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <button
          onClick={() => {
            onClose();
            window.location.href = '/notifications';
          }}
          className="w-full text-sm text-primary-600 hover:text-primary-800 font-medium"
        >
          View all notifications
        </button>
      </div>
    </div>
  );
};

export default NotificationList;
