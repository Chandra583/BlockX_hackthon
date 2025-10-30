import { CronJob } from 'cron';
import { logger } from '../utils/logger';
import { TelemetryConsolidationService } from '../services/telemetryConsolidation.service';
import { TelemetryBatch } from '../models/TelemetryBatch.model';
import { VehicleTelemetry } from '../models/core/VehicleTelemetry.model';
import Vehicle from '../models/core/Vehicle.model';
import mongoose from 'mongoose';

/**
 * Daily Merkle Job - Consolidates telemetry data and anchors to blockchain
 * Runs every night at 2 AM to process the previous day's data
 */
export class DailyMerkleJob {
  private static job: CronJob;
  
  /**
   * Start the daily consolidation job
   */
  static start(): void {
    // Run at 2 AM every day
    this.job = new CronJob('0 2 * * *', async () => {
      await this.runDailyConsolidation();
    }, null, true, 'UTC');
    
    logger.info('🕐 Daily Merkle Job started - will run at 2 AM UTC');
  }
  
  /**
   * Stop the job
   */
  static stop(): void {
    if (this.job) {
      this.job.stop();
      logger.info('🛑 Daily Merkle Job stopped');
    }
  }
  
  /**
   * Run daily consolidation for all vehicles
   */
  static async runDailyConsolidation(): Promise<void> {
    try {
      logger.info('🌅 Starting daily telemetry consolidation...');
      
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateString = yesterday.toISOString().split('T')[0]; // YYYY-MM-DD
      
      // Get all vehicles with telemetry data from yesterday
      const vehiclesWithData = await this.getVehiclesWithTelemetryData(dateString);
      
      logger.info(`📊 Found ${vehiclesWithData.length} vehicles with telemetry data for ${dateString}`);
      
      const results = {
        processed: 0,
        successful: 0,
        failed: 0,
        errors: [] as string[]
      };
      
      // Process each vehicle
      for (const vehicleId of vehiclesWithData) {
        try {
          const result = await TelemetryConsolidationService.consolidateDayBatch(
            vehicleId,
            dateString
          );
          
          results.processed++;
          
          if (result.success) {
            results.successful++;
            logger.info(`✅ Consolidated batch for vehicle ${vehicleId}`);
          } else {
            results.failed++;
            results.errors.push(`Vehicle ${vehicleId}: ${result.error}`);
            logger.error(`❌ Failed to consolidate vehicle ${vehicleId}: ${result.error}`);
          }
          
          // Add delay between vehicles to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error) {
          results.processed++;
          results.failed++;
          const errorMsg = `Vehicle ${vehicleId}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          results.errors.push(errorMsg);
          logger.error(`❌ Error processing vehicle ${vehicleId}:`, error);
        }
      }
      
      // Process any remaining pending batches
      await TelemetryConsolidationService.processPendingBatches();
      
      logger.info('📈 Daily consolidation completed:', {
        date: dateString,
        processed: results.processed,
        successful: results.successful,
        failed: results.failed,
        errorCount: results.errors.length
      });
      
      // Emit completion event
      this.emitConsolidationComplete(results);
      
    } catch (error) {
      logger.error('❌ Daily consolidation job failed:', error);
      this.emitConsolidationError(error);
    }
  }
  
  /**
   * Get vehicles with telemetry data for a specific date
   */
  private static async getVehiclesWithTelemetryData(date: string): Promise<string[]> {
    try {
      const startOfDay = new Date(date + 'T00:00:00.000Z');
      const endOfDay = new Date(date + 'T23:59:59.999Z');
      
      // Find vehicles with telemetry data for the date
      const telemetryRecords = await VehicleTelemetry.aggregate([
        {
          $match: {
            'rawData.timestamp': {
              $gte: startOfDay.getTime(),
              $lte: endOfDay.getTime()
            }
          }
        },
        {
          $group: {
            _id: '$vehicle',
            count: { $sum: 1 }
          }
        },
        {
          $match: {
            count: { $gt: 0 }
          }
        }
      ]);
      
      return telemetryRecords.map(record => record._id.toString());
      
    } catch (error) {
      logger.error('❌ Failed to get vehicles with telemetry data:', error);
      return [];
    }
  }
  
  /**
   * Emit consolidation completion event
   */
  private static emitConsolidationComplete(results: any): void {
    // This would emit to WebSocket or other real-time system
    logger.info('📡 Emitting consolidation complete event');
    
    // Example: socket.emit('daily_consolidation_complete', results);
  }
  
  /**
   * Emit consolidation error event
   */
  private static emitConsolidationError(error: any): void {
    logger.error('📡 Emitting consolidation error event');
    
    // Example: socket.emit('daily_consolidation_error', { error: error.message });
  }
  
  /**
   * Manually trigger consolidation for a specific date
   */
  static async triggerConsolidation(date: string): Promise<void> {
    logger.info(`🔧 Manually triggering consolidation for ${date}`);
    await this.runDailyConsolidation();
  }
  
  /**
   * Get job status
   */
  static getStatus(): {
    running: boolean;
    nextRun?: Date;
    lastRun?: Date;
  } {
    return {
      running: this.job ? this.job.running : false,
      nextRun: this.job ? (this.job.nextDate() as any).toJSDate() : undefined,
      lastRun: this.job ? (this.job as any).lastDate() : undefined
    };
  }
}
