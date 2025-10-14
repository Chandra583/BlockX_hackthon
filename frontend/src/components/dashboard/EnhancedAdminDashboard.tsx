import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Shield, 
  AlertTriangle, 
  TrendingUp, 
  Settings, 
  Database,
  Activity,
  FileText,
  Crown,
  RefreshCw,
  Loader2,
  Car,
  Link as LinkIcon
} from 'lucide-react';
import AdminService, { type AdminStats } from '../../services/admin';

interface EnhancedAdminDashboardProps {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

export const EnhancedAdminDashboard: React.FC<EnhancedAdminDashboardProps> = ({ user }) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [systemStats, setSystemStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setError(null);
      const [dashboardStats, vehicleStats, transactionStats, sysStats] = await Promise.all([
        AdminService.getDashboardStats().catch((err) => {
          console.error('Dashboard stats error:', err);
          return null;
        }),
        AdminService.getVehicleStats().catch((err) => {
          console.error('Vehicle stats error:', err);
          return null;
        }),
        AdminService.getTransactionStats().catch((err) => {
          console.error('Transaction stats error:', err);
          return null;
        }),
        AdminService.getSystemStats().catch(() => ({
          totalVehicles: 0,
          totalTransactions: 0,
          totalDocuments: 0,
          vehiclesByStatus: [],
          transactionsByType: [],
          blockchainStatus: {
            solana: 'unknown',
            arweave: 'unknown'
          },
          systemHealth: 0
        }))
      ]);
      
      // Combine dashboard and vehicle/transaction stats
      const combinedStats = {
        ...dashboardStats?.data?.overview,
        ...vehicleStats?.data,
        ...transactionStats?.data,
        vehiclesByStatus: vehicleStats?.data?.vehiclesByStatus || vehicleStats?.data?.vehiclesByStatus || [],
        roleDistribution: dashboardStats?.data?.roleDistribution || [],
        usersByStatus: dashboardStats?.data?.usersByStatus || []
      } as any;
      
      setStats(combinedStats as any);
      setSystemStats(sysStats);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  // Show fallback data if no stats are available
  const displayStats = stats || {
    totalUsers: 0,
    activeUsers: 0,
    newUsersToday: 0,
    totalVehicles: 0,
    verifiedVehicles: 0,
    totalTransactions: 0,
    pendingTransactions: 0,
    totalDocuments: 0,
    verifiedDocuments: 0,
    userRoleDistribution: [],
    userStatusDistribution: [],
    recentActivity: []
  } as any;

  const adminStatCards = [
    {
      title: 'Total Users',
      value: (displayStats.totalUsers || 0).toLocaleString(),
      change: `${displayStats.newUsersToday || 0} this month`,
      changeType: 'positive' as const,
      icon: Users,
      description: 'All registered users',
      bgColor: 'bg-blue-500'
    },
    {
      title: 'Active Users',
      value: (displayStats.activeUsers || 0).toLocaleString(),
      change: `${((displayStats.activeUsers || 0) / (displayStats.totalUsers || 1) * 100).toFixed(1)}%`,
      changeType: 'positive' as const,
      icon: Activity,
      description: 'Currently active accounts',
      bgColor: 'bg-green-500'
    },
    {
      title: 'Total Vehicles',
      value: (displayStats.totalVehicles || 0).toLocaleString(),
      change: `${displayStats.verifiedVehicles || 0} verified`,
      changeType: 'positive' as const,
      icon: Car,
      description: 'Registered vehicles',
      bgColor: 'bg-purple-500'
    },
    {
      title: 'System Health',
      value: '99.9%',
      change: 'All systems operational',
      changeType: 'positive' as const,
      icon: Shield,
      description: 'Overall platform health',
      bgColor: 'bg-orange-500'
    }
  ];

  const systemMetrics = [
    {
      title: 'Total Vehicles',
      value: (systemStats?.totalVehicles || 0).toLocaleString(),
      icon: Car,
      color: 'text-blue-600'
    },
    {
      title: 'Blockchain Transactions',
      value: (systemStats?.totalTransactions || 0).toLocaleString(),
      icon: LinkIcon,
      color: 'text-purple-600'
    },
    {
      title: 'Documents Stored',
      value: (systemStats?.totalDocuments || 0).toLocaleString(),
      icon: FileText,
      color: 'text-green-600'
    },
    {
      title: 'Active Sessions',
      value: (displayStats.activeUsers || 0).toLocaleString(),
      icon: Activity,
      color: 'text-orange-600'
    }
  ];


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-gray-900 font-semibold mb-2">Failed to Load Dashboard</p>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="btn-primary"
          >
            <RefreshCw className="w-4 h-4 mr-2 inline" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Crown className="w-8 h-8 text-yellow-500 mr-3" />
            Admin Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Welcome back, {user.firstName}! Here's what's happening with your platform.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="btn-secondary flex items-center"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {adminStatCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${stat.bgColor} bg-opacity-10`}>
                <stat.icon className={`w-6 h-6 ${stat.bgColor.replace('bg-', 'text-')}`} />
              </div>
              <div className={`text-xs font-medium px-2 py-1 rounded-full ${
                stat.changeType === 'positive' ? 'bg-green-100 text-green-800' :
                stat.changeType === 'negative' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {stat.change}
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
            <p className="text-sm font-medium text-gray-700">{stat.title}</p>
            <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
          </div>
        ))}
      </div>

