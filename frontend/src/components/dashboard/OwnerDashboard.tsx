import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Car, 
  DollarSign, 
  Shield, 
  TrendingUp, 
  Plus,
  Eye,
  FileText,
  Activity,
  CheckCircle,
  Clock,
  Camera,
  Edit,
  Key,
  Gauge,
  Hash,
  X
} from 'lucide-react';
import { VehicleRegistrationForm, VehicleList } from '../vehicle';
import { WalletDisplay, TransactionHistory } from '../blockchain';
import { MileageUpdateForm } from '../mileage/MileageUpdateForm';
import { ArweaveUpload } from '../arweave';
import { EnhancedTransactionHistory } from '../blockchain/EnhancedTransactionHistory';
import { HeaderHero } from './HeaderHero';
import { MetricsGrid } from './MetricsGrid';
import { WalletCard } from '../blockchain/WalletCard';
import { ThemeToggle } from '../common/ThemeToggle';
import { MetricCardSkeleton, WalletCardSkeleton } from '../common/LoadingSkeleton';
import toast from 'react-hot-toast';

interface OwnerDashboardProps {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({ user }) => {
  const [showVehicleRegistration, setShowVehicleRegistration] = useState(false);
  const [showMileageUpdate, setShowMileageUpdate] = useState(false);
  const [showVehicleList, setShowVehicleList] = useState(false);
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);
  const [showArweaveUpload, setShowArweaveUpload] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [walletAddress] = useState('GbzsmT6yK1WCY5YLMUk27nGZsen2zdTnwG4KkLhvuZjN'); // Mock wallet address

  // Simulate loading
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const ownerStats = [
    {
      title: 'My Vehicles',
      value: 12,
      change: '+2 this month',
      changeType: 'positive' as const,
      icon: Car,
      description: 'Total owned vehicles'
    },
    {
      title: 'Total Earnings',
      value: 48250,
      change: '+18.7%',
      changeType: 'positive' as const,
      icon: DollarSign,
      description: 'From vehicle sales'
    },
    {
      title: 'Active Listings',
      value: 8,
      change: '+3 new',
      changeType: 'positive' as const,
      icon: Eye,
      description: 'Currently for sale'
    },
    {
      title: 'Verified Status',
      value: '100%',
      change: 'All verified',
      changeType: 'neutral' as const,
      icon: CheckCircle,
      description: 'Vehicle verification'
    }
  ];

  const quickActions = [
    {
      title: 'Register Vehicle on Blockchain',
      description: 'Secure your vehicle with blockchain technology',
      icon: Plus,
      action: 'Register Vehicle',
      color: 'bg-green-500',
      onClick: () => setShowVehicleRegistration(true)
    },
    {
      title: 'Update Mileage',
      description: 'Record new mileage on blockchain',
      icon: Gauge,
      action: 'Update Mileage',
      color: 'bg-purple-500',
      onClick: () => setShowMileageUpdate(true)
    },
    {
      title: 'View My Vehicles',
      description: 'See all your registered vehicles',
      icon: Car,
      action: 'View Vehicles',
      color: 'bg-blue-500',
      onClick: () => setShowVehicleList(true)
    },
    {
      title: 'Blockchain History',
      description: 'View all blockchain transactions',
      icon: Hash,
      action: 'View History',
      color: 'bg-indigo-500',
      onClick: () => setShowTransactionHistory(true)
    },
    {
      title: 'Upload to Arweave',
      description: 'Store documents permanently on Arweave',
      icon: FileText,
      action: 'Upload Documents',
      color: 'bg-green-500',
      onClick: () => setShowArweaveUpload(true)
    },
    {
      title: 'Update Prices',
      description: 'Adjust pricing for active listings',
      icon: DollarSign,
      action: 'Update Prices',
      color: 'bg-blue-500'
    },
    {
      title: 'Upload Photos',
      description: 'Add or update vehicle images',
      icon: Camera,
      action: 'Upload Photos',
      color: 'bg-purple-500'
    },
    {
      title: 'View Analytics',
      description: 'See performance metrics',
      icon: TrendingUp,
      action: 'View Analytics',
      color: 'bg-orange-500'
    }
  ];

