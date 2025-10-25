import { Request, Response } from 'express';
import { logger } from '../../utils/logger';
import { ApiError, ValidationError } from '../../utils/errors';
import { Device, VehicleTelemetry, TestResult, IDevice, IVehicleTelemetry, ITestResult, Vehicle } from '../../models';
import MileageHistory from '../../models/core/MileageHistory.model';
import { TelemetryConsolidationService } from '../../services/telemetryConsolidation.service';
import { emitEvent, emitToUser } from '../../utils/socketEmitter';
import mongoose from 'mongoose';

// Device data interface matching ESP32 data structure
interface ESP32DeviceData {
  deviceID: string;
  deviceId?: string;  // OBD Device ID for installation mapping
  status: 'obd_connected' | 'device_not_connected' | 'error';
  message: string;
  vin?: string;
  mileage?: number;
  currentMileage?: number;
  newMileage?: number;
  reportedMileage?: number;
  rpm?: number;
  speed?: number;
  engineTemp?: number;
  fuelLevel?: number;
  batteryVoltage?: number;
  dataQuality?: number;
  odometerPID?: string;
  bootCount?: number;
  timestamp: number;
  dataSource: string;
  veepeakConnected?: boolean;
  location?: {
    latitude?: number;
    longitude?: number;
    accuracy?: number;
  };
}

export class DeviceController {
  /**
   * FIXED: Receive device status from ESP32 with proper mileage validation
   * POST /api/device/status
   */
  static async receiveDeviceStatus(req: Request, res: Response): Promise<void> {
    const startTime = new Date();
    let telemetryRecord: IVehicleTelemetry | null = null;
    let deviceRecord: IDevice | null = null;
    let testRecord: ITestResult | null = null;

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
        reportedMileage: deviceData?.reportedMileage,
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
        logger.error('Validation failed:', { missingFields, deviceData });
        return res.status(400).json({
          status: 'error',
          message: errorMsg,
          received: {
            deviceID: deviceData?.deviceID,
            status: deviceData?.status,
            timestamp: deviceData?.timestamp
          },
          timestamp: new Date().toISOString()
        });
      }

      // Find or create device record
      const normalizedObdId = deviceData.deviceID.trim();
      deviceRecord = await Device.findOneAndUpdate(
        { deviceID: normalizedObdId },
        {
          $set: {
            deviceID: normalizedObdId,
            status: deviceData.status,
            lastSeen: new Date(),
            vin: deviceData.vin || undefined,
            location: deviceData.location || undefined,
            isOnline: deviceData.status !== 'offline'
          }
        },
        { upsert: true, new: true }
      );

      logger.info('Device findOne result:', { deviceID: normalizedObdId, found: !!deviceRecord });

      // FIXED: Mileage validation logic
      let mileageValidation = {
        reportedMileage: 0,
        previousMileage: 0,
        newMileage: 0,
        delta: 0,
        flagged: false,
        validationStatus: 'PENDING' as const,
        reason: 'Initial record'
      };

      let vehicleRecord = null;
      let isFlagged = false;
      let fraudAlert = null;

