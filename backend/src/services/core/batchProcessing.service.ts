import { logger } from '../../utils/logger';
import { ApiError, ValidationError } from '../../utils/errors';
import BatchData from '../../models/core/BatchData.model';
import { Device, Vehicle, MileageHistory } from '../../models';
import { getSolanaService } from '../blockchain/solana.service';
import { walletService } from '../blockchain/wallet.service';
import mongoose from 'mongoose';

export interface TelemetryDataPoint {
  deviceID: string;
  vin?: string;
  mileage: number;
  rpm?: number;
  speed?: number;
  engineTemp?: number;
  fuelLevel?: number;
  batteryVoltage?: number;
  dataQuality?: number;
  odometerPID?: string;
  timestamp: number;
  location?: {
    latitude?: number;
    longitude?: number;
    accuracy?: number;
  };
  tamperingDetected?: boolean;
  validationStatus?: string;
}

export interface BatchSubmissionResult {
  success: boolean;
  batchId: string;
  transactionHash?: string;
  blockNumber?: number;
  error?: string;
  dataPointsProcessed: number;
}

export class BatchProcessingService {
  
  /**
   * Process incoming ESP32 data point
   */
  static async processDataPoint(dataPoint: TelemetryDataPoint): Promise<void> {
    try {
      logger.info(`📊 Processing data point from device: ${dataPoint.deviceID}`);
      
      // Find or create active batch for this device
      let activeBatch = await BatchData.findActiveBatch(dataPoint.deviceID);
      
      if (!activeBatch) {
        // Create new batch (trip started)
        logger.info(`🚀 Starting new trip batch for device: ${dataPoint.deviceID}`);
        
        // Get device and vehicle info
        const device = await Device.findOne({ deviceID: dataPoint.deviceID });
        const vehicle = device?.vehicle ? await Vehicle.findById(device.vehicle) : null;
        
        activeBatch = BatchData.createBatch(
          dataPoint.deviceID,
          device?.vehicle?.toString(),
          vehicle?.vin || dataPoint.vin
        );
        
        await activeBatch.save();
      }
      
      // Add data point to batch
      const dataPointWithTimestamp = {
        ...dataPoint,
        timestamp: new Date(dataPoint.timestamp)
      };
      
      activeBatch.addDataPoint(dataPointWithTimestamp);
      await activeBatch.save();
      
      // Update device pending data count
      await Device.findOneAndUpdate(
        { deviceID: dataPoint.deviceID },
        { 
          $inc: { 'batchProcessing.pendingDataCount': 1 },
          lastDataReceived: new Date()
        }
      );
      
      // Check if batch should be completed (trip ended)
      await this.checkBatchCompletion(activeBatch, dataPoint);
      
      logger.info(`✅ Data point processed for batch: ${activeBatch.batchId}`);
      
    } catch (error) {
      logger.error(`❌ Failed to process data point:`, error);
      throw new ApiError('Failed to process telemetry data', 500);
    }
  }
  
  /**
   * Check if batch should be completed based on trip end conditions
   */
  static async checkBatchCompletion(batch: any, latestDataPoint: TelemetryDataPoint): Promise<void> {
    try {
      // Trip end conditions:
      // 1. Engine RPM is 0 for extended period
      // 2. Speed is 0 for extended period
      // 3. No new data for 30 minutes
      // 4. Explicit trip end signal
      
      const lastDataPoints = batch.dataPoints.slice(-5); // Last 5 data points
      const now = new Date();
      const lastDataTime = new Date(latestDataPoint.timestamp);
      const timeSinceLastData = (now.getTime() - lastDataTime.getTime()) / (1000 * 60); // minutes
      
      let shouldComplete = false;
      let completionReason = '';
      
      // Check for engine off (RPM = 0 for last 3 data points)
      if (lastDataPoints.length >= 3) {
        const allRpmZero = lastDataPoints.every(dp => dp.rpm === 0);
        const allSpeedZero = lastDataPoints.every(dp => dp.speed === 0);
        
        if (allRpmZero && allSpeedZero) {
          shouldComplete = true;
          completionReason = 'Engine off detected';
        }
      }
      
      // Check for data timeout (no data for 30 minutes)
      if (timeSinceLastData > 30) {
        shouldComplete = true;
        completionReason = 'Data timeout - no data received for 30 minutes';
      }
      
      // Check for explicit trip end (could be added later)
      if (latestDataPoint.validationStatus === 'trip_end') {
        shouldComplete = true;
        completionReason = 'Explicit trip end signal';
      }
      
      if (shouldComplete) {
        logger.info(`🏁 Completing batch ${batch.batchId}: ${completionReason}`);
        
        batch.completeBatch();
        await batch.save();
        
        // Reset device pending count
        await Device.findOneAndUpdate(
          { deviceID: batch.deviceID },
          { 'batchProcessing.pendingDataCount': 0 }
        );
        
        // Queue for blockchain submission
        await this.queueForBlockchainSubmission(batch);
      }
      
    } catch (error) {
      logger.error(`❌ Failed to check batch completion:`, error);
    }
  }
  
