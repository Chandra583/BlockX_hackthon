import { Request, Response } from 'express';
import { TrustScoreService } from '../../services/core/trustScore.service';
import { logger } from '../../utils/logger';

export class TelemetryEventController {
  /**
   * Process telemetry events that affect TrustScore
   * POST /api/telemetry/event
   */
  static async processEvent(req: Request, res: Response): Promise<void> {
    try {
      const { vehicleId, type, deltaScore, recordedAt, source, meta } = req.body;

      // Validate required fields
      if (!vehicleId || !type || deltaScore === undefined) {
        res.status(400).json({
          success: false,
          message: 'vehicleId, type, and deltaScore are required'
        });
        return;
      }

      // Validate deltaScore is a number
      if (typeof deltaScore !== 'number') {
        res.status(400).json({
          success: false,
          message: 'deltaScore must be a number'
        });
        return;
      }

      // Map event types to reasons
      const reasonMap: { [key: string]: string } = {
        'MILEAGE_ROLLBACK': 'Mileage rollback detected',
        'ODOMETER_TAMPERING': 'Odometer tampering detected',
        'SUSPICIOUS_MILEAGE': 'Suspicious mileage pattern detected',
        'FRAUD_DETECTED': 'Fraud activity detected',
        'POSITIVE_UPDATE': 'Positive trust event',
        'SERVICE_VERIFIED': 'Service record verified',
        'INSPECTION_PASSED': 'Vehicle inspection passed'
      };

      const reason = reasonMap[type] || `TrustScore event: ${type}`;

      // Use atomic TrustScore service
      const trustResult = await TrustScoreService.updateTrustScore({
        vehicleId,
        change: deltaScore,
        reason,
        source: source || 'telemetry',
        details: {
          eventType: type,
          meta: meta || {},
          recordedAt: recordedAt || new Date()
        },
        eventTimestamp: recordedAt ? new Date(recordedAt) : new Date()
      });

      if (!trustResult.success) {
        res.status(500).json({
          success: false,
          message: 'Failed to process trust score event',
          error: trustResult.error
        });
        return;
      }

      // Emit socket event
      await TrustScoreService.emitTrustScoreChange(
        vehicleId,
        trustResult.previousScore,
        trustResult.newScore,
        trustResult.eventId!,
        reason,
        deltaScore
      );

      logger.info(`📊 Telemetry event processed: vehicle=${vehicleId}, type=${type}, delta=${deltaScore}, score=${trustResult.previousScore}→${trustResult.newScore}`);

      res.json({
        success: true,
        message: 'Trust score event processed successfully',
        data: {
          vehicleId,
          eventType: type,
          deltaScore,
          previousScore: trustResult.previousScore,
          newScore: trustResult.newScore,
          eventId: trustResult.eventId,
          reason
        }
      });

    } catch (error) {
      logger.error('Error processing telemetry event:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process telemetry event',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export default TelemetryEventController;
