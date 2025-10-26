import { apiService } from './api';

export interface DashboardStats {
  totalVehicles: number;
  activeListings: number;
  totalEarnings: number;
  verifiedStatus: number;
}

export interface DashboardData {
  user: any;
  stats: DashboardStats;
  notifications: any[];
  activity: any[];
  trustScore: number;
  unreadCount: number;
}

export class DashboardService {
  /**
   * Get user dashboard data
   * GET /api/users/dashboard
   */
  static async getUserDashboard() {
    try {
      const response = await apiService.get('/users/dashboard');
      return response;
    } catch (error) {
      console.error('Failed to fetch user dashboard:', error);
      throw error;
    }
  }

  /**
   * Get dashboard statistics
   * GET /api/dashboard/stats
   */
  static async getDashboardStats() {
    try {
      const response = await apiService.get('/dashboard/stats');
      return response;
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      throw error;
    }
  }

  /**
   * Get user vehicles summary
   * GET /api/vehicles/my-vehicles
   */
  static async getUserVehiclesSummary() {
    try {
      const response = await apiService.get('/vehicles/my-vehicles?limit=100');
      return response;
    } catch (error) {
      console.error('Failed to fetch user vehicles:', error);
      throw error;
    }
  }

  /**
   * Get vehicle statistics
   * GET /api/vehicles/stats
   */
  static async getVehicleStats() {
    try {
      const response = await apiService.get('/vehicles/stats');
      return response;
    } catch (error) {
      console.error('Failed to fetch vehicle stats:', error);
      throw error;
    }
  }

  /**
   * Get marketplace statistics
   * GET /api/marketplace/statistics
   */
  static async getMarketplaceStats() {
    try {
      const response = await apiService.get('/vehicles/marketplace-stats');
      return response;
    } catch (error) {
      console.error('Failed to fetch marketplace stats:', error);
      throw error;
    }
  }

  /**
   * Get system health
   * GET /api/health
   */
  static async getSystemHealth() {
    try {
      const response = await apiService.get('/health');
      return response;
    } catch (error) {
      console.error('Failed to fetch system health:', error);
      throw error;
    }
  }
}

export default DashboardService;
