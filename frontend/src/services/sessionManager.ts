import { store } from '../store/store';
import { logout } from '../store/slices/authSlice';

export interface SessionConfig {
  maxIdleTime: number; // in milliseconds
  warningTime: number; // in milliseconds before logout
  checkInterval: number; // in milliseconds
}

export class SessionManager {
  private static instance: SessionManager | null = null;
  private lastActivity: number = Date.now();
  private warningTimer: NodeJS.Timeout | null = null;
  private logoutTimer: NodeJS.Timeout | null = null;
  private checkTimer: NodeJS.Timeout | null = null;
  private isWarningShown: boolean = false;
  private config: SessionConfig;

  // Default configuration
  private static readonly DEFAULT_CONFIG: SessionConfig = {
    maxIdleTime: 30 * 60 * 1000, // 30 minutes
    warningTime: 5 * 60 * 1000,  // 5 minutes before logout
    checkInterval: 60 * 1000,    // Check every minute
  };

  // Remember me configuration (30 days)
  private static readonly REMEMBER_ME_CONFIG: SessionConfig = {
    maxIdleTime: 30 * 24 * 60 * 60 * 1000, // 30 days
    warningTime: 24 * 60 * 60 * 1000,     // 1 day before logout
    checkInterval: 60 * 60 * 1000,         // Check every hour
  };

  private constructor(config: Partial<SessionConfig> = {}) {
    // Check if user has "remember me" enabled by looking at token expiry
    const rememberMe = this.checkRememberMeStatus();
    const baseConfig = rememberMe ? SessionManager.REMEMBER_ME_CONFIG : SessionManager.DEFAULT_CONFIG;
    this.config = { ...baseConfig, ...config };
    this.setupActivityListeners();
    this.startSessionCheck();
  }

  // Check if "remember me" is enabled by examining token expiry
  private checkRememberMeStatus(): boolean {
    try {
      const state = store.getState();
      const { refreshToken } = state.auth;
      
      if (!refreshToken) return false;
      
      // Decode the refresh token to check its expiry
      const payload = this.decodeJWT(refreshToken);
      if (!payload || !payload.exp) return false;
      
      // If refresh token expires in more than 7 days, it's likely "remember me"
      const tokenExpiry = payload.exp * 1000; // Convert to milliseconds
      const sevenDaysFromNow = Date.now() + (7 * 24 * 60 * 60 * 1000);
      
      return tokenExpiry > sevenDaysFromNow;
    } catch (error) {
      console.error('Error checking remember me status:', error);
      return false;
    }
  }

