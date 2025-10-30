import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LoginForm } from '../components/auth/LoginForm';
import { useAppSelector } from '../hooks/redux';

const roleToRoute = (role: string) => {
  switch ((role || '').toLowerCase()) {
    case 'admin': return '/admin/dashboard';
    case 'owner': return '/owner/dashboard';
    case 'buyer': return '/buyer/dashboard';
    case 'service': return '/sp/dashboard';
    case 'insurance': return '/insurance/dashboard';
    case 'government': return '/government/dashboard';
    default: return '/dashboard';
  }
};

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const [showRolePicker, setShowRolePicker] = useState(false);

  useEffect(() => {
    // Redirect to dashboard if already authenticated
    if (isAuthenticated && user) {
      const roles: string[] = (user as any)?.roles || (user?.role ? [user.role] : []);
      const hasMultiple = Array.isArray(roles) && roles.length > 1;
      
      // Check localStorage for selected role
      const selected = typeof window !== 'undefined' ? window.localStorage.getItem('selectedRole') : null;
      
      if (selected && selected !== 'auto' && roles.includes(selected as any)) {
        // Valid selected role, navigate to its dashboard
        navigate(roleToRoute(selected), { replace: true });
        return;
      }
      
      if (hasMultiple) {
        // Multiple roles but no valid selection, show picker
        setShowRolePicker(true);
        return;
      }
      
      // Single role, navigate to that dashboard
      const effectiveRole = roles[0] || user.role;
      if (effectiveRole) {
        try { window.localStorage.setItem('selectedRole', effectiveRole); } catch (_e) { void 0; }
        navigate(roleToRoute(effectiveRole), { replace: true });
      } else {
        navigate('/dashboard');
      }
    }
  }, [isAuthenticated, navigate, user]);

  const handleSuccess = () => {
    // Check if role was selected from dropdown before login
    const selectedFromDropdown = typeof window !== 'undefined' ? window.localStorage.getItem('selectedRole') : null;
    if (selectedFromDropdown && selectedFromDropdown !== 'auto') {
      navigate(roleToRoute(selectedFromDropdown), { replace: true });
      return;
    }

    // Get roles from user (after login, user should be available in state)
    const roles: string[] = (user as any)?.roles || (user?.role ? [user.role] : []);
    const hasMultiple = Array.isArray(roles) && roles.length > 1;
    
    if (hasMultiple) {
      // Multiple roles, show picker
      setShowRolePicker(true);
      return;
    }
    
    // Single role, navigate to that dashboard
    const effectiveRole = roles[0] || (user as any)?.role;
    if (effectiveRole) {
      try { window.localStorage.setItem('selectedRole', effectiveRole); } catch (_e) { void 0; }
      navigate(roleToRoute(effectiveRole), { replace: true });
    } else {
      navigate('/dashboard');
    }
  };

  const handleRegister = () => {
    navigate('/register');
  };

  const handleForgotPassword = () => {
    navigate('/forgot-password');
  };

  const roles: string[] = (user as any)?.roles || (user?.role ? [user.role] : []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            background: [
              "radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.15) 0%, transparent 50%)",
              "radial-gradient(circle at 80% 20%, rgba(147, 51, 234, 0.15) 0%, transparent 50%)",
              "radial-gradient(circle at 40% 40%, rgba(16, 185, 129, 0.1) 0%, transparent 50%)"
            ]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0"
        />
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-blue-400/20 rounded-full"
            animate={{ x: [0, 100, 0], y: [0, -100, 0], opacity: [0, 1, 0] }}
            transition={{ duration: 3 + i * 0.2, repeat: Infinity, delay: i * 0.1 }}
            style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
          />
        ))}
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* VERIDRIVE Logo with Animation */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-8"
        >
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full mb-6 shadow-2xl"
          >
            <motion.span
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-white font-bold text-3xl"
            >
              V
            </motion.span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-5xl font-black text-white mb-3 gradient-text"
          >
            VERIDRIVE
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-xl text-gray-300 font-medium"
          >
            Reinventing Vehicle Trust with Blockchain
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="mt-4 inline-flex items-center px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-semibold border border-emerald-500/30"
          >
            🔒 Blockchain Secured
          </motion.div>
        </motion.div>

        {/* Login Form */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="space-y-4"
        >
          <LoginForm 
            onSuccess={handleSuccess}
            onRegister={handleRegister}
            onForgotPassword={handleForgotPassword}
          />

          {/* Inline Role Picker (shown after login if multiple roles) */}
          {showRolePicker && roles.length > 1 && (
            <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-4">
              <div className="text-slate-200 font-medium mb-2">Select a role</div>
              <div className="text-slate-400 text-sm mb-3">Your account has multiple roles. Choose one to continue.</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {roles.map((role) => (
                  <button
                    key={role}
                    onClick={() => {
                      try { window.localStorage.setItem('selectedRole', role); } catch (_e) { void 0; }
                      navigate(roleToRoute(role), { replace: true });
                    }}
                    className="text-left rounded-lg border border-slate-700 bg-slate-900/50 hover:bg-slate-900 transition p-3"
                  >
                    <div className="text-slate-200 font-medium capitalize">{role}</div>
                    <div className="text-xs text-slate-400 mt-1">Go to {role} dashboard</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="mt-8 text-center"
        >
          <p className="text-sm text-gray-400">
            © 2024 VERIDRIVE. All rights reserved.
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Powered by Blockchain Technology
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage; 