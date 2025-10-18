import { apiService } from './api';

// Types for Installation Request API responses
export interface InstallationRequest {
  id: string;
  vehicleId: string;
  ownerId: string;
  serviceProviderId?: string;
  deviceId?: string;
  status: 'requested' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'flagged';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  installedAt?: string;
  vehicle?: {
    id: string;
    vin: string;
    registration: string;
    make: string;
    model: string;
    year: number;
  };
  owner?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  serviceProvider?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  device?: {
    id: string;
    deviceID: string;
    status: string;
  };
}

export interface InstallationRequestSummaryItem {
  id: string;
  vehicleId: string;
  ownerId: string;
  status: 'requested' | 'assigned' | 'completed' | 'cancelled';
  deviceId?: string;
  serviceProviderId?: string;
  createdAt: string;
  assignedAt?: string;
  installedAt?: string;
}

export interface InstallationRequestSummary {
  [vehicleId: string]: InstallationRequestSummaryItem;
}

export interface Vehicle {
  id: string;
  registration: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  avatarUrl?: string;
}

export interface InstallationRequestCreateData {
  ownerId: string;
  vehicleId: string;
  notes?: string;
}

export interface InstallationRequestAssignData {
  deviceId: string;
  serviceProviderId: string;
  assignedBy: string;
}

export interface InstallationRequestCompleteData {
  completedBy: string;
  installationPhotoUrl?: string;
  notes?: string;
}

export interface InstallationListResponse {
  success: boolean;
  message: string;
  data: {
    requests: InstallationRequest[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface InstallationSummaryResponse {
  success: boolean;
  message: string;
  data: InstallationRequestSummary;
}

export interface InstallationResponse {
  success: boolean;
  message: string;
  data: any;
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

export interface VehicleSearchResponse {
  success: boolean;
  message: string;
  data: {
    vehicles: Vehicle[];
  };
}

/**
 * Installation Service Class
 * Handles all installation request-related API calls
 */
export class InstallationService {
  /**
   * Create a new installation request
   */
  static async createInstallationRequest(data: InstallationRequestCreateData): Promise<InstallationResponse> {
    return await apiService.post<InstallationResponse>('/v1/installation-requests', data);
  }

  /**
   * Get installation requests with filters
   */
  static async getInstallationRequests(params?: {
    ownerId?: string;
    vehicleId?: string;
    status?: string;
    q?: string;
    page?: number;
    limit?: number;
  }): Promise<InstallationListResponse> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const url = `/v1/installation-requests${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return await apiService.get<InstallationListResponse>(url);
  }

  /**
   * Get installation request summary for owner's vehicles
   */
  static async getInstallationRequestSummary(ownerId?: string): Promise<InstallationSummaryResponse> {
    const queryParams = new URLSearchParams();
    
    if (ownerId) {
      queryParams.append('ownerId', ownerId);
    }
    
    const url = `/v1/installation-requests/summary${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return await apiService.get<InstallationSummaryResponse>(url);
  }

  /**
   * Get owner's vehicles for selection
   */
  static async getOwnerVehicles(ownerId: string, params?: {
    q?: string;
    page?: number;
    limit?: number;
  }): Promise<VehicleListResponse> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const url = `/v1/installation-requests/owners/${ownerId}/vehicles${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return await apiService.get<VehicleListResponse>(url);
  }

  /**
   * Search vehicles globally or by owner
   */
  static async searchVehicles(params?: {
    q?: string;
    ownerId?: string;
  }): Promise<VehicleSearchResponse> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const url = `/v1/installation-requests/vehicles/search${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return await apiService.get<VehicleSearchResponse>(url);
  }

  /**
   * Assign device to installation request
   */
  static async assignInstallationRequest(id: string, data: InstallationRequestAssignData): Promise<InstallationResponse> {
    return await apiService.post<InstallationResponse>(`/v1/installation-requests/${id}/assign`, data);
  }

  /**
   * Complete installation request
   */
  static async completeInstallationRequest(id: string, data: InstallationRequestCompleteData): Promise<InstallationResponse> {
    return await apiService.post<InstallationResponse>(`/v1/installation-requests/${id}/complete`, data);
  }

  /**
   * Get raw installation request data (for debug)
   */
  static async getRawInstallationRequest(id: string): Promise<any> {
    return await apiService.get(`/v1/installation-requests/${id}/raw`);
  }
}

// Export the service as default
export default InstallationService;