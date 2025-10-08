import { apiService } from './api';
import { API_ENDPOINTS } from '../config/env';
import type { 
  LoginFormData, 
  RegisterFormData, 
  AuthResponse,
  BackendAuthResponse,
  ForgotPasswordData, 
  ResetPasswordData, 
  ChangePasswordData 
} from '../types/auth';

export class AuthService {
  static async login(credentials: LoginFormData): Promise<AuthResponse> {
    const backendResponse = await apiService.post<BackendAuthResponse>(
      API_ENDPOINTS.AUTH.LOGIN,
      credentials
    );
    
    // Map backend response to frontend AuthResponse format
    return {
      user: {
        id: backendResponse.data.user.id,
        email: backendResponse.data.user.email,
        role: backendResponse.data.user.role,
        firstName: backendResponse.data.user.firstName,
        lastName: backendResponse.data.user.lastName,
        isActive: backendResponse.data.user.accountStatus === 'active',
        isVerified: backendResponse.data.user.emailVerified,
        createdAt: backendResponse.data.user.createdAt,
        updatedAt: backendResponse.data.user.createdAt, // Using createdAt as fallback
      },
      token: backendResponse.data.tokens.accessToken,
      refreshToken: backendResponse.data.tokens.refreshToken,
    };
  }

  static async register(userData: RegisterFormData): Promise<AuthResponse> {
    const backendResponse = await apiService.post<BackendAuthResponse>(
      API_ENDPOINTS.AUTH.REGISTER,
      userData
    );
    
    // Map backend response to frontend AuthResponse format
    return {
      user: {
        id: backendResponse.data.user.id,
        email: backendResponse.data.user.email,
        role: backendResponse.data.user.role,
        firstName: backendResponse.data.user.firstName,
        lastName: backendResponse.data.user.lastName,
        isActive: backendResponse.data.user.accountStatus === 'active',
        isVerified: backendResponse.data.user.emailVerified,
        createdAt: backendResponse.data.user.createdAt,
        updatedAt: backendResponse.data.user.createdAt,
      },
      token: backendResponse.data.tokens.accessToken,
      refreshToken: backendResponse.data.tokens.refreshToken,
    };
  }

  static async refreshToken(refreshToken: string): Promise<{ token: string; refreshToken: string }> {
    const response = await apiService.post<{ token: string; refreshToken: string }>(
      API_ENDPOINTS.AUTH.REFRESH,
      { refreshToken }
    );
    return response;
  }

  static async logout(): Promise<void> {
    await apiService.post(API_ENDPOINTS.AUTH.LOGOUT);
  }

  static async forgotPassword(data: ForgotPasswordData): Promise<{ message: string }> {
    const response = await apiService.post<{ message: string }>(
      API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
      data
    );
    return response;
  }

  static async resetPassword(data: ResetPasswordData): Promise<{ message: string }> {
    const response = await apiService.post<{ message: string }>(
      API_ENDPOINTS.AUTH.RESET_PASSWORD,
      data
    );
    return response;
  }

  static async changePassword(data: ChangePasswordData): Promise<{ message: string }> {
    const response = await apiService.post<{ message: string }>(
      API_ENDPOINTS.AUTH.CHANGE_PASSWORD,
      data
    );
    return response;
  }

  static async verifyEmail(token: string): Promise<{ message: string }> {
    const response = await apiService.post<{ message: string }>(
      API_ENDPOINTS.AUTH.VERIFY_EMAIL,
      { token }
    );
    return response;
  }

  static async getCurrentUser(): Promise<AuthResponse['user']> {
    const response = await apiService.get<AuthResponse['user']>(
      API_ENDPOINTS.USER.PROFILE
    );
    return response;
  }
}

export default AuthService; 