import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface NavItemProps {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  isCollapsed?: boolean;
  onClick?: () => void;
}

export const NavItem: React.FC<NavItemProps> = ({
  label,
  href,
  icon: Icon,
  badge,
  isCollapsed = false,
  onClick
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = () => {
    if (href === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(href);
  };

  const handleClick = () => {
    navigate(href);
    onClick?.();
  };

  const active = isActive();

  return (
    <button
      onClick={handleClick}
      className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
        active
          ? 'bg-gradient-to-r from-primary-50 to-indigo-50 text-primary-700 border border-primary-200'
          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
      }`}
      title={isCollapsed ? label : undefined}
    >
      <div className={`flex items-center justify-center w-5 h-5 ${
        active ? 'text-primary-600' : 'text-gray-500 group-hover:text-gray-700'
      }`}>
        <Icon className="w-5 h-5" />
      </div>
      
      {!isCollapsed && (
        <>
          <span className="ml-3 flex-1 text-left">{label}</span>
          {badge && badge > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-red-500 text-white rounded-full">
              {badge}
            </span>
          )}
        </>
      )}
      
      {isCollapsed && badge && badge > 0 && (
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
      )}
    </button>
  );
};

export default NavItem;
