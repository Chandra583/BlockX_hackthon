import { apiService } from './api';

// Types for Vehicle API responses
export interface Vehicle {
  id: string;
  vin: string;
  vehicleNumber: string;
  make: string;
  model: string;
  year: number;
  color?: string;
  bodyType?: string;
  fuelType?: string;
  transmission?: string;
  mileage: number;
  trustScore?: number;
  ownerId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  
  // Blockchain-related fields
  blockchainAddress?: string;
  lastMileageUpdate?: string;
  lastTrustScoreUpdate?: string;
  
  // Optional marketplace fields
  isForSale?: boolean;
  price?: number;
  description?: string;
  images?: string[];
  
  // Verification status
  verificationStatus?: 'pending' | 'verified' | 'rejected';
  verificationDate?: string;
  rejectionReason?: string;
  rejectedAt?: string;
}

export interface VehicleRegistrationData {
  vehicleId?: string;
  vin: string;
  vehicleNumber: string;
  make: string;
  model: string;
  year: number;
  initialMileage: number;
  walletAddress?: string;
  color?: string;
  bodyType?: string;
  fuelType?: string;
  transmission?: string;
}

export interface VehicleUpdateData {
  make?: string;
  model?: string;
  year?: number;
  color?: string;
  bodyType?: string;
  fuelType?: string;
  transmission?: string;
  mileage?: number;
  isForSale?: boolean;
  price?: number;
  description?: string;
}

