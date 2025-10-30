import { Request, Response } from 'express';
import { Types } from 'mongoose';
import Vehicle from '../../models/core/Vehicle.model';
import MileageHistory from '../../models/core/MileageHistory.model';
import { AuthenticatedRequest } from '../../types/auth.types';
// Local controller types (keep loose to satisfy runtime)
type MileageUpdateData = {
  mileage: number;
  source?: 'owner' | 'service' | 'inspection' | 'government' | 'automated';
  location?: any;
  notes?: string;
  metadata?: Record<string, any>;
};

type MileageVerificationData = {
  verificationNotes?: string;
  verificationSource?: string;
};

interface MileageAnalytics {
  totalRecords: number;
  averageMileageIncrease: number;
  maxMileageIncrease: number;
  minMileageIncrease: number;
  totalMileageIncrease: number;
  verificationRate: number;
  sourceDistribution: Record<string, number>;
  suspiciousRecords: number;
  timePattern: Array<{ period: string; count: number; avgMileage: number }>;
}
import { 
  BadRequestError, 
  NotFoundError, 
  UnauthorizedError, 
  ValidationError 
} from '../../utils/errors';
import { logger } from '../../utils/logger';

export class MileageController {
  
  /**
   * Update vehicle mileage
   * POST /api/vehicles/:vehicleId/mileage
   */
  async updateMileage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { vehicleId } = req.params;
      const userId = req.user?.id;
      const mileageData: MileageUpdateData = req.body;

      if (!userId) {
        throw new UnauthorizedError('User authentication required');
      }

      if (!Types.ObjectId.isValid(vehicleId)) {
        throw new BadRequestError('Invalid vehicle ID format');
      }

      // Validate mileage data
      if (!mileageData.mileage || mileageData.mileage < 0) {
        throw new BadRequestError('Valid mileage is required');
      }

      // Find vehicle and check ownership
      const vehicle = await Vehicle.findById(vehicleId);
      if (!vehicle) {
        throw new NotFoundError('Vehicle not found');
      }

      // Check if user can update mileage (owner or authorized service)
      const userRole = req.user?.role;
      if (vehicle.ownerId.toString() !== userId && userRole !== 'service' && userRole !== 'admin') {
        throw new UnauthorizedError('You are not authorized to update mileage for this vehicle');
      }

      // Validate mileage increase
      if (mileageData.mileage < vehicle.currentMileage) {
        // Check if this is a legitimate rollback (rare cases)
        if (!mileageData.notes || !mileageData.notes.includes('rollback')) {
          throw new ValidationError('Mileage cannot be less than current mileage');
        }
      }

      // Create mileage history record
      const mileageRecord = new MileageHistory({
        vehicleId: new Types.ObjectId(vehicleId),
        vin: vehicle.vin,
        mileage: mileageData.mileage,
        recordedBy: new Types.ObjectId(userId),
        source: mileageData.source || 'owner',
        location: mileageData.location || 'Unknown',
        notes: mileageData.notes,
        metadata: {
          userRole: userRole,
          deviceInfo: req.headers['user-agent'],
          ipAddress: req.ip,
          previousMileage: vehicle.currentMileage,
          mileageIncrease: mileageData.mileage - vehicle.currentMileage,
          ...mileageData.metadata
        }
      });

      await mileageRecord.save();

      // Update vehicle mileage
      await vehicle.updateMileage(
        mileageData.mileage,
        mileageData.source || 'owner',
        userId,
        mileageData.location
      );

      // Calculate trust score after mileage update
      await vehicle.calculateTrustScore();

      logger.info(`Mileage updated successfully: Vehicle ${vehicleId}, New mileage: ${mileageData.mileage}`);

