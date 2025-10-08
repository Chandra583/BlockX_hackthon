import { Types } from 'mongoose';
import Vehicle from '../../models/core/Vehicle.model';
import MileageHistory from '../../models/core/MileageHistory.model';
import { 
  MileageSource, 
  VerificationStatus,
  FraudType,
  AlertSeverity 
} from '../../types/vehicle.types';
import { 
  ApiError, 
  NotFoundError, 
  ValidationError,
  BadRequestError 
} from '../../utils/errors';
import { logger } from '../../utils/logger';

// Additional type definitions
export interface MileageUpdateData {
  mileage: number;
  source?: MileageSource;
  location?: string;
  notes?: string;
  metadata?: any;
}

export interface MileageVerificationData {
  recordId: string;
  isVerified: boolean;
  verifierNotes?: string;
  verificationSource?: string;
}

export interface MileageAnalytics {
  totalRecords: number;
  averageMileageIncrease: number;
  suspiciousRecords: number;
  verifiedRecords: number;
  timePattern: Array<{
    period: string;
    count: number;
    avgMileage: number;
  }>;
  fraudIndicators: Array<{
    type: FraudType;
    count: number;
    severity: AlertSeverity;
  }>;
}

export class MileageService {
  
  /**
   * Update vehicle mileage with fraud detection
   */
  static async updateMileage(
    vehicleId: string,
    userId: string,
    userRole: string,
    mileageData: MileageUpdateData,
    requestInfo?: any
  ): Promise<any> {
    try {
      if (!Types.ObjectId.isValid(vehicleId)) {
        throw new BadRequestError('Invalid vehicle ID format');
      }

      // Validate mileage data
      if (!mileageData.mileage || mileageData.mileage < 0) {
        throw new BadRequestError('Valid mileage is required');
      }

      // Find vehicle
      const vehicle = await Vehicle.findById(vehicleId);
      if (!vehicle) {
        throw new NotFoundError('Vehicle not found');
      }

      // Check authorization
      const canUpdate = await this.canUpdateMileage(vehicleId, userId, userRole);
      if (!canUpdate) {
        throw new ApiError(403, 'You are not authorized to update mileage for this vehicle');
      }

      // Validate mileage against fraud detection
      const fraudCheck = await this.detectFraud(vehicleId, mileageData.mileage);
      if (fraudCheck.isSuspicious) {
        logger.warn(`Suspicious mileage update detected for vehicle ${vehicleId}:`, fraudCheck);
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
        verified: userRole === 'service' || userRole === 'admin',
        verificationStatus: fraudCheck.isSuspicious ? 'suspicious' : 'pending',
        metadata: {
          userRole: userRole,
          deviceInfo: requestInfo?.userAgent,
          ipAddress: requestInfo?.ip,
          previousMileage: vehicle.currentMileage,
          mileageIncrease: mileageData.mileage - vehicle.currentMileage,
          fraudScore: fraudCheck.score,
          ...mileageData.metadata
        }
      });

      await mileageRecord.save();

      // Update vehicle mileage
      await Vehicle.findByIdAndUpdate(vehicleId, {
        currentMileage: mileageData.mileage,
        $push: {
          mileageHistory: {
            mileage: mileageData.mileage,
            recordedAt: new Date(),
            recordedBy: new Types.ObjectId(userId),
            source: mileageData.source || 'owner',
            verified: userRole === 'service' || userRole === 'admin'
          }
        }
      });

      // Recalculate trust score
      const trustScore = await this.calculateTrustScore(vehicleId);
      await Vehicle.findByIdAndUpdate(vehicleId, { trustScore });

      logger.info(`Mileage updated successfully: Vehicle ${vehicleId}, New mileage: ${mileageData.mileage}`);

      return {
        vehicleId,
        previousMileage: vehicle.currentMileage,
        newMileage: mileageData.mileage,
        mileageIncrease: mileageData.mileage - vehicle.currentMileage,
        recordId: mileageRecord._id,
        trustScore: trustScore,
        fraudCheck: fraudCheck.isSuspicious ? {
          isSuspicious: true,
          score: fraudCheck.score,
          reasons: fraudCheck.reasons
        } : null
      };

    } catch (error) {
      logger.error('Mileage update failed:', error);
      throw error;
    }
  }

  /**
   * Get vehicle mileage history with analytics
   */
  static async getVehicleMileageHistory(
    vehicleId: string,
    page: number = 1,
    limit: number = 50,
    startDate?: Date,
    endDate?: Date
  ): Promise<any> {
    try {
      if (!Types.ObjectId.isValid(vehicleId)) {
        throw new BadRequestError('Invalid vehicle ID format');
      }

      const vehicle = await Vehicle.findById(vehicleId);
      if (!vehicle) {
        throw new NotFoundError('Vehicle not found');
      }

      const skip = (page - 1) * limit;
      const query: any = { vehicleId: new Types.ObjectId(vehicleId) };

      if (startDate || endDate) {
        query.recordedAt = {};
        if (startDate) query.recordedAt.$gte = startDate;
        if (endDate) query.recordedAt.$lte = endDate;
      }

      const mileageHistory = await MileageHistory.find(query)
        .sort({ recordedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('recordedBy', 'firstName lastName role')
        .populate('verifiedBy', 'firstName lastName role');

      const totalRecords = await MileageHistory.countDocuments(query);

      return {
        vehicleId,
        vin: vehicle.vin,
        currentMileage: vehicle.currentMileage,
        history: mileageHistory,
        pagination: {
          page,
          limit,
          total: totalRecords,
          pages: Math.ceil(totalRecords / limit)
        }
      };

    } catch (error) {
      logger.error('Get mileage history failed:', error);
      throw error;
    }
  }

  /**
   * Get suspicious mileage records
   */
  static async getSuspiciousRecords(
    userId: string,
    userRole: string,
    page: number = 1,
    limit: number = 20
  ): Promise<any> {
    try {
      // Only admin, service, and insurance can view suspicious records
      if (!['admin', 'service', 'insurance'].includes(userRole)) {
        throw new ApiError(403, 'Insufficient permissions to view suspicious records');
      }

      const skip = (page - 1) * limit;
      
      const suspiciousRecords = await MileageHistory.find({
        $or: [
          { verificationStatus: 'suspicious' },
          { 'metadata.fraudScore': { $gt: 0.7 } }
        ]
      })
        .sort({ recordedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('recordedBy', 'firstName lastName role')
        .populate('vehicleId', 'vin make vehicleModel year');

      const totalRecords = await MileageHistory.countDocuments({
        $or: [
          { verificationStatus: 'suspicious' },
          { 'metadata.fraudScore': { $gt: 0.7 } }
        ]
      });

      return {
        suspiciousRecords,
        pagination: {
          page,
          limit,
          total: totalRecords,
          pages: Math.ceil(totalRecords / limit)
        }
      };

    } catch (error) {
      logger.error('Get suspicious records failed:', error);
      throw error;
    }
  }

  /**
   * Verify mileage record
   */
  static async verifyMileageRecord(
    recordId: string,
    userId: string,
    userRole: string,
    verificationData: MileageVerificationData
  ): Promise<any> {
    try {
      // Only admin, service, and insurance can verify records
      if (!['admin', 'service', 'insurance'].includes(userRole)) {
        throw new ApiError(403, 'Insufficient permissions to verify mileage records');
      }

      if (!Types.ObjectId.isValid(recordId)) {
        throw new BadRequestError('Invalid record ID format');
      }

      const record = await MileageHistory.findById(recordId);
      if (!record) {
        throw new NotFoundError('Mileage record not found');
      }

      // Update verification status
      await MileageHistory.findByIdAndUpdate(recordId, {
        verified: verificationData.isVerified,
        verificationStatus: verificationData.isVerified ? 'verified' : 'rejected',
        verifiedBy: new Types.ObjectId(userId),
        verifiedAt: new Date(),
        verifierNotes: verificationData.verifierNotes,
        'metadata.verificationSource': verificationData.verificationSource
      });

      // Recalculate trust score for the vehicle
      const trustScore = await this.calculateTrustScore(record.vehicleId.toString());
      await Vehicle.findByIdAndUpdate(record.vehicleId, { trustScore });

      logger.info(`Mileage record ${recordId} verified by ${userId}: ${verificationData.isVerified}`);

      return {
        recordId,
        isVerified: verificationData.isVerified,
        verifiedBy: userId,
        verifiedAt: new Date(),
        newTrustScore: trustScore
      };

    } catch (error) {
      logger.error('Mileage verification failed:', error);
      throw error;
    }
  }

  /**
   * Get mileage analytics for a vehicle
   */
  static async getMileageAnalytics(
    vehicleId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<MileageAnalytics> {
    try {
      if (!Types.ObjectId.isValid(vehicleId)) {
        throw new BadRequestError('Invalid vehicle ID format');
      }

      const query: any = { vehicleId: new Types.ObjectId(vehicleId) };
      
      if (startDate || endDate) {
        query.recordedAt = {};
        if (startDate) query.recordedAt.$gte = startDate;
        if (endDate) query.recordedAt.$lte = endDate;
      }

      const records = await MileageHistory.find(query).sort({ recordedAt: 1 });

      const analytics: MileageAnalytics = {
        totalRecords: records.length,
        averageMileageIncrease: 0,
        suspiciousRecords: 0,
        verifiedRecords: 0,
        timePattern: [],
        fraudIndicators: []
      };

      if (records.length > 0) {
        let totalIncrease = 0;
        let increases = 0;

        for (let i = 1; i < records.length; i++) {
          const increase = records[i].mileage - records[i - 1].mileage;
          if (increase > 0) {
            totalIncrease += increase;
            increases++;
          }
        }

        analytics.averageMileageIncrease = increases > 0 ? totalIncrease / increases : 0;
        analytics.suspiciousRecords = records.filter(r => !r.verified).length;
        analytics.verifiedRecords = records.filter(r => r.verified).length;
        analytics.timePattern = this.generateTimePattern(records);
        analytics.fraudIndicators = this.analyzeFraudIndicators(records);
      }

      return analytics;

    } catch (error) {
      logger.error('Mileage analytics failed:', error);
      throw error;
    }
  }

  /**
   * Check if user can update mileage for a vehicle
   */
  private static async canUpdateMileage(
    vehicleId: string,
    userId: string,
    userRole: string
  ): Promise<boolean> {
    // Admin and service can update any vehicle
    if (userRole === 'admin' || userRole === 'service') {
      return true;
    }

         // Owner can update their own vehicle
     if (userRole === 'owner') {
       const vehicle = await Vehicle.findById(vehicleId);
       return vehicle ? (vehicle.ownerId?.toString() === userId) : false;
     }

    return false;
  }

  /**
   * Detect fraud in mileage updates
   */
  private static async detectFraud(
    vehicleId: string,
    newMileage: number
  ): Promise<{ isSuspicious: boolean; score: number; reasons: string[] }> {
    const result = {
      isSuspicious: false,
      score: 0,
      reasons: [] as string[]
    };

    try {
      // Get recent mileage history
      const recentRecords = await MileageHistory.find({ vehicleId })
        .sort({ recordedAt: -1 })
        .limit(10);

      if (recentRecords.length > 0) {
        const latestRecord = recentRecords[0];
        
        // Check for rollback
        if (newMileage < latestRecord.mileage) {
          result.score += 0.8;
          result.reasons.push('Mileage rollback detected');
        }

        // Check for unrealistic increases
        if (recentRecords.length > 1) {
          const timeDiff = Date.now() - latestRecord.recordedAt.getTime();
          const daysSinceLastUpdate = timeDiff / (1000 * 60 * 60 * 24);
          const mileageIncrease = newMileage - latestRecord.mileage;

          if (daysSinceLastUpdate > 0 && mileageIncrease > 0) {
            const dailyMileage = mileageIncrease / daysSinceLastUpdate;
            
            // Unrealistic daily mileage (>500 miles/day)
            if (dailyMileage > 500) {
              result.score += 0.6;
              result.reasons.push('Unrealistic daily mileage');
            }
            
            // Very high daily mileage (>200 miles/day)
            if (dailyMileage > 200) {
              result.score += 0.3;
              result.reasons.push('High daily mileage');
            }
          }
        }

        // Check for pattern inconsistencies
        if (recentRecords.length >= 3) {
          const increases = [];
          for (let i = 1; i < recentRecords.length; i++) {
            const increase = recentRecords[i - 1].mileage - recentRecords[i].mileage;
            if (increase > 0) increases.push(increase);
          }
          
          if (increases.length > 0) {
            const avgIncrease = increases.reduce((a, b) => a + b, 0) / increases.length;
            const currentIncrease = newMileage - latestRecord.mileage;
            
            // Sudden large increase compared to average
            if (currentIncrease > avgIncrease * 3) {
              result.score += 0.4;
              result.reasons.push('Sudden large mileage increase');
            }
          }
        }
      }

      result.isSuspicious = result.score > 0.5;
      return result;

    } catch (error) {
      logger.error('Fraud detection failed:', error);
      return result;
    }
  }

  /**
   * Calculate trust score based on mileage history
   */
  private static async calculateTrustScore(vehicleId: string): Promise<number> {
    let trustScore = 50; // Base score

    try {
      const records = await MileageHistory.find({ vehicleId }).sort({ recordedAt: 1 });
      
      if (records.length > 1) {
        let consistencyScore = 0;
        let suspiciousCount = 0;

        for (let i = 1; i < records.length; i++) {
          const current = records[i];
          const previous = records[i - 1];
          
          const timeDiff = current.recordedAt.getTime() - previous.recordedAt.getTime();
          const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
          const mileageDiff = current.mileage - previous.mileage;

          if (mileageDiff < 0) {
            suspiciousCount++;
          } else if (daysDiff > 0) {
            const dailyMileage = mileageDiff / daysDiff;
            if (dailyMileage > 500) {
              suspiciousCount++;
            } else if (dailyMileage < 100 && daysDiff > 30) {
              consistencyScore += 2;
            }
          }
        }

        trustScore += Math.min(consistencyScore, 20);
        trustScore -= suspiciousCount * 15;
      }

      // Verification bonus
      const verifiedRecords = records.filter(record => record.verified);
      trustScore += verifiedRecords.length * 5;

      // Service records bonus
      const serviceRecords = records.filter(record => record.source === 'service');
      trustScore += serviceRecords.length * 3;

      return Math.min(Math.max(trustScore, 0), 100);

    } catch (error) {
      logger.error('Trust score calculation failed:', error);
      return 50; // Default score on error
    }
  }

  /**
   * Generate time-based pattern analysis
   */
  private static generateTimePattern(records: any[]): Array<{ period: string; count: number; avgMileage: number }> {
    const patterns = new Map<string, { count: number; totalMileage: number }>();

    records.forEach(record => {
      const period = record.recordedAt.toISOString().substring(0, 7); // YYYY-MM format
      const existing = patterns.get(period) || { count: 0, totalMileage: 0 };
      patterns.set(period, {
        count: existing.count + 1,
        totalMileage: existing.totalMileage + record.mileage
      });
    });

    return Array.from(patterns.entries())
      .map(([period, data]) => ({
        period,
        count: data.count,
        avgMileage: data.totalMileage / data.count
      }))
      .sort((a, b) => a.period.localeCompare(b.period));
  }

  /**
   * Analyze fraud indicators
   */
  private static analyzeFraudIndicators(records: any[]): Array<{ type: FraudType; count: number; severity: AlertSeverity }> {
    const indicators = new Map<FraudType, { count: number; severity: AlertSeverity }>();

    for (let i = 1; i < records.length; i++) {
      const current = records[i];
      const previous = records[i - 1];
      
      if (current.mileage < previous.mileage) {
        const existing = indicators.get('odometer_rollback') || { count: 0, severity: 'high' as AlertSeverity };
        indicators.set('odometer_rollback', { count: existing.count + 1, severity: 'high' });
      }

      const timeDiff = current.recordedAt.getTime() - previous.recordedAt.getTime();
      const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
      const mileageDiff = current.mileage - previous.mileage;

      if (daysDiff > 0 && mileageDiff > 0) {
        const dailyMileage = mileageDiff / daysDiff;
        if (dailyMileage > 500) {
          const existing = indicators.get('mileage_inconsistency') || { count: 0, severity: 'medium' as AlertSeverity };
          indicators.set('mileage_inconsistency', { count: existing.count + 1, severity: 'medium' });
        }
      }
    }

    return Array.from(indicators.entries()).map(([type, data]) => ({
      type,
      count: data.count,
      severity: data.severity
    }));
  }
} 