import { apiService } from './api';

// Types for Service Installs API responses
export interface InstallAssignment {
  id: string;
  vehicleId: string;
  ownerId: string;
  serviceProviderId?: string;
  status: 'requested' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'flagged';
  deviceId?: string;
  requestedAt: string;
  assignedAt?: string;
  startedAt?: string;
  completedAt?: string;
  notes?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  initialMileage?: number;
  solanaTx?: string;
  arweaveTx?: string;
  history: Array<{
    action: string;
    by: string;
    at: string;
    meta?: any;
  }>;
  vehicle?: {
    id: string;
    vin: string;
    vehicleNumber: string;
    make: string;
    vehicleModel: string;
    year: number;
    lastVerifiedMileage?: number;
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
}

export interface StartInstallData {
  installId: string;
  deviceId: string;
  initialMileage: number;
}

export interface CompleteInstallData {
  installId: string;
  finalNotes?: string;
}

export interface AssignInstallData {
  installId: string;
  serviceProviderId: string;
}

export interface InstallListResponse {
  success: boolean;
  message: string;
  data: {
    installations: InstallAssignment[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface InstallResponse {
  success: boolean;
  message: string;
  data: any;
}

export interface StartInstallResponse {
  success: boolean;
  message: string;
  data: {
    installId: string;
    status: string;
    deviceId: string;
    initialMileage: number;
    startedAt: string;
    solanaTx: string;
    arweaveTx: string;
    arweaveUrl: string;
    solanaUrl: string;
  };
}

export interface CompleteInstallResponse {
  success: boolean;
  message: string;
  data: {
    installId: string;
    status: string;
    completedAt: string;
    deviceId?: string;
    finalNotes?: string;
    solanaTx?: string;
    arweaveTx?: string;
    blockchainUrls?: {
      solanaUrl?: string;
      arweaveUrl?: string;
    };
  };
}

export interface AssignInstallResponse {
  success: boolean;
  message: string;
  data: {
    installId: string;
    status: string;
    assignedAt: string;
    serviceProviderId: string;
  };
}

/**
 * Service Installs API Service
 * Handles all service provider installation-related API calls
 */
export class ServiceInstallsService {
  /**
   * Get assigned installations for the current service provider
   */
  static async getAssignedInstallations(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<InstallListResponse> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const url = `/service/installs/assigned${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return await apiService.get<InstallListResponse>(url);
  }

  /**
   * Start an installation
   */
  static async startInstallation(data: StartInstallData): Promise<StartInstallResponse> {
    return await apiService.post<StartInstallResponse>('/service/install/start', data);
  }

  /**
   * Complete an installation
   */
  static async completeInstallation(data: CompleteInstallData): Promise<CompleteInstallResponse> {
    return await apiService.post<CompleteInstallResponse>('/service/install/complete', data);
  }

  /**
   * Assign an installation (admin only)
   */
  static async assignInstallation(data: AssignInstallData): Promise<AssignInstallResponse> {
    return await apiService.post<AssignInstallResponse>('/admin/assign-install', data);
  }

  /**
   * Get installation by ID
   */
  static async getInstallation(id: string): Promise<InstallResponse> {
    return await apiService.get<InstallResponse>(`/installs/${id}`);
  }
}

// Export the service as default
export default ServiceInstallsService;