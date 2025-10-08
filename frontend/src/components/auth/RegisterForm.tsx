import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Lock, Mail, User, Phone, Building, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { loginStart, loginSuccess, loginFailure, clearError } from '../../store/slices/authSlice';
import { AuthService } from '../../services/auth';
import { handleApiError } from '../../services/api';
import type { RegisterFormData } from '../../types/auth';
import { USER_ROLES, ROLE_LABELS, generateDefaultRoleData } from '../../types/auth';

const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  role: z.enum([USER_ROLES.ADMIN, USER_ROLES.OWNER, USER_ROLES.BUYER, USER_ROLES.SERVICE, USER_ROLES.INSURANCE, USER_ROLES.GOVERNMENT]),
  phoneNumber: z.string().optional(),
  organization: z.string().optional(),
  termsAccepted: z.boolean().refine((val) => val === true, 'You must accept the terms and conditions'),
  privacyAccepted: z.boolean().refine((val) => val === true, 'You must accept the privacy policy'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

interface RegisterFormProps {
  onSuccess?: () => void;
  onLogin?: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ 
  onSuccess, 
  onLogin 
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    trigger,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      role: USER_ROLES.BUYER,
      phoneNumber: '',
      organization: '',
      termsAccepted: false,
      privacyAccepted: false,
    },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: RegisterFormData) => {
    try {
      dispatch(clearError());
      dispatch(loginStart());
      
      // Generate role-specific data based on selected role
      const roleSpecificData = generateDefaultRoleData(data.role, data.organization);
      
      // Prepare registration data with role-specific data
      const registrationData = {
        ...data,
        roleSpecificData
      };
      
      const response = await AuthService.register(registrationData);
      
      dispatch(loginSuccess({
        user: response.user,
        token: response.token,
        refreshToken: response.refreshToken,
      }));
      
      onSuccess?.();
    } catch (error) {
      const errorMessage = handleApiError(error);
      dispatch(loginFailure(errorMessage));
    }
  };

  const nextStep = async () => {
    const fieldsToValidate = currentStep === 1 
      ? ['email', 'password', 'confirmPassword'] 
      : ['firstName', 'lastName', 'role'];
    
    const isValid = await trigger(fieldsToValidate as (keyof RegisterFormData)[]);
    if (isValid) {
      setCurrentStep(2);
    }
  };

  const prevStep = () => {
    setCurrentStep(1);
  };

  const getRoleColor = (role: string) => {
    const colorMap: Record<string, string> = {
      [USER_ROLES.ADMIN]: 'bg-red-500',
      [USER_ROLES.OWNER]: 'bg-purple-500',
      [USER_ROLES.BUYER]: 'bg-green-500',
      [USER_ROLES.SERVICE]: 'bg-orange-500',
      [USER_ROLES.INSURANCE]: 'bg-blue-500',
      [USER_ROLES.GOVERNMENT]: 'bg-yellow-500',
    };
    return colorMap[role] || 'bg-gray-500';
  };

  const isRoleRequiresOrganization = (role: string) => {
    const rolesRequiringOrg = [USER_ROLES.SERVICE, USER_ROLES.INSURANCE, USER_ROLES.GOVERNMENT] as string[];
    return rolesRequiringOrg.includes(role);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h2>
          <p className="text-gray-600">Join the VERIDRIVE community</p>
        </div>

        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {currentStep > 1 ? <CheckCircle className="w-5 h-5" /> : '1'}
              </div>
              <div className={`w-12 h-0.5 ${currentStep >= 2 ? 'bg-primary-600' : 'bg-gray-200'}`}></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                2
              </div>
            </div>
          </div>
          <div className="flex justify-between text-sm text-gray-600 mt-2">
            <span>Account</span>
            <span>Profile</span>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {currentStep === 1 && (
            <>
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
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
                    className={`input-field pl-10 ${errors.email ? 'border-red-500' : ''}`}
                    placeholder="Enter your email"
                    disabled={isLoading}
                  />
                </div>
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
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
                    className={`input-field pl-10 pr-10 ${errors.password ? 'border-red-500' : ''}`}
                    placeholder="Create a strong password"
                    disabled={isLoading}
                  />
                  <button
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
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    {...register('confirmPassword')}
                    className={`input-field pl-10 pr-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                    placeholder="Confirm your password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-2 text-sm text-red-600">{errors.confirmPassword.message}</p>
                )}
              </div>

              {/* Next Button */}
              <button
                type="button"
                onClick={nextStep}
                className="btn-primary w-full"
                disabled={isLoading}
              >
                Continue
              </button>
            </>
          )}

          {currentStep === 2 && (
            <>
              {/* First Name Field */}
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="firstName"
                    type="text"
                    {...register('firstName')}
                    className={`input-field pl-10 ${errors.firstName ? 'border-red-500' : ''}`}
                    placeholder="Enter your first name"
                    disabled={isLoading}
                  />
                </div>
                {errors.firstName && (
                  <p className="mt-2 text-sm text-red-600">{errors.firstName.message}</p>
                )}
              </div>

              {/* Last Name Field */}
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="lastName"
                    type="text"
                    {...register('lastName')}
                    className={`input-field pl-10 ${errors.lastName ? 'border-red-500' : ''}`}
                    placeholder="Enter your last name"
                    disabled={isLoading}
                  />
                </div>
                {errors.lastName && (
                  <p className="mt-2 text-sm text-red-600">{errors.lastName.message}</p>
                )}
              </div>

              {/* Role Selection */}
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                  Select Your Role
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    id="role"
                    {...register('role')}
                    className={`input-field pl-10 ${errors.role ? 'border-red-500' : ''}`}
                    disabled={isLoading}
                  >
                    {Object.entries(ROLE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <div className={`absolute inset-y-0 right-12 w-3 h-3 rounded-full ${getRoleColor(selectedRole)} my-auto`}></div>
                </div>
                {errors.role && (
                  <p className="mt-2 text-sm text-red-600">{errors.role.message}</p>
                )}
              </div>

              {/* Phone Number Field */}
              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number <span className="text-gray-500">(optional)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="phoneNumber"
                    type="tel"
                    {...register('phoneNumber')}
                    className={`input-field pl-10 ${errors.phoneNumber ? 'border-red-500' : ''}`}
                    placeholder="Enter your phone number"
                    disabled={isLoading}
                  />
                </div>
                {errors.phoneNumber && (
                  <p className="mt-2 text-sm text-red-600">{errors.phoneNumber.message}</p>
                )}
              </div>

              {/* Organization Field (conditional) */}
              {isRoleRequiresOrganization(selectedRole) && (
                <div>
                  <label htmlFor="organization" className="block text-sm font-medium text-gray-700 mb-2">
                    Organization
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="organization"
                      type="text"
                      {...register('organization')}
                      className={`input-field pl-10 ${errors.organization ? 'border-red-500' : ''}`}
                      placeholder="Enter your organization name"
                      disabled={isLoading}
                    />
                  </div>
                  {errors.organization && (
                    <p className="mt-2 text-sm text-red-600">{errors.organization.message}</p>
                  )}
                </div>
              )}

              {/* Accept Terms */}
              <div className="flex items-start">
                <input
                  id="termsAccepted"
                  type="checkbox"
                  {...register('termsAccepted')}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-1"
                  disabled={isLoading}
                />
                <label htmlFor="termsAccepted" className="ml-3 block text-sm text-gray-700">
                  I accept the{' '}
                  <a href="/terms" className="text-primary-600 hover:text-primary-500 font-medium">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="/privacy" className="text-primary-600 hover:text-primary-500 font-medium">
                    Privacy Policy
                  </a>
                </label>
              </div>
              {errors.termsAccepted && (
                <p className="mt-2 text-sm text-red-600">{errors.termsAccepted.message}</p>
              )}

              {/* Accept Privacy Policy */}
              <div className="flex items-start">
                <input
                  id="privacyAccepted"
                  type="checkbox"
                  {...register('privacyAccepted')}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-1"
                  disabled={isLoading}
                />
                <label htmlFor="privacyAccepted" className="ml-3 block text-sm text-gray-700">
                  I accept the{' '}
                  <a href="/privacy" className="text-primary-600 hover:text-primary-500 font-medium">
                    Privacy Policy
                  </a>
                </label>
              </div>
              {errors.privacyAccepted && (
                <p className="mt-2 text-sm text-red-600">{errors.privacyAccepted.message}</p>
              )}

              {/* Navigation Buttons */}
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={prevStep}
                  className="btn-secondary w-full"
                  disabled={isLoading}
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary w-full flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin h-5 w-5 mr-2" />
                      Creating Account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </div>
            </>
          )}
        </form>

        {/* Login Link */}
        {onLogin && (
          <div className="mt-6 text-center">
            <div className="text-sm text-gray-600">
              Already have an account?{' '}
              <button
                type="button"
                onClick={onLogin}
                className="text-primary-600 hover:text-primary-500 font-medium"
                disabled={isLoading}
              >
                Sign in
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegisterForm; 