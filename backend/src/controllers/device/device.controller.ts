import { Request, Response } from 'express';
import { logger } from '../../utils/logger';
import { ApiError, ValidationError } from '../../utils/errors';
import { Device, VehicleTelemetry, TestResult, IDevice, IVehicleTelemetry, ITestResult } from '../../models';
import Vehicle from '../../models/core/Vehicle.model';
import MileageHistory from '../../models/core/MileageHistory.model';
import { TelemetryConsolidationService } from '../../services/telemetryConsolidation.service';
import { TrustEvent } from '../../models/core/TrustEvent.model';
import { emitToUser } from '../../utils/socketEmitter';
// import BatchProcessingService from '../../services/core/batchProcessing.service';
import mongoose from 'mongoose';

// Device data interface matching ESP32 data structure
interface ESP32DeviceData {
  deviceID: string;
  deviceId?: string;  // OBD Device ID for installation mapping
  status: 'obd_connected' | 'device_not_connected' | 'error';
  message: string;
  vin?: string;
  mileage?: number;
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
   * Receive device status from ESP32
   * POST /api/device/status
   */
  static async receiveDeviceStatus(req: Request, res: Response): Promise<void> {
    const startTime = new Date();
    const testStartTime = Date.now();
    let telemetryRecord: IVehicleTelemetry | null = null;
    let deviceRecord: IDevice | null = null;
    let testRecord: ITestResult | null = null;
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
        logger.warn('ESP32 Data Validation Failed:', {
          missingFields,
          receivedData: deviceData,
          bodyKeys: Object.keys(req.body || {}),
          bodyValues: req.body
        });
        throw new ValidationError(errorMsg);
      }

      // Find or create device record
      // Normalize identifier: prefer deviceId if provided, else deviceID
      const normalizedObdId = (deviceData.deviceId && deviceData.deviceId.trim().length > 0)
        ? deviceData.deviceId.trim()
        : deviceData.deviceID.trim();

      logger.info('Attempting to find device:', { deviceID: normalizedObdId });
      try {
        deviceRecord = await Device.findOne({ deviceID: normalizedObdId });
        logger.info('Device findOne result:', { found: !!deviceRecord, deviceID: normalizedObdId });
      } catch (findError) {
        logger.error('Error finding device:', findError);
        throw new Error(`Failed to find device: ${findError.message}`);
      }

      if (!deviceRecord) {
        logger.info('Creating new device:', { deviceID: normalizedObdId });
        try {
          // Create a dummy user ID for device registration (system user)
          const systemUserId = new mongoose.Types.ObjectId();
          
          const deviceData_safe = {
            deviceID: normalizedObdId,
            deviceType: 'ESP32_Telematics' as const,
            status: 'active' as const,
            description: 'Auto-registered ESP32 device',
            installationRequest: {
              requestedBy: systemUserId,
              requestedAt: new Date(),
              priority: 'medium' as const
            },
            configuration: {
              selectedVehicle: 99,
              sleepDurationMinutes: 2,
              maxRetryAttempts: 3,
              enableDataBuffering: true,
              enableSSL: true
            },
            health: {
              bootCount: deviceData.bootCount || 0,
              batteryVoltage: deviceData.batteryVoltage || 0
            },
            registeredAt: new Date(),
            isActive: true
          };
          
          logger.info('Device creation data:', deviceData_safe);
          deviceRecord = await Device.create(deviceData_safe);
          logger.info(`New device registered successfully: ${deviceData.deviceID}`, { deviceId: deviceRecord._id });
        } catch (createError) {
          logger.error('Error creating device:', createError);
          throw new Error(`Failed to create device: ${createError.message}`);
        }
      }

