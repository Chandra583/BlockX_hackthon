import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../hooks/redux';
import { 
  LayoutDashboard,
  Users,
  Car,
  Store,
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
    { label: 'Marketplace', href: '/marketplace', icon: Store },
  ];

  const ownerLinks = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Marketplace', href: '/marketplace', icon: Store },
  ];

  const links = user.role === 'admin' ? adminLinks : ownerLinks;

  return (
    <nav
      className={`h-full p-4 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-r border-gray-200 ${className}`}
      aria-label="Sidebar"
    >
      <div className="mb-4 px-2">
        <div className="h-10 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 flex items-center justify-center text-white font-semibold shadow-sm">
          <span className="text-sm tracking-wide">Admin</span>
        </div>
      </div>
      <ul className="space-y-1">
        {links.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <button
                onClick={() => navigate(item.href)}
                className={`w-full flex items-center px-3 py-2 rounded-lg text-sm transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-r from-primary-50 to-indigo-50 text-gray-900 shadow-sm ring-1 ring-primary-100'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span
                  className={`mr-2 inline-flex items-center justify-center w-7 h-7 rounded-md border ${
                    isActive
                      ? 'bg-white border-primary-200 text-primary-600'
                      : 'bg-white border-gray-200 text-gray-500 group-hover:text-primary-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </span>
                <span className="flex-1 text-left">{item.label}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500" />
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default Sidebar;




