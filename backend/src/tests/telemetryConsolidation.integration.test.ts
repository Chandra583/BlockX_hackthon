import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../app';
import { TelemetryConsolidationService } from '../services/telemetryConsolidation.service';
import { TelemetryBatch } from '../models/TelemetryBatch.model';
import { VehicleTelemetry } from '../models/core/VehicleTelemetry.model';
import { Vehicle } from '../models/core/Vehicle.model';
import { Device } from '../models/core/Device.model';
import { User } from '../models/core/User.model';

describe('Telemetry Consolidation Integration', () => {
  let testUser: any;
  let testVehicle: any;
  let testDevice: any;
  let authToken: string;

  beforeAll(async () => {
    // Create test user
    testUser = await User.create({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'TestPassword123!',
      role: 'owner'
    });

    // Create test vehicle
    testVehicle = await Vehicle.create({
      vin: 'TEST123456789',
      vehicleNumber: 'TEST001',
      make: 'Test',
      model: 'Car',
      year: 2025,
      mileage: 1000,
      ownerId: testUser._id
    });

    // Create test device
    testDevice = await Device.create({
      deviceID: 'TEST_DEVICE_001',
      deviceType: 'ESP32_Telematics',
      status: 'active',
      vehicle: testVehicle._id,
      owner: testUser._id
    });

    // Mock authentication token
    authToken = 'mock-jwt-token';
  });

  afterAll(async () => {
    // Clean up test data
    await User.deleteMany({ email: 'test@example.com' });
    await Vehicle.deleteMany({ vin: 'TEST123456789' });
    await Device.deleteMany({ deviceID: 'TEST_DEVICE_001' });
    await TelemetryBatch.deleteMany({ vehicleId: testVehicle._id });
    await VehicleTelemetry.deleteMany({ vehicle: testVehicle._id });
  });

  beforeEach(async () => {
    // Clean up batches before each test
    await TelemetryBatch.deleteMany({ vehicleId: testVehicle._id });
    await VehicleTelemetry.deleteMany({ vehicle: testVehicle._id });
  });

  describe('POST /api/vehicles/:vehicleId/consolidate-batch', () => {
    it('should consolidate telemetry data and return transaction hashes', async () => {
      const testDate = '2025-01-15';
      const startOfDay = new Date(testDate + 'T00:00:00.000Z');
      const endOfDay = new Date(testDate + 'T23:59:59.999Z');

      // Create sample telemetry data
      const telemetryData = [
        {
          deviceID: 'TEST_DEVICE_001',
          device: testDevice._id,
          vehicle: testVehicle._id,
          status: 'obd_connected',
          message: 'Test data',
          dataSource: 'veepeak_obd',
          dataQuality: 95,
          vin: 'TEST123456789',
          obd: {
            mileage: 1000,
            rpm: 2000,
            speed: 60,
            engineTemp: 90
          },
          rawData: {
            timestamp: startOfDay.getTime() + 8 * 60 * 60 * 1000, // 8 AM
            receivedAt: new Date(),
            transmissionSuccess: true
          }
        },
        {
          deviceID: 'TEST_DEVICE_001',
          device: testDevice._id,
          vehicle: testVehicle._id,
          status: 'obd_connected',
          message: 'Test data 2',
          dataSource: 'veepeak_obd',
          dataQuality: 95,
          vin: 'TEST123456789',
          obd: {
            mileage: 1025,
            rpm: 2500,
            speed: 80,
            engineTemp: 95
          },
          rawData: {
            timestamp: startOfDay.getTime() + 10 * 60 * 60 * 1000, // 10 AM
            receivedAt: new Date(),
            transmissionSuccess: true
          }
        }
      ];

      await VehicleTelemetry.insertMany(telemetryData);

      // Mock the consolidation service to avoid actual blockchain calls
      const mockConsolidationResult = {
        success: true,
        batchId: 'mock-batch-id',
        arweaveTx: 'mock-arweave-tx-hash',
        solanaTx: 'mock-solana-tx-hash',
        merkleRoot: 'mock-merkle-root'
      };

      // Mock the consolidation service
      jest.spyOn(TelemetryConsolidationService, 'consolidateDayBatch')
        .mockResolvedValue(mockConsolidationResult);

      const response = await request(app)
        .post(`/api/vehicles/${testVehicle._id}/consolidate-batch`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ date: testDate })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.batchId).toBeDefined();
      expect(response.body.data.arweaveTx).toBeDefined();
      expect(response.body.data.solanaTx).toBeDefined();
      expect(response.body.data.merkleRoot).toBeDefined();
    });

    it('should return 400 for missing date', async () => {
      const response = await request(app)
        .post(`/api/vehicles/${testVehicle._id}/consolidate-batch`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Date is required');
    });

    it('should return 404 for non-existent vehicle', async () => {
      const fakeVehicleId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .post(`/api/vehicles/${fakeVehicleId}/consolidate-batch`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ date: '2025-01-15' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Vehicle not found');
    });
  });

  describe('GET /api/vehicles/:vehicleId/telemetry-batches', () => {
    it('should return batches with transaction hashes', async () => {
      // Create a test batch
      const testBatch = await TelemetryBatch.create({
        installId: testUser._id,
        vehicleId: testVehicle._id,
        deviceId: 'TEST_DEVICE_001',
        date: '2025-01-15',
        segments: [
          {
            startTime: new Date('2025-01-15T08:00:00Z'),
            endTime: new Date('2025-01-15T08:30:00Z'),
            distance: 15.5
          }
        ],
        totalDistance: 15.5,
        segmentsCount: 1,
        merkleRoot: 'test-merkle-root',
        arweaveTx: 'test-arweave-tx',
        solanaTx: 'test-solana-tx',
        status: 'anchored',
        lastRecordedMileage: 1000,
        distanceDelta: 15.5,
        recordedAt: new Date()
      });

      const response = await request(app)
        .get(`/api/vehicles/${testVehicle._id}/telemetry-batches`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.batches).toHaveLength(1);
      
      const batch = response.body.data.batches[0];
      expect(batch.id).toBe(testBatch._id.toString());
      expect(batch.solanaTx).toBe('test-solana-tx');
      expect(batch.arweaveTx).toBe('test-arweave-tx');
      expect(batch.status).toBe('anchored');
      expect(batch.segmentsCount).toBe(1);
    });

    it('should return empty array when no batches exist', async () => {
      const response = await request(app)
        .get(`/api/vehicles/${testVehicle._id}/telemetry-batches`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.batches).toHaveLength(0);
    });
  });
});
