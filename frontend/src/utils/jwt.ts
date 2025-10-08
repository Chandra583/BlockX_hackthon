// JWT token utilities
interface JWTPayload {
  id: string;
  email: string;
  role: string;
  exp: number;
  iat: number;
}

export class JWTService {
  private static readonly TOKEN_KEY = 'token';
  private static readonly REFRESH_TOKEN_KEY = 'refreshToken';
  private static readonly USER_KEY = 'user';

  // Get tokens from localStorage
  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  static getStoredUser(): string | null {
    return localStorage.getItem(this.USER_KEY);
  }

  // Store tokens in localStorage
  static setTokens(token: string, refreshToken: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
  }

  static setUser(user: object): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  // Remove tokens from localStorage
  static removeTokens(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  // Decode JWT token (without verification)
  static decodeToken(token: string): JWTPayload | null {
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
      console.error('Error decoding token:', error);
      return null;
    }
  }

  // Check if token is expired
  static isTokenExpired(token: string): boolean {
    const payload = this.decodeToken(token);
    if (!payload) return true;
    
    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  }

  // Check if token is about to expire (within 5 minutes)
  static isTokenExpiringSoon(token: string): boolean {
    const payload = this.decodeToken(token);
    if (!payload) return true;
    
    const currentTime = Date.now() / 1000;
    const fiveMinutesFromNow = currentTime + (5 * 60);
    return payload.exp < fiveMinutesFromNow;
  }

  // Validate token format
  static isValidTokenFormat(token: string): boolean {
    const parts = token.split('.');
    return parts.length === 3;
  }

  // Check if user is authenticated
  static isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    
    if (!this.isValidTokenFormat(token)) return false;
    
    return !this.isTokenExpired(token);
  }

  // Get user info from token
  static getUserFromToken(token: string): Partial<JWTPayload> | null {
    const payload = this.decodeToken(token);
    if (!payload) return null;
    
    return {
      id: payload.id,
      email: payload.email,
      role: payload.role,
    };
  }

  // Check if refresh is needed
  static needsRefresh(): boolean {
    const token = this.getToken();
    if (!token) return false;
    
    return this.isTokenExpiringSoon(token);
  }

  // Initialize authentication state from localStorage
  static initializeAuth(): {
    isAuthenticated: boolean;
    user: object | null;
    token: string | null;
    refreshToken: string | null;
  } {
    const token = this.getToken();
    const refreshToken = this.getRefreshToken();
    const storedUser = this.getStoredUser();
    
    let user = null;
    let isAuthenticated = false;
    
    if (token && this.isAuthenticated()) {
      isAuthenticated = true;
      if (storedUser) {
        try {
          user = JSON.parse(storedUser);
        } catch (error) {
          console.error('Error parsing stored user:', error);
        }
      }
    } else {
      // Clean up invalid tokens
      this.removeTokens();
    }
    
    return {
      isAuthenticated,
      user,
      token,
      refreshToken,
    };
  }
}

export default JWTService; 