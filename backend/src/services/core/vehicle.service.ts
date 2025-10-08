import { Types } from 'mongoose';
import Vehicle from '../../models/core/Vehicle.model';
import MileageHistory from '../../models/core/MileageHistory.model';
import { 
  VehicleSearchFilters, 
  VehicleCondition,
  VehicleStatus,
  VehicleStatistics,
  FuelType,
  TransmissionType,
  Location 
} from '../../types/vehicle.types';
import { 
  ApiError, 
  NotFoundError, 
  ConflictError,
  ValidationError,
  BadRequestError 
} from '../../utils/errors';
import { logger } from '../../utils/logger';

// Additional type definitions
export interface VehicleRegistrationData {
  vin: string;
  make: string;
  model: string;
  year: number;
  color?: string;
  condition?: VehicleCondition;
  fuelType?: FuelType;
  transmission?: TransmissionType;
  engineSize?: string;
  features?: string[];
  description?: string;
  price?: number;
  location?: string;
  currentMileage?: number;
  isListed?: boolean;
}

export interface VehicleUpdateData {
  make?: string;
  model?: string;
  year?: number;
  color?: string;
  condition?: VehicleCondition;
  fuelType?: FuelType;
  transmission?: TransmissionType;
  engineSize?: string;
  features?: string[];
  description?: string;
  price?: number;
  location?: string;
  isListed?: boolean;
}

export class VehicleService {
  
