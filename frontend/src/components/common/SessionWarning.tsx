import React, { useEffect, useState } from 'react';
import { AlertTriangle, Clock, X } from 'lucide-react';
import { useSession } from '../../hooks/useSession';

interface SessionWarningProps {
  onExtend?: () => void;
  onLogout?: () => void;
}

export const SessionWarning: React.FC<SessionWarningProps> = ({ 
  onExtend,
  onLogout 
}) => {
  const { showWarning, warningDetails, extendSession, endSession } = useSession();
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (warningDetails) {
      setTimeLeft(Math.ceil(warningDetails.timeRemaining / 1000));
      
      const countdown = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(countdown);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(countdown);
    }
  }, [warningDetails]);

  const handleExtend = () => {
    extendSession();
    onExtend?.();
  };

  const handleLogout = () => {
    endSession();
    onLogout?.();
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!showWarning || !warningDetails) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full mr-4">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Session Timeout Warning</h3>
              <p className="text-sm text-gray-600">Your session will expire soon</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-center p-4 bg-orange-50 rounded-lg">
            <Clock className="w-5 h-5 text-orange-600 mr-2" />
            <span className="text-orange-800 font-mono text-lg">
              {formatTime(timeLeft)}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-3 text-center">
            Your session will automatically end in the time shown above due to inactivity.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleExtend}
            className="btn-primary w-full"
          >
            Continue Session
          </button>
          <button
            onClick={handleLogout}
            className="btn-secondary w-full"
          >
            Sign Out Now
          </button>
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-700">
            <strong>Security Notice:</strong> We automatically sign out inactive users to protect your account.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SessionWarning; 