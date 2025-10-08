import { store } from '../store/store';
import { refreshTokenStart, refreshTokenSuccess, refreshTokenFailure, logout } from '../store/slices/authSlice';
import { AuthService } from './auth';
import { JWTService } from '../utils/jwt';

export class TokenRefreshService {
  private static refreshPromise: Promise<boolean> | null = null;
  private static refreshInterval: NodeJS.Timeout | null = null;
  private static readonly REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

  // Start automatic token refresh checking
  static startRefreshTimer(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }

    this.refreshInterval = setInterval(() => {
      this.checkAndRefreshToken();
    }, this.REFRESH_INTERVAL);
  }

  // Stop automatic token refresh checking
  static stopRefreshTimer(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  // Check if token needs refresh and refresh if needed
  static async checkAndRefreshToken(): Promise<boolean> {
    const state = store.getState();
    const { isAuthenticated } = state.auth;

    if (!isAuthenticated) {
      return false;
    }

    if (JWTService.needsRefresh()) {
      return this.refreshTokens();
    }

    return true;
  }

  // Refresh JWT tokens
  static async refreshTokens(): Promise<boolean> {
    // If there's already a refresh in progress, return that promise
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.performTokenRefresh();
    const result = await this.refreshPromise;
    this.refreshPromise = null;
    return result;
  }

  // Perform the actual token refresh
  private static async performTokenRefresh(): Promise<boolean> {
    const state = store.getState();
    const { refreshToken } = state.auth;

    if (!refreshToken) {
      store.dispatch(logout());
      return false;
    }

    try {
      store.dispatch(refreshTokenStart());

      const response = await AuthService.refreshToken(refreshToken);
      
      store.dispatch(refreshTokenSuccess({
        token: response.token,
        refreshToken: response.refreshToken,
      }));

      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      store.dispatch(refreshTokenFailure('Session expired. Please log in again.'));
      return false;
    }
  }

  // Force refresh token (useful for manual refresh)
  static async forceRefresh(): Promise<boolean> {
    this.refreshPromise = null; // Reset any existing refresh promise
    return this.refreshTokens();
  }

  // Initialize the service
  static initialize(): void {
    const state = store.getState();
    const { isAuthenticated } = state.auth;

    if (isAuthenticated) {
      // Check if we need to refresh immediately
      this.checkAndRefreshToken();
      // Start the refresh timer
      this.startRefreshTimer();
    }
  }

  // Clean up the service
  static cleanup(): void {
    this.stopRefreshTimer();
    this.refreshPromise = null;
  }
}

export default TokenRefreshService; 