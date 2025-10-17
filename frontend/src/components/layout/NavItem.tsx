import React from 'react';
import { useAppDispatch } from '../../hooks/redux';
import { setActiveSidebarItem } from '../../store/uiSlice';

interface NavItemProps {
  item: {
    id: string;
    label: string;
    href: string;
    icon: React.ComponentType<any>;
  };
  isActive: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ item, isActive, onClick }) => {
  const dispatch = useAppDispatch();
  const Icon = item.icon;
  
  return (
    <li>
      <button
        onClick={() => {
          dispatch(setActiveSidebarItem(item.id));
          onClick();
        }}
        className={`w-full flex items-center px-3 py-2 rounded-lg text-sm transition-all duration-200 group ${
          isActive
            ? 'bg-gradient-to-r from-purple-50 to-cyan-50 text-gray-900 shadow-sm ring-1 ring-purple-100'
            : 'text-gray-700 hover:bg-gray-50'
        }`}
        aria-current={isActive ? 'page' : undefined}
      >
        <span
          className={`mr-3 inline-flex items-center justify-center w-8 h-8 rounded-md ${
            isActive
              ? 'bg-white text-purple-600 shadow-sm'
              : 'bg-gray-100 text-gray-500 group-hover:text-purple-600'
          }`}
        >
          <Icon className="w-4 h-4" />
        </span>
        <span className="flex-1 text-left font-medium">{item.label}</span>
        {isActive && (
          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-500" />
        )}
      </button>
    </li>
  );
};

export default NavItem;