      // Only validate mileage if we have mileage data and device is connected
      if (deviceData.status === 'obd_connected' && deviceData.vin) {
        // Extract reported mileage from various possible fields
        const reportedMileage = deviceData.reportedMileage || 
                              deviceData.newMileage || 
                              deviceData.currentMileage || 
                              deviceData.mileage || 0;

        if (reportedMileage > 0) {
          // Find vehicle by VIN
          vehicleRecord = await Vehicle.findOne({ vin: deviceData.vin });
          
          if (vehicleRecord) {
            const previousMileage = vehicleRecord.lastVerifiedMileage || 0;
            const delta = reportedMileage - previousMileage;
            
            // Validate: reported must be >= previous
            if (reportedMileage < previousMileage) {
              // FRAUD DETECTED: Rollback
              isFlagged = true;
              mileageValidation = {
                reportedMileage,
                previousMileage,
                newMileage: reportedMileage,
                delta,
                flagged: true,
                validationStatus: 'ROLLBACK_DETECTED',
                reason: `Odometer rollback detected: ${reportedMileage} < ${previousMileage}`
              };

              // Create fraud alert
              fraudAlert = {
                vehicleId: vehicleRecord._id,
                alertType: 'odometer_rollback',
                severity: 'high',
                description: `Odometer rollback detected: Mileage decreased from ${previousMileage} km to ${reportedMileage} km`,
                reportedBy: null, // System-generated
                reportedAt: new Date(),
                status: 'active',
                evidence: [],
                investigationNotes: `Delta: ${delta} km (${delta < 0 ? 'decrease' : 'increase'})`
              };

              // Add fraud alert to vehicle
              vehicleRecord.fraudAlerts.push(fraudAlert);
              await vehicleRecord.save();

              logger.error('🚨 FRAUD DETECTED:', {
                vehicleId: vehicleRecord._id,
                vin: deviceData.vin,
                previousMileage,
                reportedMileage,
                delta,
                reason: 'Odometer rollback'
              });

              // Emit fraud alert socket event
              emitEvent('fraud_alert_created', {
                vehicleId: vehicleRecord._id,
                alert: fraudAlert,
                telemetryId: null // Will be set after telemetry creation
              });

            } else {
              // Valid mileage - update vehicle
              mileageValidation = {
                reportedMileage,
                previousMileage,
                newMileage: reportedMileage,
                delta,
                flagged: false,
                validationStatus: 'VALID',
                reason: 'Valid mileage progression'
              };

              // Atomically update vehicle.lastVerifiedMileage
              const updated = await Vehicle.findOneAndUpdate(
                { _id: vehicleRecord._id, lastVerifiedMileage: previousMileage },
                { 
                  $set: { 
                    lastVerifiedMileage: reportedMileage,
                    currentMileage: reportedMileage,
                    lastMileageUpdate: new Date()
                  } 
                },
                { new: true }
              );

              if (!updated) {
                // Race condition - retry with fresh data
                const freshVehicle = await Vehicle.findById(vehicleRecord._id);
                if (freshVehicle) {
                  const freshPrevious = freshVehicle.lastVerifiedMileage;
                  if (reportedMileage >= freshPrevious) {
                    await Vehicle.findByIdAndUpdate(vehicleRecord._id, {
                      $set: { 
                        lastVerifiedMileage: reportedMileage,
                        currentMileage: reportedMileage,
                        lastMileageUpdate: new Date()
                      }
                    });
                  }
                }
              }

              logger.info('✅ Valid mileage update:', {
                vehicleId: vehicleRecord._id,
                previousMileage,
                reportedMileage,
                delta
              });

              // Emit telemetry accepted event
              emitEvent('telemetry_accepted', {
                vehicleId: vehicleRecord._id,
                telemetryId: null, // Will be set after creation
                mileage: reportedMileage,
                delta
              });
            }
          }
        }
      }

