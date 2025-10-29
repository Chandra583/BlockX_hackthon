import { Request, Response } from 'express';
import { logger } from '../../utils/logger';
import { ApiError, ValidationError, NotFoundError } from '../../utils/errors';
import MarketplaceService from '../../services/core/marketplace.service';
import { AuthenticatedRequest } from '../../types/auth.types';

export class MarketplaceController {
  
  /**
   * List vehicle for sale with automatic history report generation
   * POST /api/marketplace/list-vehicle
   */
  static async listVehicleForSale(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const ownerId = req.user?.id;
      if (!ownerId) {
        throw new ValidationError('User authentication required');
      }
      
      const result = await MarketplaceService.listVehicleForSale(ownerId, req.body);
      
      res.status(201).json({
        success: true,
        message: 'Vehicle listed for sale successfully with comprehensive history report',
        data: result
      });
      
    } catch (error) {
      logger.error('❌ Failed to list vehicle for sale:', error);
      res.status(error instanceof ApiError ? error.statusCode : 500).json({
        success: false,
        message: error.message || 'Failed to list vehicle for sale'
      });
    }
  }
  
  /**
   * Generate vehicle history report
   * GET /api/marketplace/vehicle/:vehicleId/history-report
   */
  static async generateHistoryReport(req: Request, res: Response): Promise<void> {
    try {
      const { vehicleId } = req.params;
      
      const historyReport = await MarketplaceService.generateVehicleHistoryReport(vehicleId);
      
      res.status(200).json({
        success: true,
        message: 'Vehicle history report generated successfully',
        data: { historyReport }
      });
      
    } catch (error) {
      logger.error('❌ Failed to generate history report:', error);
      res.status(error instanceof ApiError ? error.statusCode : 500).json({
        success: false,
        message: error.message || 'Failed to generate vehicle history report'
      });
    }
  }
  
  /**
   * Get marketplace listings
   * GET /api/marketplace/listings
   */
  static async getMarketplaceListings(req: Request, res: Response): Promise<void> {
    try {
      const {
        make,
        model,
        year,
        minPrice,
        maxPrice,
        condition,
        minTrustScore,
        city,
        state,
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;
      
      const filters: any = {
        isForSale: true,
        listingStatus: 'active'
      };
      
      if (make) filters.make = new RegExp(make as string, 'i');
      if (model) filters.vehicleModel = new RegExp(model as string, 'i');
      if (year) filters.year = Number(year);
      if (condition) filters.condition = condition;
      if (minTrustScore) filters.trustScore = { $gte: Number(minTrustScore) };
      
      // Price filtering would require a separate listing model in production
      // For now, we'll include it in the response structure
      
      const result = await MarketplaceService.getMarketplaceListings(
        filters,
        {
          page: Number(page),
          limit: Number(limit),
          sortBy: sortBy as string,
          sortOrder: sortOrder as 'asc' | 'desc'
        }
      );
      
      res.status(200).json({
        success: true,
        data: {
          listings: result.listings,
          total: result.pagination.total,
          page: result.pagination.page,
          limit: result.pagination.limit,
          totalPages: result.pagination.pages
        }
      });
      
    } catch (error) {
      logger.error('❌ Failed to get marketplace listings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve marketplace listings'
      });
    }
  }
  
  /**
   * Get vehicle details for marketplace
   * GET /api/marketplace/vehicle/:vehicleId
   */
  static async getVehicleDetails(req: Request, res: Response): Promise<void> {
    try {
      const { vehicleId } = req.params;
      const { includeHistoryReport = 'true' } = req.query;
      
      const result = await MarketplaceService.getVehicleMarketplaceDetails(
        vehicleId,
        includeHistoryReport === 'true'
      );
      
      res.status(200).json({
        success: true,
        data: result
      });
      
    } catch (error) {
      logger.error('❌ Failed to get vehicle details:', error);
      res.status(error instanceof ApiError ? error.statusCode : 500).json({
        success: false,
        message: error.message || 'Failed to retrieve vehicle details'
      });
    }
  }
  
  /**
   * Update vehicle listing
   * PUT /api/marketplace/vehicle/:vehicleId/listing
   */
  static async updateVehicleListing(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const ownerId = req.user?.id;
      if (!ownerId) {
        throw new ValidationError('User authentication required');
      }
      
      const { vehicleId } = req.params;
      
      const result = await MarketplaceService.updateVehicleListing(
        vehicleId,
        ownerId,
        req.body
      );
      
      res.status(200).json({
        success: true,
        message: 'Vehicle listing updated successfully',
        data: result
      });
      
    } catch (error) {
      logger.error('❌ Failed to update vehicle listing:', error);
      res.status(error instanceof ApiError ? error.statusCode : 500).json({
        success: false,
        message: error.message || 'Failed to update vehicle listing'
      });
    }
  }
  
  /**
   * Remove vehicle from marketplace
   * DELETE /api/marketplace/vehicle/:vehicleId/listing
   */
  static async removeVehicleListing(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const ownerId = req.user?.id;
      if (!ownerId) {
        throw new ValidationError('User authentication required');
      }
      
      const { vehicleId } = req.params;
      const { reason } = req.body;
      
      const result = await MarketplaceService.removeVehicleListing(
        vehicleId,
        ownerId,
        reason
      );
      
      res.status(200).json({
        success: true,
        message: 'Vehicle removed from marketplace successfully',
        data: result
      });
      
    } catch (error) {
      logger.error('❌ Failed to remove vehicle listing:', error);
      res.status(error instanceof ApiError ? error.statusCode : 500).json({
        success: false,
        message: error.message || 'Failed to remove vehicle listing'
      });
    }
  }
  
  /**
   * Get market analysis for vehicle
   * GET /api/marketplace/vehicle/:vehicleId/market-analysis
   */
  static async getMarketAnalysis(req: Request, res: Response): Promise<void> {
    try {
      const { vehicleId } = req.params;
      
      const analysis = await MarketplaceService.getMarketAnalysis(vehicleId);
      
      res.status(200).json({
        success: true,
        data: { analysis }
      });
      
    } catch (error) {
      logger.error('❌ Failed to get market analysis:', error);
      res.status(error instanceof ApiError ? error.statusCode : 500).json({
        success: false,
        message: error.message || 'Failed to retrieve market analysis'
      });
    }
  }
  
  /**
   * Search marketplace
   * GET /api/marketplace/search
   */
  static async searchMarketplace(req: Request, res: Response): Promise<void> {
    try {
      const {
        query,
        filters,
        location,
        radius,
        page = 1,
        limit = 20
      } = req.query;
      
      const searchParams = {
        query: query as string,
        filters: filters ? JSON.parse(filters as string) : {},
        location: location ? JSON.parse(location as string) : null,
        radius: radius ? Number(radius) : 50,
        page: Number(page),
        limit: Number(limit)
      };
      
      const result = await MarketplaceService.searchMarketplace(searchParams);
      
      res.status(200).json({
        success: true,
        data: result
      });
      
    } catch (error) {
      logger.error('❌ Failed to search marketplace:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search marketplace'
      });
    }
  }
  
  /**
   * Get marketplace statistics
   * GET /api/marketplace/statistics
   */
  static async getMarketplaceStatistics(req: Request, res: Response): Promise<void> {
    try {
      const { timeframe = '30d' } = req.query;
      
      const statistics = await MarketplaceService.getMarketplaceStatistics(timeframe as string);
      
      res.status(200).json({
        success: true,
        data: { statistics }
      });
      
    } catch (error) {
      logger.error('❌ Failed to get marketplace statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve marketplace statistics'
      });
    }
  }
}

export default MarketplaceController;
