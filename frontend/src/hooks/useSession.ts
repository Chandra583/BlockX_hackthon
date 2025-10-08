import { useEffect, useState, useCallback } from 'react';
import { useAppSelector, useAppDispatch } from './redux';
import { logout } from '../store/slices/authSlice';
import { SessionManager, SessionPersistence } from '../services/sessionManager';

interface SessionWarningDetails {
  timeRemaining: number;
  onExtend: () => void;
  onLogout: () => void;
}

interface UseSessionReturn {
  isSessionActive: boolean;
  timeUntilLogout: number;
  showWarning: boolean;
  warningDetails: SessionWarningDetails | null;
  extendSession: () => void;
  endSession: () => void;
}

export const useSession = (): UseSessionReturn => {
  const [showWarning, setShowWarning] = useState(false);
  const [warningDetails, setWarningDetails] = useState<SessionWarningDetails | null>(null);
  const [timeUntilLogout, setTimeUntilLogout] = useState(0);
  
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  const extendSession = useCallback(() => {
    const sessionManager = SessionManager.getInstance();
    sessionManager.extendSession();
    setShowWarning(false);
    setWarningDetails(null);
  }, []);

  const endSession = useCallback(() => {
    dispatch(logout());
    SessionPersistence.clearSession();
  }, [dispatch]);

  useEffect(() => {
    if (!isAuthenticated) {
      setShowWarning(false);
      setWarningDetails(null);
      setTimeUntilLogout(0);
      return;
    }

    // Initialize session manager
    const sessionManager = SessionManager.getInstance();

    // Update time until logout periodically
    const updateTimer = setInterval(() => {
      setTimeUntilLogout(sessionManager.getTimeUntilLogout());
    }, 1000);

    // Session warning handler
    const handleSessionWarning = (event: CustomEvent<SessionWarningDetails>) => {
      setShowWarning(true);
      setWarningDetails(event.detail);
    };

    // Session warning clear handler
    const handleSessionWarningClear = () => {
      setShowWarning(false);
      setWarningDetails(null);
    };

    // Session logout handler
    const handleSessionLogout = (event: CustomEvent<{ reason: string }>) => {
      console.log('Session ended:', event.detail.reason);
      setShowWarning(false);
      setWarningDetails(null);
    };

    // Add event listeners
    window.addEventListener('sessionWarning', handleSessionWarning as EventListener);
    window.addEventListener('sessionWarningClear', handleSessionWarningClear);
    window.addEventListener('sessionLogout', handleSessionLogout as EventListener);

    return () => {
      clearInterval(updateTimer);
      window.removeEventListener('sessionWarning', handleSessionWarning as EventListener);
      window.removeEventListener('sessionWarningClear', handleSessionWarningClear);
      window.removeEventListener('sessionLogout', handleSessionLogout as EventListener);
    };
  }, [isAuthenticated]);

  // Save session data when user state changes
  useEffect(() => {
    if (isAuthenticated) {
      SessionPersistence.saveSession();
    } else {
      SessionPersistence.clearSession();
    }
  }, [isAuthenticated]);

  const isSessionActive = isAuthenticated && timeUntilLogout > 0;

  return {
    isSessionActive,
    timeUntilLogout,
    showWarning,
    warningDetails,
    extendSession,
    endSession,
  };
};

export default useSession; 