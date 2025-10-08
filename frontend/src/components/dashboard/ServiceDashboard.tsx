import React from 'react';
import { 
  Wrench, 
  Calendar, 
  DollarSign, 
  Star, 
  MapPin, 
  Clock,
  Users,
  CheckCircle,
  TrendingUp,
  FileText,
  Award
} from 'lucide-react';

interface ServiceDashboardProps {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

export const ServiceDashboard: React.FC<ServiceDashboardProps> = ({ user }) => {
  const serviceStats = [
    {
      title: 'Service Requests',
      value: '127',
      change: '+23 this week',
      changeType: 'positive',
      icon: FileText,
      description: 'New requests received'
    },
    {
      title: 'Completed Services',
      value: '95',
      change: '+18 this month',
      changeType: 'positive',
      icon: CheckCircle,
      description: 'Successfully completed'
    },
    {
      title: 'Monthly Revenue',
      value: '$12,450',
      change: '+14.2%',
      changeType: 'positive',
      icon: DollarSign,
      description: 'This month earnings'
    },
    {
      title: 'Rating Score',
      value: '4.8',
      change: '+0.2 points',
      changeType: 'positive',
      icon: Star,
      description: 'Customer satisfaction'
    }
  ];

  const todaySchedule = [
    {
      id: 1,
      time: '09:00 AM',
      service: 'Vehicle Inspection',
      customer: 'John Doe',
      vehicle: '2022 Honda Civic',
      location: 'Downtown Service Center',
      status: 'confirmed',
      duration: '45 min'
    },
    {
      id: 2,
      time: '11:30 AM',
      service: 'Pre-purchase Inspection',
      customer: 'Sarah Johnson',
      vehicle: '2020 Toyota Camry',
      location: 'Customer Location',
      status: 'in_progress',
      duration: '60 min'
    },
    {
      id: 3,
      time: '02:00 PM',
      service: 'Mechanical Diagnosis',
      customer: 'Mike Wilson',
      vehicle: '2019 BMW 3 Series',
      location: 'Main Workshop',
      status: 'pending',
      duration: '90 min'
    }
  ];

  const recentServices = [
    {
      id: 1,
      service: 'Vehicle Inspection',
      customer: 'Alice Smith',
      vehicle: '2021 Tesla Model 3',
      date: 'Yesterday',
      rating: 5,
      earnings: '$150'
    },
    {
      id: 2,
      service: 'Brake Inspection',
      customer: 'Robert Brown',
      vehicle: '2020 Ford F-150',
      date: '2 days ago',
      rating: 4,
      earnings: '$120'
    },
    {
      id: 3,
      service: 'Engine Diagnosis',
      customer: 'Emily Davis',
      vehicle: '2019 Nissan Altima',
      date: '3 days ago',
      rating: 5,
      earnings: '$200'
    }
  ];

  const quickActions = [
    {
      title: 'Schedule Service',
      description: 'Book a new service appointment',
      icon: Calendar,
      action: 'New Appointment',
      color: 'bg-blue-500'
    },
    {
      title: 'Service History',
      description: 'View completed service records',
      icon: FileText,
      action: 'View History',
      color: 'bg-green-500'
    },
    {
      title: 'Update Availability',
      description: 'Manage your work schedule',
      icon: Clock,
      action: 'Manage Schedule',
      color: 'bg-purple-500'
    },
    {
      title: 'Customer Reviews',
      description: 'View ratings and feedback',
      icon: Star,
      action: 'View Reviews',
      color: 'bg-yellow-500'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <div className="space-y-8">
      {/* Header with Role Indication */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-lg p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center mb-2">
              <Wrench className="w-8 h-8 mr-3" />
              <span className="px-3 py-1 bg-orange-800/30 rounded-full text-sm font-medium">
                SERVICE PROVIDER
              </span>
            </div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {user.firstName}!
            </h1>
            <p className="text-orange-100 text-lg">Service Provider Dashboard</p>
            <p className="text-orange-50 text-sm mt-1">
              Manage your services and help customers with vehicle verification
            </p>
          </div>
          <div className="text-right">
            <p className="text-orange-200 text-sm">Logged in as</p>
            <p className="font-semibold">{user.email}</p>
            <p className="text-orange-200 text-sm">Role: {user.role.toUpperCase()}</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {serviceStats.map((stat, index) => {
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

      {/* Today's Schedule & Recent Services */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Today's Schedule */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Today's Schedule</h2>
              <Calendar className="w-5 h-5 text-gray-500" />
            </div>
          </div>
          <div className="p-6 space-y-4">
            {todaySchedule.map((appointment) => (
              <div key={appointment.id} className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-900">{appointment.time}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                      {appointment.status.replace('_', ' ')}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">{appointment.duration}</span>
                </div>
                <h3 className="font-medium text-gray-900 mb-1">{appointment.service}</h3>
                <p className="text-sm text-gray-600 mb-1">Customer: {appointment.customer}</p>
                <p className="text-sm text-gray-600 mb-2">Vehicle: {appointment.vehicle}</p>
                <div className="flex items-center text-xs text-gray-500">
                  <MapPin className="w-3 h-3 mr-1" />
                  {appointment.location}
                </div>
              </div>
            ))}
          </div>
          <div className="p-6 border-t border-gray-200">
            <button className="btn-secondary w-full">
              <Calendar className="w-4 h-4 mr-2" />
              View Full Schedule
            </button>
          </div>
        </div>

        {/* Recent Services */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Services</h2>
              <CheckCircle className="w-5 h-5 text-gray-500" />
            </div>
          </div>
          <div className="p-6 space-y-4">
            {recentServices.map((service) => (
              <div key={service.id} className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{service.service}</h3>
                  <span className="font-semibold text-green-600">{service.earnings}</span>
                </div>
                <p className="text-sm text-gray-600 mb-1">Customer: {service.customer}</p>
                <p className="text-sm text-gray-600 mb-2">Vehicle: {service.vehicle}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    {renderStars(service.rating)}
                  </div>
                  <span className="text-xs text-gray-500">{service.date}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="p-6 border-t border-gray-200">
            <button className="btn-secondary w-full">
              <FileText className="w-4 h-4 mr-2" />
              View All Services
            </button>
          </div>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Performance Overview</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <Award className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">98%</p>
              <p className="text-sm text-gray-600">Service completion rate</p>
            </div>
            <div className="text-center">
              <Clock className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">42</p>
              <p className="text-sm text-gray-600">Avg. service time (min)</p>
            </div>
            <div className="text-center">
              <Users className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">156</p>
              <p className="text-sm text-gray-600">Customers served</p>
            </div>
            <div className="text-center">
              <TrendingUp className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">24%</p>
              <p className="text-sm text-gray-600">Revenue growth</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDashboard; 