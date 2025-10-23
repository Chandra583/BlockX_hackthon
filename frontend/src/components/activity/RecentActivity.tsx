import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Car, 
  Shield, 
  Smartphone, 
  DollarSign, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  Settings,
  Wrench,
  Bell
} from 'lucide-react';
import { useAppSelector } from '../../hooks/redux';
import useSocket from '../../hooks/useSocket';
import { apiService } from '../../services/api';

interface ActivityItem {
  id: string;
  title: string;
  subtext: string;
  icon: string;
  entityId: string | null;
  createdAt: string;
  type: string;
}

interface RecentActivityProps {
  limit?: number;
  className?: string;
}

const RecentActivity: React.FC<RecentActivityProps> = ({ 
  limit = 6, 
  className = '' 
}) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newActivityCount, setNewActivityCount] = useState(0);
  
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { socket, on, off } = useSocket();

  // Fetch initial activities
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const fetchActivities = async () => {
      try {
        setLoading(true);
        const response = await apiService.get(`/users/activity?limit=${limit}`);
        setActivities(response.data.activity || []);
      } catch (error) {
        console.error('Failed to fetch activities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [isAuthenticated, user, limit]);

  // Listen for real-time activity updates
  useEffect(() => {
    if (!socket || !user) return;

    const handleNewActivity = (data: { activity: ActivityItem }) => {
      setActivities(prev => [data.activity, ...prev.slice(0, limit - 1)]);
      setNewActivityCount(prev => prev + 1);
    };

    on('activity_created', handleNewActivity);

    return () => {
      off('activity_created', handleNewActivity);
    };
  }, [socket, user, limit, on, off]);

  const getActivityIcon = (iconName: string) => {
    const iconMap: { [key: string]: React.ComponentType<any> } = {
      'car': Car,
      'shield': Shield,
      'smartphone': Smartphone,
      'dollar-sign': DollarSign,
      'check-circle': CheckCircle,
      'alert-triangle': AlertTriangle,
      'clock': Clock,
      'settings': Settings,
      'wrench': Wrench,
      'bell': Bell
    };
    
    const IconComponent = iconMap[iconName] || Bell;
    return <IconComponent className="w-4 h-4" />;
  };

  const getActivityColor = (type: string) => {
    const colorMap: { [key: string]: string } = {
      'security': 'bg-red-100 text-red-600',
      'fraud_alert': 'bg-red-100 text-red-600',
      'transaction': 'bg-green-100 text-green-600',
      'system': 'bg-gray-100 text-gray-600',
      'verification': 'bg-blue-100 text-blue-600',
      'reminder': 'bg-purple-100 text-purple-600',
      'marketing': 'bg-yellow-100 text-yellow-600',
      'update': 'bg-blue-100 text-blue-600',
      'install_request': 'bg-orange-100 text-orange-600'
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

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
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
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        {newActivityCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="bg-blue-500 text-white text-xs rounded-full px-2 py-1"
          >
            {newActivityCount} new
          </motion.div>
        )}
      </div>
      
      <div className="space-y-4">
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No recent activity</p>
          </div>
        ) : (
          activities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                index === 0 && newActivityCount > 0 
                  ? 'bg-green-50 border border-green-200' 
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getActivityColor(activity.type)}`}>
                {getActivityIcon(activity.icon)}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {activity.title}
                </p>
                <p className="text-sm text-gray-600 truncate">
                  {activity.subtext}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatTimeAgo(activity.createdAt)}
                </p>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default RecentActivity;
