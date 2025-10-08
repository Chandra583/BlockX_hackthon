import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  LogOut, 
  Settings, 
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
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { logout } from '../../store/slices/authSlice';
import { usePermissions } from '../../hooks/usePermissions';
import { ROLE_LABELS } from '../../types/auth';

export const Header: React.FC = () => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();

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
    return icons[role as keyof typeof icons] || User;
  };

  const getRoleColor = (role: string) => {
    const colors = {
      admin: 'text-red-600 bg-red-50',
      owner: 'text-blue-600 bg-blue-50',
      buyer: 'text-green-600 bg-green-50',
      service: 'text-yellow-600 bg-yellow-50',
      insurance: 'text-purple-600 bg-purple-50',
      government: 'text-gray-600 bg-gray-50',
    };
    return colors[role as keyof typeof colors] || 'text-gray-600 bg-gray-50';
  };

  const navigationItems = [
    { name: 'Dashboard', href: '/dashboard', resource: 'dashboard', action: 'view' },
    { name: 'Vehicles', href: '/vehicles', resource: 'vehicle', action: 'view' },
    { name: 'Transactions', href: '/transactions', resource: 'transaction', action: 'view' },
    { name: 'Reports', href: '/reports', resource: 'report', action: 'view' },
    { name: 'Users', href: '/users', resource: 'user', action: 'view' },
    { name: 'Settings', href: '/settings', resource: 'settings', action: 'view' },
  ];

  const visibleNavItems = navigationItems.filter(item => hasPermission(item.resource, item.action));

  if (!isAuthenticated || !user) {
    return null;
  }

  const RoleIcon = getRoleIcon(user.role);
  const fullName = `${user.firstName} ${user.lastName}`;

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center mr-3">
                <span className="text-white font-bold text-sm">V</span>
              </div>
              <span className="text-xl font-bold text-gray-900">VERIDRIVE</span>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:ml-8 md:flex md:space-x-8">
              {visibleNavItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => navigate(item.href)}
                  className="text-gray-700 hover:text-primary-600 px-3 py-2 text-sm font-medium transition-colors"
                >
                  {item.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Right side - Desktop */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {/* Notifications */}
            <button className="p-2 text-gray-500 hover:text-gray-700 relative">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
            </button>

            {/* User Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                <div className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-50">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getRoleColor(user.role)}`}>
                    <RoleIcon className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">{fullName}</p>
                    <p className="text-xs text-gray-500">{ROLE_LABELS[user.role]}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </div>
              </button>

              {/* Profile Dropdown Menu */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{fullName}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-2 ${getRoleColor(user.role)}`}>
                      <RoleIcon className="w-3 h-3 mr-1" />
                      {ROLE_LABELS[user.role]}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => {
                      navigate('/profile');
                      setShowProfileMenu(false);
                    }}
                    className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <User className="w-4 h-4 mr-3" />
                    Profile Settings
                  </button>
                  
                  <button
                    onClick={() => {
                      navigate('/account-settings');
                      setShowProfileMenu(false);
                    }}
                    className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Settings className="w-4 h-4 mr-3" />
                    Account Settings
                  </button>
                  
                  <div className="border-t border-gray-100 mt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 text-gray-500 hover:text-gray-700"
            >
              {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {showMobileMenu && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {visibleNavItems.map((item) => (
              <button
                key={item.name}
                onClick={() => {
                  navigate(item.href);
                  setShowMobileMenu(false);
                }}
                className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-md"
              >
                {item.name}
              </button>
            ))}
          </div>
          
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="flex items-center px-5 mb-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getRoleColor(user.role)}`}>
                <RoleIcon className="w-5 h-5" />
              </div>
              <div className="ml-3">
                <p className="text-base font-medium text-gray-800">{fullName}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            </div>
            
            <div className="px-2 space-y-1">
              <button
                onClick={() => {
                  navigate('/profile');
                  setShowMobileMenu(false);
                }}
                className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-md"
              >
                Profile Settings
              </button>
              <button
                onClick={() => {
                  navigate('/account-settings');
                  setShowMobileMenu(false);
                }}
                className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-md"
              >
                Account Settings
              </button>
              <button
                onClick={handleLogout}
                className="block w-full text-left px-3 py-2 text-base font-medium text-red-600 hover:bg-red-50 rounded-md"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overlay for profile menu */}
      {showProfileMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowProfileMenu(false)}
        />
      )}
    </header>
  );
};

export default Header; 