import { Request, Response } from 'express';
import { VehicleTelemetry } from '../../models';
import { logger } from '../../utils/logger';

export class TelemetryController {
  /**
   * Get fraud alerts for a vehicle
   * GET /api/telemetry/fraud-alerts/:vehicleId
   */
  static async getFraudAlerts(req: Request, res: Response): Promise<void> {
    try {
      const { vehicleId } = req.params;
      
      // Find all telemetry records with fraud detection
      logger.info(`Searching for fraud records for vehicle: ${vehicleId}`);
      
      const fraudRecords = await VehicleTelemetry.find({
        vehicle: vehicleId,
        $or: [
          { 'validation.tamperingDetected': true },
          { 'validation.validationStatus': { $in: ['ROLLBACK_DETECTED', 'IMPOSSIBLE_DISTANCE', 'SUDDEN_JUMP'] } },
          { 'mileageValidation.flagged': true }
        ]
      })
      .sort({ 'rawData.receivedAt': -1 })
      .limit(10);
      
      logger.info(`Found ${fraudRecords.length} fraud records for vehicle ${vehicleId}`);
      
      // Debug: Check all telemetry records for this vehicle
      const allRecords = await VehicleTelemetry.find({ vehicle: vehicleId }).limit(5);
      logger.info(`Total telemetry records for vehicle: ${allRecords.length}`);
      if (allRecords.length > 0) {
        const sample = allRecords[0];
        logger.info(`Sample record:`, {
          id: sample._id,
          vehicle: sample.vehicle,
          validationStatus: sample.validation?.validationStatus,
          tamperingDetected: sample.validation?.tamperingDetected,
          flagged: sample.mileageValidation?.flagged
        });
      }

      // Transform to fraud alert format
      const fraudAlerts = fraudRecords.map(record => ({
        id: record._id.toString(),
        type: record.validation?.validationStatus || 'FRAUD_DETECTED',
        severity: record.validation?.validationStatus === 'ROLLBACK_DETECTED' ? 'high' : 'medium',
        message: `🚨 ${record.validation?.validationStatus || 'FRAUD'} DETECTED: Mileage ${record.obd?.mileage} km`,
        detectedAt: record.rawData?.receivedAt?.toISOString() || new Date().toISOString(),
        status: 'active',
        details: {
          expectedValue: record.mileageValidation?.previousMileage || 0,
          actualValue: record.obd?.mileage || 0,
          reason: record.validation?.validationStatus || 'Fraud detected',
          deviceID: record.deviceID,
          validationStatus: record.validation?.validationStatus
        }
      }));

      logger.info(`Found ${fraudAlerts.length} fraud alerts for vehicle ${vehicleId}`);

      res.json({
        success: true,
        data: fraudAlerts,
        count: fraudAlerts.length
      });

    } catch (error) {
      logger.error('Error fetching fraud alerts:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch fraud alerts',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get latest OBD data for a vehicle
   * GET /api/telemetry/latest-obd/:vehicleId
   */
  static async getLatestOBDData(req: Request, res: Response): Promise<void> {
    try {
      const { vehicleId } = req.params;
      
      // Set cache control headers to prevent 304 responses
      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      });
      
      // Find the latest telemetry record for this vehicle
      const latestRecord = await VehicleTelemetry.findOne({
        vehicle: vehicleId
      })
      .sort({ 'rawData.receivedAt': -1 });

      // Find the latest non-flagged record
      const latestNonFlaggedRecord = await VehicleTelemetry.findOne({
        vehicle: vehicleId,
        'mileageValidation.flagged': { $ne: true }
      })
      .sort({ 'rawData.receivedAt': -1 });

      if (!latestRecord) {
        return res.json({
          success: true,
          data: null,
          message: 'No OBD data available'
        });
      }

      // Transform to OBD validation format
      const transformRecord = (record: any) => ({
        deviceID: record.deviceID,
        status: record.status,
        validationStatus: record.validation?.validationStatus || 'PENDING',
        flagged: record.mileageValidation?.flagged || false,
        lastReading: {
          mileage: record.obd?.mileage || 0,
          speed: record.obd?.speed || 0,
          rpm: record.obd?.rpm || 0,
          engineTemp: record.obd?.engineTemp || 0,
          fuelLevel: record.obd?.fuelLevel || 0,
          dataQuality: record.dataQuality || 0,
          recordedAt: record.rawData?.receivedAt?.toISOString() || new Date().toISOString()
        },
        tamperingDetected: record.validation?.tamperingDetected || false,
        fraudScore: record.validation?.tamperingDetected ? 95 : 10,
        mileageValidation: {
          previousMileage: record.mileageValidation?.previousMileage,
          newMileage: record.mileageValidation?.newMileage,
          delta: record.mileageValidation?.delta,
          flagged: record.mileageValidation?.flagged
        }
      });

      const response = {
        success: true,
        data: {
          latest: transformRecord(latestRecord),
          latestNonFlagged: latestNonFlaggedRecord ? transformRecord(latestNonFlaggedRecord) : null
        }
      };

      logger.info(`Found latest OBD data for vehicle ${vehicleId}`);

      res.json(response);

    } catch (error) {
      logger.error('Error fetching latest OBD data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch latest OBD data',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get telemetry history for a vehicle
   * GET /api/telemetry/history/:vehicleId
   */
  static async getTelemetryHistory(req: Request, res: Response): Promise<void> {
    try {
      const { vehicleId } = req.params;
      const { limit = 50, offset = 0 } = req.query;
      
      // Find telemetry records for this vehicle
      const records = await VehicleTelemetry.find({
        vehicle: vehicleId
      })
      .sort({ 'rawData.receivedAt': -1 })
      .limit(Number(limit))
      .skip(Number(offset));

      // Transform to history format
      const history = records.map(record => {
        // Determine validation status based on fraud detection
        let validationStatus = 'VALID';
        let flagged = false;
        
        // Check for rollback (negative delta)
        if (record.mileageValidation?.delta && record.mileageValidation.delta < 0) {
          validationStatus = 'ROLLBACK_DETECTED';
          flagged = true;
        }
        // Check for excessive jump (delta > 1000 km in one reading)
        else if (record.mileageValidation?.delta && record.mileageValidation.delta > 1000) {
          validationStatus = 'SUSPICIOUS';
          flagged = true;
        }
        // Check for tampering detection
        else if (record.validation?.tamperingDetected || record.mileageValidation?.flagged) {
          validationStatus = record.validation?.validationStatus || 'INVALID';
          flagged = true;
        }
        
        return {
          id: record._id.toString(),
          mileage: record.obd?.mileage || 0,
          recordedAt: record.rawData?.receivedAt?.toISOString() || new Date().toISOString(),
          source: record.dataSource || 'unknown',
          verified: !flagged,
          deviceId: record.deviceID,
          blockchainHash: record.blockchainHash,
          previousMileage: record.mileageValidation?.previousMileage,
          newMileage: record.mileageValidation?.newMileage,
          delta: record.mileageValidation?.delta,
          flagged: flagged,
          validationStatus: validationStatus
        };
      });

      logger.info(`Found ${history.length} telemetry records for vehicle ${vehicleId}`);

      res.json({
        success: true,
        data: history,
        count: history.length
      });

    } catch (error) {
      logger.error('Error fetching telemetry history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch telemetry history',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
