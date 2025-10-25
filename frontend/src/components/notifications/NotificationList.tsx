import React from 'react';
import { Bell } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

interface NotificationListProps {
  notifications: Notification[];
  loading: boolean;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onViewAll: () => void;
}

const NotificationList: React.FC<NotificationListProps> = ({
  notifications,
  loading,
  onMarkAsRead,
  onMarkAllAsRead,
  onViewAll
}) => {
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <div className="w-2 h-2 rounded-full bg-yellow-500" />;
      case 'success':
        return <div className="w-2 h-2 rounded-full bg-green-500" />;
      default:
        return <div className="w-2 h-2 rounded-full bg-blue-500" />;
    }
  };

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (!notifications || notifications.length === 0) {
    return (
      <div className="p-6 text-center">
        <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">No notifications yet</p>
      </div>
    );
  }

  return (
    <div>
      <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
        {notifications.map((n) => (
          <button
            key={n.id}
            className={`w-full text-left p-4 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none ${
              !n.read ? 'bg-blue-50/40' : ''
            }`}
            onClick={() => onMarkAsRead(n.id)}
          >
            <div className="flex items-start space-x-3">
              {getNotificationIcon(n.type)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{n.title}</p>
                <p className="text-sm text-gray-600 truncate mt-1">{n.message}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {new Date(n.createdAt).toLocaleString()}
                </p>
              </div>
              {!n.read && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
            </div>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between p-3 border-t border-gray-200 bg-gray-50">
        <button onClick={onMarkAllAsRead} className="text-sm text-primary-600 hover:text-primary-800">
          Mark all as read
        </button>
        <button onClick={onViewAll} className="text-sm text-primary-600 hover:text-primary-800">
          View all
        </button>
      </div>
    </div>
  );
};

export default NotificationList;





