import React from 'react';
import { 
  Car, 
  Heart, 
  Search, 
  DollarSign, 
  Shield, 
  Star,
  MapPin,
  Clock,
  Eye,
  Bell,
  ShoppingCart,
  CheckCircle,
  TrendingUp
} from 'lucide-react';

interface BuyerDashboardProps {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

export const BuyerDashboard: React.FC<BuyerDashboardProps> = ({ user }) => {
  const buyerStats = [
    {
      title: 'Viewed Vehicles',
      value: '34',
      change: '+12 this week',
      changeType: 'positive',
      icon: Eye,
      description: 'Recently browsed'
    },
    {
      title: 'Saved Vehicles',
      value: '7',
      change: '+3 new',
      changeType: 'positive',
      icon: Heart,
      description: 'In your wishlist'
    },
    {
      title: 'Budget Range',
      value: '$25K-$50K',
      change: 'Updated today',
      changeType: 'neutral',
      icon: DollarSign,
      description: 'Current budget'
    },
    {
      title: 'Trust Score',
      value: '850',
      change: '+25 points',
      changeType: 'positive',
      icon: Shield,
      description: 'Verification level'
    }
  ];

  const recentlyViewed = [
    {
      id: 1,
      make: 'Toyota',
      model: 'Camry',
      year: 2022,
      price: '$28,500',
      mileage: '15,000 mi',
      location: 'San Francisco, CA',
      image: '/api/placeholder/300/200',
      verified: true,
      timestamp: '2 hours ago'
    },
    {
      id: 2,
      make: 'Honda',
      model: 'Accord',
      year: 2021,
      price: '$26,800',
      mileage: '22,000 mi',
      location: 'Oakland, CA',
      image: '/api/placeholder/300/200',
      verified: true,
      timestamp: '5 hours ago'
    },
    {
      id: 3,
      make: 'Nissan',
      model: 'Altima',
      year: 2020,
      price: '$23,200',
      mileage: '28,000 mi',
      location: 'San Jose, CA',
      image: '/api/placeholder/300/200',
      verified: false,
      timestamp: '1 day ago'
    }
  ];

  const savedVehicles = [
    {
      id: 1,
      make: 'Tesla',
      model: 'Model 3',
      year: 2023,
      price: '$42,990',
      mileage: '5,000 mi',
      location: 'Palo Alto, CA',
      verified: true,
      priceChange: '-$2,000'
    },
    {
      id: 2,
      make: 'BMW',
      model: '3 Series',
      year: 2022,
      price: '$38,500',
      mileage: '12,000 mi',
      location: 'San Mateo, CA',
      verified: true,
      priceChange: '+$1,500'
    }
  ];

  const quickActions = [
    {
      title: 'Search Vehicles',
      description: 'Find your perfect car with advanced filters',
      icon: Search,
      action: 'Start Search',
      color: 'bg-blue-500'
    },
    {
      title: 'Financing Options',
      description: 'Get pre-approved for auto financing',
      icon: DollarSign,
      action: 'Get Pre-approved',
      color: 'bg-green-500'
    },
    {
      title: 'Vehicle History',
      description: 'Check vehicle history reports',
      icon: Shield,
      action: 'Check History',
      color: 'bg-purple-500'
    },
    {
      title: 'Price Alerts',
      description: 'Set up alerts for price drops',
      icon: Bell,
      action: 'Set Alerts',
      color: 'bg-orange-500'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header with Role Indication */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-lg p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center mb-2">
              <ShoppingCart className="w-8 h-8 mr-3" />
              <span className="px-3 py-1 bg-green-800/30 rounded-full text-sm font-medium">
                BUYER ACCESS
              </span>
            </div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {user.firstName}!
            </h1>
            <p className="text-green-100 text-lg">Vehicle Buyer Dashboard</p>
            <p className="text-green-50 text-sm mt-1">
              Find your perfect vehicle with verified listings and fraud protection
            </p>
          </div>
          <div className="text-right">
            <p className="text-green-200 text-sm">Logged in as</p>
            <p className="font-semibold">{user.email}</p>
            <p className="text-green-200 text-sm">Role: {user.role.toUpperCase()}</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {buyerStats.map((stat, index) => {
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
                  <button className="btn-primary text-sm w-full">
                    {action.action}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recently Viewed & Saved Vehicles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recently Viewed */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recently Viewed</h2>
              <Clock className="w-5 h-5 text-gray-500" />
            </div>
          </div>
          <div className="p-6 space-y-4">
            {recentlyViewed.map((vehicle) => (
              <div key={vehicle.id} className="flex items-center space-x-4 p-4 border border-gray-100 rounded-lg hover:bg-gray-50">
                <div className="w-20 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                  <Car className="w-8 h-8 text-gray-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-medium text-gray-900">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </h3>
                    {vehicle.verified && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{vehicle.mileage} • {vehicle.location}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-semibold text-green-600">{vehicle.price}</span>
                    <span className="text-xs text-gray-500">{vehicle.timestamp}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="p-6 border-t border-gray-200">
            <button className="btn-secondary w-full">
              <Eye className="w-4 h-4 mr-2" />
              View All History
            </button>
          </div>
        </div>

        {/* Saved Vehicles */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Saved Vehicles</h2>
              <Heart className="w-5 h-5 text-red-500" />
            </div>
          </div>
          <div className="p-6 space-y-4">
            {savedVehicles.map((vehicle) => (
              <div key={vehicle.id} className="flex items-center space-x-4 p-4 border border-gray-100 rounded-lg hover:bg-gray-50">
                <div className="w-20 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                  <Car className="w-8 h-8 text-gray-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-medium text-gray-900">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </h3>
                    {vehicle.verified && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{vehicle.mileage} • {vehicle.location}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-semibold text-green-600">{vehicle.price}</span>
                    <span className={`text-xs font-medium ${
                      vehicle.priceChange.startsWith('+') ? 'text-red-500' : 'text-green-500'
                    }`}>
                      {vehicle.priceChange}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="p-6 border-t border-gray-200">
            <button className="btn-secondary w-full">
              <Heart className="w-4 h-4 mr-2" />
              Manage Saved
            </button>
          </div>
        </div>
      </div>

      {/* Market Insights */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Market Insights</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">-3.2%</p>
              <p className="text-sm text-gray-600">Average price drop this month</p>
            </div>
            <div className="text-center">
              <Star className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">4.8</p>
              <p className="text-sm text-gray-600">Average seller rating</p>
            </div>
            <div className="text-center">
              <MapPin className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">50+</p>
              <p className="text-sm text-gray-600">Vehicles near you</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyerDashboard; 