  const recentActivity = [
    {
      id: 1,
      type: 'vehicle_registration',
      description: 'New vehicle registered on blockchain',
      vehicle: 'Toyota Camry',
      time: '2 hours ago'
    },
    {
      id: 2,
      type: 'mileage_update',
      description: 'Mileage updated for Honda Civic',
      vehicle: 'Honda Civic',
      time: '1 day ago'
    },
    {
      id: 3,
      type: 'price_change',
      description: 'Price updated for Ford Mustang',
      vehicle: 'Ford Mustang',
      time: '3 days ago'
    }
  ];

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'vehicle_registration': return 'bg-green-500';
      case 'mileage_update': return 'bg-blue-500';
      case 'price_change': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header with Theme Toggle */}
      <div className="flex justify-between items-center">
        <HeaderHero 
          user={user} 
          onAddVehicle={() => setShowVehicleRegistration(true)}
        />
        <ThemeToggle />
      </div>

      {/* Stats Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, index) => (
            <MetricCardSkeleton key={index} />
          ))}
        </div>
      ) : (
        <MetricsGrid metrics={ownerStats} />
      )}

      {/* Wallet Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <WalletCardSkeleton />
        ) : (
          <WalletCard walletAddress={walletAddress} />
        )}
        
        {/* Quick Actions Grid */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {quickActions.slice(0, 4).map((action, index) => {
                const Icon = action.icon;
                return (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={action.onClick}
                    className={`p-4 rounded-lg text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-solana-purple focus:ring-offset-2 ${action.color} text-white hover:opacity-90`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="w-6 h-6" />
                      <div>
                        <h4 className="font-medium">{action.title}</h4>
                        <p className="text-sm opacity-90">{action.description}</p>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recent Activity
        </h3>
        <div className="space-y-4">
          {recentActivity.map((activity, index) => (
            <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className={`w-2 h-2 rounded-full ${getActivityColor(activity.type)}`} />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.description}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{activity.vehicle}</p>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Modals */}
      {showVehicleRegistration && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Register New Vehicle</h2>
              <button
                onClick={() => setShowVehicleRegistration(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <VehicleRegistrationForm
              onSuccess={(result) => {
                // Let the VehicleRegistrationForm handle its own success modal
                // Don't close immediately, let user see the success modal first
                console.log('Vehicle registration successful:', result);
              }}
              onCancel={() => {
                setShowVehicleRegistration(false);
                toast.success('Vehicle registered successfully!');
              }}
            />
          </div>
        </div>
      )}

      {showMileageUpdate && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Update Mileage</h2>
              <button
                onClick={() => setShowMileageUpdate(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <MileageUpdateForm
              onSuccess={() => {
                setShowMileageUpdate(false);
                toast.success('Mileage updated successfully!');
              }}
              onCancel={() => setShowMileageUpdate(false)}
            />
          </div>
        </div>
      )}

      {showVehicleList && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">My Vehicles</h2>
              <button
                onClick={() => setShowVehicleList(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <VehicleList
              onVehicleSelect={(vehicle) => {
                setSelectedVehicleId(vehicle.id);
                setShowVehicleList(false);
              }}
              onEditVehicle={(vehicle) => {
                console.log('Edit vehicle:', vehicle);
              }}
              onDeleteVehicle={(vehicle) => {
                console.log('Delete vehicle:', vehicle);
              }}
              onViewBlockchainHistory={(vehicle) => {
                setSelectedVehicleId(vehicle.id);
                setShowTransactionHistory(true);
              }}
            />
          </div>
        </div>
      )}

      {showTransactionHistory && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
            <EnhancedTransactionHistory 
              vehicleId={selectedVehicleId}
              onClose={() => {
                setShowTransactionHistory(false);
                setSelectedVehicleId(undefined);
              }}
            />
          </div>
        </div>
      )}

      {showArweaveUpload && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <ArweaveUpload
              vehicleId={selectedVehicleId}
              onSuccess={(results) => {
                console.log('Files uploaded to Arweave successfully:', results);
                setShowArweaveUpload(false);
                toast.success('Files uploaded to Arweave successfully!');
              }}
              onCancel={() => setShowArweaveUpload(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerDashboard;