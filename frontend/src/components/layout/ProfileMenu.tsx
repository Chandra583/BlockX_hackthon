import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  LogOut, 
  Settings, 
  Wallet,
  ChevronDown,
  Shield,
  Car,
  ShoppingCart,
  Wrench,
  FileText,
  Building
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { logout } from '../../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import { ROLE_LABELS } from '../../types/auth';

interface ProfileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProfileMenu: React.FC<ProfileMenuProps> = ({ isOpen, onClose }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
    onClose();
  };

  const getRoleIcon = (role: string) => {
    const icons = {
      admin: Shield,
      owner: Car,
      buyer: ShoppingCart,
      service: Wrench,
      insurance: FileText,
      government: Building,
    };
    return icons[role as keyof typeof icons] || User;
  };

  const getRoleColor = (role: string) => {
    const colors = {
      admin: 'text-red-400 bg-red-500/20 border-red-500/30',
      owner: 'text-blue-400 bg-blue-500/20 border-blue-500/30',
      buyer: 'text-green-400 bg-green-500/20 border-green-500/30',
      service: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30',
      insurance: 'text-purple-400 bg-purple-500/20 border-purple-500/30',
      government: 'text-gray-400 bg-gray-500/20 border-gray-500/30',
    };
    return colors[role as keyof typeof colors] || 'text-gray-400 bg-gray-500/20 border-gray-500/30';
  };

  const menuItems = [
    {
      label: 'Profile Settings',
      icon: User,
      onClick: () => {
        navigate('/profile');
        onClose();
      }
    },
    {
      label: 'Wallet',
      icon: Wallet,
      onClick: () => {
        navigate('/wallet');
        onClose();
      }
    },
    {
      label: 'Account Settings',
      icon: Settings,
      onClick: () => {
        navigate('/account-settings');
        onClose();
      }
    }
  ];

  if (!user) return null;

  const RoleIcon = getRoleIcon(user.role);
  const fullName = `${user.firstName} ${user.lastName}`;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="absolute right-0 mt-3 w-80 bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl z-50 overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-700/50 bg-slate-800/50">
            <div className="flex items-center space-x-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getRoleColor(user.role)}`}>
                <RoleIcon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white">{fullName}</h3>
                <p className="text-sm text-gray-400">{user.email}</p>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-2 ${getRoleColor(user.role)}`}>
                  <RoleIcon className="w-3 h-3 mr-1" />
                  {ROLE_LABELS[user.role]}
                </span>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            {menuItems.map((item, index) => (
              <motion.button
                key={item.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05, duration: 0.2 }}
                whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                onClick={item.onClick}
                className="w-full flex items-center px-6 py-3 text-left text-gray-300 hover:text-white transition-colors duration-200"
              >
                <item.icon className="w-5 h-5 mr-3" />
                <span className="font-medium">{item.label}</span>
              </motion.button>
            ))}
          </div>

          {/* Logout */}
          <div className="px-6 py-4 border-t border-slate-700/50 bg-slate-800/30">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-xl text-red-400 font-medium transition-all duration-300"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProfileMenu;
