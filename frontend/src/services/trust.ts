import { apiService } from './api';

export interface TrustEvent {
  _id: string;
  change: number;
  previousScore: number;
  newScore: number;
  reason: string;
  source: string;
  createdAt: string;
  createdBy?: {
    firstName: string;
    lastName: string;
  };
  details: {
    telemetryId?: string;
    installId?: string;
    solanaTx?: string;
    arweaveTx?: string;
    reportedMileage?: number;
    previousMileage?: number;
    deviceId?: string;
    fraudAlertId?: string;
  };
}

export interface TrustHistoryResponse {
  success: boolean;
  data: TrustEvent[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ManualAdjustRequest {
  change: number;
  reason: string;
  details?: any;
}

export class TrustService {
  /**
   * Get trust history for a vehicle
   */
  static async getTrustHistory(
    vehicleId: string,
    options: {
      page?: number;
      limit?: number;
      filter?: 'all' | 'negative' | 'positive';
    } = {}
  ): Promise<TrustHistoryResponse> {
    const params = new URLSearchParams();
    if (options.page) params.append('page', options.page.toString());
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.filter) params.append('filter', options.filter);

    const queryString = params.toString();
    const url = `/trust/${vehicleId}/history${queryString ? `?${queryString}` : ''}`;
    
    return await apiService.get(url);
  }

  /**
   * Get specific trust event details
   */
  static async getTrustEvent(vehicleId: string, eventId: string): Promise<{ success: boolean; data: TrustEvent }> {
    return await apiService.get(`/trust/${vehicleId}/event/${eventId}`);
  }

  /**
   * Manual trust score adjustment (admin only)
   */
  static async manualAdjust(vehicleId: string, payload: ManualAdjustRequest): Promise<any> {
    return await apiService.post(`/trust/${vehicleId}/manual-adjust`, payload);
  }
}

export default TrustService;