  // Decode JWT token (without verification)~
  private decodeJWT(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        window.atob(base64)
          .split('')
          .map((c) => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`)
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decoding JWT:', error);
      return null;~
    }
  }

  // Singleton pattern
  static getInstance(config?: Partial<SessionConfig>): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager(config);
    }
    return SessionManager.instance;
  }

  // Initialize session management
  static initialize(config?: Partial<SessionConfig>): void {
    SessionManager.getInstance(config);
  }

  // Reinitialize session manager (useful after login)
  static reinitialize(): void {
    SessionManager.destroy();
    SessionManager.initialize();
  }

  // Set remember me status manually
  static setRememberMe(rememberMe: boolean): void {
    const config = rememberMe ? SessionManager.REMEMBER_ME_CONFIG : SessionManager.DEFAULT_CONFIG;
    SessionManager.destroy();
    SessionManager.initialize(config);
  }

  // Update last activity timestamp
  private updateActivity(): void {
    this.lastActivity = Date.now();
    this.clearWarning();
  }

  // Setup event listeners for user activity
  private setupActivityListeners(): void {
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];

    const activityHandler = () => this.updateActivity();

    events.forEach(event => {
      document.addEventListener(event, activityHandler, true);
    });

    // Listen for visibility change
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.updateActivity();
      }
    });
  }

  // Start session checking
  private startSessionCheck(): void {
    this.checkTimer = setInterval(() => {
      this.checkSession();
    }, this.config.checkInterval);
  }

  // Check session status
  private checkSession(): void {
    const state = store.getState();
    const { isAuthenticated } = state.auth;

    if (!isAuthenticated) {
      this.stop();
      return;
    }

    const now = Date.now();
    const timeSinceActivity = now - this.lastActivity;
    const timeUntilLogout = this.config.maxIdleTime - timeSinceActivity;

    // Check if user should be logged out
    if (timeSinceActivity >= this.config.maxIdleTime) {
      this.performLogout('Session expired due to inactivity');
      return;
    }

    // Check if warning should be shown
    if (timeUntilLogout <= this.config.warningTime && !this.isWarningShown) {
      this.showWarning(timeUntilLogout);
    }
  }

  // Show session warning
  private showWarning(timeRemaining: number): void {
    this.isWarningShown = true;
    
    // Dispatch a custom event for components to listen to
    const warningEvent = new CustomEvent('sessionWarning', {
      detail: { 
        timeRemaining,
        onExtend: () => this.extendSession(),
        onLogout: () => this.performLogout('User chose to logout'),
      }
    });
    
    window.dispatchEvent(warningEvent);

    // Set logout timer
    this.logoutTimer = setTimeout(() => {
      this.performLogout('Session expired due to inactivity');
    }, timeRemaining);
  }

  // Clear warning state
  private clearWarning(): void {
    if (this.isWarningShown) {
      this.isWarningShown = false;
      
      if (this.warningTimer) {
        clearTimeout(this.warningTimer);
        this.warningTimer = null;
      }

      if (this.logoutTimer) {
        clearTimeout(this.logoutTimer);
        this.logoutTimer = null;
      }

      // Dispatch event to hide warning
      const clearEvent = new CustomEvent('sessionWarningClear');
      window.dispatchEvent(clearEvent);
    }
  }

  // Extend session
  public extendSession(): void {
    this.updateActivity();
  }

  // Perform logout
  private performLogout(reason: string): void {
    console.log('Session logout:', reason);
    
    // Dispatch logout event
    const logoutEvent = new CustomEvent('sessionLogout', {
      detail: { reason }
    });
    window.dispatchEvent(logoutEvent);

    // Perform Redux logout
    store.dispatch(logout());
    
    this.stop();
  }

  // Stop session management
  public stop(): void {
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
    }

    this.clearWarning();
  }

  // Get time until logout
  public getTimeUntilLogout(): number {
    const timeSinceActivity = Date.now() - this.lastActivity;
    return Math.max(0, this.config.maxIdleTime - timeSinceActivity);
  }

  // Check if session is active
  public isSessionActive(): boolean {
    const state = store.getState();
    return state.auth.isAuthenticated && this.getTimeUntilLogout() > 0;
  }

  // Update configuration
  public updateConfig(newConfig: Partial<SessionConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Get current configuration
  public getConfig(): SessionConfig {
    return { ...this.config };
  }

  // Destroy instance (for cleanup)
  static destroy(): void {
    if (SessionManager.instance) {
      SessionManager.instance.stop();
      SessionManager.instance = null;
    }
  }
}

// Session persistence utilities
export class SessionPersistence {
  private static readonly SESSION_KEY = 'session_data';
  private static readonly LAST_ACTIVITY_KEY = 'last_activity';

  // Save session data
  static saveSession(): void {
    const state = store.getState();
    const { isAuthenticated, user } = state.auth;

    if (isAuthenticated && user) {
      const sessionData = {
        user,
        timestamp: Date.now(),
        lastActivity: Date.now(),
      };

      try {
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData));
        localStorage.setItem(this.LAST_ACTIVITY_KEY, Date.now().toString());
      } catch (error) {
        console.error('Failed to save session:', error);
      }
    }
  }

  // Load session data
  static loadSession(): { user: object; lastActivity: number } | null {
    try {
      const sessionData = localStorage.getItem(this.SESSION_KEY);
      const lastActivity = localStorage.getItem(this.LAST_ACTIVITY_KEY);

      if (sessionData && lastActivity) {
        const parsed = JSON.parse(sessionData);
        return {
          user: parsed.user,
          lastActivity: parseInt(lastActivity, 10),
        };
      }
    } catch (error) {
      console.error('Failed to load session:', error);
    }

    return null;
  }

  // Clear session data
  static clearSession(): void {
    localStorage.removeItem(this.SESSION_KEY);
    localStorage.removeItem(this.LAST_ACTIVITY_KEY);
  }

  // Check if stored session is valid
  static isStoredSessionValid(maxAge: number = 24 * 60 * 60 * 1000): boolean {
    try {
      const sessionData = localStorage.getItem(this.SESSION_KEY);
      if (!sessionData) return false;

      const parsed = JSON.parse(sessionData);
      const age = Date.now() - parsed.timestamp;
      
      return age < maxAge;
    } catch {
      return false;
    }
  }
}

export default SessionManager; 