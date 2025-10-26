import React from 'react';
import { motion } from 'framer-motion';
import { User, Shield, Crown } from 'lucide-react';

interface WelcomeBannerProps {
  user: {
    firstName: string;
    lastName: string;
    role: string;
    verified?: boolean;
  };
}

const WelcomeBanner: React.FC<WelcomeBannerProps> = ({ user }) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-5 h-5" />;
      case 'admin':
        return <Shield className="w-5 h-5" />;
      default:
        return <User className="w-5 h-5" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'from-blue-500 to-purple-500';
      case 'admin':
        return 'from-red-500 to-pink-500';
      default:
        return 'from-gray-500 to-slate-500';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6 }}
      className="flex items-center space-x-4"
    >
      {/* User Avatar */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        className="relative"
      >
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
          {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
        </div>
        {user.verified && (
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center"
          >
            <Shield className="w-3 h-3 text-white" />
          </motion.div>
        )}
      </motion.div>

      {/* Welcome Text */}
      <div>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-2xl font-bold text-white"
        >
          {getGreeting()}, {user.firstName}!
        </motion.h1>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="flex items-center space-x-2 mt-1"
        >
          <div className={`flex items-center space-x-1 px-3 py-1 bg-gradient-to-r ${getRoleColor(user.role)} rounded-full text-white text-sm font-semibold`}>
            {getRoleIcon(user.role)}
            <span className="capitalize">{user.role}</span>
          </div>
          
          {user.verified && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="flex items-center space-x-1 px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-semibold border border-emerald-500/30"
            >
              <Shield className="w-3 h-3" />
              <span>Verified</span>
            </motion.div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default WelcomeBanner;
