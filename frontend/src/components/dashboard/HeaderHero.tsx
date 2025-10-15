import React from 'react';
import { Plus, Key } from 'lucide-react';
import { motion } from 'framer-motion';

interface HeaderHeroProps {
  user: {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  onAddVehicle: () => void;
  className?: string;
}

export const HeaderHero: React.FC<HeaderHeroProps> = ({
  user,
  onAddVehicle,
  className = ''
}) => {
  const displayName = user.firstName || 'Owner';
  const fullName = `${user.firstName} ${user.lastName}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg p-8 text-white ${className}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center mb-2">
            <Key className="w-8 h-8 mr-3" />
            <span className="px-3 py-1 bg-purple-800/30 rounded-full text-sm font-medium">
              OWNER ACCESS
            </span>
          </div>
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {displayName}!
          </h1>
          <p className="text-purple-100 text-lg">Vehicle Owner Dashboard</p>
          <p className="text-purple-50 text-sm mt-1">
            Manage your vehicle listings and track your sales performance
          </p>
        </div>
        
        <div className="flex flex-col items-end space-y-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onAddVehicle}
            className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm px-6 py-3 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-purple-600"
            aria-label="Add new vehicle"
          >
            <Plus className="w-5 h-5" />
            <span>Add Vehicle</span>
          </motion.button>
          
          <div className="text-right">
            <p className="text-purple-200 text-sm">Logged in as</p>
            <p className="font-semibold">{user.email}</p>
            <p className="text-purple-200 text-sm">Role: {user.role.toUpperCase()}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default HeaderHero;