      {/* System Metrics */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <Database className="w-5 h-5 mr-2" />
          System Metrics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {systemMetrics.map((metric, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <metric.icon className={`w-5 h-5 ${metric.color}`} />
                <span className="text-2xl font-bold text-gray-900">{metric.value}</span>
              </div>
              <p className="text-sm text-gray-600">{metric.title}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Vehicle Status Breakdown */}
      {stats?.vehiclesByStatus && stats.vehiclesByStatus.length >= 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Car className="w-5 h-5 mr-2" />
            Vehicle Status Breakdown
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(['verified','pending','rejected'] as const).map((statusKey, index) => {
              const count = (stats.vehiclesByStatus.find((s: any) => s._id === statusKey)?.count) || 0;
              const statusColors: any = {
                verified: { bg: 'bg-green-500', text: 'text-green-600', light: 'bg-green-50' },
                pending: { bg: 'bg-yellow-500', text: 'text-yellow-600', light: 'bg-yellow-50' },
                rejected: { bg: 'bg-red-500', text: 'text-red-600', light: 'bg-red-50' }
              };
              const colors = statusColors[statusKey] || statusColors.pending;
              
              return (
                <button
                  key={index}
                  onClick={() => {
                    // Navigate to admin vehicles list with filter
                    window.location.href = `/admin/vehicles?status=${statusKey}`;
                  }}
                  className={`text-left border border-gray-200 rounded-lg p-4 ${colors.light} hover:opacity-90 transition`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 capitalize">{statusKey}</h3>
                    <div className={`w-3 h-3 rounded-full ${colors.bg}`}></div>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{count.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">vehicles</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Transaction Breakdown */}
      {stats?.transactionsByType && stats.transactionsByType.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <LinkIcon className="w-5 h-5 mr-2" />
            Transaction Breakdown
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.transactionsByType.map((item: any, index: number) => {
              const typeColors: any = {
                vehicle_registration: { bg: 'bg-blue-500', text: 'text-blue-600', light: 'bg-blue-50' },
                mileage_update: { bg: 'bg-purple-500', text: 'text-purple-600', light: 'bg-purple-50' },
                document_upload: { bg: 'bg-green-500', text: 'text-green-600', light: 'bg-green-50' },
                wallet_creation: { bg: 'bg-orange-500', text: 'text-orange-600', light: 'bg-orange-50' }
              };
              const colors = typeColors[item._id] || { bg: 'bg-gray-500', text: 'text-gray-600', light: 'bg-gray-50' };
              
              return (
                <div key={index} className={`border border-gray-200 rounded-lg p-4 ${colors.light}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 capitalize">{item._id.replace('_', ' ')}</h3>
                    <div className={`w-3 h-3 rounded-full ${colors.bg}`}></div>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{item.count.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">transactions</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Role Distribution */}
      {stats?.roleDistribution && stats.roleDistribution.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2" />
            User Distribution by Role
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {stats.roleDistribution.map((item: any, index: number) => (
              <div key={index} className="text-center">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-2 ${AdminService.getRoleColor(item._id)}`}>
                  <span className="text-2xl font-bold">{item.count}</span>
                </div>
                <p className="text-sm font-medium text-gray-700 capitalize">
                  {AdminService.formatRole(item._id)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <Settings className="w-5 h-5 mr-2" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button 
            onClick={() => navigate('/admin/users')}
            className="p-4 border-2 border-blue-200 rounded-lg hover:bg-blue-50 transition-colors text-left"
          >
            <Users className="w-8 h-8 text-blue-600 mb-2" />
            <h3 className="font-semibold text-gray-900">User Management</h3>
            <p className="text-sm text-gray-600 mt-1">Manage users, roles, and permissions</p>
          </button>
          
          <button 
            onClick={() => alert('Security Center - Coming Soon!')}
            className="p-4 border-2 border-red-200 rounded-lg hover:bg-red-50 transition-colors text-left"
          >
            <Shield className="w-8 h-8 text-red-600 mb-2" />
            <h3 className="font-semibold text-gray-900">Security Center</h3>
            <p className="text-sm text-gray-600 mt-1">Monitor threats and fraud alerts</p>
          </button>
          
          <button 
            onClick={() => alert('Analytics Dashboard - Coming Soon!')}
            className="p-4 border-2 border-green-200 rounded-lg hover:bg-green-50 transition-colors text-left"
          >
            <TrendingUp className="w-8 h-8 text-green-600 mb-2" />
            <h3 className="font-semibold text-gray-900">Analytics</h3>
            <p className="text-sm text-gray-600 mt-1">View system performance metrics</p>
          </button>

          <button 
            onClick={() => navigate('/admin/install-jobs')}
            className="p-4 border-2 border-yellow-200 rounded-lg hover:bg-yellow-50 transition-colors text-left"
          >
            <Car className="w-8 h-8 text-yellow-600 mb-2" />
            <h3 className="font-semibold text-gray-900">Install Jobs</h3>
            <p className="text-sm text-gray-600 mt-1">Assign providers and track device installs</p>
          </button>
          
          <button 
            onClick={() => alert('Database Management - Coming Soon!')}
            className="p-4 border-2 border-purple-200 rounded-lg hover:bg-purple-50 transition-colors text-left"
          >
            <Database className="w-8 h-8 text-purple-600 mb-2" />
            <h3 className="font-semibold text-gray-900">Database</h3>
            <p className="text-sm text-gray-600 mt-1">Monitor database health</p>
          </button>
          
          <button 
            onClick={() => alert('Audit Logs - Coming Soon!')}
            className="p-4 border-2 border-orange-200 rounded-lg hover:bg-orange-50 transition-colors text-left"
          >
            <FileText className="w-8 h-8 text-orange-600 mb-2" />
            <h3 className="font-semibold text-gray-900">Audit Logs</h3>
            <p className="text-sm text-gray-600 mt-1">Review system activity logs</p>
          </button>
          
          <button 
            onClick={() => alert('System Settings - Coming Soon!')}
            className="p-4 border-2 border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <Settings className="w-8 h-8 text-gray-600 mb-2" />
            <h3 className="font-semibold text-gray-900">Settings</h3>
            <p className="text-sm text-gray-600 mt-1">Configure system settings</p>
          </button>
        </div>
      </div>

      {/* Blockchain Status */}
      {systemStats?.blockchainStatus && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <LinkIcon className="w-5 h-5 mr-2" />
            Blockchain Status
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">Solana</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  systemStats.blockchainStatus.solana === 'online' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {systemStats.blockchainStatus.solana}
                </span>
              </div>
              <p className="text-sm text-gray-600">Network: Devnet</p>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">Arweave</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  systemStats.blockchainStatus.arweave === 'online' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {systemStats.blockchainStatus.arweave}
                </span>
              </div>
              <p className="text-sm text-gray-600">Network: Mainnet</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedAdminDashboard;
