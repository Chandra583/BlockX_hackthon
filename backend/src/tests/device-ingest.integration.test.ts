import request from 'supertest';
import { app } from '../app';
import mongoose from 'mongoose';
import { Vehicle, Device } from '../models';

describe('Device Ingest Integration Tests', () => {
  let testVehicle: any;
  let testDevice: any;

  beforeAll(async () => {
    // Create test vehicle
    testVehicle = await Vehicle.create({
      vin: 'INTEGRATION_TEST_VIN',
      vehicleNumber: 'INT001',
      ownerId: new mongoose.Types.ObjectId(),
      make: 'Test',
      vehicleModel: 'Model',
      year: 2023,
      color: 'Blue',
      bodyType: 'sedan',
      fuelType: 'gasoline',
      transmission: 'automatic',
      currentMileage: 65000,
      lastVerifiedMileage: 65000,
      condition: 'good'
    });
  });

  afterAll(async () => {
    await Vehicle.deleteMany({ vin: 'INTEGRATION_TEST_VIN' });
    await Device.deleteMany({ deviceID: 'INTEGRATION_DEVICE' });
  });

  describe('Valid Telemetry Flow', () => {
    it('should accept valid mileage progression', async () => {
      const response = await request(app)
        .post('/api/device/status')
        .send({
          deviceID: 'INTEGRATION_DEVICE',
          status: 'obd_connected',
          vin: 'INTEGRATION_TEST_VIN',
          mileage: 65100,
          speed: 45,
          rpm: 2200,
          engineTemp: 88,
          fuelLevel: 75,
          dataQuality: 98,
          timestamp: Date.now(),
          dataSource: 'device_status',
          message: 'Valid progression test'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.fraudDetected).toBe(false);

      // Check vehicle was updated
      const updatedVehicle = await Vehicle.findById(testVehicle._id);
      expect(updatedVehicle?.lastVerifiedMileage).toBe(65100);
    });
  });

  describe('Fraud Detection Flow', () => {
    it('should detect rollback and return 422', async () => {
      const response = await request(app)
        .post('/api/device/status')
        .send({
          deviceID: 'INTEGRATION_DEVICE',
          status: 'obd_connected',
          vin: 'INTEGRATION_TEST_VIN',
          mileage: 45000, // Rollback from 65100
          speed: 0,
          rpm: 0,
          engineTemp: 85,
          fuelLevel: 60,
          dataQuality: 95,
          timestamp: Date.now(),
          dataSource: 'device_status',
          message: 'Fraud test - rollback'
        });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
      expect(response.body.flagged).toBe(true);
      expect(response.body.reason).toContain('Odometer rollback detected');

      // Check vehicle was NOT updated
      const updatedVehicle = await Vehicle.findById(testVehicle._id);
      expect(updatedVehicle?.lastVerifiedMileage).toBe(65100); // Unchanged
    });

    it('should create fraud alert in vehicle record', async () => {
      const response = await request(app)
        .post('/api/device/status')
        .send({
          deviceID: 'INTEGRATION_DEVICE',
          status: 'obd_connected',
          vin: 'INTEGRATION_TEST_VIN',
          mileage: 40000, // Another rollback
          timestamp: Date.now(),
          dataSource: 'device_status',
          message: 'Fraud test - another rollback'
        });

      expect(response.status).toBe(422);

      // Check fraud alert was created
      const updatedVehicle = await Vehicle.findById(testVehicle._id);
      expect(updatedVehicle?.fraudAlerts.length).toBeGreaterThan(0);
      
      const latestAlert = updatedVehicle?.fraudAlerts[updatedVehicle.fraudAlerts.length - 1];
      expect(latestAlert?.alertType).toBe('odometer_rollback');
      expect(latestAlert?.severity).toBe('high');
      expect(latestAlert?.status).toBe('active');
    });
  });

  describe('Latest OBD Endpoint', () => {
    it('should return latest telemetry with cache headers', async () => {
      const response = await request(app)
        .get(`/api/telemetry/latest-obd/${testVehicle._id}`)
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.headers['cache-control']).toContain('no-store');
      expect(response.headers['pragma']).toBe('no-cache');
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('latest');
      expect(response.body.data).toHaveProperty('latestNonFlagged');
    });

    it('should return null for vehicle with no telemetry', async () => {
      const newVehicle = await Vehicle.create({
        vin: 'NO_TELEMETRY_VIN',
        vehicleNumber: 'NO_TELEM_001',
        ownerId: new mongoose.Types.ObjectId(),
        make: 'Test',
        vehicleModel: 'Model',
        year: 2023,
        color: 'Red',
        bodyType: 'sedan',
        fuelType: 'gasoline',
        transmission: 'automatic',
        currentMileage: 0,
        lastVerifiedMileage: 0,
        condition: 'good'
      });

      const response = await request(app)
        .get(`/api/telemetry/latest-obd/${newVehicle._id}`)
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.data).toBeNull();
      expect(response.body.message).toBe('No OBD data available');

      await Vehicle.findByIdAndDelete(newVehicle._id);
    });
  });

  describe('Error Handling', () => {
    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/device/status')
        .send({
          // Missing deviceID and status
          vin: 'INTEGRATION_TEST_VIN',
          mileage: 65100
        });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('Missing or invalid required fields');
    });

    it('should return 500 for server errors', async () => {
      // Mock a database error
      const originalCreate = VehicleTelemetry.create;
      VehicleTelemetry.create = jest.fn().mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/device/status')
        .send({
          deviceID: 'INTEGRATION_DEVICE',
          status: 'obd_connected',
          vin: 'INTEGRATION_TEST_VIN',
          mileage: 65100,
          timestamp: Date.now(),
          dataSource: 'device_status',
          message: 'Error test'
        });

      expect(response.status).toBe(500);
      expect(response.body.status).toBe('error');

      // Restore original function
      VehicleTelemetry.create = originalCreate;
    });
  });
});
