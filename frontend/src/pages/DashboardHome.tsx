import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  TrendingUp, 
  Car, 
  Smartphone, 
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Activity,
  Shield,
  Wrench,
  FileText
} from 'lucide-react';
import { useAppSelector } from '../hooks/redux';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { StatCard } from '../components/ui/StatCard';
import { QuickActionsDropdown } from '../components/QuickActions/QuickActionsDropdown';
import { useSocket } from '../hooks/useSocket';

interface DashboardStats {
  totalVehicles: number;
  activeDevices: number;
  pendingInstalls: number;
  trustScore: number;
  recentActivity: number;
  walletBalance: number;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  timestamp: Date;
  read: boolean;
}

export const DashboardHome: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [realtimeUpdates, setRealtimeUpdates] = useState(0);
  
  const socket = useSocket();

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        
        // Mock data - replace with actual API calls
        const mockStats: DashboardStats = {
          totalVehicles: 3,
          activeDevices: 2,
          pendingInstalls: 1,
          trustScore: 95,
          recentActivity: 12,
          walletBalance: 1250.50
        };

        const mockNotifications: Notification[] = [
          {
            id: '1',
            title: 'Device Installation Request',
            message: 'New device installation request for Vehicle VIN: 1HGBH41JXMN109186',
            type: 'info',
            timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
            read: false
          },
          {
            id: '2',
            title: 'Trust Score Updated',
            message: 'Vehicle trust score increased to 95 points',
            type: 'success',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
            read: false
          },
          {
            id: '3',
            title: 'Telemetry Received',
            message: 'New telemetry data received from device DEV-001',
            type: 'info',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
            read: true
          }
        ];

        setStats(mockStats);
        setNotifications(mockNotifications);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // Socket.IO real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleInstallRequest = (data: any) => {
      setRealtimeUpdates(prev => prev + 1);
      // Add new notification
      const newNotification: Notification = {
        id: `realtime-${Date.now()}`,
        title: 'New Install Request',
        message: `Installation request for ${data.vehicleId}`,
        type: 'info',
        timestamp: new Date(),
        read: false
      };
      setNotifications(prev => [newNotification, ...prev]);
    };

    const handleDeviceActivated = (data: any) => {
      setRealtimeUpdates(prev => prev + 1);
      // Update stats
      setStats(prev => prev ? {
        ...prev,
        activeDevices: prev.activeDevices + 1,
        pendingInstalls: Math.max(0, prev.pendingInstalls - 1)
      } : null);
    };

    const handleTrustScoreChanged = (data: any) => {
      setRealtimeUpdates(prev => prev + 1);
      // Update trust score
      setStats(prev => prev ? {
        ...prev,
        trustScore: data.newScore
      } : null);
    };

    socket.on('install_request_created', handleInstallRequest);
    socket.on('device_activated', handleDeviceActivated);
    socket.on('trustscore_changed', handleTrustScoreChanged);

    return () => {
      socket.off('install_request_created', handleInstallRequest);
      socket.off('device_activated', handleDeviceActivated);
      socket.off('trustscore_changed', handleTrustScoreChanged);
    };
  }, [socket]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to load dashboard</h2>
          <p className="text-gray-600">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Vehicles',
      value: stats.totalVehicles.toString(),
      change: '+1 this month',
      changeType: 'positive' as const,
      icon: Car,
      description: 'Registered vehicles'
    },
    {
      title: 'Active Devices',
      value: stats.activeDevices.toString(),
      change: '+2 this week',
      changeType: 'positive' as const,
      icon: Smartphone,
      description: 'Connected devices'
    },
    {
      title: 'Trust Score',
      value: `${stats.trustScore}%`,
      change: '+5 points',
      changeType: 'positive' as const,
      icon: Shield,
      description: 'Average trust score'
    },
    {
      title: 'Wallet Balance',
      value: `$${stats.walletBalance.toLocaleString()}`,
      change: '+$150 this month',
      changeType: 'positive' as const,
      icon: DollarSign,
      description: 'Available balance'
    }
  ];

  const quickActions = [
    {
      title: 'Register Vehicle',
      description: 'Add a new vehicle to your account',
      icon: Car,
      action: () => navigate('/vehicles'),
      color: 'bg-blue-500'
    },
    {
      title: 'Request Device Install',
      description: 'Request device installation for a vehicle',
      icon: Wrench,
      action: () => navigate('/devices'),
      color: 'bg-green-500'
    },
    {
      title: 'View Marketplace',
      description: 'Browse vehicles for sale',
      icon: FileText,
      action: () => navigate('/marketplace'),
      color: 'bg-purple-500'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-gray-600 mt-1">
            Here's what's happening with your vehicles and devices
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {realtimeUpdates > 0 && (
            <div className="flex items-center space-x-2 text-sm text-green-600">
              <Activity className="w-4 h-4" />
              <span>{realtimeUpdates} real-time updates</span>
            </div>
          )}
          <QuickActionsDropdown actions={quickActions} />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            change={stat.change}
            changeType={stat.changeType}
            icon={stat.icon}
            description={stat.description}
            delay={index * 0.1}
          />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Notifications */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Notifications</h2>
              <button 
                onClick={() => navigate('/notifications')}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                View all
              </button>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {notifications.slice(0, 5).map((notification) => (
              <div key={notification.id} className="flex items-start space-x-3">
                <div className={`p-2 rounded-full ${
                  notification.type === 'success' ? 'bg-green-100 text-green-600' :
                  notification.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                  notification.type === 'error' ? 'bg-red-100 text-red-600' :
                  'bg-blue-100 text-blue-600'
                }`}>
                  <Bell className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${
                    !notification.read ? 'text-gray-900' : 'text-gray-600'
                  }`}>
                    {notification.title}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {notification.timestamp.toLocaleTimeString()}
                  </p>
                </div>
                {!notification.read && (
                  <div className="w-2 h-2 bg-primary-500 rounded-full" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          </div>
          <div className="p-6 space-y-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.title}
                  onClick={action.action}
                  className="w-full flex items-center p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-sm transition-all text-left"
                >
                  <div className={`p-3 rounded-lg ${action.color} mr-4`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900">{action.title}</h3>
                    <p className="text-sm text-gray-500">{action.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">System Status</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Blockchain</p>
                <p className="text-sm text-gray-500">Operational</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Devices</p>
                <p className="text-sm text-gray-500">All connected</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Sync Status</p>
                <p className="text-sm text-gray-500">Last sync: 2 min ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;