  /**
   * Queue completed batch for blockchain submission
   */
  static async queueForBlockchainSubmission(batch: any): Promise<void> {
    try {
      // Only submit valid batches
      if (!batch.validation.isValid) {
        logger.warn(`⚠️ Batch ${batch.batchId} failed validation, not queuing for blockchain submission`);
        return;
      }
      
      // Check if batch meets minimum requirements
      if (batch.summary.totalDataPoints < 5) {
        logger.warn(`⚠️ Batch ${batch.batchId} has insufficient data points (${batch.summary.totalDataPoints}), not submitting to blockchain`);
        return;
      }
      
      logger.info(`📤 Queuing batch ${batch.batchId} for blockchain submission`);
      
      // The actual submission will be handled by a background job
      // For now, we'll attempt immediate submission
      await this.submitBatchToBlockchain(batch);
      
    } catch (error) {
      logger.error(`❌ Failed to queue batch for blockchain submission:`, error);
    }
  }
  
  /**
   * Submit batch to blockchain
   */
  static async submitBatchToBlockchain(batch: any): Promise<BatchSubmissionResult> {
    try {
      logger.info(`🔗 Submitting batch ${batch.batchId} to blockchain`);
      
      // Get vehicle and owner information
      const vehicle = await Vehicle.findById(batch.vehicleId);
      if (!vehicle) {
        throw new ValidationError('Vehicle not found for batch submission');
      }
      
      // Get owner's wallet
      const wallet = await walletService.getUserWallet(vehicle.ownerId.toString());
      if (!wallet) {
        throw new ValidationError('Owner wallet not found for blockchain submission');
      }
      
      // Validate against previous blockchain record
      const validationResult = await this.validateAgainstPreviousNode(batch, vehicle);
      if (!validationResult.isValid) {
        throw new ValidationError(`Previous node validation failed: ${validationResult.reason}`);
      }
      
      // Submit to Solana blockchain
      const blockchainResult = await getSolanaService().recordMileage(
        batch.vehicleId,
        batch.vin,
        batch.summary.endMileage,
        batch.summary.startMileage,
        'system', // recorded by system
        'automated', // automated source
        wallet
      );
      
      // Update batch with blockchain info
      batch.blockchainSubmission = {
        submitted: true,
        submittedAt: new Date(),
        transactionHash: blockchainResult.transactionHash,
        blockNumber: blockchainResult.blockNumber,
        submissionAttempts: (batch.blockchainSubmission?.submissionAttempts || 0) + 1
      };
      
      batch.tripStatus = 'submitted';
      await batch.save();
      
      // Create mileage history record
      await this.createMileageHistoryRecord(batch, blockchainResult.transactionHash);
      
      // Update vehicle current mileage
      await Vehicle.findByIdAndUpdate(batch.vehicleId, {
        currentMileage: batch.summary.endMileage,
        lastMileageUpdate: new Date()
      });
      
      logger.info(`✅ Batch ${batch.batchId} submitted to blockchain: ${blockchainResult.transactionHash}`);
      
      return {
        success: true,
        batchId: batch.batchId,
        transactionHash: blockchainResult.transactionHash,
        blockNumber: blockchainResult.blockNumber,
        dataPointsProcessed: batch.summary.totalDataPoints
      };
      
    } catch (error) {
      logger.error(`❌ Failed to submit batch to blockchain:`, error);
      
      // Update batch with error
      batch.blockchainSubmission = {
        submitted: false,
        submissionAttempts: (batch.blockchainSubmission?.submissionAttempts || 0) + 1,
        lastError: error.message
      };
      
      batch.tripStatus = 'failed';
      await batch.save();
      
      return {
        success: false,
        batchId: batch.batchId,
        error: error.message,
        dataPointsProcessed: batch.summary.totalDataPoints
      };
    }
  }
  
