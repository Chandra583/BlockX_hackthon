import React from 'react';
import { 
  FileText, 
  BarChart3, 
  Users, 
  Scale,
  Building,
  Flag,
  CheckCircle,
  Clock,
  Eye,
  Activity
} from 'lucide-react';

interface GovernmentDashboardProps {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

export const GovernmentDashboard: React.FC<GovernmentDashboardProps> = ({ user }) => {
  const governmentStats = [
    {
      title: 'Compliance Reports',
      value: '156',
      change: '+23',
      changeType: 'positive',
      icon: FileText,
      description: 'Monthly compliance checks'
    },
    {
      title: 'Active Investigations',
      value: '8',
      change: '+2',
      changeType: 'neutral',
      icon: Eye,
      description: 'Ongoing fraud investigations'
    },
    {
      title: 'Platform Users',
      value: '12,847',
      change: '+8.5%',
      changeType: 'positive',
      icon: Users,
      description: 'Registered platform users'
    },
    {
      title: 'Regulation Updates',
      value: '3',
      change: 'This month',
      changeType: 'neutral',
      icon: Scale,
      description: 'New regulatory changes'
    }
  ];

  const recentInvestigations = [
    {
      id: 'INV-2024-001',
      title: 'Odometer Rollback Investigation',
      status: 'Active',
      priority: 'High',
      agency: 'DMV Fraud Division',
      vehiclesInvolved: 15,
      estimatedLoss: '$450,000',
      timestamp: '3 days ago'
    },
    {
      id: 'INV-2024-002',
      title: 'Title Washing Scheme',
      status: 'Under Review',
      priority: 'Medium',
      agency: 'State Police',
      vehiclesInvolved: 8,
      estimatedLoss: '$120,000',
      timestamp: '1 week ago'
    },
    {
      id: 'INV-2024-003',
      title: 'Dealer License Violation',
      status: 'Completed',
      priority: 'Low',
      agency: 'Motor Vehicle Board',
      vehiclesInvolved: 3,
      estimatedLoss: '$25,000',
      timestamp: '2 weeks ago'
    },
    {
      id: 'INV-2024-004',
      title: 'Insurance Fraud Ring',
      status: 'Evidence Review',
      priority: 'High',
      agency: 'Insurance Commission',
      vehiclesInvolved: 22,
      estimatedLoss: '$780,000',
      timestamp: '3 weeks ago'
    }
  ];

  const complianceMetrics = [
    {
      id: 1,
      category: 'Platform Operations',
      score: 95,
      issues: 2,
      status: 'Compliant',
      lastAudit: '2024-01-15'
    },
    {
      id: 2,
      category: 'Data Protection',
      score: 88,
      issues: 4,
      status: 'Minor Issues',
      lastAudit: '2024-01-10'
    },
    {
      id: 3,
      category: 'Financial Reporting',
      score: 100,
      issues: 0,
      status: 'Fully Compliant',
      lastAudit: '2024-01-20'
    },
    {
      id: 4,
      category: 'User Privacy',
      score: 92,
      issues: 3,
      status: 'Compliant',
      lastAudit: '2024-01-18'
    }
  ];

  const governmentActions = [
    {
      title: 'Compliance Monitoring',
      description: 'Monitor platform compliance with regulations',
      icon: Scale,
      action: 'View Compliance',
      color: 'bg-blue-500'
    },
    {
      title: 'Investigation Center',
      description: 'Access investigation tools and reports',
      icon: Eye,
      action: 'Open Investigations',
      color: 'bg-purple-500'
    },
    {
      title: 'Regulatory Reports',
      description: 'Generate and view regulatory reports',
      icon: FileText,
      action: 'Generate Reports',
      color: 'bg-green-500'
    },
    {
      title: 'User Oversight',
      description: 'Monitor user activities and registrations',
      icon: Users,
      action: 'Monitor Users',
      color: 'bg-orange-500'
    },
    {
      title: 'Policy Updates',
      description: 'Update and publish regulatory policies',
      icon: Flag,
      action: 'Update Policies',
      color: 'bg-red-500'
    },
    {
      title: 'Audit Dashboard',
      description: 'Access comprehensive audit information',
      icon: BarChart3,
      action: 'View Audits',
      color: 'bg-indigo-500'
    }
  ];

  const getInvestigationStatusIcon = (status: string) => {
    switch (status) {
      case 'Active': return <Activity className="w-4 h-4 text-blue-600" />;
      case 'Completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'Under Review': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'Evidence Review': return <Eye className="w-4 h-4 text-purple-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getInvestigationStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'text-blue-600 bg-blue-50';
      case 'Completed': return 'text-green-600 bg-green-50';
      case 'Under Review': return 'text-yellow-600 bg-yellow-50';
      case 'Evidence Review': return 'text-purple-600 bg-purple-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'text-red-600 bg-red-50 border-red-200';
      case 'Medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getComplianceScoreColor = (score: number) => {
    if (score >= 95) return 'text-green-600';
    if (score >= 85) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getComplianceStatusColor = (status: string) => {
    switch (status) {
      case 'Fully Compliant': return 'text-green-600 bg-green-50 border-green-200';
      case 'Compliant': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'Minor Issues': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Non-Compliant': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header with Role Indication */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center mb-2">
              <Building className="w-8 h-8 mr-3" />
              <span className="px-3 py-1 bg-indigo-800/30 rounded-full text-sm font-medium">
                GOVERNMENT OFFICIAL
              </span>
            </div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {user.firstName}!
            </h1>
            <p className="text-indigo-100 text-lg">Government Oversight Dashboard</p>
            <p className="text-indigo-50 text-sm mt-1">
              Monitor compliance, investigate fraud, and enforce regulations
            </p>
          </div>
          <div className="text-right">
            <p className="text-indigo-200 text-sm">Logged in as</p>
            <p className="font-semibold">{user.email}</p>
            <p className="text-indigo-200 text-sm">Role: {user.role.toUpperCase()}</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {governmentStats.map((stat, index) => {
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
              <div className="mt-4">
                <span className={`text-xs font-medium ${
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

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Investigations */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Eye className="w-5 h-5 text-gray-400 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Active Investigations</h2>
              </div>
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                View All
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentInvestigations.map((investigation, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{investigation.id}</h4>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(investigation.priority)}`}>
                            {investigation.priority}
                          </span>
                          <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${getInvestigationStatusColor(investigation.status)}`}>
                            {getInvestigationStatusIcon(investigation.status)}
                            <span className="ml-1">{investigation.status}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm font-medium text-gray-900 mb-1">{investigation.title}</p>
                      <p className="text-sm text-gray-600 mb-2">{investigation.agency}</p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{investigation.vehiclesInvolved} vehicles • {investigation.estimatedLoss}</span>
                        <span className="text-gray-500">{investigation.timestamp}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Compliance Metrics */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Scale className="w-5 h-5 text-gray-400 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Compliance Metrics</h2>
              </div>
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                Full Report
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {complianceMetrics.map((metric, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">{metric.category}</h4>
                      <p className="text-sm text-gray-600">Last audit: {metric.lastAudit}</p>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${getComplianceScoreColor(metric.score)}`}>
                        {metric.score}%
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getComplianceStatusColor(metric.status)}`}>
                        {metric.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {metric.issues} issue{metric.issues !== 1 ? 's' : ''} found
                    </span>
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          metric.score >= 95 ? 'bg-green-500' : 
                          metric.score >= 85 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${metric.score}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Government Actions</h2>
          <p className="text-sm text-gray-600">Regulatory oversight and compliance tools</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {governmentActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <div key={index} className="p-6 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-center mb-4">
                    <div className={`p-3 ${action.color} rounded-lg mr-4`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{action.title}</h3>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{action.description}</p>
                  <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors">
                    {action.action}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GovernmentDashboard; 