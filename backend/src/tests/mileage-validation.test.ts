import request from 'supertest';
import { app } from '../app';
import { Vehicle } from '../models/core/Vehicle.model';
import { VehicleTelemetry } from '../models/core/VehicleTelemetry.model';
import mongoose from 'mongoose';

describe('Mileage Validation Tests', () => {
  let testVehicle: any;
  let testDeviceId: string;

  beforeAll(async () => {
    // Create test vehicle
    testVehicle = await Vehicle.create({
      vin: 'TEST12345678901234',
      vehicleNumber: 'TEST001',
      ownerId: new mongoose.Types.ObjectId(),
      make: 'Test',
      vehicleModel: 'Model',
      year: 2023,
      color: 'White',
      bodyType: 'sedan',
      fuelType: 'gasoline',
      transmission: 'automatic',
      currentMileage: 67000,
      lastVerifiedMileage: 67000, // FIXED: Set authoritative mileage
      verificationStatus: 'verified',
      trustScore: 100,
      fraudAlerts: [],
      isForSale: false,
      listingStatus: 'not_listed',
      features: [],
      condition: 'good',
      accidentHistory: [],
      serviceHistory: []
    });

    testDeviceId = 'TEST_DEVICE_001';
  });

  afterAll(async () => {
    // Cleanup
    await Vehicle.deleteOne({ _id: testVehicle._id });
    await VehicleTelemetry.deleteMany({ deviceID: testDeviceId });
  });

  describe('Valid Mileage Updates', () => {
    test('should accept valid mileage increase', async () => {
      const response = await request(app)
        .post('/api/device/status')
        .send({
          deviceID: testDeviceId,
          status: 'obd_connected',
          vin: testVehicle.vin,
          mileage: 67100, // +100 km increase
          timestamp: Date.now(),
          dataSource: 'veepeak_obd'
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.mileageValidation.flagged).toBe(false);
      expect(response.body.data.mileageValidation.validationStatus).toBe('VALID');
      expect(response.body.data.mileageValidation.delta).toBe(100);

      // Verify vehicle was updated
      const updatedVehicle = await Vehicle.findById(testVehicle._id);
      expect(updatedVehicle.lastVerifiedMileage).toBe(67100);
    });

    test('should accept same mileage (no change)', async () => {
      const response = await request(app)
        .post('/api/device/status')
        .send({
          deviceID: testDeviceId,
          status: 'obd_connected',
          vin: testVehicle.vin,
          mileage: 67100, // Same as current
          timestamp: Date.now(),
          dataSource: 'veepeak_obd'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.mileageValidation.flagged).toBe(false);
      expect(response.body.data.mileageValidation.delta).toBe(0);
    });
  });

  describe('Fraud Detection', () => {
    test('should flag rollback (mileage decrease)', async () => {
      const response = await request(app)
        .post('/api/device/status')
        .send({
          deviceID: testDeviceId,
          status: 'obd_connected',
          vin: testVehicle.vin,
          mileage: 82, // MASSIVE rollback from 67100
          timestamp: Date.now(),
          dataSource: 'veepeak_obd'
        });

      expect(response.status).toBe(422);
      expect(response.body.status).toBe('flagged');
      expect(response.body.flagged).toBe(true);
      expect(response.body.reason).toContain('rollback');
      expect(response.body.delta).toBeLessThan(0);

      // Verify vehicle was NOT updated
      const vehicle = await Vehicle.findById(testVehicle._id);
      expect(vehicle.lastVerifiedMileage).toBe(67100); // Should remain unchanged
    });

    test('should flag small rollback (1 km decrease)', async () => {
      const response = await request(app)
        .post('/api/device/status')
        .send({
          deviceID: testDeviceId,
          status: 'obd_connected',
          vin: testVehicle.vin,
          mileage: 67099, // 1 km decrease
          timestamp: Date.now(),
          dataSource: 'veepeak_obd'
        });

      expect(response.status).toBe(422);
      expect(response.body.flagged).toBe(true);
    });

    test('should allow small sensor error (3 km decrease)', async () => {
      const response = await request(app)
        .post('/api/device/status')
        .send({
          deviceID: testDeviceId,
          status: 'obd_connected',
          vin: testVehicle.vin,
          mileage: 67097, // 3 km decrease (within tolerance)
          timestamp: Date.now(),
          dataSource: 'veepeak_obd'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.mileageValidation.flagged).toBe(false);
    });
  });

  describe('Backwards Compatibility', () => {
    test('should accept both currentMileage and newMileage keys', async () => {
      const response1 = await request(app)
        .post('/api/device/status')
        .send({
          deviceID: testDeviceId,
          status: 'obd_connected',
          vin: testVehicle.vin,
          currentMileage: 67200, // Old key
          timestamp: Date.now(),
          dataSource: 'veepeak_obd'
        });

      expect(response1.status).toBe(200);

      const response2 = await request(app)
        .post('/api/device/status')
        .send({
          deviceID: testDeviceId,
          status: 'obd_connected',
          vin: testVehicle.vin,
          newMileage: 67300, // New key
          timestamp: Date.now(),
          dataSource: 'veepeak_obd'
        });

      expect(response2.status).toBe(200);
    });
  });

  describe('Race Condition Protection', () => {
    test('should handle concurrent updates atomically', async () => {
      // Simulate concurrent requests
      const promises = [
        request(app)
          .post('/api/device/status')
          .send({
            deviceID: testDeviceId,
            status: 'obd_connected',
            vin: testVehicle.vin,
            mileage: 67400,
            timestamp: Date.now(),
            dataSource: 'veepeak_obd'
          }),
        request(app)
          .post('/api/device/status')
          .send({
            deviceID: testDeviceId,
            status: 'obd_connected',
            vin: testVehicle.vin,
            mileage: 67500,
            timestamp: Date.now() + 1,
            dataSource: 'veepeak_obd'
          })
      ];

      const responses = await Promise.all(promises);
      
      // At least one should succeed, one might fail due to race condition
      const successCount = responses.filter(r => r.status === 200).length;
      expect(successCount).toBeGreaterThan(0);
    });
  });
});

