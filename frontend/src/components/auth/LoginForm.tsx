import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, Mail, AlertCircle, Loader2, Shield, Sparkles } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { loginStart, loginSuccess, loginFailure, clearError } from '../../store/slices/authSlice';
import { AuthService } from '../../services/auth';
import { handleApiError } from '../../services/api';
import type { LoginFormData } from '../../types/auth';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean().optional(),
});

interface LoginFormProps {
  onSuccess?: () => void;
  onForgotPassword?: () => void;
  onRegister?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ 
  onSuccess, 
  onForgotPassword, 
  onRegister 
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      dispatch(clearError());
      dispatch(loginStart());
      
      console.log('Login attempt with data:', data);
      
      const response = await AuthService.login(data);
      
      console.log('Login response:', response);
      
      dispatch(loginSuccess({
        user: response.user,
        token: response.token,
        refreshToken: response.refreshToken,
        rememberMe: data.rememberMe || false,
      }));
      
      console.log('Login successful, navigating...');
      onSuccess?.();
    } catch (error) {
      console.error('Login failed:', error);
      const errorMessage = handleApiError(error);
      dispatch(loginFailure(errorMessage));
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="flex items-center justify-center mb-4"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mr-3"
            >
              <Shield className="w-6 h-6 text-white" />
            </motion.div>
            <h2 className="text-3xl font-bold text-white mb-2">Sign In</h2>
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-gray-300"
          >
            Access your VERIDRIVE account
          </motion.p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center backdrop-blur-sm"
          >
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <span className="text-red-300 text-sm">{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Email Field */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                type="email"
                {...register('email')}
                className={`w-full px-3 py-3 pl-10 bg-slate-700/50 backdrop-blur-sm border border-slate-600/50 rounded-xl text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 ${errors.email ? 'border-red-500' : ''}`}
                placeholder="Enter your email"
                disabled={isLoading}
              />
            </div>
            {errors.email && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 text-sm text-red-400">{errors.email.message}</motion.p>
            )}
          </motion.div>

          {/* Password Field */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                className={`w-full px-3 py-3 pl-10 pr-10 bg-slate-700/50 backdrop-blur-sm border border-slate-600/50 rounded-xl text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 ${errors.password ? 'border-red-500' : ''}`}
                placeholder="Enter your password"
                disabled={isLoading}
              />
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </motion.button>
            </div>
            {errors.password && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 text-sm text-red-400">{errors.password.message}</motion.p>
            )}
          </motion.div>

          {/* Remember Me */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="flex items-center"
          >
            <input
              id="rememberMe"
              type="checkbox"
              {...register('rememberMe')}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-600 rounded bg-slate-700/50"
              disabled={isLoading}
            />
            <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-300">
              Remember me for 30 days
            </label>
          </motion.div>

          {/* Submit Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin h-5 w-5 mr-2" />
                Signing in...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 mr-2" />
                Sign In
              </>
            )}
          </motion.button>
        </form>

        {/* Additional Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mt-6 text-center space-y-4"
        >
          {onForgotPassword && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              type="button"
              onClick={onForgotPassword}
              className="text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
              disabled={isLoading}
            >
              Forgot your password?
            </motion.button>
          )}
          
          {onRegister && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.6 }}
              className="text-sm text-gray-400"
            >
              Don't have an account?{' '}
              <motion.button
                whileHover={{ scale: 1.05 }}
                type="button"
                onClick={onRegister}
                className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                disabled={isLoading}
              >
                Sign up
              </motion.button>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LoginForm; 