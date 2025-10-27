import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app';
import Vehicle from '../models/core/Vehicle.model';
import { TrustEvent } from '../models/core/TrustEvent.model';

describe('TrustScore Integration Tests', () => {
  let testVehicleId: string;
  let authToken: string;

  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/blockx_test');
    }

    // Create test vehicle
    const vehicle = new Vehicle({
      vin: 'TEST123456789',
      ownerId: new mongoose.Types.ObjectId(),
      currentMileage: 50000,
      trustScore: 100,
      trustHistoryCount: 0
    });
    await vehicle.save();
    testVehicleId = vehicle._id.toString();

    // Get auth token (you may need to adjust this based on your auth setup)
    authToken = 'test-auth-token'; // Replace with actual token generation
  });

  beforeEach(async () => {
    // Clear trust events
    await TrustEvent.deleteMany({ vehicleId: testVehicleId });
  });

  afterEach(async () => {
    // Clean up trust events
    await TrustEvent.deleteMany({ vehicleId: testVehicleId });
  });

  afterAll(async () => {
    // Clean up
    await Vehicle.deleteMany({ vin: 'TEST123456789' });
    await mongoose.connection.close();
  });

  describe('POST /api/trust/:vehicleId/seed', () => {
    it('should seed initial trust score', async () => {
      const response = await request(app)
        .post(`/api/trust/${testVehicleId}/seed`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ score: 100 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.newScore).toBe(100);
    });

    it('should reject invalid scores', async () => {
      await request(app)
        .post(`/api/trust/${testVehicleId}/seed`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ score: 150 })
        .expect(400);

      await request(app)
        .post(`/api/trust/${testVehicleId}/seed`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ score: -10 })
        .expect(400);
    });
  });

  describe('POST /api/telemetry/event', () => {
    it('should process first rollback event correctly', async () => {
      const response = await request(app)
        .post('/api/telemetry/event')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          vehicleId: testVehicleId,
          type: 'MILEAGE_ROLLBACK',
          deltaScore: -30,
          recordedAt: '2025-10-25T11:45:15Z',
          source: 'fraud-detect',
          meta: { prevMileage: 65185, newMileage: 50000 }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.previousScore).toBe(100);
      expect(response.body.data.newScore).toBe(70);
      expect(response.body.data.eventType).toBe('MILEAGE_ROLLBACK');
    });

    it('should process second rollback event correctly', async () => {
      // First event
      await request(app)
        .post('/api/telemetry/event')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          vehicleId: testVehicleId,
          type: 'MILEAGE_ROLLBACK',
          deltaScore: -30,
          recordedAt: '2025-10-25T11:45:15Z',
          source: 'fraud-detect',
          meta: { prevMileage: 65185, newMileage: 50000 }
        })
        .expect(200);

      // Second event
      const response = await request(app)
        .post('/api/telemetry/event')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          vehicleId: testVehicleId,
          type: 'MILEAGE_ROLLBACK',
          deltaScore: -30,
          recordedAt: '2025-10-25T11:45:17Z',
          source: 'fraud-detect',
          meta: { prevMileage: 65185, newMileage: 45000 }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.previousScore).toBe(70);
      expect(response.body.data.newScore).toBe(40);
    });

    it('should reject invalid event data', async () => {
      await request(app)
        .post('/api/telemetry/event')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          vehicleId: testVehicleId,
          type: 'MILEAGE_ROLLBACK',
          deltaScore: 'invalid', // Should be number
          recordedAt: '2025-10-25T11:45:15Z',
          source: 'fraud-detect'
        })
        .expect(400);
    });
  });

  describe('GET /api/trust/:vehicleId/score', () => {
    it('should return current trust score', async () => {
      const response = await request(app)
        .get(`/api/trust/${testVehicleId}/score`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.vehicleId).toBe(testVehicleId);
      expect(response.body.data.trustScore).toBeDefined();
    });

    it('should return updated score after events', async () => {
      // Apply two events
      await request(app)
        .post('/api/telemetry/event')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          vehicleId: testVehicleId,
          type: 'MILEAGE_ROLLBACK',
          deltaScore: -30,
          recordedAt: '2025-10-25T11:45:15Z',
          source: 'fraud-detect'
        });

      await request(app)
        .post('/api/telemetry/event')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          vehicleId: testVehicleId,
          type: 'MILEAGE_ROLLBACK',
          deltaScore: -30,
          recordedAt: '2025-10-25T11:45:17Z',
          source: 'fraud-detect'
        });

      // Check final score
      const response = await request(app)
        .get(`/api/trust/${testVehicleId}/score`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.trustScore).toBe(40);
    });
  });

  describe('GET /api/trust/:vehicleId/history', () => {
    it('should return trust score history', async () => {
      // Create some events
      await request(app)
        .post('/api/telemetry/event')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          vehicleId: testVehicleId,
          type: 'MILEAGE_ROLLBACK',
          deltaScore: -30,
          recordedAt: '2025-10-25T11:45:15Z',
          source: 'fraud-detect'
        });

      await request(app)
        .post('/api/telemetry/event')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          vehicleId: testVehicleId,
          type: 'MILEAGE_ROLLBACK',
          deltaScore: -30,
          recordedAt: '2025-10-25T11:45:17Z',
          source: 'fraud-detect'
        });

      const response = await request(app)
        .get(`/api/trust/${testVehicleId}/history`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      
      // Check that events are in reverse chronological order
      expect(response.body.data[0].change).toBe(-30);
      expect(response.body.data[0].previousScore).toBe(70);
      expect(response.body.data[0].newScore).toBe(40);
      
      expect(response.body.data[1].change).toBe(-30);
      expect(response.body.data[1].previousScore).toBe(100);
      expect(response.body.data[1].newScore).toBe(70);
    });
  });

  describe('Concurrent Event Processing', () => {
    it('should handle concurrent events correctly', async () => {
      const promises = [
        request(app)
          .post('/api/telemetry/event')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            vehicleId: testVehicleId,
            type: 'MILEAGE_ROLLBACK',
            deltaScore: -20,
            recordedAt: '2025-10-25T11:45:15Z',
            source: 'fraud-detect'
          }),
        request(app)
          .post('/api/telemetry/event')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            vehicleId: testVehicleId,
            type: 'MILEAGE_ROLLBACK',
            deltaScore: -15,
            recordedAt: '2025-10-25T11:45:16Z',
            source: 'fraud-detect'
          })
      ];

      const responses = await Promise.all(promises);

      // Both should succeed
      expect(responses[0].status).toBe(200);
      expect(responses[1].status).toBe(200);

      // Check final score
      const finalResponse = await request(app)
        .get(`/api/trust/${testVehicleId}/score`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(finalResponse.body.data.trustScore).toBe(65); // 100 - 20 - 15 = 65
    });
  });
});
