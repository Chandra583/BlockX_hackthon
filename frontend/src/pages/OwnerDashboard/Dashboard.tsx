import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAppSelector } from '../../hooks/redux';
import { DashboardService } from '../../services/dashboard';
import { NotificationService } from '../../services/notifications';
import { VehicleService } from '../../services/vehicle';
import { TrustService } from '../../services/trust';
import useSocket from '../../hooks/useSocket';

// Components
import WelcomeBanner from './components/WelcomeBanner';
import StatsCards from './components/StatsCards';
import RecentNotifications from './components/RecentNotifications';
import RecentActivity from './components/RecentActivity';
import TrustScoreCard from './components/TrustScoreCard';
import NotificationBell from './components/NotificationBell';
import { SellerRequestsList } from '../../components/marketplace/SellerRequestsList';
import { SellerTransferManager } from '../../components/marketplace/SellerTransferManager';

interface DashboardData {
  user: any;
  stats: {
    totalVehicles: number;
    activeListings: number;
    totalEarnings: number;
    verifiedStatus: number;
  };
  notifications: any[];
  activity: any[];
  trustScore: number;
  unreadCount: number;
}

const Dashboard: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPurchaseRequests, setShowPurchaseRequests] = useState(false);
  const [showTransferManager, setShowTransferManager] = useState(false);
  const { socket } = useSocket();

  // Fetch dashboard data
  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch all dashboard data in parallel
        const [
          userData,
          notifications,
          vehicles,
          trustData
        ] = await Promise.all([
          DashboardService.getUserDashboard(),
          NotificationService.getNotifications({ limit: 5, page: 1 }),
          VehicleService.getUserVehicles({ limit: 100 }),
          TrustService.getUserTrustScoreById(user.id)
        ]);

        // Calculate stats
        const totalVehicles = vehicles?.data?.vehicles?.length || 0;
        const activeListings = vehicles?.data?.vehicles?.filter((v: any) => v.isListed)?.length || 0;
        const totalEarnings = vehicles?.data?.vehicles?.reduce((sum: number, v: any) => sum + (v.earnings || 0), 0) || 0;
        const verifiedStatus = vehicles?.data?.vehicles?.filter((v: any) => v.verified)?.length || 0;

        setDashboardData({
          user: userData?.user || user,
          stats: {
            totalVehicles,
            activeListings,
            totalEarnings,
            verifiedStatus: totalVehicles > 0 ? Math.round((verifiedStatus / totalVehicles) * 100) : 0
          },
          notifications: notifications?.data?.notifications || [],
          activity: notifications?.data?.notifications?.slice(0, 3) || [],
          trustScore: trustData?.trustScore || trustData?.data?.trustScore || 100,
          unreadCount: notifications?.data?.unreadCount || 0
        });

      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  // Socket listeners for real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleNotification = (data: any) => {
      setDashboardData(prev => prev ? {
        ...prev,
        notifications: [data, ...prev.notifications.slice(0, 4)],
        unreadCount: prev.unreadCount + 1
      } : null);
    };

    const handleTrustUpdate = (data: any) => {
      setDashboardData(prev => prev ? {
        ...prev,
        trustScore: data.trustScore
      } : null);
    };

    socket.on('notification', handleNotification);
    socket.on('trustUpdate', handleTrustUpdate);

    return () => {
      socket.off('notification', handleNotification);
      socket.off('trustUpdate', handleTrustUpdate);
    };
  }, [socket]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-slate-800/50 rounded-2xl p-6 animate-pulse">
                <div className="h-4 bg-slate-700 rounded mb-4"></div>
                <div className="h-8 bg-slate-700 rounded mb-2"></div>
                <div className="h-3 bg-slate-700 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="text-red-400 text-xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </motion.div>
      </div>
    );
  }

  if (!dashboardData) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header with Notification Bell */}
      <div className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <WelcomeBanner user={dashboardData.user} />
            <NotificationBell 
              unreadCount={dashboardData.unreadCount}
              notifications={dashboardData.notifications.slice(0, 3)}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          {/* Stats Cards */}
          <StatsCards stats={dashboardData.stats} />

          {/* Purchase Management */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-2">Purchase Management</h2>
                <p className="text-slate-300">Manage vehicle sales and ownership transfers</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setShowPurchaseRequests(true)}
                className="flex items-center justify-center space-x-3 p-4 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-xl text-blue-400 hover:text-blue-300 transition-all duration-200"
              >
                <div className="p-2 bg-blue-600/20 rounded-lg">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-medium">Purchase Requests</div>
                  <div className="text-sm text-slate-400">View and respond to buyer requests</div>
                </div>
              </button>

              <button
                onClick={() => setShowTransferManager(true)}
                className="flex items-center justify-center space-x-3 p-4 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-xl text-purple-400 hover:text-purple-300 transition-all duration-200"
              >
                <div className="p-2 bg-purple-600/20 rounded-lg">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-medium">Transfer Manager</div>
                  <div className="text-sm text-slate-400">Complete ownership transfers</div>
                </div>
              </button>
            </div>
          </motion.div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Notifications */}
            <div className="lg:col-span-1">
              <RecentNotifications 
                notifications={dashboardData.notifications}
                unreadCount={dashboardData.unreadCount}
              />
            </div>

            {/* Right Column - Activity & Trust Score */}
            <div className="lg:col-span-2 space-y-8">
              <RecentActivity activity={dashboardData.activity} />
              <TrustScoreCard trustScore={dashboardData.trustScore} />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Purchase Management Modals */}
      <SellerRequestsList
        isOpen={showPurchaseRequests}
        onClose={() => setShowPurchaseRequests(false)}
        onRequestUpdate={() => {
          // Refresh dashboard data if needed
        }}
      />

      <SellerTransferManager
        isOpen={showTransferManager}
        onClose={() => setShowTransferManager(false)}
        onTransferComplete={() => {
          // Refresh dashboard data if needed
        }}
      />
    </div>
  );
};

export default Dashboard;
