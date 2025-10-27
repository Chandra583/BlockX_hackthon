import mongoose from 'mongoose';
import { TrustEvent } from '../../models/core/TrustEvent.model';
import Vehicle from '../../models/core/Vehicle.model';
import { logger } from '../../utils/logger';
import { emitToUser } from '../../utils/socketEmitter';

export interface TrustScoreUpdateData {
  vehicleId: string;
  change: number;
  reason: string;
  source: 'telemetry' | 'admin' | 'manual' | 'fraudEngine' | 'anchor';
  details?: any;
  createdBy?: string;
  eventTimestamp?: Date;
}

export interface TrustScoreResult {
  success: boolean;
  previousScore: number;
  newScore: number;
  eventId?: string;
  error?: string;
}

export class TrustScoreService {
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 100; // ms

  /**
   * Atomically update TrustScore with proper concurrency handling
   * This is the single source of truth for TrustScore updates
   */
  static async updateTrustScore(data: TrustScoreUpdateData): Promise<TrustScoreResult> {
    const { vehicleId, change, reason, source, details = {}, createdBy, eventTimestamp } = data;
    
    logger.info(`🔄 TrustScore update initiated: vehicle=${vehicleId}, change=${change}, reason=${reason}`);

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        // Use MongoDB transaction for atomicity
        const session = await mongoose.startSession();
        
        try {
          await session.withTransaction(async () => {
            // Get current vehicle with lock
            const vehicle = await Vehicle.findById(vehicleId).session(session);
            if (!vehicle) {
              throw new Error(`Vehicle ${vehicleId} not found`);
            }

            const previousScore = vehicle.trustScore || 100;
            const newScore = Math.max(0, Math.min(100, previousScore + change));

            // Check for out-of-order events
            if (eventTimestamp) {
              const latestEvent = await TrustEvent.findOne({ vehicleId })
                .sort({ createdAt: -1 })
                .session(session);
              
              if (latestEvent && eventTimestamp < latestEvent.createdAt) {
                logger.warn(`⚠️ Out-of-order event detected: vehicle=${vehicleId}, eventTime=${eventTimestamp}, latestTime=${latestEvent.createdAt}`);
                // Option A: Reject out-of-order events (recommended)
                throw new Error('Event timestamp is earlier than latest recorded event. Rejecting to maintain order.');
              }
            }

            // Create trust event record
            const trustEvent = new TrustEvent({
              vehicleId,
              change,
              previousScore,
              newScore,
              reason,
              details,
              source,
              createdBy,
              createdAt: eventTimestamp || new Date()
            });

            // Save trust event
            await trustEvent.save({ session });

            // Update vehicle trust score atomically
            await Vehicle.findByIdAndUpdate(
              vehicleId,
              {
                $set: { 
                  trustScore: newScore,
                  lastTrustScoreUpdate: new Date()
                },
                $inc: { trustHistoryCount: 1 }
              },
              { session }
            );

            logger.info(`✅ TrustScore updated: vehicle=${vehicleId}, prev=${previousScore}, delta=${change}, new=${newScore}, reason=${reason}`);
            
            return {
              success: true,
              previousScore,
              newScore,
              eventId: trustEvent._id.toString()
            };
          });

          // Transaction successful
          const result = await this.getCurrentTrustScore(vehicleId);
          return {
            success: true,
            previousScore: result.previousScore,
            newScore: result.currentScore,
            eventId: result.latestEventId
          };

        } finally {
          await session.endSession();
        }

      } catch (error: any) {
        logger.error(`❌ TrustScore update attempt ${attempt} failed:`, error);
        
        if (attempt === this.MAX_RETRIES) {
          return {
            success: false,
            previousScore: 0,
            newScore: 0,
            error: error.message
          };
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * attempt));
      }
    }

    return {
      success: false,
      previousScore: 0,
      newScore: 0,
      error: 'Max retries exceeded'
    };
  }

  /**
   * Get current TrustScore for a vehicle
   */
  static async getCurrentTrustScore(vehicleId: string): Promise<{
    currentScore: number;
    previousScore: number;
    latestEventId?: string;
    lastUpdated?: Date;
  }> {
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      throw new Error(`Vehicle ${vehicleId} not found`);
    }

    const latestEvent = await TrustEvent.findOne({ vehicleId })
      .sort({ createdAt: -1 });

    return {
      currentScore: vehicle.trustScore || 100,
      previousScore: latestEvent?.previousScore || 100,
      latestEventId: latestEvent?._id.toString(),
      lastUpdated: latestEvent?.createdAt || vehicle.lastTrustScoreUpdate
    };
  }

  /**
   * Get TrustScore history for a vehicle
   */
  static async getTrustScoreHistory(vehicleId: string, limit = 50): Promise<any[]> {
    const events = await TrustEvent.find({ vehicleId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('createdBy', 'firstName lastName email')
      .lean();

    return events.map(event => ({
      id: event._id,
      vehicleId: event.vehicleId,
      change: event.change,
      previousScore: event.previousScore,
      newScore: event.newScore,
      reason: event.reason,
      source: event.source,
      details: event.details,
      createdBy: event.createdBy,
      createdAt: event.createdAt
    }));
  }

  /**
   * Recompute TrustScore from scratch using all history (for verification)
   */
  static async recomputeTrustScore(vehicleId: string): Promise<number> {
    const events = await TrustEvent.find({ vehicleId })
      .sort({ createdAt: 1 }); // Chronological order

    let score = 100; // Initial score
    
    for (const event of events) {
      score = Math.max(0, Math.min(100, score + event.change));
    }

    // Update vehicle with recomputed score
    await Vehicle.findByIdAndUpdate(vehicleId, { 
      trustScore: score,
      lastTrustScoreUpdate: new Date()
    });

    logger.info(`🔄 TrustScore recomputed: vehicle=${vehicleId}, finalScore=${score}`);
    return score;
  }

  /**
   * Seed initial TrustScore for testing
   */
  static async seedTrustScore(vehicleId: string, initialScore: number): Promise<TrustScoreResult> {
    return this.updateTrustScore({
      vehicleId,
      change: initialScore - 100, // Assuming base score is 100
      reason: 'Initial TrustScore seed',
      source: 'manual',
      details: { seeded: true }
    });
  }

  /**
   * Emit TrustScore change event to frontend
   */
  static async emitTrustScoreChange(vehicleId: string, previousScore: number, newScore: number, eventId: string, reason: string, change: number): Promise<void> {
    try {
      const vehicle = await Vehicle.findById(vehicleId);
      if (vehicle) {
        emitToUser(vehicle.ownerId.toString(), 'trustscore_changed', {
          vehicleId,
          previousScore,
          newScore,
          eventId,
          reason,
          change,
          timestamp: new Date()
        });
      }
    } catch (error) {
      logger.warn('Failed to emit TrustScore change event:', error);
    }
  }
}

export default TrustScoreService;
