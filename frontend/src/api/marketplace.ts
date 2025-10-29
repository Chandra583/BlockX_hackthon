import { apiService } from '../services/api';

/**
 * Marketplace API Service
 * Handles all marketplace-related API calls
 */

export interface MarketplaceListing {
  id: string;
  vehicle: {
    id: string;
    vin: string;
    make: string;
    model: string;
    year: number;
    color: string;
    currentMileage: number;
    condition: string;
    trustScore: number;
    features: string[];
    owner: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
    createdAt: string;
  };
  price: number;
  negotiable: boolean;
  description?: string;
  listedAt: string;
  views: number;
  inquiries: number;
}

export interface MarketplaceListingsResponse {
  success: boolean;
  data: {
    listings: MarketplaceListing[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface MarketplaceSearchParams {
  page?: number;
  limit?: number;
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  make?: string;
  model?: string;
  yearMin?: number;
  yearMax?: number;
  condition?: string;
  sort?: 'newest' | 'price-low' | 'price-high' | 'mileage-low' | 'year-new';
}

export interface BuyRequest {
  listingId: string;
  price: number;
  message: string;
}

export interface BuyRequestResponse {
  success: boolean;
  data: {
    requestId: string;
    listingId: string;
    buyerId: string;
    message: string;
    createdAt: string;
    status: 'pending' | 'accepted' | 'rejected';
  };
}

export class MarketplaceAPI {
  
  /**
   * Get marketplace listings with filters
   * GET /api/marketplace/listings
   */
  static async getListings(params: MarketplaceSearchParams = {}): Promise<MarketplaceListingsResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.q) queryParams.append('q', params.q);
      if (params.minPrice) queryParams.append('minPrice', params.minPrice.toString());
      if (params.maxPrice) queryParams.append('maxPrice', params.maxPrice.toString());
      if (params.make) queryParams.append('make', params.make);
      if (params.model) queryParams.append('model', params.model);
      if (params.yearMin) queryParams.append('yearMin', params.yearMin.toString());
      if (params.yearMax) queryParams.append('yearMax', params.yearMax.toString());
      if (params.condition) queryParams.append('condition', params.condition);
      if (params.sort) queryParams.append('sort', params.sort);

      const response = await apiService.get<MarketplaceListingsResponse>(`/marketplace/listings?${queryParams.toString()}`);
      return response;
    } catch (error) {
      console.error('Failed to fetch marketplace listings:', error);
      throw error;
    }
  }

  /**
   * Get specific marketplace listing
   * GET /api/marketplace/vehicle/:vehicleId
   */
  static async getListing(vehicleId: string): Promise<{ success: boolean; data: MarketplaceListing }> {
    try {
      const response = await apiService.get<{ success: boolean; data: MarketplaceListing }>(`/marketplace/vehicle/${vehicleId}`);
      return response;
    } catch (error) {
      console.error('Failed to fetch marketplace listing:', error);
      throw error;
    }
  }

  /**
   * Submit buy request
   * POST /api/marketplace/:listingId/request
   */
  static async requestToBuy(buyRequest: BuyRequest): Promise<BuyRequestResponse> {
    try {
      const response = await apiService.post<BuyRequestResponse>(`/marketplace/${buyRequest.listingId}/request`, {
        price: buyRequest.price,
        message: buyRequest.message
      });
      return response;
    } catch (error) {
      console.error('Failed to submit buy request:', error);
      throw error;
    }
  }

  /**
   * Search marketplace
   * GET /api/marketplace/search
   */
  static async searchMarketplace(params: MarketplaceSearchParams): Promise<MarketplaceListingsResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.q) queryParams.append('q', params.q);
      if (params.minPrice) queryParams.append('minPrice', params.minPrice.toString());
      if (params.maxPrice) queryParams.append('maxPrice', params.maxPrice.toString());
      if (params.make) queryParams.append('make', params.make);
      if (params.model) queryParams.append('model', params.model);
      if (params.yearMin) queryParams.append('yearMin', params.yearMin.toString());
      if (params.yearMax) queryParams.append('yearMax', params.yearMax.toString());
      if (params.condition) queryParams.append('condition', params.condition);
      if (params.sort) queryParams.append('sort', params.sort);
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());

      const response = await apiService.get<MarketplaceListingsResponse>(`/marketplace/search?${queryParams.toString()}`);
      return response;
    } catch (error) {
      console.error('Failed to search marketplace:', error);
      throw error;
    }
  }

  /**
   * Get marketplace statistics
   * GET /api/marketplace/statistics
   */
  static async getStatistics(): Promise<{ success: boolean; data: any }> {
    try {
      const response = await apiService.get<{ success: boolean; data: any }>('/marketplace/statistics');
      return response;
    } catch (error) {
      console.error('Failed to fetch marketplace statistics:', error);
      throw error;
    }
  }
}

export default MarketplaceAPI;
