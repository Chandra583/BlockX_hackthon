import { Request, Response } from 'express';
import { VehicleTelemetry } from '../../models/core/VehicleTelemetry.model';
import { Vehicle } from '../../models/core/Vehicle.model';
import { Device } from '../../models/core/Device.model';
import { TestResult } from '../../models/core/TestResult.model';
import { logger } from '../../utils/logger';
import mongoose from 'mongoose';

interface ESP32DeviceData {
  deviceID: string;
  status: 'obd_connected' | 'device_not_connected' | 'error' | 'discovery_mode';
  vin?: string;
  mileage?: number;
  currentMileage?: number; // Accept both keys for backwards compatibility
  newMileage?: number; // Accept both keys for backwards compatibility
  rpm?: number;
  speed?: number;
  engineTemp?: number;
  fuelLevel?: number;
  batteryVoltage?: number;
  dataQuality?: number;
  odometerPID?: string;
  dataSource?: string;
  timestamp: number;
  message?: string;
  bootCount?: number;
  signalStrength?: string;
  networkOperator?: string;
  freeHeap?: number;
  veepeakConnected?: boolean;
  httpAttempts?: number;
}

export class DeviceController {
  /**
   * FIXED: Receive device status from ESP32 with proper mileage validation
   * POST /api/device/status
   */
  static async receiveDeviceStatus(req: Request, res: Response): Promise<void> {
    const startTime = new Date();
    const testStartTime = Date.now();
    let telemetryRecord: any = null;
    let deviceRecord: any = null;
    let testRecord: any = null;
    let duration = 0;

    try {
      // Log raw request data for debugging
      logger.info('Raw ESP32 Request:', {
        body: req.body,
        contentType: req.get('content-type'),
        contentLength: req.get('content-length'),
        headers: req.headers,
        method: req.method,
        url: req.url
      });

      const deviceData: ESP32DeviceData = req.body;

      // Log the incoming data for monitoring
      logger.info('ESP32 Device Status Received:', {
        deviceID: deviceData?.deviceID,
        status: deviceData?.status,
        vin: deviceData?.vin,
        mileage: deviceData?.mileage,
        currentMileage: deviceData?.currentMileage,
        newMileage: deviceData?.newMileage,
        timestamp: deviceData?.timestamp,
        dataSource: deviceData?.dataSource,
        hasDeviceID: !!deviceData?.deviceID,
        hasStatus: !!deviceData?.status,
        hasTimestamp: !!deviceData?.timestamp,
        bodyType: typeof req.body,
        bodyKeys: Object.keys(req.body || {})
      });

      // Enhanced validation with detailed error messages
      const missingFields = [];
      if (!deviceData?.deviceID || deviceData.deviceID.trim().length === 0) {
        missingFields.push('deviceID (empty or missing)');
      }
      if (!deviceData?.status || deviceData.status.trim().length === 0) {
        missingFields.push('status (empty or missing)');
      }
      if (!deviceData?.timestamp && deviceData?.timestamp !== 0) {
        missingFields.push('timestamp (missing or zero)');
      }

      if (missingFields.length > 0) {
        const errorMsg = `Missing or invalid required fields: ${missingFields.join(', ')}`;
        logger.error('Validation failed:', { missingFields, received: req.body });
        return res.status(400).json({
          status: 'error',
          message: errorMsg,
          received: req.body,
          timestamp: new Date().toISOString()
        });
      }

      // FIXED: Extract reported mileage from device (accept both keys)
      const reportedMileage = deviceData.mileage || deviceData.currentMileage || deviceData.newMileage;
      
      if (!reportedMileage || reportedMileage <= 0) {
        logger.warn('No valid mileage data in request');
      }

      // Find or create device record
      try {
        deviceRecord = await Device.findOne({ deviceID: deviceData.deviceID });
        if (!deviceRecord) {
          deviceRecord = new Device({
            deviceID: deviceData.deviceID,
            deviceType: 'esp32_obd',
            status: 'active',
            description: `ESP32 OBD Device ${deviceData.deviceID}`,
            lastSeen: new Date(),
            lastDataReceived: new Date(),
            health: {
              batteryVoltage: deviceData.batteryVoltage || 0,
              bootCount: deviceData.bootCount || 0,
              signalStrength: deviceData.signalStrength || 'unknown',
              networkOperator: deviceData.networkOperator || 'unknown',
              freeHeap: deviceData.freeHeap || 0
            }
          });
          await deviceRecord.save();
          logger.info(`Created new device record: ${deviceData.deviceID}`);
        }
      } catch (deviceError) {
        logger.error('Error with device record:', deviceError);
        throw new Error(`Failed to handle device record: ${deviceError.message}`);
      }

      // Find vehicle by VIN if provided
      let vehicle = null;
      if (deviceData.vin) {
        vehicle = await Vehicle.findOne({ vin: deviceData.vin });
        if (!vehicle) {
          logger.warn(`Vehicle not found for VIN: ${deviceData.vin}`);
        }
      }

      // FIXED: Mileage validation logic
      let mileageValidation = {
        reportedMileage: reportedMileage || 0,
        previousMileage: 0,
        newMileage: reportedMileage || 0,
        delta: 0,
        flagged: false,
        validationStatus: 'PENDING' as const,
        reason: undefined as string | undefined
      };

      if (reportedMileage && reportedMileage > 0) {
        // Get authoritative previous mileage from vehicle
        const previousMileage = vehicle?.lastVerifiedMileage || vehicle?.currentMileage || 0;
        const delta = reportedMileage - previousMileage;
        
        mileageValidation = {
          reportedMileage,
          previousMileage,
          newMileage: reportedMileage,
          delta,
          flagged: false,
          validationStatus: 'VALID' as const,
          reason: undefined
        };

        // FIXED: Rollback detection (ANY decrease is fraud)
        if (delta < -5) { // Allow 5km tolerance for sensor errors
          mileageValidation.flagged = true;
          mileageValidation.validationStatus = 'ROLLBACK_DETECTED';
          mileageValidation.reason = `Odometer rollback detected: ${Math.abs(delta)} km decrease`;
          
          logger.error(`🚨 FRAUD ALERT: Odometer rollback detected on ${deviceData.deviceID}: ${previousMileage} -> ${reportedMileage} km (decrease: ${delta} km)`);
          
          // Return 422 for flagged records
          return res.status(422).json({
            status: 'flagged',
            message: 'Mileage rollback detected',
            flagged: true,
            reason: mileageValidation.reason,
            previousMileage,
            reportedMileage,
            delta,
            vehicleId: vehicle?._id,
            timestamp: new Date().toISOString()
          });
        }
        
        // Suspicious but not fraud: very large increase
        else if (delta > 1000) {
          mileageValidation.validationStatus = 'SUSPICIOUS';
          mileageValidation.reason = `Large mileage increase: ${delta} km`;
          logger.warn(`⚠️ SUSPICIOUS: Large mileage increase on ${deviceData.deviceID}: ${delta} km`);
        }
        
        // Valid increase
        else {
          mileageValidation.validationStatus = 'VALID';
          logger.info(`✅ Valid mileage update: ${previousMileage} -> ${reportedMileage} km (+${delta} km)`);
        }
      }

      // Create telemetry record with FIXED validation
      telemetryRecord = new VehicleTelemetry({
        deviceID: deviceData.deviceID,
        device: deviceRecord._id,
        vehicle: vehicle?._id,
        status: deviceData.status,
        message: deviceData.message || 'Device status update',
        dataSource: (deviceData.dataSource as any) || 'veepeak_obd',
        dataQuality: deviceData.dataQuality || 0,
        vin: deviceData.vin,
        obd: {
          mileage: reportedMileage,
          rpm: deviceData.rpm,
          speed: deviceData.speed,
          engineTemp: deviceData.engineTemp,
          fuelLevel: deviceData.fuelLevel,
          odometerPID: deviceData.odometerPID,
          diagnosticCodes: undefined
        },
        mileageValidation, // FIXED: Use new validation structure
        deviceHealth: {
          batteryVoltage: deviceData.batteryVoltage,
          bootCount: deviceData.bootCount,
          signalStrength: deviceData.signalStrength,
          networkOperator: deviceData.networkOperator,
          freeHeap: deviceData.freeHeap
        },
        rawData: {
          timestamp: deviceData.timestamp,
          receivedAt: new Date(),
          veepeakConnected: deviceData.veepeakConnected,
          httpAttempts: deviceData.httpAttempts,
          transmissionSuccess: true
        }
      });

      await telemetryRecord.save();
      logger.info(`Telemetry record created: ${telemetryRecord._id}`);

      // FIXED: Update vehicle mileage atomically if valid
      if (reportedMileage && reportedMileage > 0 && !mileageValidation.flagged && vehicle) {
        try {
          // Atomic update with race condition protection
          const updateResult = await Vehicle.findOneAndUpdate(
            { 
              _id: vehicle._id,
              lastVerifiedMileage: mileageValidation.previousMileage // Ensure no race condition
            },
            {
              $set: {
                currentMileage: mileageValidation.newMileage,
                lastVerifiedMileage: mileageValidation.newMileage,
                lastMileageUpdate: new Date()
              }
            },
            { new: true }
          );

          if (!updateResult) {
            // Race condition detected, re-read and validate
            const updatedVehicle = await Vehicle.findById(vehicle._id);
            const newPreviousMileage = updatedVehicle?.lastVerifiedMileage || 0;
            
            if (reportedMileage < newPreviousMileage) {
              // Still invalid after race condition check
              logger.error(`Race condition: Mileage still invalid after re-read. Previous: ${newPreviousMileage}, Reported: ${reportedMileage}`);
              return res.status(422).json({
                status: 'flagged',
                message: 'Mileage rollback detected (race condition)',
                flagged: true,
                reason: `Mileage ${reportedMileage} is less than current verified mileage ${newPreviousMileage}`,
                previousMileage: newPreviousMileage,
                reportedMileage,
                delta: reportedMileage - newPreviousMileage,
                vehicleId: vehicle._id,
                timestamp: new Date().toISOString()
              });
            }
            
            // Retry atomic update
            await Vehicle.findOneAndUpdate(
              { _id: vehicle._id },
              {
                $set: {
                  currentMileage: reportedMileage,
                  lastVerifiedMileage: reportedMileage,
                  lastMileageUpdate: new Date()
                }
              }
            );
          }

          logger.info(`✅ Vehicle mileage updated: ${vehicle.vin} -> ${mileageValidation.newMileage} km`);
        } catch (updateError) {
          logger.error('Failed to update vehicle mileage:', updateError);
          // Don't fail the request, just log the error
        }
      }

      // Update device last seen
      await Device.updateOne(
        { deviceID: deviceData.deviceID },
        {
          $set: {
            lastSeen: new Date(),
            lastDataReceived: new Date(),
            'health.batteryVoltage': deviceData.batteryVoltage || 0,
            'health.bootCount': deviceData.bootCount || 0,
            status: deviceData.status === 'obd_connected' ? 'active' : 'error'
          }
        }
      );

      // Create test result for monitoring
      testRecord = await TestResult.create({
        testType: 'device_status',
        testName: 'ESP32 Device Status',
        deviceID: deviceData.deviceID,
        status: mileageValidation.flagged ? 'failed' : 'passed',
        result: mileageValidation.flagged ? 'error' : 'success',
        testData: {
          deviceData: {
            deviceID: deviceData.deviceID,
            status: deviceData.status,
            vin: deviceData.vin,
            mileage: reportedMileage,
            dataQuality: deviceData.dataQuality
          },
          validation: mileageValidation
        },
        performance: {
          startTime: new Date(testStartTime),
          endTime: new Date(),
          duration: Date.now() - testStartTime
        }
      });

      duration = Date.now() - testStartTime;

      // FIXED: Return appropriate response based on validation
      if (mileageValidation.flagged) {
        // This should not happen as we return 422 above, but just in case
        return res.status(422).json({
          status: 'flagged',
          message: 'Mileage validation failed',
          flagged: true,
          reason: mileageValidation.reason,
          previousMileage: mileageValidation.previousMileage,
          reportedMileage: mileageValidation.reportedMileage,
          delta: mileageValidation.delta,
          vehicleId: vehicle?._id,
          timestamp: new Date().toISOString()
        });
      }

      // Success response
      res.status(200).json({
        status: 'success',
        message: 'Device status received and processed',
        data: {
          deviceID: deviceData.deviceID,
          status: deviceData.status,
          mileageValidation,
          vehicleId: vehicle?._id,
          telemetryId: telemetryRecord._id,
          testId: testRecord._id,
          processingTime: duration
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Device status processing error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to process device status',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }
}

