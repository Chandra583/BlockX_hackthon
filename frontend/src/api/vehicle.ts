import { apiService } from '../services/api';

/**
 * Vehicle API Service
 * Handles all vehicle-related API calls
 */

export interface Vehicle {
  _id: string;
  vin: string;
  vehicleNumber: string;
  make: string;
  vehicleModel: string;
  year: number;
  color: string;
  currentMileage: number;
  trustScore: number;
  ownerUserId?: string;
  ownerWalletAddress?: string;
  ownershipHistory: Array<{
    ownerUserId: string;
    ownerWallet?: string;
    fromDate: string;
    toDate?: string;
    txHash?: string;
    saleRecordId?: string;
    note?: string;
    explorerUrl?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export class VehicleAPI {
  
  /**
   * Get user's owned vehicles
   * GET /api/vehicles/my-vehicles
   */
  static async getMyVehicles(): Promise<{ success: boolean; data: Vehicle[] }> {
    try {
      const response = await apiService.get<{ success: boolean; data: Vehicle[] }>(
        '/vehicles/my-vehicles'
      );
      return response;
    } catch (error) {
      console.error('Failed to fetch my vehicles:', error);
      throw error;
    }
  }

  /**
   * Get vehicle details by ID
   * GET /api/vehicles/:vehicleId
   */
  static async getVehicleById(vehicleId: string): Promise<{ success: boolean; data: Vehicle }> {
    try {
      const response = await apiService.get<{ success: boolean; data: Vehicle }>(
        `/vehicles/${vehicleId}`
      );
      return response;
    } catch (error) {
      console.error('Failed to fetch vehicle:', error);
      throw error;
    }
  }

  /**
   * Get vehicle ownership history
   * GET /api/vehicles/:vehicleId/ownership-history
   */
  static async getVehicleOwnershipHistory(vehicleId: string): Promise<{ success: boolean; data: Array<{ ownerId: string; fullName: string; role: string; from: string; to?: string | null; txHash?: string | null; notes?: string; contactEmail?: string }> }> {
    try {
      const response = await apiService.get<{ success: boolean; data: Array<{ ownerId: string; fullName: string; role: string; from: string; to?: string | null; txHash?: string | null; notes?: string; contactEmail?: string }> }>(
        `/vehicles/${vehicleId}/ownership-history`
      );
      return response;
    } catch (error: unknown) {
      console.error('Failed to fetch vehicle ownership history:', error as Error);
      throw error;
    }
  }

  // Alias per spec
  static async getOwnershipHistory(vehicleId: string): Promise<{ success: boolean; data: Array<{ ownerId: string; fullName: string; role: string; from: string; to?: string | null; txHash?: string | null; notes?: string; contactEmail?: string }> }> {
    return this.getVehicleOwnershipHistory(vehicleId);
  }

  /**
   * Import vehicle by VIN/registration/deviceId
   * POST /api/vehicles/import
   */
  static async importVehicle(params: { vin?: string; regNumber?: string; deviceId?: string }): Promise<{ success: boolean; data?: { vehicleId: string }; message?: string }> {
    try {
      const response = await apiService.post<{ success: boolean; data?: { vehicleId: string }; message?: string }>(
        `/vehicles/import`,
        params
      );
      return response;
    } catch (error: unknown) {
      console.error('Failed to import vehicle:', error as Error);
      throw error;
    }
  }

  /**
   * Update vehicle information
   * PUT /api/vehicles/:vehicleId
   */
  static async updateVehicle(vehicleId: string, data: Partial<Vehicle>): Promise<{ success: boolean; data: Vehicle }> {
    try {
      const response = await apiService.put<{ success: boolean; data: Vehicle }>(
        `/vehicles/${vehicleId}`,
        data
      );
      return response;
    } catch (error) {
      console.error('Failed to update vehicle:', error);
      throw error;
    }
  }

  /**
   * Get all vehicles (for admin)
   * GET /api/vehicles
   */
  static async getAllVehicles(params?: {
    page?: number;
    limit?: number;
    search?: string;
    make?: string;
    year?: number;
    trustScoreMin?: number;
  }): Promise<{ success: boolean; data: Vehicle[]; total: number; page: number; limit: number }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.search) queryParams.append('search', params.search);
      if (params?.make) queryParams.append('make', params.make);
      if (params?.year) queryParams.append('year', params.year.toString());
      if (params?.trustScoreMin) queryParams.append('trustScoreMin', params.trustScoreMin.toString());

      const response = await apiService.get<{ success: boolean; data: Vehicle[]; total: number; page: number; limit: number }>(
        `/vehicles?${queryParams.toString()}`
      );
      return response;
    } catch (error) {
      console.error('Failed to fetch vehicles:', error);
      throw error;
    }
  }
}

export default VehicleAPI;
