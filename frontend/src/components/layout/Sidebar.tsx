import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { setActiveSidebarItem } from '../../store/uiSlice';
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
  ShieldCheck
} from 'lucide-react';
import NavItem from './NavItem';

interface SidebarProps {
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ className = '' }) => {
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

  const getRoleBasedLinks = () => {
    const role = user?.role?.toLowerCase();
    
    switch (role) {
      case 'admin':
        return [
          { id: 'dashboard', label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
          { id: 'marketplace', label: 'Marketplace', href: '/admin/marketplace', icon: Store },
          { id: 'installs', label: 'Install Requests', href: '/admin/installs', icon: Settings },
          { id: 'history', label: 'History', href: '/admin/history', icon: History },
          { id: 'users', label: 'Users', href: '/admin/users', icon: Users },
        ];
      
      case 'owner':
        return [
          { id: 'dashboard', label: 'Dashboard', href: '/owner/dashboard', icon: LayoutDashboard },
          { id: 'wallet', label: 'Wallet', href: '/owner/wallet', icon: Wallet },
          { id: 'vehicles', label: 'Vehicles', href: '/owner/vehicles', icon: Car },
          { id: 'devices', label: 'Devices', href: '/owner/devices', icon: Smartphone },
          { id: 'history', label: 'History', href: '/owner/history', icon: History },
          { id: 'marketplace', label: 'Marketplace', href: '/owner/marketplace', icon: Store },
        ];
      
      case 'service':
        return [
          { id: 'dashboard', label: 'Dashboard', href: '/sp/dashboard', icon: LayoutDashboard },
          { id: 'installs', label: 'Assigned Installs', href: '/sp/installs', icon: Wrench },
          { id: 'devices', label: 'Devices', href: '/sp/devices', icon: Smartphone },
        ];
      
      default:
        // Fallback for unknown roles
        return [
          { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        ];
    }
  };

  const getLinks = () => getRoleBasedLinks();

  return (
    <nav
      className={`h-full p-4 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-r border-gray-200 ${className}`}
      aria-label="Sidebar"
    >
      <div className="mb-4 px-2">
        <div className="h-10 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 flex items-center justify-center text-white font-semibold shadow-sm">
          <span className="text-sm tracking-wide">BlockX</span>
        </div>
      </div>
      <ul className="space-y-1">
        {getLinks().map((item) => (
          <NavItem
            key={item.id}
            item={item}
            isActive={activeSidebarItem === item.id}
            onClick={() => {
              dispatch(setActiveSidebarItem(item.id));
              navigate(item.href);
            }}
          />
        ))}
      </ul>
    </nav>
  );
};

export default Sidebar;