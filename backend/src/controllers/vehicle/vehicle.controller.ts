import { Request, Response } from 'express';
import { Types } from 'mongoose';
import Vehicle from '../../models/core/Vehicle.model';
import MileageHistory from '../../models/core/MileageHistory.model';
import { AuthenticatedRequest } from '../../types/auth.types';
// Local minimal types for controller payloads
type VehicleRegistrationData = {
  vin: string;
  make: string;
  model: string;
  year: number;
  currentMileage?: number;
  location?: any;
  isListed?: boolean;
};

type VehicleSearchFilters = {
  make?: string;
  model?: string;
  minYear?: number;
  maxYear?: number;
  minMileage?: number;
  maxMileage?: number;
  minPrice?: number;
  maxPrice?: number;
  condition?: string;
  location?: string;
  trustScoreMin?: number;
  sortBy?: 'price' | 'mileage' | 'year' | 'trustScore';
  sortOrder?: 'asc' | 'desc';
};

type VehicleUpdateData = Partial<{
  make: string;
  vehicleModel: string;
  year: number;
  color: string;
  condition: string;
  price: number;
  location: string;
  isForSale: boolean;
  description: string;
}>;
import { 
  BadRequestError, 
  NotFoundError, 
  UnauthorizedError, 
  ConflictError,
  ValidationError 
} from '../../utils/errors';
import { logger } from '../../utils/logger';

export class VehicleController {
  
  /**
   * Register a new vehicle
   * POST /api/vehicles/register
   */
  async registerVehicle(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('User authentication required');
      }

      const vehicleData: VehicleRegistrationData = req.body;
      
      // Validate required fields
      if (!vehicleData.vin || !vehicleData.make || !vehicleData.model || !vehicleData.year) {
        throw new BadRequestError('VIN, make, model, and year are required');
      }

      // Check if VIN already exists
      const existingVehicle = await Vehicle.findOne({ vin: vehicleData.vin });
      if (existingVehicle) {
        throw new ConflictError('Vehicle with this VIN already exists');
      }

