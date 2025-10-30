import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield,
  Car,
  ShoppingCart,
  Wrench,
  FileText,
  Building,
  ChevronDown,
  Check
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { setSelectedRole, type UserRole } from '../../store/slices/authSlice';
import { ROLE_LABELS } from '../../types/auth';
import toast from 'react-hot-toast';

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

const getRoleDashboard = (role: UserRole): string => {
  const routes = {
    admin: '/admin/dashboard',
    owner: '/owner/dashboard',
    buyer: '/buyer/dashboard',
    service: '/sp/dashboard',
    insurance: '/insurance/dashboard',
    government: '/government/dashboard',
  };
  return routes[role] || '/dashboard';
};

export const RoleSelector: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, selectedRole } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  if (!user) return null;

  const userRoles = user.roles || (user.role ? [user.role] : []);
  const activeRole = selectedRole || user.role;

  // Don't show if user has only one role
  if (userRoles.length <= 1) {
    return null;
  }

  const handleRoleChange = (role: UserRole) => {
    if (role === activeRole) {
      setIsOpen(false);
      return;
    }

    // Validate role is in user's roles
    if (!userRoles.includes(role)) {
      toast.error('You do not have permission for this role');
      return;
    }

    // Update selected role in state and localStorage
    dispatch(setSelectedRole(role));
    
    // Navigate to role dashboard
    const dashboardRoute = getRoleDashboard(role);
    navigate(dashboardRoute, { replace: true });
    
    // Show success toast
    toast.success(`Switched to ${ROLE_LABELS[role]} view`);
    setIsOpen(false);
  };

  const RoleIcon = getRoleIcon(activeRole);

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 px-3 py-2 rounded-xl transition-all duration-200 border ${
          isOpen 
            ? 'bg-blue-500/20 border-blue-500/50' 
            : 'bg-slate-800/50 hover:bg-slate-700/50 border-slate-700/50'
        }`}
      >
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getRoleColor(activeRole)}`}>
          <RoleIcon className="w-4 h-4" />
        </div>
        <div className="text-left hidden lg:block">
          <p className="text-xs text-gray-400">Role</p>
          <p className="text-sm font-semibold text-white">{ROLE_LABELS[activeRole]}</p>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown Menu */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-2 w-64 bg-slate-800/95 backdrop-blur-xl rounded-xl shadow-2xl border border-slate-700/50 overflow-hidden z-50"
            >
              <div className="p-2">
                <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-slate-700/50 mb-2">
                  Switch Role
                </div>
                
                {userRoles.map((role) => {
                  const Icon = getRoleIcon(role);
                  const isActive = role === activeRole;
                  
                  return (
                    <motion.button
                      key={role}
                      whileHover={{ x: 4 }}
                      onClick={() => handleRoleChange(role)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 ${
                        isActive
                          ? `${getRoleColor(role)} font-semibold`
                          : 'text-gray-300 hover:bg-slate-700/50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          isActive ? getRoleColor(role) : 'bg-slate-700/50'
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-sm">{ROLE_LABELS[role]}</span>
                      </div>
                      {isActive && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        >
                          <Check className="w-4 h-4" />
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
              
              <div className="px-3 py-2 text-xs text-gray-500 border-t border-slate-700/50">
                Your active role affects what you see and what actions you can perform.
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RoleSelector;

