import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Car, 
  Users, 
  DollarSign, 
  FileText, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, changeType, icon }) => {
  const getChangeColor = () => {
    switch (changeType) {
      case 'positive':
        return 'text-green-600';
      case 'negative':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getChangeIcon = () => {
    switch (changeType) {
      case 'positive':
        return <TrendingUp className="w-4 h-4" />;
      case 'negative':
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="p-3 bg-primary-50 rounded-lg">
            {icon}
          </div>
          <div className="ml-4">
            <h3 className="text-sm font-medium text-gray-500">{title}</h3>
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
          </div>
        </div>
        <div className={`flex items-center ${getChangeColor()}`}>
          {getChangeIcon()}
          <span className="ml-1 text-sm font-medium">{change}</span>
        </div>
      </div>
    </div>
  );
};

interface DashboardStatsProps {
  userRole: string;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ userRole }) => {
  const getStatsForRole = (role: string) => {
    switch (role) {
      case 'admin':
        return [
          {
            title: 'Total Users',
            value: '2,547',
            change: '+12.5%',
            changeType: 'positive' as const,
            icon: <Users className="w-6 h-6 text-primary-600" />
          },
          {
            title: 'Active Vehicles',
            value: '8,934',
            change: '+8.2%',
            changeType: 'positive' as const,
            icon: <Car className="w-6 h-6 text-primary-600" />
          },
          {
            title: 'Flagged Transactions',
            value: '23',
            change: '-15.3%',
            changeType: 'positive' as const,
            icon: <AlertTriangle className="w-6 h-6 text-primary-600" />
          },
          {
            title: 'System Health',
            value: '99.9%',
            change: 'Stable',
            changeType: 'neutral' as const,
            icon: <Shield className="w-6 h-6 text-primary-600" />
          }
        ];
      case 'owner':
        return [
          {
            title: 'My Vehicles',
            value: '12',
            change: '+2',
            changeType: 'positive' as const,
            icon: <Car className="w-6 h-6 text-primary-600" />
          },
          {
            title: 'Total Earnings',
            value: '$48,250',
            change: '+18.7%',
            changeType: 'positive' as const,
            icon: <DollarSign className="w-6 h-6 text-primary-600" />
          },
          {
            title: 'Active Listings',
            value: '8',
            change: '+3',
            changeType: 'positive' as const,
            icon: <FileText className="w-6 h-6 text-primary-600" />
          },
          {
            title: 'Verified Status',
            value: '100%',
            change: 'Verified',
            changeType: 'neutral' as const,
            icon: <CheckCircle className="w-6 h-6 text-primary-600" />
          }
        ];
      case 'buyer':
        return [
          {
            title: 'Viewed Vehicles',
            value: '34',
            change: '+12',
            changeType: 'positive' as const,
            icon: <Car className="w-6 h-6 text-primary-600" />
          },
          {
            title: 'Saved Vehicles',
            value: '7',
            change: '+3',
            changeType: 'positive' as const,
            icon: <FileText className="w-6 h-6 text-primary-600" />
          },
          {
            title: 'Budget Range',
            value: '$25K-$50K',
            change: 'Updated',
            changeType: 'neutral' as const,
            icon: <DollarSign className="w-6 h-6 text-primary-600" />
          },
          {
            title: 'Verified Score',
            value: '850',
            change: '+25',
            changeType: 'positive' as const,
            icon: <Shield className="w-6 h-6 text-primary-600" />
          }
        ];
      case 'service':
        return [
          {
            title: 'Service Requests',
            value: '127',
            change: '+23',
            changeType: 'positive' as const,
            icon: <FileText className="w-6 h-6 text-primary-600" />
          },
          {
            title: 'Completed Services',
            value: '95',
            change: '+18',
            changeType: 'positive' as const,
            icon: <CheckCircle className="w-6 h-6 text-primary-600" />
          },
          {
            title: 'Monthly Revenue',
            value: '$12,450',
            change: '+14.2%',
            changeType: 'positive' as const,
            icon: <DollarSign className="w-6 h-6 text-primary-600" />
          },
          {
            title: 'Rating Score',
            value: '4.8',
            change: '+0.2',
            changeType: 'positive' as const,
            icon: <Shield className="w-6 h-6 text-primary-600" />
          }
        ];
      case 'insurance':
        return [
          {
            title: 'Active Policies',
            value: '1,234',
            change: '+87',
            changeType: 'positive' as const,
            icon: <Shield className="w-6 h-6 text-primary-600" />
          },
          {
            title: 'Claims Processed',
            value: '456',
            change: '+34',
            changeType: 'positive' as const,
            icon: <FileText className="w-6 h-6 text-primary-600" />
          },
          {
            title: 'Monthly Premiums',
            value: '$234K',
            change: '+12.8%',
            changeType: 'positive' as const,
            icon: <DollarSign className="w-6 h-6 text-primary-600" />
          },
          {
            title: 'Fraud Detection',
            value: '99.2%',
            change: '+0.5%',
            changeType: 'positive' as const,
            icon: <AlertTriangle className="w-6 h-6 text-primary-600" />
          }
        ];
      case 'government':
        return [
          {
            title: 'Registered Vehicles',
            value: '45,678',
            change: '+1,234',
            changeType: 'positive' as const,
            icon: <Car className="w-6 h-6 text-primary-600" />
          },
          {
            title: 'Compliance Rate',
            value: '97.3%',
            change: '+2.1%',
            changeType: 'positive' as const,
            icon: <CheckCircle className="w-6 h-6 text-primary-600" />
          },
          {
            title: 'Investigations',
            value: '12',
            change: '-3',
            changeType: 'positive' as const,
            icon: <AlertTriangle className="w-6 h-6 text-primary-600" />
          },
          {
            title: 'Monthly Reports',
            value: '87',
            change: '+12',
            changeType: 'positive' as const,
            icon: <FileText className="w-6 h-6 text-primary-600" />
          }
        ];
      default:
        return [];
    }
  };

  const stats = getStatsForRole(userRole);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
};

export default DashboardStats; 