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
    // Set active item based on current path
    const path = location.pathname;
    if (path.includes('/dashboard')) dispatch(setActiveSidebarItem('dashboard'));
    else if (path.includes('/wallet')) dispatch(setActiveSidebarItem('wallet'));
    else if (path.includes('/vehicles')) dispatch(setActiveSidebarItem('vehicles'));
    else if (path.includes('/devices')) dispatch(setActiveSidebarItem('devices'));
    else if (path.includes('/history')) dispatch(setActiveSidebarItem('history'));
    else if (path.includes('/marketplace')) dispatch(setActiveSidebarItem('marketplace'));
    else if (path.includes('/admin')) dispatch(setActiveSidebarItem('admin'));
    else if (path.includes('/sp')) dispatch(setActiveSidebarItem('sp'));
  }, [location, dispatch]);

  if (!isAuthenticated || !user) return null;

  const commonLinks = [
    { id: 'dashboard', label: 'Dashboard', href: '/dashboard/home', icon: LayoutDashboard },
    { id: 'wallet', label: 'Wallet', href: '/wallet', icon: Wallet },
    { id: 'vehicles', label: 'Vehicles', href: '/vehicles', icon: Car },
    { id: 'devices', label: 'Devices', href: '/devices', icon: Smartphone },
    { id: 'history', label: 'History', href: '/history', icon: History },
    { id: 'marketplace', label: 'Marketplace', href: '/marketplace', icon: Store },
  ];

  const adminLinks = [
    { id: 'admin-installs', label: 'Install Requests', href: '/admin/installs', icon: Settings },
    { id: 'admin-users', label: 'Users', href: '/admin/users', icon: Users },
  ];

  const spLinks = [
    { id: 'sp-installs', label: 'Install Assignments', href: '/sp/installs', icon: Wrench },
  ];

  const getLinks = () => {
    if (user?.role === 'admin') return [...commonLinks, ...adminLinks];
    if (user?.role === 'service') return [...commonLinks, ...spLinks];
    return commonLinks;
  };

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