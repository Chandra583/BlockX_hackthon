import { AuthService } from '../services/auth';
import { JWTService } from './jwt';
import type { User } from '../store/slices/authSlice';

export interface LoginTestResult {
  success: boolean;
  data?: {
    user: User;
    token: string;
    refreshToken: string;
    storedCorrectly: boolean;
  };
  error?: string;
}

export class AuthTestService {
  /**
   * Test the complete login flow including localStorage storage
   */
  static async testLogin(email: string, password: string, rememberMe = true): Promise<LoginTestResult> {
    try {
      console.log('🧪 Starting login test...');
      
      // Clear existing auth data
      JWTService.removeTokens();
      
      // Attempt login
      console.log('📡 Attempting login...');
      const response = await AuthService.login({ email, password, rememberMe });
      
      console.log('✅ Login response received:', response);
      
      // Check if tokens are stored in localStorage
      const storedToken = JWTService.getToken();
      const storedRefreshToken = JWTService.getRefreshToken();
      const storedUser = JWTService.getStoredUser();
      
      console.log('💾 Checking localStorage...');
      console.log('Token stored:', !!storedToken);
      console.log('RefreshToken stored:', !!storedRefreshToken);
      console.log('User stored:', !!storedUser);
      
      const storedCorrectly = !!(storedToken && storedRefreshToken && storedUser);
      
      if (storedCorrectly) {
        console.log('✅ All data stored correctly in localStorage');
        try {
          const parsedUser = JSON.parse(storedUser);
          console.log('👤 Stored user:', parsedUser);
        } catch (e) {
          console.error('❌ Error parsing stored user:', e);
        }
      } else {
        console.log('❌ Some data missing from localStorage');
      }
      
      return {
        success: true,
        data: {
          user: response.user,
          token: response.token,
          refreshToken: response.refreshToken,
          storedCorrectly,
        },
      };
    } catch (error) {
      console.error('❌ Login test failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
  
  /**
   * Test JWT token functionality
   */
  static testJWTFunctionality(): void {
    console.log('🧪 Testing JWT functionality...');
    
    const token = JWTService.getToken();
    if (!token) {
      console.log('❌ No token found in localStorage');
      return;
    }
    
    console.log('🔍 Token format valid:', JWTService.isValidTokenFormat(token));
    console.log('⏰ Token expired:', JWTService.isTokenExpired(token));
    console.log('⚠️ Token expiring soon:', JWTService.isTokenExpiringSoon(token));
    console.log('🔐 User authenticated:', JWTService.isAuthenticated());
    
    const tokenData = JWTService.getUserFromToken(token);
    console.log('👤 Token data:', tokenData);
  }
  
  /**
   * Test the complete auth initialization
   */
  static testAuthInitialization(): void {
    console.log('🧪 Testing auth initialization...');
    
    const authData = JWTService.initializeAuth();
    console.log('🔄 Auth initialization result:', authData);
  }
  
  /**
   * Run all auth tests
   */
  static async runAllTests(email: string, password: string): Promise<void> {
    console.log('🧪 Running comprehensive auth tests...');
    
    // Test 1: Login flow
    console.log('\n--- Test 1: Login Flow ---');
    const loginResult = await this.testLogin(email, password);
    console.log('Login test result:', loginResult);
    
    if (loginResult.success) {
      // Test 2: JWT functionality
      console.log('\n--- Test 2: JWT Functionality ---');
      this.testJWTFunctionality();
      
      // Test 3: Auth initialization
      console.log('\n--- Test 3: Auth Initialization ---');
      this.testAuthInitialization();
    }
    
    console.log('\n🏁 All tests completed!');
  }
}

// Make it available globally for testing in browser console
declare global {
  interface Window {
    AuthTestService: typeof AuthTestService;
  }
}

if (typeof window !== 'undefined') {
  window.AuthTestService = AuthTestService;
} 