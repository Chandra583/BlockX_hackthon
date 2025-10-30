import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { JWTService } from '../../utils/jwt';

export type UserRole = 'admin' | 'owner' | 'buyer' | 'service' | 'insurance' | 'government';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  roles?: UserRole[]; // Multi-role support
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
  selectedRole: UserRole | null; // Active role for multi-role users
}

// Initialize state from JWT service
const authData = JWTService.initializeAuth();

// Initialize selectedRole from localStorage or first role in user.roles
const storedSelectedRole = typeof window !== 'undefined' ? window.localStorage.getItem('selectedRole') as UserRole | null : null;
const user = authData.user as User | null;
const userRoles = user?.roles || (user?.role ? [user.role] : []);
const initialSelectedRole = storedSelectedRole && userRoles.includes(storedSelectedRole) 
  ? storedSelectedRole 
  : (userRoles[0] || user?.role || null);

const initialState: AuthState = {
  user: authData.user as User | null,
  token: authData.token,
  refreshToken: authData.refreshToken,
  isAuthenticated: authData.isAuthenticated,
  isLoading: false,
  error: null,
  selectedRole: initialSelectedRole,
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
      
      // Set selectedRole from localStorage or first role
      const storedRole = typeof window !== 'undefined' ? window.localStorage.getItem('selectedRole') as UserRole | null : null;
      const userRoles = action.payload.user.roles || (action.payload.user.role ? [action.payload.user.role] : []);
      state.selectedRole = storedRole && userRoles.includes(storedRole) ? storedRole : (userRoles[0] || action.payload.user.role);
      
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
      state.selectedRole = null;
      
      // Remove tokens using JWT service
      JWTService.removeTokens();
      // Clear selected role
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('selectedRole');
      }
    },
    clearError: (state) => {
      state.error = null;
    },
    updateUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      // Update stored user
      JWTService.setUser(action.payload);
    },
    setSelectedRole: (state, action: PayloadAction<UserRole>) => {
      if (state.user) {
        const userRoles = state.user.roles || (state.user.role ? [state.user.role] : []);
        if (userRoles.includes(action.payload)) {
          state.selectedRole = action.payload;
          // Persist to localStorage
          if (typeof window !== 'undefined') {
            window.localStorage.setItem('selectedRole', action.payload);
          }
        }
      }
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
  setSelectedRole,
  setTokens,
  refreshTokenStart,
  refreshTokenSuccess,
  refreshTokenFailure,
} = authSlice.actions;

export default authSlice.reducer; 