import { apiService } from './api';

// Base interfaces first
export interface TelemetryBatch {
  id: string;
  recordedAt: string;
  deviceId: string;
  startMileage: number;
  endMileage: number;
  distance: number;
  blockchainHash: string | null;
  status: 'anchored' | 'pending' | 'failed';
  dataPoints: number;
}

export interface RollbackEvent {
  id: string;
  prevMileage: number;
  newMileage: number;
  deltaKm: number;
  timestamp: string;
  detectionReason: string;
  resolutionStatus: 'resolved' | 'unresolved' | 'investigating';
  resolvedBy: string | null;
}

export interface TrustEvent {
  reason: string;
  change: number;
  timestamp: string;
}

export interface TrustScore {
  score: number;
  lastUpdated: string;
  trend: 'increasing' | 'decreasing' | 'stable';
  topCauses: TrustEvent[];
}

// Main VehicleReportData interface (references the above interfaces)
export interface VehicleReportData {
  vehicle: {
    id: string;
    vin: string;
    vehicleNumber: string;
    make: string;
    model: string;
    year: number;
    color: string;
    currentMileage: number;
    trustScore: number;
    verificationStatus: string;
    createdAt: string;
  };
  owner: {
    id: string;
    fullName: string;
    email: string;
    registrationDate: string;
  };
  registeredOnChain: {
    solanaTxHash: string | null;
    arweaveTx: string | null;
    timestamp: string;
  };
  lastBatches: TelemetryBatch[];
  rollbackEvents: RollbackEvent[];
  trustScore: {
    score: number;
    lastUpdated: string;
    trend: 'increasing' | 'decreasing' | 'stable';
    topCauses: TrustEvent[];
  };
  listing: {
    isListed: boolean;
    price: number | null;
    listedAt: string | null;
    listingId: string;
  };
}

export interface ListingRequest {
  price: number;
  negotiable: boolean;
  description?: string;
}

export interface ListingResponse {
  vehicleId: string;
  price: number;
  negotiable: boolean;
  description: string;
  listedAt: string;
  marketplaceLink: string;
}

export interface PDFResponse {
  vehicleId: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  trustScore: number;
  generatedAt: string;
  downloadUrl: string;
}

/**
 * Report Service Class
 * Handles all vehicle report and marketplace related API calls
 */
export class ReportService {
  
  /**
   * Get comprehensive vehicle report
   * GET /api/vehicles/:vehicleId/report
   */
  static async getVehicleReport(vehicleId: string): Promise<VehicleReportData> {
    try {
      const response = await apiService.get(`/vehicles/${vehicleId}/report`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch vehicle report:', error);
      throw error;
    }
  }

  /**
   * List vehicle for sale
   * POST /api/vehicles/:vehicleId/list
   */
  static async listVehicleForSale(vehicleId: string, listingData: ListingRequest): Promise<ListingResponse> {
    try {
      const response = await apiService.post(`/vehicles/${vehicleId}/list`, listingData);
      return response.data;
    } catch (error) {
      console.error('Failed to list vehicle for sale:', error);
      throw error;
    }
  }

  /**
   * Remove vehicle from marketplace
   * POST /api/vehicles/:vehicleId/unlist
   */
  static async unlistVehicle(vehicleId: string): Promise<{ vehicleId: string; unlistedAt: string }> {
    try {
      const response = await apiService.post(`/vehicles/${vehicleId}/unlist`);
      return response.data;
    } catch (error) {
      console.error('Failed to unlist vehicle:', error);
      throw error;
    }
  }

  /**
   * Generate PDF report
   * POST /api/vehicles/:vehicleId/report/pdf
   */
  static async generatePDFReport(vehicleId: string): Promise<PDFResponse> {
    try {
      const response = await apiService.post(`/vehicles/${vehicleId}/report/pdf`);
      return response.data;
    } catch (error) {
      console.error('Failed to generate PDF report:', error);
      throw error;
    }
  }

  /**
   * Download PDF report
   * GET /api/vehicles/:vehicleId/report/pdf/download
   */
  static async downloadPDFReport(vehicleId: string): Promise<Blob> {
    try {
      const response = await apiService.get(`/vehicles/${vehicleId}/report/pdf/download`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Failed to download PDF report:', error);
      throw error;
    }
  }
}

export default ReportService;