      // Update device last seen and health
      try {
        logger.info('Updating device record:', { deviceID: deviceData.deviceID });
        const updateResult = await Device.updateOne(
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
        logger.info('Device update result:', updateResult);
      } catch (updateError) {
        logger.error('Error updating device:', updateError);
        throw new Error(`Failed to update device: ${updateError.message}`);
      }

      // Process data through batch processing system for OBD data (temporarily disabled)
      // if (deviceData.mileage && deviceData.dataSource === 'veepeak_obd') {
      //   try {
      //     logger.info('Processing data point through batch system:', { deviceID: deviceData.deviceID, mileage: deviceData.mileage });
      //     await BatchProcessingService.processDataPoint({
      //       deviceID: deviceData.deviceID,
      //       vin: deviceData.vin,
      //       mileage: deviceData.mileage,
      //       rpm: deviceData.rpm,
      //       speed: deviceData.speed,
      //       engineTemp: deviceData.engineTemp,
      //       fuelLevel: deviceData.fuelLevel,
      //       batteryVoltage: deviceData.batteryVoltage,
      //       dataQuality: deviceData.dataQuality,
      //       odometerPID: deviceData.odometerPID,
      //       timestamp: deviceData.timestamp,
      //       location: deviceData.location,
      //       tamperingDetected: false, // This would be determined by ESP32 validation
      //       validationStatus: 'pending'
      //     });
      //     logger.info('Data point processed through batch system successfully');
      //   } catch (batchError) {
      //     logger.error('Failed to process data through batch system:', batchError);
      //     // Continue with regular processing even if batch processing fails
      //   }
      // }

      // Find vehicle by VIN for telemetry linking
      let vehicleRecord = null;
      if (deviceData.vin) {
        try {
          vehicleRecord = await Vehicle.findOne({ vin: deviceData.vin });
          if (vehicleRecord) {
            logger.info(`Found vehicle for VIN ${deviceData.vin}: ${vehicleRecord._id}`);
          } else {
            logger.warn(`Vehicle not found for VIN: ${deviceData.vin}`);
          }
        } catch (vehicleError) {
          logger.error('Error finding vehicle:', vehicleError);
        }
      }

      // Create telemetry record
      try {
        logger.info('Creating telemetry record:', { deviceID: deviceData.deviceID });
        const telemetryData = {
          deviceID: deviceData.deviceID,
          device: deviceRecord._id,
          vehicle: vehicleRecord?._id, // FIXED: Link to vehicle
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
            tamperingDetected: false,
            validationStatus: 'RECEIVED'
          },
          // FIXED: Add required mileageValidation fields
          mileageValidation: {
            reportedMileage: deviceData.mileage || 0,
            previousMileage: 0, // Will be updated by vehicle lookup
            newMileage: deviceData.mileage || 0,
            delta: 0, // Will be calculated
            flagged: false,
            validationStatus: 'PENDING',
            reason: 'Initial record'
          },
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
      } catch (telemetryError) {
        logger.error('Error creating telemetry record:', telemetryError);
        throw new Error(`Failed to create telemetry record: ${telemetryError.message}`);
      }

      // Process device identifier mapping (supports deviceId or deviceID) and update vehicle mileage
      const obDeviceId = (deviceData.deviceId && deviceData.deviceId.trim().length > 0)
        ? deviceData.deviceId
        : deviceData.deviceID;
      if (obDeviceId && deviceData.mileage && deviceData.status === 'obd_connected') {
        await DeviceController.processDeviceIdMapping(deviceData, telemetryRecord);
      }

      // Process different status types and update validation
      let fraudDetected = false;
      let fraudDetails = null;
      
      switch (deviceData.status) {
        case 'obd_connected':
          const processResult = await DeviceController.processVehicleData({ ...deviceData, deviceId: normalizedObdId, deviceID: normalizedObdId }, telemetryRecord);
          fraudDetected = processResult?.fraudDetected || false;
          fraudDetails = processResult?.fraudDetails || null;
          break;
        case 'device_not_connected':
          await DeviceController.processDeviceError({ ...deviceData, deviceId: normalizedObdId, deviceID: normalizedObdId }, telemetryRecord);
          break;
        default:
          logger.warn('Unknown device status:', deviceData.status);
      }

      // Create test result record
      try {
        logger.info('Creating test result record:', { deviceID: normalizedObdId });
        const endTime = new Date();
        duration = endTime.getTime() - startTime.getTime();
        
        const testData = {
          testType: 'device_status' as const,
          testName: `ESP32 ${deviceData.status} Test`,
          deviceID: normalizedObdId,
          device: deviceRecord._id,
          status: 'passed' as const,
          result: 'success' as const,
          testData: {
            input: deviceData,
            output: {
              telemetryId: telemetryRecord._id,
              deviceUpdated: true,
              dataStored: true
            }
          },
          performance: {
            startTime,
            endTime,
            duration,
            responseTime: duration,
            dataSize: JSON.stringify(deviceData).length
          },
          environment: {
            serverHost: req.get('host') || 'unknown',
            endpoint: req.originalUrl || '/api/device/status',
            method: req.method || 'POST',
            userAgent: req.get('user-agent') || 'ESP32',
            clientIP: req.ip || 'unknown',
            protocol: req.protocol || 'https'
          },
          validation: {
            dataValid: true,
            schemaValid: true,
            businessRulesValid: true,
            securityValid: true
          },
          tags: ['device_status', 'telemetry', deviceData.dataSource || 'device_status'],
          category: 'integration' as const,
          priority: (deviceData.status === 'obd_connected' ? 'medium' : 'high') as const,
          metadata: {
            environmentType: 'production' as const,
            automated: true,
            retryCount: 0
          }
        };
        
        logger.info('Test result data to create:', testData);
        testRecord = await TestResult.create(testData);
        logger.info('Test result created successfully:', { id: testRecord._id });
      } catch (testError) {
        logger.error('Error creating test result:', testError);
        // Don't throw here - test result is not critical for ESP32 functionality
        logger.warn('Continuing without test result due to error');
        testRecord = null;
      }

      // Check if this is the last trip of the day and trigger consolidation
      try {
        await DeviceController.checkAndTriggerConsolidation(deviceData, deviceRecord);
      } catch (consolidationError) {
        logger.warn('⚠️ Consolidation check failed:', consolidationError);
        // Don't fail the main request if consolidation fails
      }

      // Send appropriate response based on fraud detection
      if (fraudDetected) {
        res.status(422).json({
          success: false,
          flagged: true,
          reason: fraudDetails?.validationStatus || 'Fraud detected',
          telemetryId: telemetryRecord._id,
          message: 'Telemetry flagged for fraud detection',
          data: {
            vehicleId: fraudDetails?.vehicleId,
            previousMileage: fraudDetails?.previousMileage,
            reportedMileage: fraudDetails?.mileage,
            delta: fraudDetails?.delta,
            validationStatus: fraudDetails?.validationStatus,
            validationErrors: fraudDetails?.validationErrors
          },
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(200).json({
          status: 'success',
          message: 'Device status received and saved successfully',
          data: {
            deviceID: normalizedObdId,
            telemetryId: telemetryRecord._id,
            testId: testRecord._id,
            processedAt: new Date().toISOString(),
            dataReceived: true,
            databaseSaved: true,
            duration: duration
          },
          timestamp: new Date().toISOString()
        });
      }

    } catch (error) {
      logger.error('Error processing device status:', {
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack,
          name: error.constructor.name
        } : error,
        deviceID: req.body?.deviceID,
        endpoint: req.originalUrl,
        method: req.method
      });
      
      // Save failed test result (best effort)
      if (req.body?.deviceID) {
        try {
          const endTime = new Date();
          await TestResult.create({
            testType: 'device_status' as const,
            testName: `ESP32 Failed Test`,
            deviceID: req.body.deviceID,
            status: 'failed' as const,
            result: 'error' as const,
            testData: {
              input: req.body,
              error: error instanceof Error ? error.message : 'Unknown error'
            },
            performance: {
              startTime,
              endTime,
              duration: endTime.getTime() - startTime.getTime()
            },
            error: {
              message: error instanceof Error ? error.message : 'Unknown error',
              stack: error instanceof Error ? error.stack : undefined
            },
            environment: {
              serverHost: req.get('host') || 'unknown',
              endpoint: req.originalUrl || '/api/device/status',
              method: req.method || 'POST'
            },
            validation: {
              dataValid: false,
              schemaValid: false,
              businessRulesValid: false,
              securityValid: true
            },
            tags: ['esp32', 'error'],
            category: 'integration' as const,
            priority: 'critical' as const,
            metadata: {
              environmentType: 'production' as const,
              automated: true,
              retryCount: 0
            }
          });
        } catch (testError) {
          logger.error('Failed to save test error:', testError);
        }
      }
      
      // Send appropriate error response
      if (error instanceof ValidationError) {
        res.status(400).json({
          status: 'error',
          message: error.message,
          details: 'Validation failed',
          timestamp: new Date().toISOString()
        });
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
        res.status(500).json({
          status: 'error',
          message: `Failed to process device status: ${errorMessage}`,
          details: 'Database operation failed',
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  /**
   * Process successful vehicle data from ESP32
   */
  private static async processVehicleData(data: ESP32DeviceData, telemetryRecord: IVehicleTelemetry): Promise<{ fraudDetected: boolean; fraudDetails?: any }> {
    try {
      logger.info('Processing vehicle data:', {
        deviceID: data.deviceID,
        vin: data.vin,
        mileage: data.mileage,
        rpm: data.rpm,
        speed: data.speed
      });

      // Fraud detection and validation
      let tamperingDetected = false;
      let validationStatus = 'VALID';
      const validationErrors: string[] = [];
      let vehicle = null;

      // 1. FIXED: Mileage validation against vehicle's authoritative lastVerifiedMileage
      if (data.mileage && data.mileage > 0 && data.vin) {
        // Find vehicle by VIN to get authoritative mileage
        vehicle = await Vehicle.findOne({ vin: data.vin });
        
        if (vehicle) {
          const previousMileage = vehicle.lastVerifiedMileage || 0;
          const reportedMileage = data.mileage;
          const delta = reportedMileage - previousMileage;
          
          logger.info(`Mileage validation: Previous=${previousMileage}, Reported=${reportedMileage}, Delta=${delta}`);
          
          // FRAUD DETECTION: Odometer rollback
          if (reportedMileage < previousMileage) {
            tamperingDetected = true;
            validationStatus = 'ROLLBACK_DETECTED';
            validationErrors.push(`Odometer rollback: ${reportedMileage} < ${previousMileage} (${delta} km decrease)`);
            logger.error(`🚨 FRAUD ALERT: Odometer rollback detected on ${data.deviceID}: ${previousMileage} -> ${reportedMileage} km (${delta} km decrease)`);
            
            // Create fraud alert in vehicle record
            const fraudAlert = {
              alertType: 'odometer_rollback',
              severity: 'high',
              description: `Odometer rollback detected: Mileage decreased from ${previousMileage} km to ${reportedMileage} km`,
              reportedBy: vehicle.ownerId, // Use vehicle owner as reporter
              reportedAt: new Date(),
              status: 'active',
              evidence: [],
              investigationNotes: `Delta: ${delta} km (decrease)`
            };
            
            // Add fraud alert to vehicle
            vehicle.fraudAlerts.push(fraudAlert);
            await vehicle.save();
            
            logger.error(`🚨 FRAUD ALERT CREATED for vehicle ${vehicle._id}: ${fraudAlert.description}`);
            
            // Create trust event for fraud detection
            try {
              const trustEvent = new TrustEvent({
                vehicleId: vehicle._id,
                change: -30, // Configurable impact
                previousScore: vehicle.trustScore,
                newScore: Math.max(0, vehicle.trustScore - 30),
                reason: `Mileage rollback detected: ${reportedMileage} km vs ${previousMileage} km`,
                details: {
                  telemetryId: telemetryRecord._id,
                  reportedMileage,
                  previousMileage,
                  deviceId: data.deviceID,
                  fraudAlertId: vehicle.fraudAlerts[vehicle.fraudAlerts.length - 1]?._id
                },
                source: 'fraudEngine',
                createdBy: vehicle.ownerId
              });

              await trustEvent.save();
              
              // Update vehicle trust score
              vehicle.trustScore = Math.max(0, vehicle.trustScore - 30);
              vehicle.trustHistoryCount = (vehicle.trustHistoryCount || 0) + 1;
              await vehicle.save();

              // Emit socket event
              try {
                emitToUser(vehicle.ownerId.toString(), 'trustscore_changed', {
                  vehicleId: vehicle._id,
                  previousScore: vehicle.trustScore + 30,
                  newScore: vehicle.trustScore,
                eventId: trustEvent._id,
                reason: trustEvent.reason,
                change: -30
              });
              } catch (socketError) {
                logger.warn('Failed to emit socket update:', socketError);
              }
              
              logger.info(`📉 TRUST EVENT CREATED: Score decreased by 30 points for vehicle ${vehicle._id}`);
            } catch (trustError) {
              logger.error('Failed to create trust event:', trustError);
            }
          }
          
          // Update telemetry with validation results
          logger.info(`Updating telemetry record ${telemetryRecord._id} with fraud flags:`, {
            tamperingDetected,
            validationStatus,
            flagged: tamperingDetected,
            delta
          });
          
          const updateResult = await VehicleTelemetry.updateOne(
            { _id: telemetryRecord._id },
            {
              $set: {
                'validation.tamperingDetected': tamperingDetected,
                'validation.validationStatus': validationStatus,
                'mileageValidation.previousMileage': previousMileage,
                'mileageValidation.newMileage': reportedMileage,
                'mileageValidation.delta': delta,
                'mileageValidation.flagged': tamperingDetected,
                'mileageValidation.validationStatus': validationStatus,
                'mileageValidation.reason': tamperingDetected ? `Odometer rollback: ${reportedMileage} < ${previousMileage}` : 'Valid mileage progression'
              }
            }
          );
          
          logger.info(`Telemetry update result:`, {
            matchedCount: updateResult.matchedCount,
            modifiedCount: updateResult.modifiedCount,
            acknowledged: updateResult.acknowledged
          });
          
          // If valid, update vehicle's lastVerifiedMileage
          if (!tamperingDetected && reportedMileage >= previousMileage) {
            await Vehicle.findByIdAndUpdate(vehicle._id, {
              $set: {
                lastVerifiedMileage: reportedMileage,
                currentMileage: reportedMileage,
                lastMileageUpdate: new Date()
              }
            });
            logger.info(`✅ Valid mileage update: ${previousMileage} -> ${reportedMileage} km`);
          }
        } else {
          logger.warn(`Vehicle not found for VIN: ${data.vin}`);
        }

        logger.info(`Mileage reading: ${data.mileage} km from ${data.deviceID} (Status: ${validationStatus})`);
      }
      
      // 2. Vehicle health monitoring
      const healthAlerts: string[] = [];
      
      if (data.engineTemp && data.engineTemp > 100) {
        healthAlerts.push(`High engine temperature: ${data.engineTemp}°C`);
        logger.warn(`🌡️ HIGH TEMP: Engine temperature ${data.engineTemp}°C on ${data.deviceID}`);
      }

      if (data.batteryVoltage && data.batteryVoltage < 12.0) {
        healthAlerts.push(`Low battery voltage: ${data.batteryVoltage}V`);
        logger.warn(`🔋 LOW VOLTAGE: Battery voltage ${data.batteryVoltage}V on ${data.deviceID}`);
      }

      if (data.rpm && data.rpm > 4000) {
        healthAlerts.push(`High RPM: ${data.rpm}`);
        logger.warn(`⚡ HIGH RPM: Engine RPM ${data.rpm} on ${data.deviceID}`);
      }

      if (data.fuelLevel && data.fuelLevel < 10) {
        healthAlerts.push(`Low fuel level: ${data.fuelLevel}%`);
        logger.warn(`⛽ LOW FUEL: Fuel level ${data.fuelLevel}% on ${data.deviceID}`);
      }

      // 3. Create health alert test results if needed
      if (healthAlerts.length > 0 || tamperingDetected) {
        await TestResult.create({
          testType: 'system_health',
          testName: tamperingDetected ? 'Fraud Detection Alert' : 'Vehicle Health Alert',
          deviceID: data.deviceID,
          status: tamperingDetected ? 'failed' : 'warning',
          result: tamperingDetected ? 'error' : 'success',
          testData: {
            healthAlerts,
            validationErrors,
            mileage: data.mileage,
            engineTemp: data.engineTemp,
            batteryVoltage: data.batteryVoltage
          },
          performance: {
            startTime: new Date(),
            endTime: new Date(),
            duration: 0
          },
          validation: {
            dataValid: true,
            schemaValid: true,
            businessRulesValid: !tamperingDetected,
            securityValid: !tamperingDetected,
            validationErrors
          },
          tags: tamperingDetected ? ['fraud', 'alert', 'critical'] : ['health', 'monitoring'],
          category: 'security',
          priority: tamperingDetected ? 'critical' : 'medium',
          metadata: {
            environmentType: 'production',
            automated: true,
            retryCount: 0
          }
        });
      }

      // 4. Update device health status
      if (tamperingDetected) {
        await Device.updateOne(
          { deviceID: data.deviceID },
          { 
            $set: { 
              status: 'error',
              'health.lastError': validationStatus 
            } 
          }
        );
      }

      // Return fraud detection result
      return {
        fraudDetected: tamperingDetected,
        fraudDetails: tamperingDetected ? {
          validationStatus,
          validationErrors,
          mileage: data.mileage,
          previousMileage: vehicle?.lastVerifiedMileage,
          delta: data.mileage - (vehicle?.lastVerifiedMileage || 0)
        } : null
      };

    } catch (error) {
      logger.error('Error processing vehicle data:', error);
      throw error;
    }
  }

  /**
   * Process device connection errors
   */
  private static async processDeviceError(data: ESP32DeviceData, telemetryRecord: IVehicleTelemetry): Promise<void> {
    try {
      logger.warn('Device connection issue:', {
        deviceID: data.deviceID,
        message: data.message,
        veepeakConnected: data.veepeakConnected
      });

      // Update telemetry record with error details
      await VehicleTelemetry.updateOne(
        { _id: telemetryRecord._id },
        {
          $set: {
            'validation.validationStatus': 'CONNECTION_ERROR',
            'rawData.veepeakConnected': data.veepeakConnected || false
          }
        }
      );

      // Update device status to error
      await Device.updateOne(
        { deviceID: data.deviceID },
        {
          $set: {
            status: 'error',
            'health.lastError': data.message
          }
        }
      );

      // Create error test result
      await TestResult.create({
        testType: 'obd_connection',
        testName: 'OBD Connection Test',
        deviceID: data.deviceID,
        status: 'failed',
        result: 'error',
        testData: {
          errorMessage: data.message,
          veepeakConnected: data.veepeakConnected,
          batteryVoltage: data.batteryVoltage
        },
        performance: {
          startTime: new Date(),
          endTime: new Date(),
          duration: 0
        },
        error: {
          message: data.message,
          code: 'OBD_CONNECTION_FAILED'
        },
        validation: {
          dataValid: true,
          schemaValid: true,
          businessRulesValid: false,
          securityValid: true,
          validationErrors: [data.message]
        },
        tags: ['obd', 'connection', 'error'],
        category: 'functional',
        priority: 'high',
        metadata: {
          environmentType: 'production',
          automated: true,
          retryCount: 0
        }
      });

    } catch (error) {
      logger.error('Error processing device error:', error);
      throw error;
    }
  }

  /**
   * Process deviceId mapping to installations and update vehicle mileage
   */
  private static async processDeviceIdMapping(data: ESP32DeviceData, telemetryRecord: IVehicleTelemetry): Promise<void> {
    try {
      logger.info('Processing deviceId mapping:', {
        deviceId: data.deviceId || data.deviceID,
        mileage: data.mileage,
        vin: data.vin
      });

      // Import InstallationRequest and Vehicle models
      const { InstallationRequest } = await import('../../models/InstallationRequest.model');
      const { default: Vehicle } = await import('../../models/core/Vehicle.model');

      // Find active installation with matching deviceId (including completed ones)
      let activeInstallation = await InstallationRequest.findOne({
        deviceId: (data.deviceId && data.deviceId.trim().length > 0) ? data.deviceId : data.deviceID,
        status: { $in: ['in_progress', 'assigned', 'completed'] }
      }).populate('vehicleId ownerId');

      // If no active one, try fallbacks: latest batch or any installation (including completed)
      let mappedVehicleId: any = activeInstallation?.vehicleId || null;
      if (!activeInstallation) {
        logger.warn('No active installation found for deviceId:', data.deviceId || data.deviceID);
        try {
          const { TelemetryBatch } = await import('../../models/TelemetryBatch.model');
          const deviceIdKey = (data.deviceId && data.deviceId.trim().length > 0) ? data.deviceId : data.deviceID;
          const latestBatch = await TelemetryBatch.findOne({ deviceId: deviceIdKey }).sort({ recordedAt: -1 });
          if (latestBatch) {
            mappedVehicleId = latestBatch.vehicleId;
            logger.info('Using latest TelemetryBatch mapping for device', { deviceId: deviceIdKey, vehicleId: mappedVehicleId });
          }
        } catch (e) {
          logger.warn('Failed to check TelemetryBatch fallback:', e);
        }

        if (!mappedVehicleId) {
          const latestInstallAny = await InstallationRequest.findOne({
            deviceId: (data.deviceId && data.deviceId.trim().length > 0) ? data.deviceId : data.deviceID
          }).sort({ updatedAt: -1 }).populate('vehicleId ownerId');
          if (latestInstallAny) {
            activeInstallation = latestInstallAny as any; // for ownerId/installId usage
            mappedVehicleId = latestInstallAny.vehicleId;
            logger.info('Using latest InstallationRequest mapping for device', { deviceId: data.deviceId || data.deviceID, vehicleId: mappedVehicleId, status: latestInstallAny.status });
          }
        }

        if (!mappedVehicleId) {
          logger.warn('No mapping found via installation or batches for deviceId:', data.deviceId || data.deviceID);
          return;
        }
      }

      logger.info('Found active installation:', {
        installId: activeInstallation._id,
        vehicleId: activeInstallation.vehicleId,
        ownerId: activeInstallation.ownerId,
        status: activeInstallation.status
      });

      // Get the vehicle
      const vehicle = await Vehicle.findById(mappedVehicleId || (activeInstallation?.vehicleId));
      if (!vehicle) {
        logger.error('Vehicle not found for resolved mapping:', mappedVehicleId || (activeInstallation?.vehicleId));
        return;
      }

      // Validate VIN if provided
      if (data.vin && vehicle.vin !== data.vin) {
        logger.warn('VIN mismatch:', {
          deviceVin: data.vin,
          vehicleVin: vehicle.vin,
          vehicleId: vehicle._id
        });
        // Continue processing but log the mismatch
      }

      // Update vehicle mileage
      const mileageRecord = {
        mileage: data.mileage || 0,
        recordedBy: (activeInstallation && activeInstallation.ownerId) ? activeInstallation.ownerId : vehicle.ownerId,
        recordedAt: new Date(),
        source: 'automated',
        notes: `OBD device ${(data.deviceId && data.deviceId.trim().length > 0) ? data.deviceId : data.deviceID} reading`,
        verified: false,
        deviceId: (data.deviceId && data.deviceId.trim().length > 0) ? data.deviceId : data.deviceID
      };

      // Add to mileage history
      vehicle.mileageHistory.push(mileageRecord);
      
      // Update current mileage and last update time
      vehicle.currentMileage = data.mileage || vehicle.currentMileage;
      vehicle.lastMileageUpdate = new Date();
      
      // Recalculate trust score
      vehicle.trustScore = vehicle.calculateTrustScore();
      
      await vehicle.save();

      // Create MileageHistory record for OBD device update
      try {
        await MileageHistory.create({
          vehicleId: vehicle._id,
          vin: vehicle.vin,
          mileage: data.mileage || 0,
          recordedBy: (activeInstallation && activeInstallation.ownerId) ? activeInstallation.ownerId : vehicle.ownerId,
          recordedAt: new Date(),
          source: 'automated',
          notes: `OBD device ${(data.deviceId && data.deviceId.trim().length > 0) ? data.deviceId : data.deviceID} reading`,
          verified: false,
          deviceId: (data.deviceId && data.deviceId.trim().length > 0) ? data.deviceId : data.deviceID
        });
        logger.info(`✅ Created MileageHistory record for OBD update: ${vehicle._id}`);
      } catch (mileageErr) {
        logger.warn('⚠️ Failed to create MileageHistory record:', mileageErr);
      }

      // Upsert/update TelemetryBatch snapshot for UI summaries (kept in sync with latest OBD mileage)
      try {
        const { TelemetryBatch } = await import('../../models/TelemetryBatch.model');
        const deviceIdStr = (data.deviceId && data.deviceId.trim().length > 0) ? data.deviceId : data.deviceID;

        // Find the latest batch for this vehicle/device
        let latestBatch = await TelemetryBatch.findOne({ vehicleId: vehicle._id, deviceId: deviceIdStr })
          .sort({ recordedAt: -1 });

        if (!latestBatch) {
          // Try fallback by device only (older batch before vehicleId changed)
          latestBatch = await TelemetryBatch.findOne({ deviceId: deviceIdStr }).sort({ recordedAt: -1 });
        }

        if (!latestBatch) {
          // Create if none exists (e.g., installation started before, or cleanup happened)
          if (!activeInstallation?._id) {
            // Cannot create without installId (schema requires it)
            logger.warn('Skipping TelemetryBatch creation: missing installId');
          } else {
            await TelemetryBatch.create({
              installId: activeInstallation._id,
            vehicleId: vehicle._id,
            deviceId: deviceIdStr,
            lastRecordedMileage: data.mileage,
            distanceDelta: 0,
            batchData: [],
            recordedAt: new Date()
            });
            logger.info('🆕 TelemetryBatch created from OBD update', { vehicleId: vehicle._id, deviceId: deviceIdStr, mileage: data.mileage });
          }
        } else {
          const prevMileage = Number(latestBatch.lastRecordedMileage) || 0;
          const delta = Math.max(0, (data.mileage || 0) - prevMileage);
          latestBatch.lastRecordedMileage = data.mileage || prevMileage;
          latestBatch.distanceDelta = (Number(latestBatch.distanceDelta) || 0) + delta;
          latestBatch.recordedAt = new Date();
          // Ensure vehicleId sync
          if (String(latestBatch.vehicleId) !== String(vehicle._id)) {
            latestBatch.vehicleId = vehicle._id as any;
          }
          await latestBatch.save();
          logger.info('✅ TelemetryBatch updated from OBD update', { vehicleId: vehicle._id, deviceId: deviceIdStr, mileage: data.mileage, delta });
        }
      } catch (batchErr) {
        logger.warn('⚠️ Failed to upsert TelemetryBatch from OBD update:', batchErr);
      }

      // Anchor mileage update to Solana once per day per vehicle to reduce spam
      try {
        const { getAnchorService } = await import('../../services/anchor.service');
        const anchorService = getAnchorService();
        const { walletService } = await import('../../services/blockchain/wallet.service');

        // Owner wallet is used for anchoring
        const ownerWallet = await walletService.getUserWallet(vehicle.ownerId.toString());
        if (!ownerWallet) {
          logger.warn('Owner wallet not found; skipping mileage anchoring');
        } else {
          // Anchor all mileage updates to Solana for full traceability
            const previousMileage = typeof vehicle.currentMileage === 'number' ? vehicle.currentMileage : 0;
            const anchorResult = await anchorService.anchorMileageUpdate({
              vehicle,
              newMileage: data.mileage || previousMileage,
              previousMileage,
              recordedBy: (activeInstallation && activeInstallation.ownerId) ? activeInstallation.ownerId.toString() : vehicle.ownerId.toString(),
              source: 'automated',
              deviceId: (data.deviceId && data.deviceId.trim().length > 0) ? data.deviceId : data.deviceID,
              ownerWallet
            });

            if (anchorResult.success && anchorResult.solanaTx) {
              // Save hash on the latest mileage history record for traceability
              const latestHistory = await MileageHistory.findOne({ vehicleId: vehicle._id, source: 'automated' }).sort({ recordedAt: -1 });
              if (latestHistory) {
                latestHistory.blockchainHash = anchorResult.solanaTx;
                await latestHistory.save();
              }
              logger.info('✅ Anchored mileage update to Solana:', anchorResult.solanaTx);
            } else {
              logger.warn('⚠️ Failed to anchor mileage update:', anchorResult.message);
            }
        }
      } catch (anchorErr) {
        logger.warn('⚠️ Mileage anchoring failed:', anchorErr);
      }

      logger.info('Vehicle mileage updated successfully:', {
        vehicleId: vehicle._id,
        newMileage: data.mileage,
        previousMileage: vehicle.currentMileage - (data.mileage - vehicle.currentMileage),
        trustScore: vehicle.trustScore
      });

      // Update telemetry record with installation info
      await VehicleTelemetry.updateOne(
        { _id: telemetryRecord._id },
        {
          $set: {
            'rawData.installId': activeInstallation._id,
            'rawData.vehicleId': vehicle._id,
            'rawData.ownerId': activeInstallation.ownerId
          }
        }
      );

      // Emit socket event for real-time updates (if socket.io is available)
      try {
        const { io } = await import('../../server');
        if (io) {
          io.emit('vehicle_mileage_updated', {
            vehicleId: vehicle._id,
            ownerId: activeInstallation.ownerId,
            newMileage: data.mileage,
            deviceId: data.deviceId,
            timestamp: new Date()
          });
          logger.info('Socket event emitted for mileage update');
        }
      } catch (socketError) {
        logger.warn('Failed to emit socket event:', socketError);
      }

    } catch (error) {
      logger.error('Error processing deviceId mapping:', error);
      // Don't throw - this is not critical for ESP32 functionality
    }
  }

  /**
   * Get device status by ID
   * GET /api/device/status/:deviceId
   */
  static async getDeviceStatus(req: Request, res: Response): Promise<void> {
    try {
      const { deviceId } = req.params;

      // Find device
      const device = await Device.findOne({ deviceID: deviceId });
      if (!device) {
        res.status(404).json({
          status: 'error',
          message: 'Device not found'
        });
        return;
      }

      // Get latest telemetry data
      const latestTelemetry = await VehicleTelemetry.findOne(
        { deviceID: deviceId },
        {},
        { sort: { 'rawData.receivedAt': -1 } }
      );

      // Get recent test results
      const recentTests = await TestResult.find(
        { deviceID: deviceId },
        {},
        { sort: { createdAt: -1 }, limit: 10 }
      );

      // Calculate statistics
      const totalReadings = await VehicleTelemetry.countDocuments({ deviceID: deviceId });
      const fraudAlerts = await VehicleTelemetry.countDocuments({ 
        deviceID: deviceId, 
        'validation.tamperingDetected': true 
      });

      res.status(200).json({
        status: 'success',
        message: 'Device status retrieved successfully',
        data: {
          device: {
            deviceID: device.deviceID,
            deviceType: device.deviceType,
            status: device.status,
            description: device.description,
            lastSeen: device.lastSeen,
            lastDataReceived: device.lastDataReceived,
            isOnline: (device as any).isOnline,
            health: device.health,
            configuration: device.configuration
          },
          latestData: latestTelemetry ? {
            vin: latestTelemetry.vin,
            mileage: latestTelemetry.obd.mileage,
            dataQuality: latestTelemetry.dataQuality,
            validationStatus: latestTelemetry.validation.validationStatus,
            tamperingDetected: latestTelemetry.validation.tamperingDetected,
            receivedAt: latestTelemetry.rawData.receivedAt
          } : null,
          statistics: {
            totalReadings,
            fraudAlerts,
            successRate: totalReadings > 0 ? ((totalReadings - fraudAlerts) / totalReadings * 100).toFixed(1) + '%' : 'N/A'
          },
          recentTests: recentTests.map(test => ({
            testName: test.testName,
            status: test.status,
            result: test.result,
            createdAt: test.createdAt,
            duration: test.performance.duration
          }))
        }
      });

    } catch (error) {
      logger.error('Error getting device status:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to get device status'
      });
    }
  }

  /**
   * List all devices
   * GET /api/device/list
   */
  static async listDevices(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 10, status, deviceType } = req.query;
      
      // Build filter
      const filter: any = {};
      if (status) filter.status = status;
      if (deviceType) filter.deviceType = deviceType;

      // Get devices with pagination
      const devices = await Device.find(filter)
        .sort({ lastSeen: -1 })
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit));

      const total = await Device.countDocuments(filter);

      // Get additional statistics for each device
      const devicesWithStats = await Promise.all(
        devices.map(async (device) => {
          const latestTelemetry = await VehicleTelemetry.findOne(
            { deviceID: device.deviceID },
            { 'obd.mileage': 1, 'validation.tamperingDetected': 1, 'rawData.receivedAt': 1 },
            { sort: { 'rawData.receivedAt': -1 } }
          );

          const totalReadings = await VehicleTelemetry.countDocuments({ deviceID: device.deviceID });
          const fraudAlerts = await VehicleTelemetry.countDocuments({ 
            deviceID: device.deviceID, 
            'validation.tamperingDetected': true 
          });

          return {
            deviceID: device.deviceID,
            deviceType: device.deviceType,
            status: device.status,
            description: device.description,
            lastSeen: device.lastSeen,
            lastDataReceived: device.lastDataReceived,
            isOnline: (device as any).isOnline,
            health: device.health,
            statistics: {
              totalReadings,
              fraudAlerts,
              lastMileage: latestTelemetry?.obd?.mileage || null,
              lastReading: latestTelemetry?.rawData?.receivedAt || null
            }
          };
        })
      );

      res.status(200).json({
        status: 'success',
        message: 'Devices listed successfully',
        data: {
          devices: devicesWithStats,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit))
          },
          summary: {
            total,
            active: devices.filter(d => d.status === 'active').length,
            error: devices.filter(d => d.status === 'error').length,
            online: devices.filter(d => (d as any).isOnline).length
          }
        }
      });

    } catch (error) {
      logger.error('Error listing devices:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to list devices'
      });
    }
  }

  /**
   * Register new device
   * POST /api/device/register
   */
  static async registerDevice(req: Request, res: Response): Promise<void> {
    try {
      const { deviceID, deviceType, description, configuration } = req.body;

      if (!deviceID) {
        throw new ValidationError('Device ID is required');
      }

      // Check if device already exists
      const existingDevice = await Device.findOne({ deviceID });
      if (existingDevice) {
        res.status(409).json({
          status: 'error',
          message: 'Device already exists'
        });
        return;
      }

      // Create new device
      const device = await Device.create({
        deviceID,
        deviceType: deviceType || 'ESP32_Telematics',
        status: 'active',
        description: description || 'Vehicle telematics device',
        configuration: {
          selectedVehicle: configuration?.selectedVehicle || 99,
          sleepDurationMinutes: configuration?.sleepDurationMinutes || 2,
          maxRetryAttempts: configuration?.maxRetryAttempts || 3,
          enableDataBuffering: configuration?.enableDataBuffering !== false,
          enableSSL: configuration?.enableSSL !== false
        },
        health: {
          bootCount: 0,
          batteryVoltage: 0
        },
        registeredAt: new Date(),
        isActive: true
      });

      // Create registration test result
      await TestResult.create({
        testType: 'device_status',
        testName: 'Device Registration',
        deviceID,
        device: device._id,
        status: 'passed',
        result: 'success',
        testData: {
          input: req.body,
          output: {
            deviceCreated: true,
            deviceId: device._id
          }
        },
        performance: {
          startTime: new Date(),
          endTime: new Date(),
          duration: 0
        },
        environment: {
          serverHost: req.get('host'),
          endpoint: req.originalUrl,
          method: req.method,
          userAgent: req.get('user-agent'),
          clientIP: req.ip
        },
        validation: {
          dataValid: true,
          schemaValid: true,
          businessRulesValid: true,
          securityValid: true
        },
        tags: ['registration', 'device'],
        category: 'functional',
        priority: 'medium',
        metadata: {
          environmentType: 'production',
          automated: false,
          retryCount: 0
        }
      });

      logger.info(`Device registered successfully: ${deviceID}`);

      res.status(201).json({
        status: 'success',
        message: 'Device registered successfully',
        data: {
          deviceID: device.deviceID,
          deviceType: device.deviceType,
          description: device.description,
          status: device.status,
          configuration: device.configuration,
          registeredAt: device.registeredAt,
          _id: device._id
        }
      });

    } catch (error) {
      logger.error('Error registering device:', error);
      
      if (error instanceof ValidationError) {
        res.status(400).json({
          status: 'error',
          message: error.message
        });
      } else if (error.code === 11000) { // MongoDB duplicate key error
        res.status(409).json({
          status: 'error',
          message: 'Device ID already exists'
        });
      } else {
        res.status(500).json({
          status: 'error',
          message: 'Failed to register device'
        });
      }
    }
  }

  /**
   * Check if this is the last trip of the day and trigger consolidation
   */
  private static async checkAndTriggerConsolidation(
    deviceData: ESP32DeviceData,
    deviceRecord: IDevice
  ): Promise<void> {
    try {
      // Only trigger for OBD data with mileage
      if (!deviceData.mileage || deviceData.dataSource !== 'veepeak_obd') {
        return;
      }

      const now = new Date();
      const currentHour = now.getHours();
      
      // Check if this is likely the last trip of the day (after 10 PM or before 6 AM)
      const isEndOfDay = currentHour >= 22 || currentHour <= 6;
      
      if (!isEndOfDay) {
        return;
      }

      // Get the date for consolidation (yesterday if before 6 AM, today if after 10 PM)
      const consolidationDate = currentHour <= 6 
        ? new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : now.toISOString().split('T')[0];

      logger.info(`🔄 Checking for end-of-day consolidation: ${deviceData.deviceID} on ${consolidationDate}`);

      // Check if vehicle exists
      if (!deviceRecord.vehicle) {
        logger.info(`📭 No vehicle associated with device ${deviceData.deviceID}, skipping consolidation`);
        return;
      }

      // Trigger consolidation asynchronously (don't wait for completion)
      setImmediate(async () => {
        try {
          const result = await TelemetryConsolidationService.consolidateDayBatch(
            deviceRecord.vehicle!.toString(),
            consolidationDate
          );

          if (result.success) {
            logger.info(`✅ Immediate consolidation completed for vehicle ${deviceRecord.vehicle} on ${consolidationDate}`);
          } else {
            logger.warn(`⚠️ Immediate consolidation failed for vehicle ${deviceRecord.vehicle}: ${result.error}`);
          }
        } catch (error) {
          logger.error(`❌ Immediate consolidation error for vehicle ${deviceRecord.vehicle}:`, error);
        }
      });

    } catch (error) {
      logger.error('❌ Error checking consolidation trigger:', error);
      // Don't throw - this is not critical for the main flow
    }
  }
}
