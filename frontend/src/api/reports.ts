import { apiService } from './api';
import type { VehicleReportData, ListingRequest, ListingResponse, PDFResponse } from './report';

/**
 * Reports API Service
 * Handles all vehicle report related API calls
 */
export class ReportsAPI {
  
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
   * Generate PDF report (server-side)
   * POST /api/vehicles/:vehicleId/report/pdf
   */
  static async generateVehicleReportPdf(vehicleId: string): Promise<PDFResponse> {
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
  static async downloadVehicleReportPdf(vehicleId: string): Promise<Blob> {
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
   * Get marketplace listing status
   * GET /api/vehicles/:vehicleId/listing
   */
  static async getListingStatus(vehicleId: string): Promise<{ isListed: boolean; listingId?: string; price?: number }> {
    try {
      const response = await apiService.get(`/vehicles/${vehicleId}/listing`);
      return response.data;
    } catch (error) {
      console.error('Failed to get listing status:', error);
      throw error;
    }
  }
}

export default ReportsAPI;
