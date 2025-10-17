import React from 'react';
import { 
  Users, 
  Shield, 
  AlertTriangle, 
  TrendingUp, 
  Settings, 
  Database,
  Activity,
  FileText,
  Eye,
  UserX,
  CheckCircle,
  Crown
} from 'lucide-react';
import MetricCard from './MetricCard';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

interface AdminDashboardProps {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

type ChangeType = 'positive' | 'negative' | 'neutral';

interface AdminStat {
  title: string;
  value: string;
  change: string;
  changeType: ChangeType;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
  const adminStats: AdminStat[] = [
    {
      title: 'Total Users',
      value: '2,547',
      change: '+12.5%',
      changeType: 'positive',
      icon: Users,
      description: 'All registered users'
    },
    {
      title: 'Active Sessions',
      value: '423',
      change: '+5.2%',
      changeType: 'positive',
      icon: Activity,
      description: 'Currently online users'
    },
    {
      title: 'Security Alerts',
      value: '7',
      change: '-23%',
      changeType: 'positive',
      icon: AlertTriangle,
      description: 'Pending security issues'
    },
    {
      title: 'System Health',
      value: '99.9%',
      change: 'Stable',
      changeType: 'neutral',
      icon: Shield,
      description: 'Overall system status'
    }
  ];

  const recentActivities = [
    {
      id: 1,
      type: 'user_registration',
      description: 'New user registered: john.doe@example.com',
      timestamp: '2 minutes ago',
      severity: 'info'
    },
    {
      id: 2,
      type: 'fraud_alert',
      description: 'Fraud alert detected for vehicle listing #VH-2847',
      timestamp: '15 minutes ago',
      severity: 'warning'
    },
    {
      id: 3,
      type: 'system_update',
      description: 'System maintenance completed successfully',
      timestamp: '1 hour ago',
      severity: 'success'
    },
    {
      id: 4,
      type: 'user_blocked',
      description: 'User account suspended: suspicious.user@email.com',
      timestamp: '2 hours ago',
      severity: 'error'
    }
  ];

  const adminActions = [
    {
      title: 'User Management',
      description: 'Manage all users, roles, and permissions',
      icon: Users,
      action: 'Manage Users',
      color: 'bg-blue-500'
    },
    {
      title: 'Security Center',
      description: 'Monitor security threats and fraud alerts',
      icon: Shield,
      action: 'View Security',
      color: 'bg-red-500'
    },
    {
      title: 'System Analytics',
      description: 'View detailed system performance metrics',
      icon: TrendingUp,
      action: 'View Analytics',
      color: 'bg-green-500'
    },
    {
      title: 'Database Management',
      description: 'Monitor database health and backups',
      icon: Database,
      action: 'Manage Database',
      color: 'bg-purple-500'
    },
    {
      title: 'Audit Logs',
      description: 'Review system and user activity logs',
      icon: FileText,
      action: 'View Logs',
      color: 'bg-orange-500'
    },
    {
      title: 'System Settings',
      description: 'Configure global system settings',
      icon: Settings,
      action: 'Configure',
      color: 'bg-gray-500'
    }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_registration': return <Users className="w-4 h-4" />;
      case 'fraud_alert': return <AlertTriangle className="w-4 h-4" />;
      case 'system_update': return <CheckCircle className="w-4 h-4" />;
      case 'user_blocked': return <UserX className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getActivityColor = (severity: string) => {
    switch (severity) {
      case 'info': return 'text-blue-600 bg-blue-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'success': return 'text-green-600 bg-green-50';
      case 'error': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="rounded-2xl p-8 bg-gradient-to-br from-primary-600 to-indigo-600 text-white shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center mb-2">
              <Crown className="w-8 h-8 mr-3 text-yellow-300" />
              <span className="px-3 py-1 bg-black/20 rounded-full text-sm font-medium tracking-wide">
                ADMIN ACCESS
              </span>
            </div>
            <h1 className="text-3xl font-bold mb-1">Welcome back, {user.firstName}!</h1>
            <p className="text-white/80">System Administrator Dashboard</p>
          </div>
          <div className="text-right">
            <p className="text-white/70 text-sm">Logged in as</p>
            <p className="font-semibold">{user.email}</p>
            <p className="text-white/70 text-sm">Role: {user.role.toUpperCase()}</p>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {adminStats.map((stat, index) => (
          <MetricCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            change={stat.change}
            changeType={stat.changeType}
            icon={stat.icon}
            description={stat.description}
            delay={index * 0.05}
          />
        ))}
      </div>

      {/* Admin Actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Administrative Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md hover:-translate-y-0.5 transition-all text-left">
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-lg ${action.color}`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 mb-1">{action.title}</h3>
                    <p className="text-sm text-gray-600 mb-4">{action.description}</p>
                    <span className="inline-flex items-center text-sm text-primary-600">{action.action}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent Activity + Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent System Activity</h2>
          </div>
          <div className="p-6 space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className={`p-2 rounded-full ${getActivityColor(activity.severity)}`}>
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                  <p className="text-xs text-gray-500">{activity.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="p-6 border-t border-gray-200">
            <button className="btn-secondary w-full"><Eye className="w-4 h-4 mr-2" />View All Activities</button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">User Growth</h2>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[{ m: 'Jan', v: 200 }, { m: 'Feb', v: 260 }, { m: 'Mar', v: 320 }, { m: 'Apr', v: 410 }, { m: 'May', v: 480 }]}> 
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">  
                    

                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                  </linearGradient>
                </defs>


                <XAxis dataKey="m" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip cursor={{ stroke: '#E5E7EB' }} />
                <Area type="monotone" dataKey="v" stroke="#6366F1" fillOpacity={1} fill="url(#colorUsers)" />
              </AreaChart>      
            </ResponsiveContainer>
            
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">System Status</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">API Status</span>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
              <span className="text-sm text-green-600">Operational</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Database</span>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
              <span className="text-sm text-green-600">Healthy</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Background Jobs</span>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
              <span className="text-sm text-green-600">Running</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Email Service</span>
            <div className="flex items-center">
              <AlertTriangle className="w-4 h-4 text-yellow-600 mr-2" />
              <span className="text-sm text-yellow-600">Limited</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Storage</span>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
              <span className="text-sm text-green-600">75% Available</span>
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-gray-200">
          <button className="btn-secondary w-full">
            <Settings className="w-4 h-4 mr-2" />
            System Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 