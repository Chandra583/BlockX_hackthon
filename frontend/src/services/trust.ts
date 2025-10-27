import { apiService } from './api';

export interface TrustEvent {
  id: string;
  type: string;
  description: string;
  impact: number;
  timestamp: string;
  metadata?: any;
}

export interface TrustScore {
  currentScore: number;
  averageScore: number;
  totalEvents: number;
  positiveEvents: number;
  negativeEvents: number;
  history: TrustEvent[];
}

export class TrustService {
  /**
   * Get user trust score
   * GET /api/trust/user-score
   */
  static async getUserTrustScore() {
    try {
      const response = await apiService.get('/trust/user-score');
      return response;
    } catch (error) {
      console.error('Failed to fetch user trust score:', error);
      throw error;
    }
  }

  /**
   * Get vehicle trust score
   * GET /api/trust/:vehicleId/score
   */
  static async getVehicleTrustScore(vehicleId: string) {
    try {
      const response = await apiService.get(`/trust/${vehicleId}/score`);
      return response;
    } catch (error) {
      console.error('Failed to fetch vehicle trust score:', error);
      throw error;
    }
  }

  /**
   * Get trust score history
   * GET /api/trust/:vehicleId/history
   */
  static async getTrustScoreHistory(vehicleId: string) {
    try {
      const response = await apiService.get(`/trust/${vehicleId}/history`);
      return response;
    } catch (error) {
      console.error('Failed to fetch trust score history:', error);
      throw error;
    }
  }

  /**
   * Get trust events
   * GET /api/trust/events
   */
  static async getTrustEvents(params?: { limit?: number; page?: number }) {
    try {
      const response = await apiService.get('/trust/events', { params });
      return response;
    } catch (error) {
      console.error('Failed to fetch trust events:', error);
      throw error;
    }
  }

  /**
   * Update trust score
   * POST /api/trust/update
   */
  static async updateTrustScore(data: {
    vehicleId: string;
    eventType: string;
    impact: number;
    description: string;
    metadata?: any;
  }) {
    try {
      const response = await apiService.post('/trust/update', data);
      return response;
    } catch (error) {
      console.error('Failed to update trust score:', error);
      throw error;
    }
  }

  static async getUserTrustScoreById(userId: string): Promise<any> {
    try {
      const response = await apiService.get(`/trust/user-score/${userId}`);
      return response;
    } catch (error) {
      console.error('Failed to fetch user trust score:', error);
      throw error;
    }
  }

  static async getTrustHistory(userId: string): Promise<any> {
    try {
      const response = await apiService.get(`/trust/${userId}/history`);
      return response;
    } catch (error) {
      console.error('Failed to fetch trust history:', error);
      throw error;
    }
  }
}

export default TrustService;