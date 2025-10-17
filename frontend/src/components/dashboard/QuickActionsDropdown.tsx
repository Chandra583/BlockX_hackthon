import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus,
  Gauge,
  Car,
  Hash,
  FileText,
  DollarSign,
  Camera,
  TrendingUp,
  ChevronDown
} from 'lucide-react';

const QuickActionsDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  const quickActions = [
    {
      title: 'Register Vehicle',
      description: 'Add new vehicle to blockchain',
      icon: Plus,
      action: 'register-vehicle',
      color: 'bg-green-500'
    },
    {
      title: 'Update Mileage',
      description: 'Record new mileage on blockchain',
      icon: Gauge,
      action: 'update-mileage',
      color: 'bg-purple-500'
    },
    {
      title: 'View Vehicles',
      description: 'See all your registered vehicles',
      icon: Car,
      action: 'view-vehicles',
      color: 'bg-blue-500'
    },
    {
      title: 'Blockchain History',
      description: 'View all blockchain transactions',
      icon: Hash,
      action: 'view-history',
      color: 'bg-indigo-500'
    },
    {
      title: 'Upload Documents',
      description: 'Store documents on Arweave',
      icon: FileText,
      action: 'upload-docs',
      color: 'bg-green-500'
    },
    {
      title: 'Update Prices',
      description: 'Adjust pricing for listings',
      icon: DollarSign,
      action: 'update-prices',
      color: 'bg-blue-500'
    },
    {
      title: 'Upload Photos',
      description: 'Add vehicle images',
      icon: Camera,
      action: 'upload-photos',
      color: 'bg-purple-500'
    },
    {
      title: 'View Analytics',
      description: 'See performance metrics',
      icon: TrendingUp,
      action: 'view-analytics',
      color: 'bg-orange-500'
    }
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
      >
        <span className="text-sm font-medium text-gray-700">Quick Actions</span>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
          >
            <div className="p-2">
              <div className="grid grid-cols-2 gap-2">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={index}
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${action.color}`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{action.title}</p>
                        <p className="text-xs text-gray-500">{action.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QuickActionsDropdown;