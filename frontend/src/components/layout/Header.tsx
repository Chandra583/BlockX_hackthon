import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Bell, 
  Menu,
  X,
  ChevronDown,
  Shield,
  Car,
  ShoppingCart,
  Wrench,
  FileText,
  Building
} from 'lucide-react';
import { ThemeToggle } from '../common/ThemeToggle';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { logout } from '../../store/slices/authSlice';
import { usePermissions } from '../../hooks/usePermissions';
import { ROLE_LABELS } from '../../types/auth';
import NotificationService from '../../services/notifications';
import NotificationDropdown from './NotificationDropdown';
import ProfileMenu from './ProfileMenu';
import { RoleSelector } from './RoleSelector';

export const Header: React.FC = () => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loadingNotifications, setLoadingNotifications] = useState<boolean>(false);

  useEffect(() => {
    const load = async () => {
      if (!isAuthenticated) return;
      try {
        setLoadingNotifications(true);
        const res = await NotificationService.getNotifications({ unread: true, limit: 1, page: 1 });
        setUnreadCount(res.data.unreadCount || 0);
      } catch (e) {
        // ignore
      } finally {
        setLoadingNotifications(false);
      }
    };
    load();
  }, [isAuthenticated]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
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
    return icons[role as keyof typeof icons] || Car;
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
    return colors[role as keyof typeof colors] || 'text-blue-400 bg-blue-500/20 border-blue-500/30';
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  const RoleIcon = getRoleIcon(user.role);
  const fullName = `${user.firstName} ${user.lastName}`;

  return (
    <header className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mr-3 shadow-lg">
                <span className="text-white font-bold text-lg">V</span>
              </div>
              <span className="text-2xl font-black text-white gradient-text">VERIDRIVE</span>
            </div>
          </div>

          {/* Right side - Desktop */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {/* Role Selector (for multi-role users) */}
            <RoleSelector />
            
            {/* Theme Toggle */}
            <ThemeToggle />
            
            {/* Notifications */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                className={`relative p-3 rounded-xl transition-all duration-300 border ${
                  showNotificationDropdown 
                    ? 'bg-blue-500/20 border-blue-500/50 shadow-lg shadow-blue-500/20' 
                    : 'bg-slate-800/50 hover:bg-slate-700/50 border-slate-700/50'
                }`}
                aria-label="Notifications"
              >
                <Bell className={`w-6 h-6 transition-colors duration-200 ${
                  showNotificationDropdown ? 'text-blue-400' : 'text-white'
                }`} />
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"
                  >
                    <motion.span
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="text-xs font-bold text-white"
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </motion.span>
                  </motion.span>
                )}
              </motion.button>

              <NotificationDropdown
                isOpen={showNotificationDropdown}
                onClose={() => setShowNotificationDropdown(false)}
                onMarkAsRead={() => {
                  setUnreadCount(0);
                  setShowNotificationDropdown(false);
                }}
                onViewAll={() => {
                  navigate('/notifications');
                  setShowNotificationDropdown(false);
                }}
              />
            </div>

            {/* User Profile Dropdown */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center space-x-3 px-4 py-2 rounded-xl hover:bg-slate-800/50 transition-all duration-200"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getRoleColor(user.role)}`}>
                  <RoleIcon className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-white">{fullName}</p>
                  <p className="text-xs text-gray-400">{ROLE_LABELS[user.role]}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </motion.button>

              <ProfileMenu
                isOpen={showProfileMenu}
                onClose={() => setShowProfileMenu(false)}
              />
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {showMobileMenu && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="md:hidden bg-slate-900/95 backdrop-blur-xl border-t border-slate-700/50"
        >
          <div className="px-4 py-4 space-y-4">
            <div className="flex items-center space-x-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getRoleColor(user.role)}`}>
                <RoleIcon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-lg font-semibold text-white">{fullName}</p>
                <p className="text-sm text-gray-400">{user.email}</p>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${getRoleColor(user.role)}`}>
                  <RoleIcon className="w-3 h-3 mr-1" />
                  {ROLE_LABELS[user.role]}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
              <ThemeToggle />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-xl text-red-400 font-medium transition-all duration-300"
              >
                Sign Out
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </header>
  );
};

export default Header;