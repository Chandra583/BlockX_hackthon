import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { JWTService } from '../../utils/jwt';

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'owner' | 'buyer' | 'service' | 'insurance' | 'government';
  firstName: string;
  lastName: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Initialize state from JWT service
const authData = JWTService.initializeAuth();

const initialState: AuthState = {
  user: authData.user as User | null,
  token: authData.token,
  refreshToken: authData.refreshToken,
  isAuthenticated: authData.isAuthenticated,
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    loginSuccess: (state, action: PayloadAction<{ user: User; token: string; refreshToken: string; rememberMe?: boolean }>) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
      state.error = null;
      
      // Store tokens and user using JWT service
      JWTService.setTokens(action.payload.token, action.payload.refreshToken);
      JWTService.setUser(action.payload.user);
      
      // Dispatch custom event to reinitialize session manager
      window.dispatchEvent(new CustomEvent('authLoginSuccess', { 
        detail: { rememberMe: action.payload.rememberMe } 
      }));
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.error = action.payload;
      
      // Remove tokens using JWT service
      JWTService.removeTokens();
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.error = null;
      
      // Remove tokens using JWT service
      JWTService.removeTokens();
    },
    clearError: (state) => {
      state.error = null;
    },
    updateUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      // Update stored user
      JWTService.setUser(action.payload);
    },
    setTokens: (state, action: PayloadAction<{ token: string; refreshToken: string }>) => {
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
      
      // Store tokens using JWT service
      JWTService.setTokens(action.payload.token, action.payload.refreshToken);
    },
    refreshTokenStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    refreshTokenSuccess: (state, action: PayloadAction<{ token: string; refreshToken: string }>) => {
      state.isLoading = false;
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
      
      // Store new tokens using JWT service
      JWTService.setTokens(action.payload.token, action.payload.refreshToken);
    },
    refreshTokenFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.error = action.payload;
      
      // Remove tokens using JWT service
      JWTService.removeTokens();
    },
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  clearError,
  updateUser,
  setTokens,
  refreshTokenStart,
  refreshTokenSuccess,
  refreshTokenFailure,
} = authSlice.actions;

export default authSlice.reducer; 