      res.status(200).json({
        status: 'success',
        message: 'Mileage updated successfully',
        data: {
          vehicleId,
          previousMileage: vehicle.currentMileage,
          newMileage: mileageData.mileage,
          mileageIncrease: mileageData.mileage - vehicle.currentMileage,
          recordId: mileageRecord._id,
          trustScore: vehicle.trustScore
        }
      });

    } catch (error) {
      logger.error('Mileage update failed:', error);
      
      if (error instanceof BadRequestError || 
          error instanceof NotFoundError || 
          error instanceof UnauthorizedError ||
          error instanceof ValidationError) {
        res.status(error.statusCode).json({
          status: 'error',
          message: error.message
        });
      } else {
        res.status(500).json({
          status: 'error',
          message: 'Failed to update mileage'
        });
      }
    }
  }

  /**
   * Get vehicle mileage history
   * GET /api/vehicles/:vehicleId/mileage
   */
  async getVehicleMileageHistory(req: Request, res: Response): Promise<void> {
    try {
      const { vehicleId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const skip = (page - 1) * limit;

      if (!Types.ObjectId.isValid(vehicleId)) {
        throw new BadRequestError('Invalid vehicle ID format');
      }

      const vehicle = await Vehicle.findById(vehicleId);
      if (!vehicle) {
        throw new NotFoundError('Vehicle not found');
      }

      const mileageHistory = await MileageHistory.find({ vehicleId: new Types.ObjectId(vehicleId) })
        .sort({ recordedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('recordedBy', 'firstName lastName role');

      const totalRecords = await MileageHistory.countDocuments({ vehicleId: new Types.ObjectId(vehicleId) });

      // Get summary data
      const allRecords = await MileageHistory.find({ vehicleId: new Types.ObjectId(vehicleId) })
        .sort({ recordedAt: 1 });
      
      const registeredMileage = allRecords.find(r => r.source === 'owner')?.mileage || 0;
      const serviceVerifiedMileage = allRecords.find(r => r.source === 'service')?.mileage || null;
      
      // Get last OBD update (search from end)
      const lastOBDUpdate = [...allRecords].reverse().find(r => r.source === 'automated');
      
      // Latest mileage is the last record
      const latestMileage = allRecords.length > 0 ? allRecords[allRecords.length - 1].mileage : vehicle.currentMileage;

      res.status(200).json({
        status: 'success',
        message: 'Mileage history retrieved successfully',
        data: {
          vehicleId,
          vin: vehicle.vin,
          currentMileage: vehicle.currentMileage,
          totalMileage: latestMileage,
          registeredMileage,
          serviceVerifiedMileage,
          lastOBDUpdate: lastOBDUpdate ? {
            mileage: lastOBDUpdate.mileage,
            deviceId: lastOBDUpdate.deviceId,
            recordedAt: lastOBDUpdate.recordedAt
          } : null,
          history: mileageHistory.map(record => {
            const obj = record.toObject();
            return {
              ...obj,
              blockchainHash: obj.blockchainHash || undefined
            };
          }),
          pagination: {
            page,
            limit,
            total: totalRecords,
            pages: Math.ceil(totalRecords / limit)
          }
        }
      });

    } catch (error) {
      logger.error('Get mileage history failed:', error);
      
      if (error instanceof BadRequestError || error instanceof NotFoundError) {
        res.status(error.statusCode).json({
          status: 'error',
          message: error.message
        });
      } else {
        res.status(500).json({
          status: 'error',
          message: 'Failed to retrieve mileage history'
        });
      }
    }
  }

  /**
   * Get detailed mileage history with analytics
   * GET /api/mileage/history/:vehicleId
   */
  async getDetailedMileageHistory(req: Request, res: Response): Promise<void> {
    try {
      const { vehicleId } = req.params;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      if (!Types.ObjectId.isValid(vehicleId)) {
        throw new BadRequestError('Invalid vehicle ID format');
      }

      const vehicle = await Vehicle.findById(vehicleId);
      if (!vehicle) {
        throw new NotFoundError('Vehicle not found');
      }

      // Build query with date filters
      const query: any = { vehicleId: new Types.ObjectId(vehicleId) };
      if (startDate || endDate) {
        query.recordedAt = {};
        if (startDate) query.recordedAt.$gte = startDate;
        if (endDate) query.recordedAt.$lte = endDate;
      }

      const mileageHistory = await MileageHistory.find(query)
        .sort({ recordedAt: 1 })
        .populate('recordedBy', 'firstName lastName role')
        .populate('verifiedBy', 'firstName lastName role');

      // Calculate analytics
      const analytics = await this.calculateMileageAnalytics(vehicleId, startDate, endDate);

      res.status(200).json({
        status: 'success',
        message: 'Detailed mileage history retrieved successfully',
        data: {
          vehicleId,
          vin: vehicle.vin,
          currentMileage: vehicle.currentMileage,
          history: mileageHistory.map(record => record.toObject()),
          analytics,
          dateRange: {
            startDate: startDate?.toISOString(),
            endDate: endDate?.toISOString()
          }
        }
      });

    } catch (error) {
      logger.error('Get detailed mileage history failed:', error);
      
      if (error instanceof BadRequestError || error instanceof NotFoundError) {
        res.status(error.statusCode).json({
          status: 'error',
          message: error.message
        });
      } else {
        res.status(500).json({
          status: 'error',
          message: 'Failed to retrieve detailed mileage history'
        });
      }
    }
  }

  /**
   * Get suspicious mileage records
   * GET /api/mileage/suspicious
   */
  async getSuspiciousRecords(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userRole = req.user?.role;
      
      // Only admin and service can access suspicious records
      if (userRole !== 'admin' && userRole !== 'service') {
        throw new UnauthorizedError('Access denied: Insufficient permissions');
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      const suspiciousRecords = await (MileageHistory as any).findSuspiciousRecords(
        parseInt(req.query.limit as string) || 100
      );

      const paginatedRecords = suspiciousRecords.slice(skip, skip + limit);

      res.status(200).json({
        status: 'success',
        message: 'Suspicious mileage records retrieved successfully',
        data: {
          suspiciousRecords: paginatedRecords,
          pagination: {
            page,
            limit,
            total: suspiciousRecords.length,
            pages: Math.ceil(suspiciousRecords.length / limit)
          }
        }
      });

    } catch (error) {
      logger.error('Get suspicious records failed:', error);
      
      if (error instanceof UnauthorizedError) {
        res.status(error.statusCode).json({
          status: 'error',
          message: error.message
        });
      } else {
        res.status(500).json({
          status: 'error',
          message: 'Failed to retrieve suspicious records'
        });
      }
    }
  }

  /**
   * Verify mileage record
   * POST /api/mileage/verify/:recordId
   */
  async verifyMileageRecord(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { recordId } = req.params;
      const userId = req.user?.id;
      const userRole = req.user?.role;
      const verificationData: MileageVerificationData = req.body;

      if (!userId) {
        throw new UnauthorizedError('User authentication required');
      }

      // Only service and admin can verify records
      if (userRole !== 'admin' && userRole !== 'service') {
        throw new UnauthorizedError('Access denied: Only service providers and admins can verify mileage');
      }

      if (!Types.ObjectId.isValid(recordId)) {
        throw new BadRequestError('Invalid record ID format');
      }

      const mileageRecord = await MileageHistory.findById(recordId);
      if (!mileageRecord) {
        throw new NotFoundError('Mileage record not found');
      }

      // Mark as verified
      await mileageRecord.markAsVerified();

      // Update vehicle trust score
      const vehicle = await Vehicle.findById(mileageRecord.vehicleId);
      if (vehicle) {
        await vehicle.calculateTrustScore();
      }

      logger.info(`Mileage record verified: ${recordId} by user ${userId}`);

      res.status(200).json({
        status: 'success',
        message: 'Mileage record verified successfully',
        data: {
          recordId,
          verifiedAt: new Date(),
          verifiedBy: userId,
          verificationNotes: verificationData.verificationNotes
        }
      });

    } catch (error) {
      logger.error('Mileage verification failed:', error);
      
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
          message: 'Failed to verify mileage record'
        });
      }
    }
  }

  /**
   * Get mileage analytics for a vehicle
   * GET /api/mileage/analytics/:vehicleId
   */
  async getMileageAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const { vehicleId } = req.params;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      if (!Types.ObjectId.isValid(vehicleId)) {
        throw new BadRequestError('Invalid vehicle ID format');
      }

      const vehicle = await Vehicle.findById(vehicleId);
      if (!vehicle) {
        throw new NotFoundError('Vehicle not found');
      }

      const analytics = await this.calculateMileageAnalytics(vehicleId, startDate, endDate);

      res.status(200).json({
        status: 'success',
        message: 'Mileage analytics retrieved successfully',
        data: {
          vehicleId,
          vin: vehicle.vin,
          analytics,
          dateRange: {
            startDate: startDate?.toISOString(),
            endDate: endDate?.toISOString()
          }
        }
      });

    } catch (error) {
      logger.error('Get mileage analytics failed:', error);
      
      if (error instanceof BadRequestError || error instanceof NotFoundError) {
        res.status(error.statusCode).json({
          status: 'error',
          message: error.message
        });
      } else {
        res.status(500).json({
          status: 'error',
          message: 'Failed to retrieve mileage analytics'
        });
      }
    }
  }

  /**
   * Get global mileage statistics
   * GET /api/mileage/stats
   */
  async getMileageStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userRole = req.user?.role;
      
      // Only admin can access global stats
      if (userRole !== 'admin') {
        throw new UnauthorizedError('Access denied: Admin privileges required');
      }

      // Compute global statistics (all vehicles)
      const all = await MileageHistory.find({}).lean();
      const total = all.length;
      const verified = all.filter(r => r.verified).length;
      const bySource = all.reduce((acc: Record<string, number>, r: any) => {
        acc[r.source] = (acc[r.source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const increases = all
        .map((r: any) => r.mileageIncrease || 0)
        .filter((x: number) => x > 0);
      const stats = {
        totalRecords: total,
        verifiedRecords: verified,
        verificationRate: total > 0 ? (verified / total) * 100 : 0,
        avgMileageIncrease: increases.length > 0 ? (increases.reduce((s, x) => s + x, 0) / increases.length) : 0,
        maxMileageIncrease: increases.length > 0 ? Math.max(...increases) : 0,
        bySource
      } as any;

      const recentActivity = await MileageHistory.find({})
        .sort({ recordedAt: -1 })
        .limit(10)
        .populate('recordedBy', 'firstName lastName role')
        .populate('vehicleId', 'vin make vehicleModel');

      res.status(200).json({
        status: 'success',
        message: 'Global mileage statistics retrieved successfully',
        data: {
          statistics: stats,
          recentActivity: recentActivity.map(record => record.toObject())
        }
      });

    } catch (error) {
      logger.error('Get mileage stats failed:', error);
      
      if (error instanceof UnauthorizedError) {
        res.status(error.statusCode).json({
          status: 'error',
          message: error.message
        });
      } else {
        res.status(500).json({
          status: 'error',
          message: 'Failed to retrieve mileage statistics'
        });
      }
    }
  }

  /**
   * Private helper method to calculate mileage analytics
   */
  private async calculateMileageAnalytics(vehicleId: string, startDate?: Date, endDate?: Date): Promise<MileageAnalytics> {
    const query: any = { vehicleId: new Types.ObjectId(vehicleId) };
    
    if (startDate || endDate) {
      query.recordedAt = {};
      if (startDate) query.recordedAt.$gte = startDate;
      if (endDate) query.recordedAt.$lte = endDate;
    }

    const records = await MileageHistory.find(query).sort({ recordedAt: 1 });
    
    if (records.length === 0) {
      return {
        totalRecords: 0,
        averageMileageIncrease: 0,
        maxMileageIncrease: 0,
        minMileageIncrease: 0,
        totalMileageIncrease: 0,
        verificationRate: 0,
        sourceDistribution: {},
        suspiciousRecords: 0,
        timePattern: []
      };
    }

    const mileageIncreases = records.slice(1).map((record, index) => 
      record.mileage - records[index].mileage
    ).filter(increase => increase > 0);

    const sourceDistribution = records.reduce((acc, record) => {
      acc[record.source] = (acc[record.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const verifiedRecords = records.filter(record => (record as any).verified === true).length;
    const suspiciousRecords = records.filter(record => (record as any).mileageIncrease && (record as any).mileageIncrease > 500).length;

    return {
      totalRecords: records.length,
      averageMileageIncrease: mileageIncreases.length > 0 
        ? mileageIncreases.reduce((sum, inc) => sum + inc, 0) / mileageIncreases.length 
        : 0,
      maxMileageIncrease: mileageIncreases.length > 0 ? Math.max(...mileageIncreases) : 0,
      minMileageIncrease: mileageIncreases.length > 0 ? Math.min(...mileageIncreases) : 0,
      totalMileageIncrease: mileageIncreases.reduce((sum, inc) => sum + inc, 0),
      verificationRate: records.length > 0 ? (verifiedRecords / records.length) * 100 : 0,
      sourceDistribution,
      suspiciousRecords,
      timePattern: this.generateTimePattern(records)
    };
  }

  /**
   * Generate time pattern analysis
   */
  private generateTimePattern(records: any[]): Array<{ period: string; count: number; avgMileage: number }> {
    const monthlyData = records.reduce((acc, record) => {
      const month = record.recordedAt.toISOString().slice(0, 7); // YYYY-MM
      if (!acc[month]) {
        acc[month] = { count: 0, totalMileage: 0 };
      }
      acc[month].count += 1;
      acc[month].totalMileage += record.mileage;
      return acc;
    }, {} as Record<string, { count: number; totalMileage: number }>);

    return (Object.entries(monthlyData) as Array<[string, { count: number; totalMileage: number }]>).map(([month, data]) => ({
      period: month,
      count: data.count,
      avgMileage: data.totalMileage / data.count
    }));
  }
}

export default new MileageController(); 