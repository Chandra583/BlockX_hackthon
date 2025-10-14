import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../hooks/redux';
import { 
  LayoutDashboard,
  Users,
  Car,
} from 'lucide-react';

interface SidebarProps {
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ className = '' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  if (!isAuthenticated || !user) return null;

  const adminLinks = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Users', href: '/admin/users', icon: Users },
    { label: 'Vehicles', href: '/admin/vehicles', icon: Car },
  ];

  const ownerLinks = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  ];

  const links = user.role === 'admin' ? adminLinks : ownerLinks;

  return (
    <nav className={`h-full p-4 ${className}`} aria-label="Sidebar">
      <ul className="space-y-1">
        {links.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <button
                onClick={() => navigate(item.href)}
                className={`w-full flex items-center px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                <span>{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default Sidebar;



