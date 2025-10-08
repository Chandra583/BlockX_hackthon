import React from 'react';
import { 
  Plus, 
  Search, 
  FileText, 
  Users, 
  Settings, 
  TrendingUp,
  Shield,
  Car,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Bell,
  Eye
} from 'lucide-react';
import { DashboardStats } from './DashboardStats';
import { ROLE_LABELS } from '../../types/auth';

interface ActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  buttonText: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'warning';
}

const ActionCard: React.FC<ActionCardProps> = ({ 
  title, 
  description, 
  icon, 
  buttonText, 
  onClick, 
  variant = 'primary' 
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'secondary':
        return 'bg-gray-50 border-gray-200 hover:bg-gray-100';
      case 'success':
        return 'bg-green-50 border-green-200 hover:bg-green-100';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100';
      default:
        return 'bg-primary-50 border-primary-200 hover:bg-primary-100';
    }
  };

  return (
    <div className={`p-6 rounded-lg border transition-colors ${getVariantClasses()}`}>
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-600 mb-4">{description}</p>
          <button 
            onClick={onClick}
            className="btn-primary text-sm"
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
};

interface RoleDashboardProps {
  userRole: string;
  userName: string;
}

export const RoleDashboard: React.FC<RoleDashboardProps> = ({ userRole, userName }) => {
  const getWelcomeMessage = () => {
    switch (userRole) {
      case 'admin':
        return {
          title: `Welcome back, ${userName}!`,
          subtitle: 'System Administrator Dashboard',
          message: 'Monitor platform activity, manage users, and ensure system security across VERIDRIVE.'
        };
      case 'owner':
        return {
          title: `Hello, ${userName}!`,
          subtitle: 'Vehicle Owner Dashboard',
          message: 'Manage your vehicle listings, track earnings, and connect with potential buyers.'
        };
      case 'buyer':
        return {
          title: `Hi, ${userName}!`,
          subtitle: 'Vehicle Buyer Dashboard',
          message: 'Discover verified vehicles, save favorites, and make secure purchases with confidence.'
        };
      case 'service':
        return {
          title: `Welcome, ${userName}!`,
          subtitle: 'Service Provider Dashboard',
          message: 'Manage service requests, track completed work, and grow your automotive business.'
        };
      case 'insurance':
        return {
          title: `Good day, ${userName}!`,
          subtitle: 'Insurance Provider Dashboard',
          message: 'Monitor policies, process claims, and leverage fraud detection analytics.'
        };
      case 'government':
        return {
          title: `Welcome, ${userName}!`,
          subtitle: 'Government Official Dashboard',
          message: 'Oversee vehicle registrations, ensure compliance, and monitor marketplace activities.'
        };
      default:
        return {
          title: `Welcome, ${userName}!`,
          subtitle: 'VERIDRIVE Dashboard',
          message: 'Access your personalized dashboard to manage your vehicle marketplace activities.'
        };
    }
  };

  const getActionCards = () => {
    switch (userRole) {
      case 'admin':
        return [
          {
            title: 'User Management',
            description: 'View and manage all registered users across the platform',
            icon: <Users className="w-8 h-8 text-blue-600" />,
            buttonText: 'Manage Users',
            onClick: () => console.log('Navigate to users'),
            variant: 'primary' as const
          },
          {
            title: 'System Analytics',
            description: 'Monitor platform performance and user engagement metrics',
            icon: <TrendingUp className="w-8 h-8 text-green-600" />,
            buttonText: 'View Analytics',
            onClick: () => console.log('Navigate to analytics'),
            variant: 'success' as const
          },
          {
            title: 'Security Center',
            description: 'Review security alerts and fraud detection reports',
            icon: <Shield className="w-8 h-8 text-red-600" />,
            buttonText: 'Security Dashboard',
            onClick: () => console.log('Navigate to security'),
            variant: 'warning' as const
          }
        ];
      case 'owner':
        return [
          {
            title: 'List New Vehicle',
            description: 'Add a new vehicle to your inventory with detailed specifications',
            icon: <Plus className="w-8 h-8 text-blue-600" />,
            buttonText: 'Add Vehicle',
            onClick: () => console.log('Navigate to add vehicle'),
            variant: 'primary' as const
          },
          {
            title: 'My Listings',
            description: 'View and manage your current vehicle listings',
            icon: <Car className="w-8 h-8 text-green-600" />,
            buttonText: 'View Listings',
            onClick: () => console.log('Navigate to listings'),
            variant: 'success' as const
          },
          {
            title: 'Earnings Report',
            description: 'Track your sales performance and revenue analytics',
            icon: <DollarSign className="w-8 h-8 text-purple-600" />,
            buttonText: 'View Earnings',
            onClick: () => console.log('Navigate to earnings'),
            variant: 'secondary' as const
          }
        ];
      case 'buyer':
        return [
          {
            title: 'Search Vehicles',
            description: 'Find your perfect vehicle using our advanced search filters',
            icon: <Search className="w-8 h-8 text-blue-600" />,
            buttonText: 'Search Now',
            onClick: () => console.log('Navigate to search'),
            variant: 'primary' as const
          },
          {
            title: 'Saved Vehicles',
            description: 'Review your favorite vehicles and compare options',
            icon: <Eye className="w-8 h-8 text-green-600" />,
            buttonText: 'View Saved',
            onClick: () => console.log('Navigate to saved'),
            variant: 'success' as const
          },
          {
            title: 'Purchase History',
            description: 'Track your vehicle purchases and transaction history',
            icon: <FileText className="w-8 h-8 text-purple-600" />,
            buttonText: 'View History',
            onClick: () => console.log('Navigate to history'),
            variant: 'secondary' as const
          }
        ];
      case 'service':
        return [
          {
            title: 'Service Requests',
            description: 'View and respond to new service requests from customers',
            icon: <Bell className="w-8 h-8 text-blue-600" />,
            buttonText: 'View Requests',
            onClick: () => console.log('Navigate to requests'),
            variant: 'primary' as const
          },
          {
            title: 'Schedule Management',
            description: 'Manage your service appointments and availability',
            icon: <Calendar className="w-8 h-8 text-green-600" />,
            buttonText: 'Manage Schedule',
            onClick: () => console.log('Navigate to schedule'),
            variant: 'success' as const
          },
          {
            title: 'Service History',
            description: 'Review completed services and customer feedback',
            icon: <CheckCircle className="w-8 h-8 text-purple-600" />,
            buttonText: 'View History',
            onClick: () => console.log('Navigate to history'),
            variant: 'secondary' as const
          }
        ];
      case 'insurance':
        return [
          {
            title: 'Active Policies',
            description: 'Manage active insurance policies and coverage details',
            icon: <Shield className="w-8 h-8 text-blue-600" />,
            buttonText: 'View Policies',
            onClick: () => console.log('Navigate to policies'),
            variant: 'primary' as const
          },
          {
            title: 'Claims Processing',
            description: 'Review and process insurance claims efficiently',
            icon: <FileText className="w-8 h-8 text-green-600" />,
            buttonText: 'Process Claims',
            onClick: () => console.log('Navigate to claims'),
            variant: 'success' as const
          },
          {
            title: 'Fraud Detection',
            description: 'Monitor suspicious activities and potential fraud cases',
            icon: <AlertTriangle className="w-8 h-8 text-red-600" />,
            buttonText: 'View Alerts',
            onClick: () => console.log('Navigate to fraud'),
            variant: 'warning' as const
          }
        ];
      case 'government':
        return [
          {
            title: 'Vehicle Registry',
            description: 'Access comprehensive vehicle registration database',
            icon: <Car className="w-8 h-8 text-blue-600" />,
            buttonText: 'View Registry',
            onClick: () => console.log('Navigate to registry'),
            variant: 'primary' as const
          },
          {
            title: 'Compliance Reports',
            description: 'Generate and review regulatory compliance reports',
            icon: <FileText className="w-8 h-8 text-green-600" />,
            buttonText: 'View Reports',
            onClick: () => console.log('Navigate to reports'),
            variant: 'success' as const
          },
          {
            title: 'Investigations',
            description: 'Monitor ongoing investigations and regulatory actions',
            icon: <AlertTriangle className="w-8 h-8 text-red-600" />,
            buttonText: 'View Cases',
            onClick: () => console.log('Navigate to investigations'),
            variant: 'warning' as const
          }
        ];
      default:
        return [];
    }
  };

  const welcome = getWelcomeMessage();
  const actionCards = getActionCards();

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-600 to-blue-600 rounded-lg p-8 text-white">
        <div className="max-w-4xl">
          <h1 className="text-3xl font-bold mb-2">{welcome.title}</h1>
          <p className="text-primary-100 text-lg mb-4">{welcome.subtitle}</p>
          <p className="text-primary-50 max-w-2xl">{welcome.message}</p>
        </div>
      </div>

      {/* Role Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800">
            {ROLE_LABELS[userRole as keyof typeof ROLE_LABELS]}
          </span>
          <span className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleDateString()}
          </span>
        </div>
        <button className="btn-secondary">
          <Settings className="w-4 h-4 mr-2" />
          Account Settings
        </button>
      </div>

      {/* Statistics */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Overview</h2>
        <DashboardStats userRole={userRole} />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {actionCards.map((card, index) => (
            <ActionCard key={index} {...card} />
          ))}
        </div>
      </div>

      {/* Recent Activity Placeholder */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-4">
          <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">System notification</p>
              <p className="text-sm text-gray-500">Your account is active and verified</p>
            </div>
            <span className="text-sm text-gray-400">2 hours ago</span>
          </div>
          <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Profile update</p>
              <p className="text-sm text-gray-500">Successfully updated profile information</p>
            </div>
            <span className="text-sm text-gray-400">1 day ago</span>
          </div>
          <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Security alert</p>
              <p className="text-sm text-gray-500">Login from new device detected</p>
            </div>
            <span className="text-sm text-gray-400">3 days ago</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleDashboard; 