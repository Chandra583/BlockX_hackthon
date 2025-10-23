import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  AlertTriangle, 
  Database, 
  UserPlus, 
  Car, 
  Link, 
  DollarSign, 
  CheckCircle, 
  Clock,
  Settings,
  Wrench,
  Bell,
  TrendingUp,
  Activity
} from 'lucide-react';
import { useAppSelector } from '../../hooks/redux';
import useSocket from '../../hooks/useSocket';
import { AdminNotificationService } from '../../api/adminNotifications';

interface AdminActivityItem {
  id: string;
  title: string;
  subtext: string;
  icon: string;
  entityType: string;
  entityId: string | null;
  createdAt: string;
  type: string;
  actionUrl?: string;
}

interface AdminRecentActivityProps {
  limit?: number;
  className?: string;
}

const AdminRecentActivity: React.FC<AdminRecentActivityProps> = ({ 
  limit = 6, 
  className = '' 
}) => {
  const [activities, setActivities] = useState<AdminActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newActivityCount, setNewActivityCount] = useState(0);
  
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { socket, on, off } = useSocket();

  // Fetch initial activities
  useEffect(() => {
    if (!isAuthenticated || !user || user.role !== 'admin') return;

    const fetchActivities = async () => {
      try {
        setLoading(true);
        const response = await AdminNotificationService.getActivity({ limit });
        setActivities(response.data.activity || []);
      } catch (error) {
        console.error('Failed to fetch admin activities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [isAuthenticated, user, limit]);

  // Listen for real-time activity updates
  useEffect(() => {
    if (!socket || !user || user.role !== 'admin') return;

    const handleNewActivity = (data: { activity: AdminActivityItem }) => {
      setActivities(prev => [data.activity, ...prev.slice(0, limit - 1)]);
      setNewActivityCount(prev => prev + 1);
    };

    on('activity_created_admin', handleNewActivity);

    return () => {
      off('activity_created_admin', handleNewActivity);
    };
  }, [socket, user, limit, on, off]);

  const getActivityIcon = (iconName: string) => {
    const iconMap: { [key: string]: React.ComponentType<any> } = {
      'shield': Shield,
      'alert-triangle': AlertTriangle,
      'database': Database,
      'user-plus': UserPlus,
      'car': Car,
      'link': Link,
      'dollar-sign': DollarSign,
      'check-circle': CheckCircle,
      'clock': Clock,
      'settings': Settings,
      'wrench': Wrench,
      'bell': Bell,
      'trending-up': TrendingUp,
      'activity': Activity
    };
    
    const IconComponent = iconMap[iconName] || Bell;
    return <IconComponent className="w-4 h-4" />;
  };

  const getActivityColor = (type: string) => {
    const colorMap: { [key: string]: string } = {
      'security': 'bg-red-100 text-red-600',
      'fraud_alert': 'bg-red-100 text-red-600',
      'fraud_detection': 'bg-red-100 text-red-600',
      'system': 'bg-blue-100 text-blue-600',
      'system_health': 'bg-blue-100 text-blue-600',
      'user_registration': 'bg-green-100 text-green-600',
      'user_login': 'bg-green-100 text-green-600',
      'vehicle_approval': 'bg-blue-100 text-blue-600',
      'vehicle_registration': 'bg-blue-100 text-blue-600',
      'vehicle_verification': 'bg-blue-100 text-blue-600',
      'batch_anchor': 'bg-purple-100 text-purple-600',
      'blockchain_anchor': 'bg-purple-100 text-purple-600',
      'transaction': 'bg-green-100 text-green-600',
      'reminder': 'bg-yellow-100 text-yellow-600',
      'install_request': 'bg-orange-100 text-orange-600',
      'obd_installation': 'bg-orange-100 text-orange-600',
      'device_activation': 'bg-green-100 text-green-600',
      'telemetry_received': 'bg-blue-100 text-blue-600',
      'batch_processing': 'bg-purple-100 text-purple-600',
      'data_export': 'bg-gray-100 text-gray-600',
      'audit_log': 'bg-gray-100 text-gray-600',
      'update': 'bg-gray-100 text-gray-600'
    };
    
    return colorMap[type] || 'bg-gray-100 text-gray-600';
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

  const handleActivityClick = (activity: AdminActivityItem) => {
    if (activity.actionUrl) {
      window.location.href = activity.actionUrl;
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Admin Activity</h3>
        <div className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Activity className="w-6 h-6 text-blue-600" />
          <h3 className="text-xl font-bold text-gray-900">Recent Admin Activity</h3>
        </div>
        {newActivityCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="bg-blue-500 text-white text-xs rounded-full px-3 py-1 font-medium"
          >
            {newActivityCount} new
          </motion.div>
        )}
      </div>
      
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {activities.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium">No recent admin activity</p>
            <p className="text-gray-400 text-sm mt-2">Activity will appear here as it happens</p>
          </div>
        ) : (
          activities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className={`flex items-start space-x-4 p-4 rounded-lg border transition-all duration-200 ${
                index === 0 && newActivityCount > 0 
                  ? 'bg-green-50 border-green-200 shadow-sm' 
                  : 'hover:bg-gray-50 border-gray-100'
              } ${activity.actionUrl ? 'cursor-pointer hover:shadow-md' : ''}`}
              onClick={() => handleActivityClick(activity)}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getActivityColor(activity.type)}`}>
                {getActivityIcon(activity.icon)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 mb-1">
                      {activity.title}
                    </p>
                    <p className="text-sm text-gray-600 mb-2 leading-relaxed">
                      {activity.subtext}
                    </p>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getActivityColor(activity.type)}`}>
                        {activity.entityType}
                      </span>
                      <p className="text-xs text-gray-500">
                        {formatTimeAgo(activity.createdAt)}
                      </p>
                    </div>
                  </div>
                  {activity.actionUrl && (
                    <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminRecentActivity;
