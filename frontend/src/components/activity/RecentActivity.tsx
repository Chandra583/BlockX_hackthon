import React, { useEffect, useState } from 'react';
import { Activity, Bell, AlertTriangle, CheckCircle, Clock, Megaphone, RefreshCw, Shield, Wrench, DollarSign, Car } from 'lucide-react';
import { useAppSelector } from '../../hooks/redux';
import useSocket from '../../hooks/useSocket';
import { apiService } from '../../services/api';

interface ActivityItem {
  id: string;
  title: string;
  subtext: string;
  icon: string; // mapped to Lucide icon
  entityId: string | null;
  createdAt: string;
  type: string;
}

interface RecentActivityProps {
  limit?: number;
}

const RecentActivity: React.FC<RecentActivityProps> = ({ limit = 6 }) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newActivityCount, setNewActivityCount] = useState(0);

  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { socket, on, off } = useSocket();

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

  useEffect(() => {
    if (!socket || !user) return;

    const handleNewActivity = (data: { activity: ActivityItem }) => {
      setActivities((prev) => [data.activity, ...prev.slice(0, limit - 1)]);
      setNewActivityCount((prev) => prev + 1);
    };

    on('activity_created', handleNewActivity);
    return () => {
      off('activity_created', handleNewActivity);
    };
  }, [socket, user, limit, on, off]);

  const iconMap: Record<string, React.ComponentType<any>> = {
    car: Car,
    shield: Shield,
    'alert-triangle': AlertTriangle,
    'dollar-sign': DollarSign,
    settings: RefreshCw,
    'check-circle': CheckCircle,
    clock: Clock,
    megaphone: Megaphone,
    'refresh-cw': RefreshCw,
    wrench: Wrench,
    bell: Bell,
  };

  const getIcon = (name: string) => {
    const Cmp = iconMap[name] || Bell;
    return <Cmp className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        {newActivityCount > 0 && (
          <span className="text-xs bg-blue-500 text-white rounded-full px-2 py-1">{newActivityCount} new</span>
        )}
      </div>
      {activities.length === 0 ? (
        <div className="text-center py-8">
          <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No recent activity</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((a) => (
            <div key={a.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                {getIcon(a.icon)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{a.title}</p>
                <p className="text-sm text-gray-600 truncate">{a.subtext}</p>
                <p className="text-xs text-gray-500 mt-1">{new Date(a.createdAt).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentActivity;





