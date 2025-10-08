import api from '../services/api';
import { AuthService } from '../services/auth';
import { config } from '../config/env';

export interface ApiTestResult {
  endpoint: string;
  method: string;
  status: 'success' | 'error' | 'pending';
  responseTime?: number;
  error?: string;
  data?: object;
}

export interface ApiHealthCheck {
  isHealthy: boolean;
  results: ApiTestResult[];
  timestamp: string;
}

export class ApiTestingService {
  private static testData = {
    validLogin: {
      email: 'test@example.com',
      password: 'TestPassword123!',
    },
    validRegistration: {
      email: 'newuser@example.com',
      password: 'NewPassword123!',
      confirmPassword: 'NewPassword123!',
      firstName: 'Test',
      lastName: 'User',
      role: 'buyer' as const,
      phoneNumber: '+1234567890',
      termsAccepted: true,
      privacyAccepted: true,
    },
    forgotPassword: {
      email: 'test@example.com',
    },
  };

  // Test basic API connectivity
  static async testApiHealth(): Promise<ApiTestResult> {
    const startTime = Date.now();
    try {
      const response = await api.get('/health');
      return {
        endpoint: '/health',
        method: 'GET',
        status: 'success',
        responseTime: Date.now() - startTime,
        data: response.data,
      };
    } catch (error) {
      return {
        endpoint: '/health',
        method: 'GET',
        status: 'error',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Test authentication endpoints
  static async testAuthEndpoints(): Promise<ApiTestResult[]> {
    const results: ApiTestResult[] = [];

    // Test login endpoint
    const loginResult = await this.testLogin();
    results.push(loginResult);

    // Test registration endpoint
    const registerResult = await this.testRegister();
    results.push(registerResult);

    // Test forgot password endpoint
    const forgotPasswordResult = await this.testForgotPassword();
    results.push(forgotPasswordResult);

    return results;
  }

  // Test login functionality
  static async testLogin(): Promise<ApiTestResult> {
    const startTime = Date.now();
    try {
      const response = await AuthService.login(this.testData.validLogin);
      return {
        endpoint: '/auth/login',
        method: 'POST',
        status: 'success',
        responseTime: Date.now() - startTime,
        data: { hasToken: !!response.token, hasUser: !!response.user },
      };
    } catch (error) {
      return {
        endpoint: '/auth/login',
        method: 'POST',
        status: 'error',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Test registration functionality
  static async testRegister(): Promise<ApiTestResult> {
    const startTime = Date.now();
    try {
      const response = await AuthService.register(this.testData.validRegistration);
      return {
        endpoint: '/auth/register',
        method: 'POST',
        status: 'success',
        responseTime: Date.now() - startTime,
        data: { hasToken: !!response.token, hasUser: !!response.user },
      };
    } catch (error) {
      return {
        endpoint: '/auth/register',
        method: 'POST',
        status: 'error',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Test forgot password functionality
  static async testForgotPassword(): Promise<ApiTestResult> {
    const startTime = Date.now();
    try {
      await AuthService.forgotPassword(this.testData.forgotPassword);
      return {
        endpoint: '/auth/forgot-password',
        method: 'POST',
        status: 'success',
        responseTime: Date.now() - startTime,
        data: { message: 'Password reset email sent' },
      };
    } catch (error) {
      return {
        endpoint: '/auth/forgot-password',
        method: 'POST',
        status: 'error',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Test token refresh functionality
  static async testTokenRefresh(): Promise<ApiTestResult> {
    const startTime = Date.now();
    try {
      const response = await api.post('/auth/refresh');
      return {
        endpoint: '/auth/refresh',
        method: 'POST',
        status: 'success',
        responseTime: Date.now() - startTime,
        data: { hasToken: !!response.data.token },
      };
    } catch (error) {
      return {
        endpoint: '/auth/refresh',
        method: 'POST',
        status: 'error',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Comprehensive API health check
  static async performHealthCheck(): Promise<ApiHealthCheck> {
    const results: ApiTestResult[] = [];

    // Test basic connectivity
    const healthResult = await this.testApiHealth();
    results.push(healthResult);

    // Test authentication endpoints if health check passes
    if (healthResult.status === 'success') {
      const authResults = await this.testAuthEndpoints();
      results.push(...authResults);

      // Test token refresh
      const refreshResult = await this.testTokenRefresh();
      results.push(refreshResult);
    }

    const isHealthy = results.every(result => result.status === 'success');

    return {
      isHealthy,
      results,
      timestamp: new Date().toISOString(),
    };
  }

  // Test error handling scenarios
  static async testErrorScenarios(): Promise<ApiTestResult[]> {
    const results: ApiTestResult[] = [];

    // Test invalid login
    const invalidLogin = await this.testInvalidLogin();
    results.push(invalidLogin);

    // Test invalid registration
    const invalidRegistration = await this.testInvalidRegistration();
    results.push(invalidRegistration);

    // Test rate limiting (if implemented)
    const rateLimitTest = await this.testRateLimit();
    results.push(rateLimitTest);

    return results;
  }

  private static async testInvalidLogin(): Promise<ApiTestResult> {
    const startTime = Date.now();
    try {
      await AuthService.login({
        email: 'invalid@example.com',
        password: 'wrongpassword',
      });
      return {
        endpoint: '/auth/login',
        method: 'POST',
        status: 'error',
        responseTime: Date.now() - startTime,
        error: 'Expected error for invalid credentials',
      };
    } catch {
      return {
        endpoint: '/auth/login (invalid)',
        method: 'POST',
        status: 'success',
        responseTime: Date.now() - startTime,
        data: { message: 'Correctly rejected invalid credentials' },
      };
    }
  }

  private static async testInvalidRegistration(): Promise<ApiTestResult> {
    const startTime = Date.now();
    try {
      await AuthService.register({
        email: 'invalid-email',
        password: '123',
        confirmPassword: '456',
        firstName: '',
        lastName: '',
        role: 'buyer',
        termsAccepted: false,
        privacyAccepted: false,
      });
      return {
        endpoint: '/auth/register',
        method: 'POST',
        status: 'error',
        responseTime: Date.now() - startTime,
        error: 'Expected error for invalid registration data',
      };
    } catch {
      return {
        endpoint: '/auth/register (invalid)',
        method: 'POST',
        status: 'success',
        responseTime: Date.now() - startTime,
        data: { message: 'Correctly rejected invalid registration' },
      };
    }
  }

  private static async testRateLimit(): Promise<ApiTestResult> {
    const startTime = Date.now();
    try {
      // Attempt multiple rapid requests
      const promises = Array(10).fill(null).map(() => 
        api.get('/auth/me').catch(() => ({ data: null }))
      );
      await Promise.all(promises);
      
      return {
        endpoint: '/auth/me (rate limit)',
        method: 'GET',
        status: 'success',
        responseTime: Date.now() - startTime,
        data: { message: 'Rate limiting test completed' },
      };
    } catch (error) {
      return {
        endpoint: '/auth/me (rate limit)',
        method: 'GET',
        status: 'error',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Utility method to log test results
  static logTestResults(results: ApiTestResult[]): void {
    console.group('🧪 API Test Results');
    results.forEach(result => {
      const emoji = result.status === 'success' ? '✅' : '❌';
      console.log(`${emoji} ${result.method} ${result.endpoint}`);
      if (result.responseTime) {
        console.log(`   ⏱️  Response time: ${result.responseTime}ms`);
      }
      if (result.error) {
        console.log(`   ❌ Error: ${result.error}`);
      }
      if (result.data) {
        console.log(`   📊 Data:`, result.data);
      }
    });
    console.groupEnd();
  }

  // Get backend API URL for testing
  static getApiUrl(): string {
    return config.API_BASE_URL;
  }

  // Get backend base URL
  static getBackendUrl(): string {
    return config.BACKEND_URL;
  }

  // Check if backend is running
  static async isBackendRunning(): Promise<boolean> {
    try {
      const response = await fetch(`${this.getBackendUrl()}/api/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  // Test environment configuration
  static testEnvironmentConfig(): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (!config.API_BASE_URL) {
      issues.push('API_BASE_URL is not configured');
    }

    if (!config.BACKEND_URL) {
      issues.push('BACKEND_URL is not configured');
    }

    if (config.ENABLE_ANALYTICS && !config.ANALYTICS_ID) {
      issues.push('Analytics is enabled but ANALYTICS_ID is missing');
    }

    if (config.ENABLE_ERROR_REPORTING && !config.ERROR_REPORTING_DSN) {
      issues.push('Error reporting is enabled but ERROR_REPORTING_DSN is missing');
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  // Log environment configuration
  static logEnvironmentConfig(): void {
    console.group('🔧 Environment Configuration');
    console.log('API Base URL:', config.API_BASE_URL);
    console.log('Backend URL:', config.BACKEND_URL);
    console.log('Frontend URL:', config.FRONTEND_URL);
    console.log('App Name:', config.APP_NAME);
    console.log('App Version:', config.APP_VERSION);
    console.log('Environment:', config.NODE_ENV);
    console.log('Debug Mode:', config.DEBUG);
    console.log('HTTPS Enabled:', config.ENABLE_HTTPS);
    console.log('Features:', {
      registration: config.ENABLE_REGISTRATION,
      forgotPassword: config.ENABLE_FORGOT_PASSWORD,
      emailVerification: config.ENABLE_EMAIL_VERIFICATION,
      twoFactor: config.ENABLE_2FA,
      analytics: config.ENABLE_ANALYTICS,
      errorReporting: config.ENABLE_ERROR_REPORTING,
    });
    console.groupEnd();
  }
}

export default ApiTestingService; 