      // Create telemetry record with validation data
      try {
        logger.info('Creating telemetry record:', { deviceID: deviceData.deviceID });
        const telemetryData = {
          deviceID: deviceData.deviceID,
          device: deviceRecord._id,
          vehicle: vehicleRecord?._id,
          status: deviceData.status,
          message: deviceData.message || 'ESP32 data received',
          dataSource: deviceData.dataSource || 'device_status',
          dataQuality: deviceData.dataQuality || 0,
          vin: deviceData.vin || undefined,
          obd: {
            mileage: deviceData.mileage || undefined,
            rpm: deviceData.rpm || undefined,
            speed: deviceData.speed || undefined,
            engineTemp: deviceData.engineTemp || undefined,
            fuelLevel: deviceData.fuelLevel || undefined,
            odometerPID: deviceData.odometerPID || undefined
          },
          location: deviceData.location || undefined,
          deviceHealth: {
            batteryVoltage: deviceData.batteryVoltage || undefined,
            bootCount: deviceData.bootCount || undefined
          },
          validation: {
            tamperingDetected: isFlagged,
            validationStatus: mileageValidation.validationStatus
          },
          mileageValidation,
          rawData: {
            timestamp: deviceData.timestamp,
            receivedAt: new Date(),
            veepeakConnected: deviceData.veepeakConnected || false,
            transmissionSuccess: true
          }
        };
        
        logger.info('Telemetry data to create:', telemetryData);
        telemetryRecord = await VehicleTelemetry.create(telemetryData);
        logger.info('Telemetry record created successfully:', { id: telemetryRecord._id });

        // Update fraud alert with telemetry ID if flagged
        if (isFlagged && fraudAlert && vehicleRecord) {
          await Vehicle.findByIdAndUpdate(vehicleRecord._id, {
            $set: { 'fraudAlerts.$.telemetryId': telemetryRecord._id }
          });
        }

      } catch (telemetryError) {
        logger.error('Error creating telemetry record:', telemetryError);
        throw new Error(`Failed to create telemetry record: ${telemetryError.message}`);
      }

      // Create test result record
      try {
        logger.info('Creating test result record:', { deviceID: normalizedObdId });
        const endTime = new Date();
        const duration = endTime.getTime() - startTime.getTime();
        
        const testData = {
          testType: 'device_status' as const,
          testName: `ESP32 ${deviceData.status} Test`,
          deviceID: normalizedObdId,
          device: deviceRecord._id,
          status: isFlagged ? 'failed' : 'passed' as const,
          result: isFlagged ? 'fraud_detected' : 'success' as const,
          testData: {
            input: deviceData,
            output: {
              telemetryId: telemetryRecord._id,
              deviceUpdated: true,
              dataStored: true,
              fraudDetected: isFlagged,
              mileageValidation
            }
          },
          performance: {
            startTime,
            endTime,
            duration
          },
          environment: {
            nodeVersion: process.version,
            platform: process.platform,
            timestamp: new Date().toISOString()
          },
          metadata: {
            dataValid: true,
            schemaValid: true,
            businessRulesValid: !isFlagged,
            securityValid: true
          },
          tags: ['device_status', 'telemetry', deviceData.dataSource || 'device_status'],
          category: 'integration' as const,
          priority: (deviceData.status === 'obd_connected' ? 'medium' : 'high') as const,
          metadata: {
            environmentType: 'production' as const,
            automated: true,
            source: 'esp32_device'
          }
        };

        testRecord = await TestResult.create(testData);
        logger.info('Test result created successfully:', { id: testRecord._id });

      } catch (testError) {
        logger.error('Error creating test result:', testError);
        // Don't fail the main request for test record errors
      }

      // Return appropriate response
      if (isFlagged) {
        return res.status(422).json({
          success: false,
          flagged: true,
          reason: mileageValidation.reason,
          telemetryId: telemetryRecord._id,
          message: 'Telemetry flagged for fraud detection',
          data: {
            vehicleId: vehicleRecord?._id,
            previousMileage: mileageValidation.previousMileage,
            reportedMileage: mileageValidation.reportedMileage,
            delta: mileageValidation.delta
          }
        });
      } else {
        return res.status(200).json({
          success: true,
          message: 'Device status received and saved successfully',
          data: {
            telemetryId: telemetryRecord._id,
            deviceId: deviceRecord._id,
            vehicleId: vehicleRecord?._id,
            mileageValidation,
            fraudDetected: false
          }
        });
      }

    } catch (error) {
      logger.error('Error processing device status:', {
        endpoint: '/api/device/status',
        error: error instanceof Error ? error.message : 'Unknown error',
        method: req.method,
        timestamp: new Date().toISOString()
      });

      res.status(500).json({
        status: 'error',
        message: 'Failed to process device status',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }
}
