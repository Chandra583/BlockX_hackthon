import React from 'react';
import { useAppDispatch } from '../../hooks/redux';
import { setActiveSidebarItem } from '../../store/uiSlice';
import { motion } from 'framer-motion';

interface NavItemProps {
  item: {
    key: string;
    label: string;
    path: string;
    icon: React.ComponentType<any>;
  };
  isActive: boolean;
  onClick: () => void;
  collapsed?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ item, isActive, onClick, collapsed = false }) => {
  const dispatch = useAppDispatch();
  const Icon = item.icon;
  
  return (
    <li>
      <motion.button
        whileHover={{ scale: 1.02, x: collapsed ? 0 : 4 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          dispatch(setActiveSidebarItem(item.key));
          onClick();
        }}
        className={`w-full flex items-center rounded-xl text-sm transition-all duration-200 group relative ${
          collapsed ? 'px-3 py-3 justify-center' : 'px-3 py-2'
        } ${
          isActive
            ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white shadow-lg shadow-blue-500/20 border border-blue-500/30'
            : 'text-gray-300 hover:bg-slate-700/50 hover:text-white'
        }`}
        aria-current={isActive ? 'page' : undefined}
        aria-label={collapsed ? item.label : undefined}
        title={collapsed ? item.label : undefined}
      >
        <span
          className={`inline-flex items-center justify-center rounded-lg transition-all duration-200 ${
            collapsed ? 'w-8 h-8' : 'w-8 h-8 mr-3'
          } ${
            isActive
              ? 'bg-white/20 text-white shadow-sm'
              : 'text-gray-400 group-hover:text-white'
          }`}
        >
          <Icon className="w-4 h-4" />
        </span>
        
        {!collapsed && (
          <>
            <span className="flex-1 text-left font-medium">{item.label}</span>
            {isActive && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-2 h-2 rounded-full bg-blue-400"
              />
            )}
          </>
        )}
        
        {collapsed && isActive && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded-lg shadow-lg border border-slate-700/50 whitespace-nowrap z-50"
          >
            {item.label}
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-slate-800 rotate-45 border-l border-b border-slate-700/50" />
          </motion.div>
        )}
      </motion.button>
    </li>
  );
};

export default NavItem;