  /**
   * Register a new vehicle with validation and business logic
   */
  static async registerVehicle(
    userId: string, 
    vehicleData: VehicleRegistrationData
  ): Promise<any> {
    try {
      // Validate required fields
      if (!vehicleData.vin || !vehicleData.make || !vehicleData.model || !vehicleData.year) {
        throw new BadRequestError('VIN, make, model, and year are required');
      }

      // Check if VIN already exists
      const existingVehicle = await Vehicle.findOne({ vin: vehicleData.vin });
      if (existingVehicle) {
        throw new ConflictError('Vehicle with this VIN already exists');
      }

      // Validate VIN format
      if (!this.validateVIN(vehicleData.vin)) {
        throw new ValidationError('Invalid VIN format');
      }

      // Validate year
      const currentYear = new Date().getFullYear();
      if (vehicleData.year < 1900 || vehicleData.year > currentYear + 1) {
        throw new ValidationError('Invalid vehicle year');
      }

      // Create vehicle with calculated trust score
      const initialTrustScore = this.calculateInitialTrustScore(vehicleData);

      const vehicle = new Vehicle({
        ...vehicleData,
        owner: new Types.ObjectId(userId),
        currentMileage: vehicleData.currentMileage || 0,
        mileageHistory: vehicleData.currentMileage ? [{
          mileage: vehicleData.currentMileage,
          recordedAt: new Date(),
          recordedBy: new Types.ObjectId(userId),
          source: 'owner',
          isVerified: false
        }] : [],
        trustScore: initialTrustScore,
        status: 'active' as VehicleStatus,
        isListed: vehicleData.isListed || false,
        registeredAt: new Date()
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
          location: vehicleData.location || 'Unknown',
          isVerified: false,
          metadata: {
            registrationSource: 'initial_registration',
            userRole: 'owner'
          }
        });
        await mileageRecord.save();
      }

      logger.info(`Vehicle registered successfully: ${vehicle.vin} by user ${userId}`);
      return vehicle.toObject();

    } catch (error) {
      logger.error('Vehicle registration failed:', error);
      throw error;
    }
  }

  /**
   * Search vehicles with advanced filtering and pagination
   */
  static async searchVehicles(
    filters: VehicleSearchFilters,
    page: number = 1,
    limit: number = 20
  ): Promise<{ vehicles: any[], total: number, pages: number }> {
    try {
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
        searchQuery.model = new RegExp(filters.model, 'i');
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
      if (filters.fuelType) {
        searchQuery.fuelType = filters.fuelType;
      }
      if (filters.transmission) {
        searchQuery.transmission = filters.transmission;
      }
      if (filters.trustScoreMin) {
        searchQuery.trustScore = { $gte: filters.trustScoreMin };
      }
      if (filters.location) {
        searchQuery.location = new RegExp(filters.location, 'i');
      }

      // Sort options
      let sortQuery: any = { createdAt: -1 }; // Default sort
      if (filters.sortBy) {
        switch (filters.sortBy) {
          case 'price_asc':
            sortQuery = { price: 1 };
            break;
          case 'price_desc':
            sortQuery = { price: -1 };
            break;
          case 'mileage_asc':
            sortQuery = { currentMileage: 1 };
            break;
          case 'mileage_desc':
            sortQuery = { currentMileage: -1 };
            break;
          case 'year_desc':
            sortQuery = { year: -1 };
            break;
          case 'trust_score_desc':
            sortQuery = { trustScore: -1 };
            break;
          default:
            sortQuery = { createdAt: -1 };
        }
      }

      const vehicles = await Vehicle.find(searchQuery)
        .sort(sortQuery)
        .skip(skip)
        .limit(limit)
        .populate('ownerId', 'firstName lastName')
        .lean();

      const total = await Vehicle.countDocuments(searchQuery);

      return {
        vehicles: vehicles.map(v => ({
          ...v,
          mileageHistory: undefined // Remove detailed history for list view
        })),
        total,
        pages: Math.ceil(total / limit)
      };

    } catch (error) {
      logger.error('Vehicle search failed:', error);
      throw error;
    }
  }

  /**
   * Get vehicle by ID with detailed information
   */
  static async getVehicleById(vehicleId: string): Promise<any> {
    try {
      if (!Types.ObjectId.isValid(vehicleId)) {
        throw new BadRequestError('Invalid vehicle ID format');
      }

      const vehicle = await Vehicle.findById(vehicleId)
        .populate('ownerId', 'firstName lastName email')
        .populate('mileageHistory.recordedBy', 'firstName lastName role');

      if (!vehicle) {
        throw new NotFoundError('Vehicle not found');
      }

      return vehicle.toObject();

    } catch (error) {
      logger.error('Get vehicle by ID failed:', error);
      throw error;
    }
  }

  /**
   * Update vehicle with validation
   */
  static async updateVehicle(
    vehicleId: string,
    userId: string,
    updateData: VehicleUpdateData
  ): Promise<any> {
    try {
      if (!Types.ObjectId.isValid(vehicleId)) {
        throw new BadRequestError('Invalid vehicle ID format');
      }

      const vehicle = await Vehicle.findById(vehicleId);
      if (!vehicle) {
        throw new NotFoundError('Vehicle not found');
      }

      // Check ownership
      if (vehicle.ownerId.toString() !== userId) {
        throw new BadRequestError('You can only update your own vehicles');
      }

      // Validate update data
      if (updateData.year && (updateData.year < 1900 || updateData.year > new Date().getFullYear() + 1)) {
        throw new ValidationError('Invalid vehicle year');
      }

      if (updateData.price && updateData.price < 0) {
        throw new ValidationError('Price cannot be negative');
      }

      // Update vehicle
      const updatedVehicle = await Vehicle.findByIdAndUpdate(
        vehicleId,
        { ...updateData, updatedAt: new Date() },
        { new: true }
      ).populate('ownerId', 'firstName lastName email');

      if (!updatedVehicle) {
        throw new NotFoundError('Vehicle not found');
      }

      // Recalculate trust score if relevant fields changed
      if (updateData.condition || updateData.price || updateData.description) {
        await updatedVehicle.calculateTrustScore();
      }

      logger.info(`Vehicle updated successfully: ${vehicleId} by user ${userId}`);
      return updatedVehicle.toObject();

    } catch (error) {
      logger.error('Vehicle update failed:', error);
      throw error;
    }
  }

  /**
   * Delete vehicle (soft delete)
   */
  static async deleteVehicle(vehicleId: string, userId: string): Promise<void> {
    try {
      if (!Types.ObjectId.isValid(vehicleId)) {
        throw new BadRequestError('Invalid vehicle ID format');
      }

      const vehicle = await Vehicle.findById(vehicleId);
      if (!vehicle) {
        throw new NotFoundError('Vehicle not found');
      }

      // Check ownership
      if (vehicle.ownerId.toString() !== userId) {
        throw new BadRequestError('You can only delete your own vehicles');
      }

      // Soft delete
      await Vehicle.findByIdAndUpdate(vehicleId, {
        status: 'deleted' as VehicleStatus,
        isListed: false,
        deletedAt: new Date()
      });

      logger.info(`Vehicle soft deleted: ${vehicleId} by user ${userId}`);

    } catch (error) {
      logger.error('Vehicle deletion failed:', error);
      throw error;
    }
  }

  /**
   * Get user's vehicles with pagination
   */
  static async getUserVehicles(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ vehicles: any[], total: number, pages: number }> {
    try {
      const skip = (page - 1) * limit;

      const vehicles = await Vehicle.find({ 
        ownerId: new Types.ObjectId(userId),
        status: { $ne: 'deleted' }
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('ownerId', 'firstName lastName email')
        .lean();

      const total = await Vehicle.countDocuments({ 
        ownerId: new Types.ObjectId(userId),
        status: { $ne: 'deleted' }
      });

      return {
        vehicles: vehicles.map(v => ({
          ...v,
          mileageHistory: undefined // Remove detailed history for list view
        })),
        total,
        pages: Math.ceil(total / limit)
      };

    } catch (error) {
      logger.error('Get user vehicles failed:', error);
      throw error;
    }
  }

  /**
   * Validate VIN format
   */
  static validateVIN(vin: string): boolean {
    // Basic VIN validation (17 characters, no I, O, Q)
    if (!vin || vin.length !== 17) {
      return false;
    }

    // Check for invalid characters
    const invalidChars = /[IOQ]/i;
    if (invalidChars.test(vin)) {
      return false;
    }

    // Check for alphanumeric characters only
    const validChars = /^[A-HJ-NPR-Z0-9]{17}$/i;
    return validChars.test(vin);
  }

  /**
   * Calculate initial trust score based on vehicle data
   */
  private static calculateInitialTrustScore(vehicleData: VehicleRegistrationData): number {
    let trustScore = 50; // Base score

    // Year factor (newer cars get higher trust score)
    const currentYear = new Date().getFullYear();
    const vehicleAge = currentYear - vehicleData.year;
    if (vehicleAge <= 3) trustScore += 20;
    else if (vehicleAge <= 7) trustScore += 10;
    else if (vehicleAge <= 15) trustScore += 5;

    // Condition factor
    if (vehicleData.condition === 'excellent') trustScore += 15;
    else if (vehicleData.condition === 'good') trustScore += 10;
    else if (vehicleData.condition === 'fair') trustScore += 5;

    // Mileage factor (lower mileage = higher trust)
    if (vehicleData.currentMileage) {
      const expectedMileage = vehicleAge * 12000; // 12k miles per year average
      if (vehicleData.currentMileage < expectedMileage * 0.8) trustScore += 10;
      else if (vehicleData.currentMileage > expectedMileage * 1.5) trustScore -= 10;
    }

    // Complete information bonus
    if (vehicleData.description && vehicleData.features && vehicleData.features.length > 0) {
      trustScore += 5;
    }

    return Math.min(Math.max(trustScore, 0), 100); // Clamp between 0-100
  }

  /**
   * Calculate trust score for existing vehicle
   */
  static async calculateTrustScore(vehicleId: string): Promise<number> {
    try {
      const vehicle = await Vehicle.findById(vehicleId);
      if (!vehicle) {
        throw new NotFoundError('Vehicle not found');
      }

      let trustScore = 50; // Base score

      // Get mileage history
      const mileageHistory = await MileageHistory.find({ vehicleId })
        .sort({ recordedAt: 1 });

      // Analyze mileage consistency
      if (mileageHistory.length > 1) {
        let consistencyScore = 0;
        let suspiciousCount = 0;

        for (let i = 1; i < mileageHistory.length; i++) {
          const current = mileageHistory[i];
          const previous = mileageHistory[i - 1];
          
          const timeDiff = current.recordedAt.getTime() - previous.recordedAt.getTime();
          const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
          const mileageDiff = current.mileage - previous.mileage;

          if (mileageDiff < 0) {
            suspiciousCount++;
          } else if (daysDiff > 0) {
            const dailyMileage = mileageDiff / daysDiff;
            if (dailyMileage > 500) { // Suspicious high daily mileage
              suspiciousCount++;
            } else if (dailyMileage < 100 && daysDiff > 30) { // Reasonable usage
              consistencyScore += 2;
            }
          }
        }

        trustScore += Math.min(consistencyScore, 20);
        trustScore -= suspiciousCount * 15;
      }

      // Verification bonus
      const verifiedRecords = mileageHistory.filter(record => record.verified);
      if (verifiedRecords.length > 0) {
        trustScore += verifiedRecords.length * 5;
      }

      // Service records bonus
      const serviceRecords = mileageHistory.filter(record => record.source === 'service');
      if (serviceRecords.length > 0) {
        trustScore += serviceRecords.length * 3;
      }

      // Update vehicle trust score
      const finalScore = Math.min(Math.max(trustScore, 0), 100);
      await Vehicle.findByIdAndUpdate(vehicleId, { trustScore: finalScore });

      return finalScore;

    } catch (error) {
      logger.error('Trust score calculation failed:', error);
      throw error;
    }
  }

  /**
   * Get vehicle statistics
   */
  static async getVehicleStats(userId?: string): Promise<VehicleStatistics> {
    try {
      const matchStage = userId ? { ownerId: new Types.ObjectId(userId) } : {};

      const stats = await Vehicle.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalVehicles: { $sum: 1 },
            activeVehicles: {
              $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
            },
            listedVehicles: {
              $sum: { $cond: ['$isListed', 1, 0] }
            },
            averageTrustScore: { $avg: '$trustScore' },
            averageMileage: { $avg: '$currentMileage' },
            averagePrice: { $avg: '$price' },
            totalValue: { $sum: '$price' }
          }
        }
      ]);

      const makeStats = await Vehicle.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$make',
            count: { $sum: 1 },
            averagePrice: { $avg: '$price' },
            averageMileage: { $avg: '$currentMileage' },
            averageTrustScore: { $avg: '$trustScore' }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]);

      const yearStats = await Vehicle.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$year',
            count: { $sum: 1 },
            averagePrice: { $avg: '$price' },
            averageMileage: { $avg: '$currentMileage' }
          }
        },
        { $sort: { _id: -1 } },
        { $limit: 10 }
      ]);

      return {
        totalVehicles: stats[0]?.totalVehicles || 0,
        verifiedVehicles: stats[0]?.activeVehicles || 0,
        flaggedVehicles: 0,
        averageTrustScore: stats[0]?.averageTrustScore || 0,
        totalDocuments: 0,
        recentActivity: 0,
        fraudAlerts: 0,
        resolvedFraudAlerts: 0
      };

    } catch (error) {
      logger.error('Vehicle stats calculation failed:', error);
      throw error;
    }
  }
} 