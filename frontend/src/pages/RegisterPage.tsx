import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RegisterForm } from '../components/auth/RegisterForm';
import { useAppSelector } from '../hooks/redux';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // Redirect to dashboard if already authenticated
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleRegisterSuccess = () => {
    navigate('/dashboard');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* VERIDRIVE Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-600 rounded-full mb-4">
            <span className="text-white font-bold text-2xl">V</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">VERIDRIVE</h1>
          <p className="text-lg text-gray-600">Anti-Fraud Vehicle Marketplace</p>
        </div>

        {/* Register Form */}
        <RegisterForm 
          onSuccess={handleRegisterSuccess}
          onLogin={handleLogin}
        />

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            © 2024 VERIDRIVE. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage; 