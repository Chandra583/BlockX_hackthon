import React, { useState } from 'react';
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
  const ownerStats = [
    {
      title: 'My Vehicles',
      value: '12',
      change: '+2 this month',
      changeType: 'positive',
      icon: Car,
      description: 'Total owned vehicles'
    },
    {
      title: 'Total Earnings',
      value: '$48,250',
      change: '+18.7%',
      changeType: 'positive',
      icon: DollarSign,
      description: 'From vehicle sales'
    },
    {
      title: 'Active Listings',
      value: '8',
      change: '+3 new',
      changeType: 'positive',
      icon: Eye,
      description: 'Currently for sale'
    },
    {
      title: 'Verified Status',
      value: '100%',
      change: 'All verified',
      changeType: 'neutral',
      icon: CheckCircle,
      description: 'Vehicle verification'
    }
  ];

  const myVehicles = [
    {
      id: 1,
      make: 'Toyota',
      model: 'Camry',
      year: 2022,
      vin: 'JTD3***7890',
      status: 'active',
      price: '$28,500',
      views: 247,
      inquiries: 12,
      lastUpdated: '2 days ago'
    },
    {
      id: 2,
      make: 'Honda',
      model: 'Civic',
      year: 2021,
      vin: 'JHM2***4567',
      status: 'sold',
      price: '$24,800',
      views: 189,
      inquiries: 8,
      lastUpdated: '1 week ago'
    },
    {
      id: 3,
      make: 'Tesla',
      model: 'Model 3',
      year: 2023,
      vin: '5YJ3***1234',
      status: 'draft',
      price: '$42,990',
      views: 0,
      inquiries: 0,
      lastUpdated: 'Today'
    }
  ];

  const recentActivity = [
    {
      id: 1,
      type: 'inquiry',
      message: 'New inquiry for 2022 Toyota Camry',
      timestamp: '30 minutes ago',
      vehicle: 'Toyota Camry'
    },
    {
      id: 2,
      type: 'view',
      message: 'Your Honda Civic listing was viewed 15 times',
      timestamp: '2 hours ago',
      vehicle: 'Honda Civic'
    },
    {
      id: 3,
      type: 'verification',
      message: 'Vehicle verification completed for Tesla Model 3',
      timestamp: '5 hours ago',
      vehicle: 'Tesla Model 3'
    },
    {
      id: 4,
      type: 'price_change',
      message: 'Price updated for Toyota Camry',
      timestamp: '1 day ago',
      vehicle: 'Toyota Camry'
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'sold': return 'bg-gray-100 text-gray-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'inquiry': return <FileText className="w-4 h-4" />;
      case 'view': return <Eye className="w-4 h-4" />;
      case 'verification': return <Shield className="w-4 h-4" />;
      case 'price_change': return <DollarSign className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'inquiry': return 'text-blue-600 bg-blue-50';
      case 'view': return 'text-green-600 bg-green-50';
      case 'verification': return 'text-purple-600 bg-purple-50';
      case 'price_change': return 'text-orange-600 bg-orange-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header with Role Indication */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center mb-2">
              <Key className="w-8 h-8 mr-3" />
              <span className="px-3 py-1 bg-purple-800/30 rounded-full text-sm font-medium">
                OWNER ACCESS
              </span>
            </div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {user.firstName}!
            </h1>
            <p className="text-purple-100 text-lg">Vehicle Owner Dashboard</p>
            <p className="text-purple-50 text-sm mt-1">
              Manage your vehicle listings and track your sales performance
            </p>
          </div>
          <div className="text-right">
            <p className="text-purple-200 text-sm">Logged in as</p>
            <p className="font-semibold">{user.email}</p>
            <p className="text-purple-200 text-sm">Role: {user.role.toUpperCase()}</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {ownerStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.description}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <Icon className="w-6 h-6 text-gray-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className={`text-sm font-medium ${
                  stat.changeType === 'positive' ? 'text-green-600' : 
                  stat.changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {stat.change}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Blockchain Wallet */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Blockchain Wallet</h2>
        <WalletDisplay 
          showCreateButton={true}
          onWalletCreated={(wallet) => {
            console.log('Wallet created:', wallet);
          }}
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <div key={index} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
                <div className="text-center">
                  <div className={`inline-flex p-3 rounded-lg ${action.color} mb-4`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{action.title}</h3>
                  <p className="text-sm text-gray-600 mb-4">{action.description}</p>
                  <button 
                    className="btn-primary text-sm w-full"
                    onClick={action.onClick}
                  >
                    {action.action}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* My Vehicles & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* My Vehicles */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">My Vehicles</h2>
              <Car className="w-5 h-5 text-gray-500" />
            </div>
          </div>
          <div className="p-6 space-y-4">
            {myVehicles.map((vehicle) => (
              <div key={vehicle.id} className="flex items-center space-x-4 p-4 border border-gray-100 rounded-lg hover:bg-gray-50">
                <div className="w-20 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                  <Car className="w-8 h-8 text-gray-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-medium text-gray-900">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(vehicle.status)}`}>
                      {vehicle.status.charAt(0).toUpperCase() + vehicle.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">VIN: {vehicle.vin}</p>
                  <div className="grid grid-cols-3 gap-4 text-xs text-gray-500">
                    <div>
                      <span className="font-medium text-green-600">{vehicle.price}</span>
                    </div>
                    <div>
                      {vehicle.views} views
                    </div>
                    <div>
                      {vehicle.inquiries} inquiries
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <button className="p-2 text-gray-400 hover:text-gray-600">
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="p-6 border-t border-gray-200">
            <button className="btn-secondary w-full">
              <Car className="w-4 h-4 mr-2" />
              Manage All Vehicles
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
              <Activity className="w-5 h-5 text-gray-500" />
            </div>
          </div>
          <div className="p-6 space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className={`p-2 rounded-full ${getActivityColor(activity.type)}`}>
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-500">{activity.vehicle}</span>
                    <span className="text-xs text-gray-500">{activity.timestamp}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="p-6 border-t border-gray-200">
            <button className="btn-secondary w-full">
              <Clock className="w-4 h-4 mr-2" />
              View All Activity
            </button>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Performance Metrics</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">87%</p>
              <p className="text-sm text-gray-600">Listing success rate</p>
            </div>
            <div className="text-center">
              <Clock className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">24</p>
              <p className="text-sm text-gray-600">Avg. days to sell</p>
            </div>
            <div className="text-center">
              <Eye className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">1,247</p>
              <p className="text-sm text-gray-600">Total views this month</p>
            </div>
            <div className="text-center">
              <Shield className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">5.0</p>
              <p className="text-sm text-gray-600">Average rating</p>
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle Registration Modal */}
      {showVehicleRegistration && (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
          <VehicleRegistrationForm
            onSuccess={(result) => {
              console.log('Vehicle registered successfully:', result);
              // Keep modal open to show success state
            }}
            onCancel={() => setShowVehicleRegistration(false)}
          />
        </div>
      </div>
      )}

      {/* Mileage Update Modal */}
      {showMileageUpdate && (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
          <MileageUpdateForm
            onSuccess={(result) => {
              console.log('Mileage updated successfully:', result);
              // Keep modal open to show success state
            }}
            onCancel={() => setShowMileageUpdate(false)}
          />
        </div>
      </div>
      )}

      {/* Vehicle List Modal */}
      {showVehicleList && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">My Vehicles</h2>
              <button
                onClick={() => setShowVehicleList(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <VehicleList
              onVehicleSelect={(vehicle) => {
                console.log('Vehicle selected:', vehicle);
                // Handle vehicle selection
              }}
              onEditVehicle={(vehicle) => {
                console.log('Edit vehicle:', vehicle);
                // Handle vehicle editing
              }}
              onDeleteVehicle={(vehicle) => {
                console.log('Delete vehicle:', vehicle);
                // Handle vehicle deletion
              }}
            />
          </div>
        </div>
      )}

      {/* Transaction History Modal */}
      {showTransactionHistory && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Blockchain Transaction History</h2>
              <button
                onClick={() => setShowTransactionHistory(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <TransactionHistory />
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerDashboard; 