import { Request, Response } from 'express';
import { logger } from '../../utils/logger';
import { ApiError, ValidationError } from '../../utils/errors';
import BatchProcessingService from '../../services/core/batchProcessing.service';
import BatchData from '../../models/core/BatchData.model';
import { Device } from '../../models';
import { AuthenticatedRequest } from '../../types/auth.types';

export class BatchProcessingController {
  
  /**
   * Get batch processing statistics
   * GET /api/admin/batch-processing/statistics
   */
  static async getBatchStatistics(req: Request, res: Response): Promise<void> {
    try {
      const { deviceID, timeframe = '30d' } = req.query;
      
      const statistics = await BatchProcessingService.getBatchStatistics(deviceID as string);
      
      res.status(200).json({
        success: true,
        data: { statistics }
      });
      
    } catch (error) {
      logger.error('❌ Failed to get batch statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve batch statistics'
      });
    }
  }
  
  /**
   * Get batch processing dashboard
   * GET /api/admin/batch-processing/dashboard
   */
  static async getBatchDashboard(req: Request, res: Response): Promise<void> {
    try {
      // Get overall statistics
      const overallStats = await BatchProcessingService.getBatchStatistics();
      
      // Get recent batches
      const recentBatches = await BatchData.find({})
        .sort({ createdAt: -1 })
        .limit(20)
        .populate('vehicleId', 'vin make vehicleModel year');
      
      // Get pending submissions
      const pendingSubmissions = await BatchData.find({
        tripStatus: 'completed',
        'blockchainSubmission.submitted': false
      })
      .sort({ tripEndTime: 1 })
      .limit(10);
      
      // Get failed submissions
      const failedSubmissions = await BatchData.find({
        tripStatus: 'failed'
      })
      .sort({ updatedAt: -1 })
      .limit(10);
      
      // Get active trips
      const activeTrips = await BatchData.find({
        tripStatus: 'active'
      })
      .sort({ tripStartTime: -1 })
      .limit(15);
      
      const dashboard = {
        statistics: overallStats,
        recentBatches,
        pendingSubmissions,
        failedSubmissions,
        activeTrips,
        summary: {
          totalBatches: overallStats.totalBatches,
          pendingCount: pendingSubmissions.length,
          failedCount: failedSubmissions.length,
          activeCount: activeTrips.length,
          successRate: overallStats.totalBatches > 0 ? 
            (overallStats.submittedBatches / overallStats.totalBatches) * 100 : 0
        }
      };
      
      res.status(200).json({
        success: true,
        data: dashboard
      });
      
    } catch (error) {
      logger.error('❌ Failed to get batch dashboard:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve batch processing dashboard'
      });
    }
  }
  
  /**
   * Get batch details
   * GET /api/admin/batch-processing/batch/:batchId
   */
  static async getBatchDetails(req: Request, res: Response): Promise<void> {
    try {
      const { batchId } = req.params;
      
      const batch = await BatchData.findOne({ batchId })
        .populate('vehicleId', 'vin make vehicleModel year owner')
        .populate('processedBy', 'firstName lastName email');
      
      if (!batch) {
        return res.status(404).json({
          success: false,
          message: 'Batch not found'
        });
      }
      
      res.status(200).json({
        success: true,
        data: { batch }
      });
      
    } catch (error) {
      logger.error('❌ Failed to get batch details:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve batch details'
      });
    }
  }
  
  /**
   * Manually process pending batches
   * POST /api/admin/batch-processing/process-pending
   */
  static async processPendingBatches(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const adminId = req.user?.id;
      if (!adminId) {
        throw new ValidationError('Admin authentication required');
      }
      
      logger.info(`🔄 Manual batch processing initiated by admin: ${adminId}`);
      
      // Process pending batches in background
      BatchProcessingService.processPendingBatches()
        .then(() => {
          logger.info('✅ Manual batch processing completed');
        })
        .catch(error => {
          logger.error('❌ Manual batch processing failed:', error);
        });
      
      res.status(202).json({
        success: true,
        message: 'Batch processing initiated. Check dashboard for progress.'
      });
      
    } catch (error) {
      logger.error('❌ Failed to initiate batch processing:', error);
      res.status(error instanceof ApiError ? error.statusCode : 500).json({
        success: false,
        message: error.message || 'Failed to initiate batch processing'
      });
    }
  }
  
  /**
   * Retry failed batch submission
   * POST /api/admin/batch-processing/retry/:batchId
   */
  static async retryBatchSubmission(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { batchId } = req.params;
      const adminId = req.user?.id;
      
      const batch = await BatchData.findOne({ batchId });
      if (!batch) {
        return res.status(404).json({
          success: false,
          message: 'Batch not found'
        });
      }
      
      if (batch.tripStatus !== 'failed') {
        return res.status(400).json({
          success: false,
          message: 'Only failed batches can be retried'
        });
      }
      
      logger.info(`🔄 Retrying batch submission: ${batchId} by admin: ${adminId}`);
      
      const result = await BatchProcessingService.submitBatchToBlockchain(batch);
      
      res.status(200).json({
        success: true,
        message: result.success ? 'Batch submitted successfully' : 'Batch submission failed',
        data: result
      });
      
    } catch (error) {
      logger.error('❌ Failed to retry batch submission:', error);
      res.status(error instanceof ApiError ? error.statusCode : 500).json({
        success: false,
        message: error.message || 'Failed to retry batch submission'
      });
    }
  }
  
  /**
   * Get device batch history
   * GET /api/admin/batch-processing/device/:deviceId/history
   */
  static async getDeviceBatchHistory(req: Request, res: Response): Promise<void> {
    try {
      const { deviceId } = req.params;
      const { page = 1, limit = 20, status } = req.query;
      
      const query: any = { deviceID: deviceId };
      if (status) query.tripStatus = status;
      
      const skip = (Number(page) - 1) * Number(limit);
      
      const [batches, total] = await Promise.all([
        BatchData.find(query)
          .sort({ tripStartTime: -1 })
          .skip(skip)
          .limit(Number(limit))
          .populate('vehicleId', 'vin make vehicleModel year'),
        BatchData.countDocuments(query)
      ]);
      
      res.status(200).json({
        success: true,
        data: {
          batches,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit))
          }
        }
      });
      
    } catch (error) {
      logger.error('❌ Failed to get device batch history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve device batch history'
      });
    }
  }
  
  /**
   * Update batch configuration for device
   * PUT /api/admin/batch-processing/device/:deviceId/config
   */
  static async updateBatchConfiguration(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { deviceId } = req.params;
      const { batchType, batchSize, enabled } = req.body;
      
      const updateData: any = {};
      if (batchType) updateData['batchProcessing.batchType'] = batchType;
      if (batchSize) updateData['batchProcessing.batchSize'] = batchSize;
      if (enabled !== undefined) updateData['batchProcessing.enabled'] = enabled;
      
      const device = await Device.findOneAndUpdate(
        { deviceID: deviceId },
        { $set: updateData },
        { new: true }
      );
      
      if (!device) {
        return res.status(404).json({
          success: false,
          message: 'Device not found'
        });
      }
      
      res.status(200).json({
        success: true,
        message: 'Batch configuration updated successfully',
        data: { device }
      });
      
    } catch (error) {
      logger.error('❌ Failed to update batch configuration:', error);
      res.status(error instanceof ApiError ? error.statusCode : 500).json({
        success: false,
        message: error.message || 'Failed to update batch configuration'
      });
    }
  }
  
  /**
   * Get batch validation report
   * GET /api/admin/batch-processing/batch/:batchId/validation
   */
  static async getBatchValidationReport(req: Request, res: Response): Promise<void> {
    try {
      const { batchId } = req.params;
      
      const batch = await BatchData.findOne({ batchId });
      if (!batch) {
        return res.status(404).json({
          success: false,
          message: 'Batch not found'
        });
      }
      
      const validationReport = {
        batchId: batch.batchId,
        validationStatus: batch.validation.isValid ? 'PASSED' : 'FAILED',
        fraudScore: batch.validation.fraudScore,
        anomalies: batch.validation.anomalies,
        validationRules: batch.validation.validationRules,
        dataQuality: {
          totalDataPoints: batch.summary.totalDataPoints,
          averageDataQuality: batch.dataPoints.length > 0 ? 
            batch.dataPoints.reduce((sum: number, dp: any) => sum + (dp.dataQuality || 0), 0) / batch.dataPoints.length : 0,
          tamperingDetected: batch.dataPoints.filter((dp: any) => dp.tamperingDetected).length
        },
        tripAnalysis: {
          duration: batch.tripEndTime ? 
            (batch.tripEndTime.getTime() - batch.tripStartTime.getTime()) / (1000 * 60) : 0,
          distance: batch.summary.mileageDifference,
          averageSpeed: batch.summary.averageSpeed,
          maxSpeed: batch.summary.maxSpeed
        }
      };
      
      res.status(200).json({
        success: true,
        data: { validationReport }
      });
      
    } catch (error) {
      logger.error('❌ Failed to get batch validation report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve batch validation report'
      });
    }
  }
}

export default BatchProcessingController;