export interface VehicleListResponse {
  success: boolean;
  message: string;
  data: {
    vehicles: Vehicle[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface VehicleResponse {
  success: boolean;
  message: string;
  data: Vehicle;
}

export interface VehicleSearchParams {
  page?: number;
  limit?: number;
  search?: string;
  make?: string;
  model?: string;
  yearMin?: number;
  yearMax?: number;
  priceMin?: number;
  priceMax?: number;
  mileageMax?: number;
  fuelType?: string;
  bodyType?: string;
  isForSale?: boolean;
  sortBy?: 'createdAt' | 'price' | 'mileage' | 'year';
  sortOrder?: 'asc' | 'desc';
}

export interface BlockchainVehicleRegistration {
  success: boolean;
  message: string;
  data: {
    vehicleId: string;
    vin: string;
    vehicleNumber: string;
    make: string;
    model: string;
    year: number;
    initialMileage: number;
    transactionHash: string;
    blockchainAddress: string;
    network: string;
    explorerUrl: string;
  };
}

export interface MileageRecord {
  id: string;
  vehicleId: string;
  mileage: number;
  location: string;
  source: 'manual' | 'obd_device' | 'service_record' | 'inspection';
  notes?: string;
  recordedBy: string;
  recordedAt: string;
  transactionHash?: string;
  isVerified: boolean;
}

export interface MileageHistoryResponse {
  success: boolean;
  message: string;
  data: {
    records: MileageRecord[];
    total: number;
    currentMileage: number;
  };
}

export interface MileageUpdateData {
  vehicleId: string;
  mileage: number;
  location: string;
  source: 'manual' | 'obd_device' | 'service_record' | 'inspection';
  notes?: string;
}

export interface MileageUpdateResponse {
  success: boolean;
  message: string;
  data: {
    vehicleId: string;
    vin: string;
    previousMileage: number;
    newMileage: number;
    transactionHash: string;
    blockchainAddress: string;
    network: string;
    explorerUrl: string;
    location: string;
    source: string;
  };
}

export interface InstallRequestData {
  vehicleId: string;
  notes?: string;
}

export interface InstallAssignmentData {
  installId: string;
  serviceProviderId: string;
  notes?: string;
}

export interface InstallCompletionData {
  installId: string;
  deviceId: string;
  notes?: string;
}

export interface InstallResponse {
  success: boolean;
  message: string;
  data: {
    installId: string;
    status: string;
    [key: string]: any;
  };
}

export interface TrustScoreUpdateData {
  trustScore: number;
  reason?: string;
}

export interface TrustScoreUpdateResponse {
  success: boolean;
  message: string;
  data: {
    vehicleId: string;
    trustScore: number;
  };
}

/**
 * Vehicle Service Class
 * Handles all vehicle-related API calls
 */
export class VehicleService {
  
  // ========================================
  // VEHICLE CRUD OPERATIONS
  // ========================================
  
  /**
   * Test database connection
   */
  static async testDatabase(): Promise<any> {
    return await apiService.get('/vehicles/test');
  }

  /**
   * Validate if vehicle number is already registered
   */
  static async validateVehicleNumber(vehicleNumber: string): Promise<any> {
    return await apiService.get(`/vehicles/validate-vehicle-number/${encodeURIComponent(vehicleNumber)}`);
  }

  /**
   * Get all vehicles for the current user
   */
  static async getUserVehicles(params?: VehicleSearchParams): Promise<VehicleListResponse> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const url = `/vehicles${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return await apiService.get<VehicleListResponse>(url);
  }
  
  /**
   * Get a specific vehicle by ID
   */
  static async getVehicleById(vehicleId: string): Promise<VehicleResponse> {
    return await apiService.get<VehicleResponse>(`/vehicles/${vehicleId}`);
  }
  
  /**
   * Get telemetry batches for a vehicle
   */
  static async getTelemetryBatches(vehicleId: string, limit: number = 30): Promise<any> {
    return await apiService.get(`/vehicles/${vehicleId}/telemetry-batches`, { params: { limit } });
  }

  /**
   * Manually trigger batch consolidation for a specific date
   */
  static async consolidateBatch(vehicleId: string, date: string): Promise<any> {
    try {
      return await apiService.post(`/vehicles/${vehicleId}/consolidate-batch`, { date });
    } catch (err: any) {
      // Normalize error shape
      return {
        success: false,
        message: err?.response?.data?.message || err?.message || 'Consolidation failed',
        error: err?.response?.data?.error
      } as any;
    }
  }

  static async getMileageHistory(vehicleId: string, page: number = 1, limit: number = 50): Promise<any> {
    try {
      const response = await apiService.get(`/vehicles/${vehicleId}/mileage-history`, {
        params: { page, limit }
      });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || error.message,
        error: error.response?.data?.error || error.message
      };
    }
  }
  
  /**
   * Create a new vehicle (traditional database entry)
   */
  static async createVehicle(vehicleData: Omit<VehicleRegistrationData, 'vehicleId'>): Promise<VehicleResponse> {
    return await apiService.post<VehicleResponse>('/vehicles', vehicleData);
  }
  
  /**
   * Update an existing vehicle
   */
  static async updateVehicle(vehicleId: string, updateData: VehicleUpdateData): Promise<VehicleResponse> {
    return await apiService.put<VehicleResponse>(`/vehicles/${vehicleId}`, updateData);
  }
  
  /**
   * Delete a vehicle
   */
  static async deleteVehicle(vehicleId: string): Promise<{ success: boolean; message: string }> {
    return await apiService.delete(`/vehicles/${vehicleId}`);
  }
  
  // ========================================
  // BLOCKCHAIN OPERATIONS
  // ========================================
  
  /**
   * Register a vehicle (creates pending record awaiting admin approval)
   * NEW FLOW: Vehicle is saved to database with "pending" status
   * Admin must approve before blockchain registration
   */
  static async registerVehicleOnBlockchain(vehicleData: VehicleRegistrationData): Promise<BlockchainVehicleRegistration> {
    const registrationData = {
      vin: vehicleData.vin,
      vehicleNumber: vehicleData.vehicleNumber,
      make: vehicleData.make,
      model: vehicleData.model,
      year: vehicleData.year,
      initialMileage: vehicleData.initialMileage,
      walletAddress: vehicleData.walletAddress,
      color: vehicleData.color,
      bodyType: vehicleData.bodyType,
      fuelType: vehicleData.fuelType,
      transmission: vehicleData.transmission,
      condition: 'good', // Default condition
    };
    
    // NEW ENDPOINT: Register vehicle (pending admin verification)
    return await apiService.post<BlockchainVehicleRegistration>('/vehicles/register', registrationData);
  }
  
  /**
   * Get vehicle blockchain history
   */
  static async getVehicleBlockchainHistory(vehicleId: string): Promise<any> {
    return await apiService.get(`/blockchain/vehicle/${vehicleId}/history`);
  }
  
  /**
   * Verify a blockchain transaction
   */
  static async verifyBlockchainTransaction(transactionHash: string): Promise<any> {
    return await apiService.get(`/blockchain/verify/${transactionHash}`);
  }
  
  // ========================================
  // MILEAGE OPERATIONS
  // ========================================
  
  /**
   * Record mileage update on blockchain
   */
  static async recordMileageOnBlockchain(mileageData: MileageUpdateData): Promise<MileageUpdateResponse> {
    return await apiService.post<MileageUpdateResponse>('/blockchain/mileage/record', mileageData);
  }
  
  /**
   * Get mileage history for a vehicle
   */
  static async getVehicleMileageHistory(vehicleId: string): Promise<MileageHistoryResponse> {
    return await apiService.get<MileageHistoryResponse>(`/vehicles/${vehicleId}/mileage`);
  }
  
  /**
   * Get blockchain mileage history for a vehicle
   */
  static async getBlockchainMileageHistory(vehicleId: string): Promise<any> {
    return await apiService.get(`/blockchain/vehicle/${vehicleId}/mileage-history`);
  }
  
  // ========================================
  // INSTALLATION OPERATIONS
  // ========================================
  
  /**
   * Request device installation for a vehicle
   */
  static async requestDeviceInstallation(data: InstallRequestData): Promise<InstallResponse> {
    return await apiService.post<InstallResponse>(`/installs/vehicles/${data.vehicleId}/request-install`, {
      notes: data.notes
    });
  }
  
  /**
   * Assign installation to service provider (admin only)
   */
  static async assignInstallation(data: InstallAssignmentData): Promise<InstallResponse> {
    return await apiService.post<InstallResponse>('/installs/admin/assign-install', data);
  }
  
  /**
   * Complete installation (service provider only)
   */
  static async completeInstallation(data: InstallCompletionData): Promise<InstallResponse> {
    return await apiService.post<InstallResponse>('/installs/service/install/complete', data);
  }
  
  /**
   * Get installation requests
   */
  static async getInstallations(params?: any): Promise<any> {
    const queryParams = new URLSearchParams(params || {});
    return await apiService.get(`/installs/devices?${queryParams.toString()}`);
  }
  
  // ========================================
  // TRUSTSCORE OPERATIONS
  // ========================================
  
  /**
   * Update vehicle trustScore (admin only)
   */
  static async updateTrustScore(vehicleId: string, data: TrustScoreUpdateData): Promise<TrustScoreUpdateResponse> {
    return await apiService.patch<TrustScoreUpdateResponse>(`/vehicles/${vehicleId}/trustscore`, data);
  }
  
  // ========================================
  // SEARCH & MARKETPLACE
  // ========================================
  
  /**
   * Search vehicles in marketplace
   */
  static async searchVehicles(params: VehicleSearchParams): Promise<VehicleListResponse> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
    
    return await apiService.get<VehicleListResponse>(`/vehicles/search?${queryParams.toString()}`);
  }
  
  /**
   * Get vehicles for sale
   */
  static async getVehiclesForSale(params?: VehicleSearchParams): Promise<VehicleListResponse> {
    return await this.searchVehicles({ ...params, isForSale: true });
  }

  /**
   * Get vehicle statistics for dashboard
   */
  static async getVehicleStats(): Promise<any> {
    return await apiService.get('/vehicles/stats');
  }
  
  /**
   * List vehicle for sale
   */
  static async listVehicleForSale(vehicleId: string, saleData: { price: number; description?: string }): Promise<VehicleResponse> {
    return await apiService.put<VehicleResponse>(`/vehicles/${vehicleId}/list-for-sale`, {
      isForSale: true,
      ...saleData
    });
  }
  
  /**
   * Remove vehicle from sale
   */
  static async removeVehicleFromSale(vehicleId: string): Promise<VehicleResponse> {
    return await apiService.put<VehicleResponse>(`/vehicles/${vehicleId}/remove-from-sale`, {
      isForSale: false,
      price: null
    });
  }
  
  // ========================================
  // UTILITY METHODS
  // ========================================
  
  /**
   * Validate VIN format
   */
  static validateVIN(vin: string): boolean {
    const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/;
    return vinRegex.test(vin.toUpperCase());
  }
  
  /**
   * Format VIN for display
   */
  static formatVIN(vin: string): string {
    if (!vin) return '';
    return vin.toUpperCase();
  }
  
  /**
   * Get vehicle display name
   */
  static getVehicleDisplayName(vehicle: Vehicle): string {
    return `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  }
  
  /**
   * Get vehicle short identifier
   */
  static getVehicleShortId(vehicle: Vehicle): string {
    const displayName = this.getVehicleDisplayName(vehicle);
    const vinSuffix = vehicle.vin ? ` - ${vehicle.vin.slice(-4)}` : '';
    return `${displayName}${vinSuffix}`;
  }
  
  /**
   * Calculate vehicle age
   */
  static getVehicleAge(year: number): number {
    return new Date().getFullYear() - year;
  }
  
  /**
   * Format mileage for display
   */
  static formatMileage(mileage?: number | null): string {
    if (mileage === null || mileage === undefined || Number.isNaN(mileage)) {
      return '0 miles';
    }
    try {
      return `${Number(mileage).toLocaleString()} miles`;
    } catch {
      return `${mileage} miles`;
    }
  }
  
  /**
   * Get Solana explorer URL for transaction
   */
  static getSolanaExplorerUrl(transactionHash: string, network: string = 'devnet'): string {
    const baseUrl = 'https://explorer.solana.com/tx';
    const cluster = network === 'mainnet' ? '' : `?cluster=${network}`;
    return `${baseUrl}/${transactionHash}${cluster}`;
  }
  
  /**
   * Get body type display name
   */
  static getBodyTypeDisplayName(bodyType?: string): string {
    if (!bodyType) return 'Unknown';
    
    const displayNames: Record<string, string> = {
      sedan: 'Sedan',
      suv: 'SUV',
      truck: 'Truck',
      coupe: 'Coupe',
      hatchback: 'Hatchback',
      wagon: 'Wagon',
      convertible: 'Convertible',
      van: 'Van',
      motorcycle: 'Motorcycle',
      other: 'Other'
    };
    
    return displayNames[bodyType] || bodyType;
  }
  
  /**
   * Get fuel type display name
   */
  static getFuelTypeDisplayName(fuelType?: string): string {
    if (!fuelType) return 'Unknown';
    
    const displayNames: Record<string, string> = {
      gasoline: 'Gasoline',
      diesel: 'Diesel',
      electric: 'Electric',
      hybrid: 'Hybrid',
      hydrogen: 'Hydrogen',
      other: 'Other'
    };
    
    return displayNames[fuelType] || fuelType;
  }
}

// Export the service as default
export default VehicleService;