  /**
   * Validate batch against previous blockchain node
   */
  static async validateAgainstPreviousNode(batch: any, vehicle: any): Promise<{isValid: boolean, reason?: string}> {
    try {
      // Get last mileage record from database
      const lastMileageRecord = await MileageHistory.findOne({
        vehicleId: batch.vehicleId
      }).sort({ recordedAt: -1 });
      
      // Get last blockchain transaction for this vehicle
      // This would require querying the blockchain for the vehicle's transaction history
      // For now, we'll validate against the database record
      
      if (lastMileageRecord) {
        // Check if batch start mileage matches last recorded mileage
        const mileageDifference = Math.abs(batch.summary.startMileage - lastMileageRecord.mileage);
        
        if (mileageDifference > 100) { // Allow 100km tolerance
          return {
            isValid: false,
            reason: `Large gap between last recorded mileage (${lastMileageRecord.mileage}) and batch start (${batch.summary.startMileage})`
          };
        }
        
        // Check for mileage rollback
        if (batch.summary.endMileage < lastMileageRecord.mileage) {
          return {
            isValid: false,
            reason: `Mileage rollback detected: ${lastMileageRecord.mileage} -> ${batch.summary.endMileage}`
          };
        }
      }
      
      return { isValid: true };
      
    } catch (error) {
      logger.error(`❌ Failed to validate against previous node:`, error);
      return {
        isValid: false,
        reason: `Validation error: ${error.message}`
      };
    }
  }
  
  /**
   * Create mileage history record from batch
   */
  static async createMileageHistoryRecord(batch: any, transactionHash: string): Promise<void> {
    try {
      const mileageRecord = new MileageHistory({
        vehicleId: batch.vehicleId,
        vin: batch.vin,
        mileage: batch.summary.endMileage,
        recordedBy: null, // System generated
        source: 'automated',
        location: 'Unknown', // Could be derived from GPS data in batch
        notes: `Batch processing: ${batch.summary.totalDataPoints} data points, ${batch.summary.mileageDifference}km trip`,
        verified: true, // Automated records are pre-verified
        blockchainHash: transactionHash,
        deviceId: batch.deviceID,
        metadata: {
          batchId: batch.batchId,
          dataPointCount: batch.summary.totalDataPoints,
          tripDuration: batch.tripEndTime ? 
            (batch.tripEndTime.getTime() - batch.tripStartTime.getTime()) / (1000 * 60) : 0,
          averageSpeed: batch.summary.averageSpeed,
          maxSpeed: batch.summary.maxSpeed,
          fraudScore: batch.validation.fraudScore,
          validationPassed: batch.validation.isValid
        }
      });
      
      await mileageRecord.save();
      logger.info(`📝 Created mileage history record for batch: ${batch.batchId}`);
      
    } catch (error) {
      logger.error(`❌ Failed to create mileage history record:`, error);
    }
  }
  
  /**
   * Process pending batches (background job)
   */
  static async processPendingBatches(): Promise<void> {
    try {
      logger.info(`🔄 Processing pending batch submissions...`);
      
      const pendingBatches = await BatchData.findPendingSubmission(5); // Process 5 at a time
      
      for (const batch of pendingBatches) {
        try {
          await this.submitBatchToBlockchain(batch);
          
          // Add delay between submissions to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 2000));
          
        } catch (error) {
          logger.error(`❌ Failed to process batch ${batch.batchId}:`, error);
        }
      }
      
      logger.info(`✅ Processed ${pendingBatches.length} pending batches`);
      
    } catch (error) {
      logger.error(`❌ Failed to process pending batches:`, error);
    }
  }
  
  /**
   * Get batch statistics
   */
  static async getBatchStatistics(deviceID?: string): Promise<any> {
    try {
      const matchStage: any = {};
      if (deviceID) {
        matchStage.deviceID = deviceID;
      }
      
      const stats = await BatchData.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalBatches: { $sum: 1 },
            completedBatches: {
              $sum: { $cond: [{ $eq: ['$tripStatus', 'completed'] }, 1, 0] }
            },
            submittedBatches: {
              $sum: { $cond: [{ $eq: ['$tripStatus', 'submitted'] }, 1, 0] }
            },
            failedBatches: {
              $sum: { $cond: [{ $eq: ['$tripStatus', 'failed'] }, 1, 0] }
            },
            totalDataPoints: { $sum: '$summary.totalDataPoints' },
            totalMileage: { $sum: '$summary.mileageDifference' },
            averageBatchSize: { $avg: '$summary.totalDataPoints' },
            averageTripDistance: { $avg: '$summary.mileageDifference' }
          }
        }
      ]);
      
      return stats[0] || {
        totalBatches: 0,
        completedBatches: 0,
        submittedBatches: 0,
        failedBatches: 0,
        totalDataPoints: 0,
        totalMileage: 0,
        averageBatchSize: 0,
        averageTripDistance: 0
      };
      
    } catch (error) {
      logger.error(`❌ Failed to get batch statistics:`, error);
      throw new ApiError('Failed to retrieve batch statistics', 500);
    }
  }
}

export default BatchProcessingService;
