import React from 'react';
import { 
  Shield, 
  FileText, 
  TrendingUp, 
  AlertTriangle, 
  DollarSign,
  Calculator,
  Clock,
  CheckCircle,
  XCircle,
  BarChart3,
  Activity,
  Target
} from 'lucide-react';

interface InsuranceDashboardProps {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

export const InsuranceDashboard: React.FC<InsuranceDashboardProps> = ({ user }) => {
  const insuranceStats = [
    {
      title: 'Active Policies',
      value: '1,247',
      change: '+8.3%',
      changeType: 'positive',
      icon: Shield,
      description: 'Currently covered vehicles'
    },
    {
      title: 'Claims This Month',
      value: '43',
      change: '-12%',
      changeType: 'positive',
      icon: FileText,
      description: 'New claims submitted'
    },
    {
      title: 'Risk Score',
      value: '7.2/10',
      change: '+0.3',
      changeType: 'positive',
      icon: TrendingUp,
      description: 'Average portfolio risk'
    },
    {
      title: 'Fraud Alerts',
      value: '3',
      change: '-67%',
      changeType: 'positive',
      icon: AlertTriangle,
      description: 'Potential fraud cases'
    }
  ];

  const recentClaims = [
    {
      id: 'CLM-2024-001',
      policyHolder: 'Sarah Johnson',
      vehicle: '2022 Tesla Model 3',
      type: 'Collision',
      amount: '$8,500',
      status: 'Under Review',
      timestamp: '2 hours ago',
      severity: 'medium'
    },
    {
      id: 'CLM-2024-002',
      policyHolder: 'Michael Chen',
      vehicle: '2021 Honda Accord',
      type: 'Theft',
      amount: '$22,000',
      status: 'Approved',
      timestamp: '5 hours ago',
      severity: 'high'
    },
    {
      id: 'CLM-2024-003',
      policyHolder: 'Emily Davis',
      vehicle: '2020 Toyota Camry',
      type: 'Vandalism',
      amount: '$1,200',
      status: 'Processed',
      timestamp: '1 day ago',
      severity: 'low'
    },
    {
      id: 'CLM-2024-004',
      policyHolder: 'Robert Wilson',
      vehicle: '2023 BMW X5',
      type: 'Comprehensive',
      amount: '$15,000',
      status: 'Investigating',
      timestamp: '2 days ago',
      severity: 'high'
    }
  ];

  const riskAssessments = [
    {
      id: 1,
      vehicle: '2019 Ford Mustang',
      owner: 'Alex Thompson',
      riskLevel: 'High',
      factors: ['Young driver', 'Sports car', 'High theft area'],
      premiumAdjustment: '+25%'
    },
    {
      id: 2,
      vehicle: '2021 Volvo XC90',
      owner: 'Jennifer Martinez',
      riskLevel: 'Low',
      factors: ['Experienced driver', 'Safety features', 'Low crime area'],
      premiumAdjustment: '-15%'
    },
    {
      id: 3,
      vehicle: '2020 Tesla Model S',
      owner: 'David Brown',
      riskLevel: 'Medium',
      factors: ['Electric vehicle', 'Advanced safety', 'Moderate usage'],
      premiumAdjustment: '+5%'
    }
  ];

  const insuranceActions = [
    {
      title: 'Policy Management',
      description: 'Create, modify, and manage insurance policies',
      icon: Shield,
      action: 'Manage Policies',
      color: 'bg-blue-500'
    },
    {
      title: 'Claims Processing',
      description: 'Review and process insurance claims',
      icon: FileText,
      action: 'Process Claims',
      color: 'bg-purple-500'
    },
    {
      title: 'Risk Assessment',
      description: 'Analyze vehicle and driver risk factors',
      icon: Calculator,
      action: 'Assess Risk',
      color: 'bg-orange-500'
    },
    {
      title: 'Premium Calculator',
      description: 'Calculate insurance premiums and quotes',
      icon: DollarSign,
      action: 'Calculate Premium',
      color: 'bg-green-500'
    },
    {
      title: 'Fraud Detection',
      description: 'Monitor and investigate potential fraud',
      icon: AlertTriangle,
      action: 'Detect Fraud',
      color: 'bg-red-500'
    },
    {
      title: 'Analytics Dashboard',
      description: 'View detailed insurance analytics',
      icon: BarChart3,
      action: 'View Analytics',
      color: 'bg-indigo-500'
    }
  ];

  const getClaimStatusIcon = (status: string) => {
    switch (status) {
      case 'Approved': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'Processed': return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case 'Under Review': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'Investigating': return <Activity className="w-4 h-4 text-orange-600" />;
      case 'Rejected': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getClaimStatusColor = (status: string) => {
    switch (status) {
      case 'Approved': return 'text-green-600 bg-green-50';
      case 'Processed': return 'text-blue-600 bg-blue-50';
      case 'Under Review': return 'text-yellow-600 bg-yellow-50';
      case 'Investigating': return 'text-orange-600 bg-orange-50';
      case 'Rejected': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'High': return 'text-red-600 bg-red-50 border-red-200';
      case 'Medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header with Role Indication */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center mb-2">
              <Shield className="w-8 h-8 mr-3" />
              <span className="px-3 py-1 bg-blue-800/30 rounded-full text-sm font-medium">
                INSURANCE PROVIDER
              </span>
            </div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {user.firstName}!
            </h1>
            <p className="text-blue-100 text-lg">Insurance Provider Dashboard</p>
            <p className="text-blue-50 text-sm mt-1">
              Manage policies, process claims, and assess vehicle risks
            </p>
          </div>
          <div className="text-right">
            <p className="text-blue-200 text-sm">Logged in as</p>
            <p className="font-semibold">{user.email}</p>
            <p className="text-blue-200 text-sm">Role: {user.role.toUpperCase()}</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {insuranceStats.map((stat, index) => {
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
        {/* Recent Claims */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="w-5 h-5 text-gray-400 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Recent Claims</h2>
              </div>
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                View All
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentClaims.map((claim, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{claim.id}</h4>
                      <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${getClaimStatusColor(claim.status)}`}>
                        {getClaimStatusIcon(claim.status)}
                        <span className="ml-1">{claim.status}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{claim.policyHolder} • {claim.vehicle}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-medium text-gray-900">{claim.type} • {claim.amount}</span>
                      <span className="text-xs text-gray-500">{claim.timestamp}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Risk Assessments */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Target className="w-5 h-5 text-gray-400 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Risk Assessments</h2>
              </div>
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                View All
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {riskAssessments.map((assessment, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">{assessment.vehicle}</h4>
                      <p className="text-sm text-gray-600">{assessment.owner}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRiskLevelColor(assessment.riskLevel)}`}>
                        {assessment.riskLevel} Risk
                      </span>
                      <p className="text-sm font-medium text-gray-900 mt-1">{assessment.premiumAdjustment}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {assessment.factors.map((factor, idx) => (
                      <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {factor}
                      </span>
                    ))}
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
          <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          <p className="text-sm text-gray-600">Common insurance management tasks</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {insuranceActions.map((action, index) => {
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

export default InsuranceDashboard; 