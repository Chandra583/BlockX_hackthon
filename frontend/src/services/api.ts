import axios, { type AxiosInstance, type InternalAxiosRequestConfig, type AxiosResponse } from 'axios';
import { config } from '../config/env';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: config.API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token and active role to requests
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add X-Active-Role header for multi-role support
    const selectedRole = localStorage.getItem('selectedRole');
    if (selectedRole && config.headers) {
      config.headers['X-Active-Role'] = selectedRole;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token refresh and errors
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If the error is 401 and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(
            `${config.API_BASE_URL}/auth/refresh`,
            { refreshToken }
          );

          const { token, refreshToken: newRefreshToken } = response.data;
          
          // Update tokens in localStorage
          localStorage.setItem('token', token);
          localStorage.setItem('refreshToken', newRefreshToken);

          // Update the original request with new token
          originalRequest.headers.Authorization = `Bearer ${token}`;
          
          // Retry the original request
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Generic API methods
export const apiService = {
  get: <T>(url: string, config?: InternalAxiosRequestConfig): Promise<T> => {
    return api.get(url, config).then((response) => response.data);
  },

  post: <T>(url: string, data?: unknown, config?: InternalAxiosRequestConfig): Promise<T> => {
    return api.post(url, data, config).then((response) => response.data);
  },

  put: <T>(url: string, data?: unknown, config?: InternalAxiosRequestConfig): Promise<T> => {
    return api.put(url, data, config).then((response) => response.data);
  },

  patch: <T>(url: string, data?: unknown, config?: InternalAxiosRequestConfig): Promise<T> => {
    return api.patch(url, data, config).then((response) => response.data);
  },

  delete: <T>(url: string, config?: InternalAxiosRequestConfig): Promise<T> => {
    return api.delete(url, config).then((response) => response.data);
  },
};

// Error handling utility
export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    if (error.message) {
      return error.message;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

export default api; 