      // Validate VIN format (basic check)
      if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vehicleData.vin)) {
        throw new ValidationError('Invalid VIN format');
      }

      // Create vehicle with owner
      const vehicle = new Vehicle({
        vin: vehicleData.vin.toUpperCase(),
        make: vehicleData.make,
        vehicleModel: vehicleData.model,
        year: vehicleData.year,
        ownerId: new Types.ObjectId(userId),
        currentMileage: vehicleData.currentMileage || 0,
        mileageHistory: vehicleData.currentMileage ? [{
          mileage: vehicleData.currentMileage,
          recordedAt: new Date(),
          recordedBy: new Types.ObjectId(userId),
          source: 'owner',
          verified: false
        }] : [],
        trustScore: 50, // Initial trust score
        listingStatus: vehicleData.isListed ? 'active' : 'not_listed',
        isForSale: !!vehicleData.isListed
      });

      await vehicle.save();

      // Create initial mileage history record if mileage provided
      if (vehicleData.currentMileage) {
        const mileageRecord = new MileageHistory({
          vehicleId: vehicle._id,
          vin: vehicle.vin,
          mileage: vehicleData.currentMileage,
          recordedBy: new Types.ObjectId(userId),
          source: 'owner',
          location: vehicleData.location || undefined,
          verified: false,
          metadata: {
            registrationSource: 'initial_registration'
          }
        });
        await mileageRecord.save();
      }

      logger.info(`Vehicle registered successfully: ${vehicle.vin} by user ${userId}`);

      res.status(201).json({
        status: 'success',
        message: 'Vehicle registered successfully',
        data: {
          vehicle: vehicle.toObject()
        }
      });

    } catch (error) {
      logger.error('Vehicle registration failed:', error);
      
      if (error instanceof BadRequestError || 
          error instanceof ConflictError || 
          error instanceof ValidationError) {
        res.status(error.statusCode).json({
          status: 'error',
          message: error.message
        });
      } else {
        res.status(500).json({
          status: 'error',
          message: 'Internal server error during vehicle registration'
        });
      }
    }
  }

  /**
   * Get user's vehicles
   * GET /api/vehicles/my-vehicles
   */
  async getUserVehicles(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('User authentication required');
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const vehicles = await Vehicle.find({ ownerId: new Types.ObjectId(userId) })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('ownerId', 'firstName lastName email');

      const totalVehicles = await Vehicle.countDocuments({ ownerId: new Types.ObjectId(userId) });

      res.status(200).json({
        status: 'success',
        message: 'User vehicles retrieved successfully',
        data: {
          vehicles: vehicles.map(v => v.toObject()),
          pagination: {
            page,
            limit,
            total: totalVehicles,
            pages: Math.ceil(totalVehicles / limit)
          }
        }
      });

    } catch (error) {
      logger.error('Get user vehicles failed:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve user vehicles'
      });
    }
  }

  /**
   * Search vehicles with filters
   * GET /api/vehicles/search
   */
  async searchVehicles(req: Request, res: Response): Promise<void> {
    try {
      const filters: VehicleSearchFilters = req.query as any;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      // Build search query
      const searchQuery: any = {
        isListed: true,
        status: 'active'
      };

      // Apply filters
      if (filters.make) {
        searchQuery.make = new RegExp(filters.make, 'i');
      }
      if (filters.model) {
        searchQuery.vehicleModel = new RegExp(filters.model, 'i');
      }
      if (filters.minYear || filters.maxYear) {
        searchQuery.year = {};
        if (filters.minYear) searchQuery.year.$gte = filters.minYear;
        if (filters.maxYear) searchQuery.year.$lte = filters.maxYear;
      }
      if (filters.minMileage || filters.maxMileage) {
        searchQuery.currentMileage = {};
        if (filters.minMileage) searchQuery.currentMileage.$gte = filters.minMileage;
        if (filters.maxMileage) searchQuery.currentMileage.$lte = filters.maxMileage;
      }
      if (filters.minPrice || filters.maxPrice) {
        searchQuery.price = {};
        if (filters.minPrice) searchQuery.price.$gte = filters.minPrice;
        if (filters.maxPrice) searchQuery.price.$lte = filters.maxPrice;
      }
      if (filters.condition) {
        searchQuery.condition = filters.condition;
      }
      if (filters.location) {
        searchQuery.location = new RegExp(filters.location, 'i');
      }
      if (filters.trustScoreMin) {
        searchQuery.trustScore = { $gte: filters.trustScoreMin };
      }

      // Sort options
      const sortOptions: any = {};
      switch (filters.sortBy) {
        case 'price':
          sortOptions.price = filters.sortOrder === 'desc' ? -1 : 1;
          break;
        case 'mileage':
          sortOptions.currentMileage = filters.sortOrder === 'desc' ? -1 : 1;
          break;
        case 'year':
          sortOptions.year = filters.sortOrder === 'desc' ? -1 : 1;
          break;
        case 'trustScore':
          sortOptions.trustScore = filters.sortOrder === 'desc' ? -1 : 1;
          break;
        default:
          sortOptions.createdAt = -1;
      }

      const vehicles = await Vehicle.find(searchQuery)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .populate('ownerId', 'firstName lastName');

      const totalVehicles = await Vehicle.countDocuments(searchQuery);

      res.status(200).json({
        status: 'success',
        message: 'Vehicle search completed successfully',
        data: {
          vehicles: vehicles.map(v => v.toObject()),
          pagination: {
            page,
            limit,
            total: totalVehicles,
            pages: Math.ceil(totalVehicles / limit)
          },
          filters: filters
        }
      });

    } catch (error) {
      logger.error('Vehicle search failed:', error);
      res.status(500).json({
        status: 'error',
        message: 'Vehicle search failed'
      });
    }
  }

  /**
   * Get vehicle details by ID
   * GET /api/vehicles/:vehicleId
   */
  async getVehicleById(req: Request, res: Response): Promise<void> {
    try {
      const { vehicleId } = req.params;

      if (!Types.ObjectId.isValid(vehicleId)) {
        throw new BadRequestError('Invalid vehicle ID format');
      }

      const vehicle = await Vehicle.findById(vehicleId)
        .populate('ownerId', 'firstName lastName email phone')
        .populate('mileageHistory.recordedBy', 'firstName lastName');

      if (!vehicle) {
        throw new NotFoundError('Vehicle not found');
      }

      res.status(200).json({
        status: 'success',
        message: 'Vehicle details retrieved successfully',
        data: {
          vehicle: vehicle.toObject()
        }
      });

    } catch (error) {
      logger.error('Get vehicle by ID failed:', error);
      
      if (error instanceof BadRequestError || error instanceof NotFoundError) {
        res.status(error.statusCode).json({
          status: 'error',
          message: error.message
        });
      } else {
        res.status(500).json({
          status: 'error',
          message: 'Failed to retrieve vehicle details'
        });
      }
    }
  }

  /**
   * Update vehicle information
   * PUT /api/vehicles/:vehicleId
   */
  async updateVehicle(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { vehicleId } = req.params;
      const userId = req.user?.id;
      const updateData: VehicleUpdateData = req.body;

      if (!Types.ObjectId.isValid(vehicleId)) {
        throw new BadRequestError('Invalid vehicle ID format');
      }

      const vehicle = await Vehicle.findById(vehicleId);
      if (!vehicle) {
        throw new NotFoundError('Vehicle not found');
      }

      // Check ownership
      if (vehicle.ownerId.toString() !== userId) {
        throw new UnauthorizedError('You can only update your own vehicles');
      }

      // Update allowed fields
      const allowedUpdates = ['make', 'vehicleModel', 'year', 'color', 'condition', 'price', 'location', 'isListed', 'description'];
      const updates: any = {};
      
      allowedUpdates.forEach(field => {
        if (updateData[field] !== undefined) {
          updates[field] = updateData[field];
        }
      });

      updates.updatedAt = new Date();

      const updatedVehicle = await Vehicle.findByIdAndUpdate(
        vehicleId,
        updates,
        { new: true, runValidators: true }
      ).populate('ownerId', 'firstName lastName email');

      logger.info(`Vehicle updated successfully: ${vehicleId} by user ${userId}`);

      res.status(200).json({
        status: 'success',
        message: 'Vehicle updated successfully',
        data: {
          vehicle: updatedVehicle?.toObject()
        }
      });

    } catch (error) {
      logger.error('Vehicle update failed:', error);
      
      if (error instanceof BadRequestError || 
          error instanceof NotFoundError || 
          error instanceof UnauthorizedError) {
        res.status(error.statusCode).json({
          status: 'error',
          message: error.message
        });
      } else {
        res.status(500).json({
          status: 'error',
          message: 'Failed to update vehicle'
        });
      }
    }
  }

  /**
   * Delete vehicle
   * DELETE /api/vehicles/:vehicleId
   */
  async deleteVehicle(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { vehicleId } = req.params;
      const userId = req.user?.id;

      if (!Types.ObjectId.isValid(vehicleId)) {
        throw new BadRequestError('Invalid vehicle ID format');
      }

      const vehicle = await Vehicle.findById(vehicleId);
      if (!vehicle) {
        throw new NotFoundError('Vehicle not found');
      }

      // Check ownership
      if (vehicle.ownerId.toString() !== userId) {
        throw new UnauthorizedError('You can only delete your own vehicles');
      }

      // Soft delete - change status to deleted
      await Vehicle.findByIdAndUpdate(vehicleId, { 
        status: 'deleted',
        isListed: false,
        deletedAt: new Date()
      });

      logger.info(`Vehicle deleted successfully: ${vehicleId} by user ${userId}`);

      res.status(200).json({
        status: 'success',
        message: 'Vehicle deleted successfully'
      });

    } catch (error) {
      logger.error('Vehicle deletion failed:', error);
      
      if (error instanceof BadRequestError || 
          error instanceof NotFoundError || 
          error instanceof UnauthorizedError) {
        res.status(error.statusCode).json({
          status: 'error',
          message: error.message
        });
      } else {
        res.status(500).json({
          status: 'error',
          message: 'Failed to delete vehicle'
        });
      }
    }
  }

  /**
   * Validate VIN
   * POST /api/vehicles/validate-vin
   */
  async validateVIN(req: Request, res: Response): Promise<void> {
    try {
      const { vin } = req.body;

      if (!vin) {
        throw new BadRequestError('VIN is required');
      }

      // Check VIN format
      const isValidFormat = /^[A-HJ-NPR-Z0-9]{17}$/.test(vin.toUpperCase());
      
      // Check if VIN already exists
      const existingVehicle = await Vehicle.findOne({ vin });
      
      res.status(200).json({
        status: 'success',
        message: 'VIN validation completed',
        data: {
          vin,
          isValid: isValidFormat,
          exists: !!existingVehicle,
          vehicle: existingVehicle ? {
            id: existingVehicle._id,
            make: existingVehicle.make,
            model: existingVehicle.model,
            year: existingVehicle.year,
            listingStatus: (existingVehicle as any).listingStatus
          } : null
        }
      });

    } catch (error) {
      logger.error('VIN validation failed:', error);
      
      if (error instanceof BadRequestError) {
        res.status(error.statusCode).json({
          status: 'error',
          message: error.message
        });
      } else {
        res.status(500).json({
          status: 'error',
          message: 'VIN validation failed'
        });
      }
    }
  }

  /**
   * Get vehicle trust score
   * GET /api/vehicles/:vehicleId/trust-score
   */
  async getVehicleTrustScore(req: Request, res: Response): Promise<void> {
    try {
      const { vehicleId } = req.params;

      if (!Types.ObjectId.isValid(vehicleId)) {
        throw new BadRequestError('Invalid vehicle ID format');
      }

      const vehicle = await Vehicle.findById(vehicleId);
      if (!vehicle) {
        throw new NotFoundError('Vehicle not found');
      }

      // Calculate trust score
      const trustScore = await vehicle.calculateTrustScore();

      res.status(200).json({
        status: 'success',
        message: 'Trust score calculated successfully',
        data: {
          vehicleId,
          trustScore
        }
      });

    } catch (error) {
      logger.error('Trust score calculation failed:', error);
      
      if (error instanceof BadRequestError || error instanceof NotFoundError) {
        res.status(error.statusCode).json({
          status: 'error',
          message: error.message
        });
      } else {
        res.status(500).json({
          status: 'error',
          message: 'Failed to calculate trust score'
        });
      }
    }
  }

  /**
   * Get vehicle statistics
   * GET /api/vehicles/stats
   */
  async getVehicleStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await Vehicle.aggregate([
        {
          $group: {
            _id: null,
            totalVehicles: { $sum: 1 },
            activeVehicles: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
            listedVehicles: { $sum: { $cond: ['$isListed', 1, 0] } },
            averageTrustScore: { $avg: '$trustScore' },
            averageMileage: { $avg: '$currentMileage' },
            averagePrice: { $avg: '$price' }
          }
        }
      ]);

      const conditionStats = await Vehicle.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: '$condition', count: { $sum: 1 } } }
      ]);

      const makeStats = await Vehicle.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: '$make', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]);

      res.status(200).json({
        status: 'success',
        message: 'Vehicle statistics retrieved successfully',
        data: {
          overview: stats[0] || {
            totalVehicles: 0,
            activeVehicles: 0,
            listedVehicles: 0,
            averageTrustScore: 0,
            averageMileage: 0,
            averagePrice: 0
          },
          byCondition: conditionStats,
          byMake: makeStats
        }
      });

    } catch (error) {
      logger.error('Vehicle stats failed:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve vehicle statistics'
      });
    }
  }
}

export default new VehicleController(); 