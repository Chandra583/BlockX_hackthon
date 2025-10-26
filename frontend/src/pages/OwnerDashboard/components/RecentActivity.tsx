import React from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  Car, 
  CheckCircle, 
  AlertTriangle, 
  Shield, 
  DollarSign,
  Clock,
  ArrowRight
} from 'lucide-react';

interface ActivityItem {
  id: string;
  title: string;
  subtext: string;
  icon: string;
  entityType: string;
  entityId?: string;
  createdAt: string;
  type: string;
  actionUrl?: string;
}

interface RecentActivityProps {
  activity: ActivityItem[];
}

const RecentActivity: React.FC<RecentActivityProps> = ({ activity }) => {
  const getActivityIcon = (iconName: string) => {
    switch (iconName) {
      case 'car':
        return <Car className="w-5 h-5 text-blue-400" />;
      case 'check-circle':
        return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case 'alert-triangle':
        return <AlertTriangle className="w-5 h-5 text-red-400" />;
      case 'shield':
        return <Shield className="w-5 h-5 text-blue-400" />;
      case 'dollar-sign':
        return <DollarSign className="w-5 h-5 text-green-400" />;
      case 'activity':
        return <Activity className="w-5 h-5 text-purple-400" />;
      default:
        return <Activity className="w-5 h-5 text-gray-400" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'vehicle_approval':
      case 'vehicle_registration':
        return 'border-blue-500/30 bg-blue-500/10';
      case 'fraud_alert':
      case 'security':
        return 'border-red-500/30 bg-red-500/10';
      case 'transaction':
        return 'border-green-500/30 bg-green-500/10';
      case 'verification':
        return 'border-emerald-500/30 bg-emerald-500/10';
      default:
        return 'border-gray-500/30 bg-gray-500/10';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl"
            >
              <Activity className="w-5 h-5 text-white" />
            </motion.div>
            <div>
              <h3 className="text-lg font-bold text-white">Recent Activity</h3>
              <p className="text-sm text-gray-400">Your latest actions and updates</p>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="p-6">
        {activity.length > 0 ? (
          <div className="space-y-4">
            {activity.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                whileHover={{ scale: 1.02, x: 5 }}
                className={`p-4 rounded-xl border ${getActivityColor(item.type)} transition-all duration-300`}
              >
                <div className="flex items-start space-x-4">
                  {/* Timeline Dot */}
                  <div className="flex-shrink-0 mt-2">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
                      className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                    />
                  </div>
                  
                  {/* Activity Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getActivityIcon(item.icon)}
                        <h4 className="text-sm font-semibold text-white">
                          {item.title}
                        </h4>
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        <span>{formatTimeAgo(item.createdAt)}</span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-300 mb-3 line-clamp-2">
                      {item.subtext}
                    </p>
                    
                    {item.actionUrl && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center space-x-1 text-xs text-blue-400 hover:text-blue-300 font-medium"
                      >
                        <span>View Details</span>
                        <ArrowRight className="w-3 h-3" />
                      </motion.button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8"
          >
            <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-gray-300 mb-2">No Recent Activity</h4>
            <p className="text-sm text-gray-400">Your activity will appear here</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default RecentActivity;
