import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import mongoose from 'mongoose';
import { Vehicle, VehicleTelemetry, Device } from '../models';
import { DeviceController } from '../controllers/device/device.controller';

describe('Mileage Validation Logic', () => {
  let testVehicle: any;
  let testDevice: any;

  beforeEach(async () => {
    // Create test vehicle
    testVehicle = await Vehicle.create({
      vin: 'TEST123456789',
      vehicleNumber: 'TEST001',
      ownerId: new mongoose.Types.ObjectId(),
      make: 'Test',
      vehicleModel: 'Model',
      year: 2023,
      color: 'Blue',
      bodyType: 'sedan',
      fuelType: 'gasoline',
      transmission: 'automatic',
      currentMileage: 50000,
      lastVerifiedMileage: 50000,
      condition: 'good'
    });

    // Create test device
    testDevice = await Device.create({
      deviceID: 'TEST_DEVICE_001',
      status: 'obd_connected',
      lastSeen: new Date()
    });
  });

  afterEach(async () => {
    await Vehicle.deleteMany({ vin: 'TEST123456789' });
    await Device.deleteMany({ deviceID: 'TEST_DEVICE_001' });
    await VehicleTelemetry.deleteMany({ deviceID: 'TEST_DEVICE_001' });
  });

  describe('Valid Mileage Progression', () => {
    it('should accept valid mileage increase', async () => {
      const deviceData = {
        deviceID: 'TEST_DEVICE_001',
        status: 'obd_connected',
        vin: 'TEST123456789',
        mileage: 50100,
        timestamp: Date.now(),
        dataSource: 'device_status',
        message: 'Test data'
      };

      // Mock request and response
      const req = { body: deviceData } as any;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as any;

      await DeviceController.receiveDeviceStatus(req, res);

      // Should return 200 success
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Device status received and saved successfully'
        })
      );

      // Check vehicle was updated
      const updatedVehicle = await Vehicle.findById(testVehicle._id);
      expect(updatedVehicle?.lastVerifiedMileage).toBe(50100);
    });

    it('should accept same mileage (no change)', async () => {
      const deviceData = {
        deviceID: 'TEST_DEVICE_001',
        status: 'obd_connected',
        vin: 'TEST123456789',
        mileage: 50000, // Same as current
        timestamp: Date.now(),
        dataSource: 'device_status',
        message: 'Test data'
      };

      const req = { body: deviceData } as any;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as any;

      await DeviceController.receiveDeviceStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('Fraud Detection', () => {
    it('should flag rollback and return 422', async () => {
      const deviceData = {
        deviceID: 'TEST_DEVICE_001',
        status: 'obd_connected',
        vin: 'TEST123456789',
        mileage: 45000, // Rollback from 50000
        timestamp: Date.now(),
        dataSource: 'device_status',
        message: 'Test data'
      };

      const req = { body: deviceData } as any;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as any;

      await DeviceController.receiveDeviceStatus(req, res);

      // Should return 422 for fraud
      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          flagged: true,
          reason: expect.stringContaining('Odometer rollback detected')
        })
      );

      // Check vehicle was NOT updated
      const updatedVehicle = await Vehicle.findById(testVehicle._id);
      expect(updatedVehicle?.lastVerifiedMileage).toBe(50000); // Unchanged

      // Check telemetry was created with flagged status
      const telemetry = await VehicleTelemetry.findOne({ deviceID: 'TEST_DEVICE_001' });
      expect(telemetry?.mileageValidation.flagged).toBe(true);
      expect(telemetry?.mileageValidation.validationStatus).toBe('ROLLBACK_DETECTED');
    });

    it('should handle multiple field names for reported mileage', async () => {
      const testCases = [
        { field: 'mileage', value: 45000 },
        { field: 'currentMileage', value: 45000 },
        { field: 'newMileage', value: 45000 },
        { field: 'reportedMileage', value: 45000 }
      ];

      for (const testCase of testCases) {
        const deviceData = {
          deviceID: 'TEST_DEVICE_001',
          status: 'obd_connected',
          vin: 'TEST123456789',
          [testCase.field]: testCase.value,
          timestamp: Date.now(),
          dataSource: 'device_status',
          message: 'Test data'
        };

        const req = { body: deviceData } as any;
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        } as any;

        await DeviceController.receiveDeviceStatus(req, res);

        // Should flag as fraud
        expect(res.status).toHaveBeenCalledWith(422);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            flagged: true
          })
        );
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing VIN gracefully', async () => {
      const deviceData = {
        deviceID: 'TEST_DEVICE_001',
        status: 'obd_connected',
        // No VIN
        mileage: 50100,
        timestamp: Date.now(),
        dataSource: 'device_status',
        message: 'Test data'
      };

      const req = { body: deviceData } as any;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as any;

      await DeviceController.receiveDeviceStatus(req, res);

      // Should still work but not validate mileage
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle zero mileage gracefully', async () => {
      const deviceData = {
        deviceID: 'TEST_DEVICE_001',
        status: 'obd_connected',
        vin: 'TEST123456789',
        mileage: 0,
        timestamp: Date.now(),
        dataSource: 'device_status',
        message: 'Test data'
      };

      const req = { body: deviceData } as any;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as any;

      await DeviceController.receiveDeviceStatus(req, res);

      // Should work without validation
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});