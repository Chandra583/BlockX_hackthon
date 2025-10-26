import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, NavLink } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { setActiveSidebarItem } from '../../store/uiSlice';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard,
  Wallet,
  Car,
  Settings,
  Smartphone,
  History,
  Store,
  Users,
  Wrench,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Shield,
  ShoppingCart,
  FileText,
  Building
} from 'lucide-react';
import { getNavigationForRole } from '../../config/navigation';
import NavItem from './NavItem';

interface SidebarProps {
  className?: string;
  collapsed?: boolean;
  onToggle?: () => void;
  isMobile?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  className = '', 
  collapsed = false, 
  onToggle,
  isMobile = false 
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { activeSidebarItem } = useAppSelector((state) => state.ui);

  useEffect(() => {
    // Set active item based on current path with role-based routing
    const path = location.pathname;
    const role = user?.role?.toLowerCase();
    
    if (role === 'admin') {
      if (path.includes('/admin/dashboard')) dispatch(setActiveSidebarItem('dashboard'));
      else if (path.includes('/admin/marketplace')) dispatch(setActiveSidebarItem('marketplace'));
      else if (path.includes('/admin/installs')) dispatch(setActiveSidebarItem('installs'));
      else if (path.includes('/admin/history')) dispatch(setActiveSidebarItem('history'));
      else if (path.includes('/admin/users')) dispatch(setActiveSidebarItem('users'));
    } else if (role === 'owner') {
      if (path.includes('/owner/dashboard')) dispatch(setActiveSidebarItem('dashboard'));
      else if (path.includes('/owner/wallet')) dispatch(setActiveSidebarItem('wallet'));
      else if (path.includes('/owner/vehicles')) dispatch(setActiveSidebarItem('vehicles'));
      else if (path.includes('/owner/devices')) dispatch(setActiveSidebarItem('devices'));
      else if (path.includes('/owner/history')) dispatch(setActiveSidebarItem('history'));
      else if (path.includes('/owner/marketplace')) dispatch(setActiveSidebarItem('marketplace'));
    } else if (role === 'service') {
      if (path.includes('/sp/dashboard')) dispatch(setActiveSidebarItem('dashboard'));
      else if (path.includes('/sp/installs')) dispatch(setActiveSidebarItem('installs'));
      else if (path.includes('/sp/devices')) dispatch(setActiveSidebarItem('devices'));
    } else {
      // Fallback for legacy routes
      if (path.includes('/dashboard')) dispatch(setActiveSidebarItem('dashboard'));
      else if (path.includes('/wallet')) dispatch(setActiveSidebarItem('wallet'));
      else if (path.includes('/vehicles')) dispatch(setActiveSidebarItem('vehicles'));
      else if (path.includes('/devices')) dispatch(setActiveSidebarItem('devices'));
      else if (path.includes('/history')) dispatch(setActiveSidebarItem('history'));
      else if (path.includes('/marketplace')) dispatch(setActiveSidebarItem('marketplace'));
    }
  }, [location, dispatch, user?.role]);

  if (!isAuthenticated || !user) return null;

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

  const getLinks = () => {
    const role = user?.role?.toLowerCase();
    return getNavigationForRole(role) || [];
  };

  const RoleIcon = getRoleIcon(user.role);
  const fullName = `${user.firstName} ${user.lastName}`;
  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();

  return (
    <nav
      className={`h-full bg-slate-900/95 backdrop-blur-xl border-r border-slate-700/50 ${className}`}
      aria-label="Sidebar"
      role="navigation"
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-slate-700/50">
          <div className="flex items-center justify-between">
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center space-x-3"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">V</span>
                </div>
                <div>
                  <h1 className="text-xl font-black text-white gradient-text">VERIDRIVE</h1>
                  <p className="text-xs text-gray-400">Blockchain Platform</p>
                </div>
              </motion.div>
            )}
            
            {collapsed && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg mx-auto"
              >
                <span className="text-white font-bold text-lg">V</span>
              </motion.div>
            )}
            
            {onToggle && !isMobile && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onToggle}
                className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {collapsed ? (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronLeft className="w-4 h-4 text-gray-400" />
                )}
              </motion.button>
            )}
          </div>
        </div>

        {/* User Info */}
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 border-b border-slate-700/50"
          >
            <div className="flex items-center space-x-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getRoleColor(user.role)}`}>
                <RoleIcon className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{fullName}</p>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${getRoleColor(user.role)}`}>
                  <RoleIcon className="w-3 h-3 mr-1" />
                  {user.role}
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {collapsed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 border-b border-slate-700/50 flex justify-center"
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getRoleColor(user.role)}`}>
              <span className="text-lg font-bold text-white">{initials}</span>
            </div>
          </motion.div>
        )}

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <ul className="p-2 space-y-1">
            {getLinks().map((item, index) => (
              <motion.li
                key={item.key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05, duration: 0.2 }}
              >
                <NavItem
                  item={item}
                  isActive={activeSidebarItem === item.key}
                  onClick={() => {
                    dispatch(setActiveSidebarItem(item.key));
                    navigate(item.path);
                    if (isMobile && onToggle) {
                      onToggle();
                    }
                  }}
                  collapsed={collapsed}
                />
              </motion.li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 border-t border-slate-700/50"
          >
            <div className="text-center">
              <p className="text-xs text-gray-500">Powered by Blockchain</p>
              <p className="text-xs text-gray-600">v2.0.0</p>
            </div>
          </motion.div>
        )}
      </div>
    </nav>
  );
};

export default Sidebar;