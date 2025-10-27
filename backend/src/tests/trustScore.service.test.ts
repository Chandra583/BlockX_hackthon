import mongoose from 'mongoose';
import { TrustScoreService } from '../services/core/trustScore.service';
import { TrustEvent } from '../models/core/TrustEvent.model';
import Vehicle from '../models/core/Vehicle.model';
import { logger } from '../utils/logger';

// Mock logger
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}));

// Mock socket emitter
jest.mock('../utils/socketEmitter', () => ({
  emitToUser: jest.fn()
}));

describe('TrustScoreService', () => {
  let testVehicleId: string;

  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/blockx_test');
    }
  });

  beforeEach(async () => {
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

    // Clear trust events
    await TrustEvent.deleteMany({ vehicleId: testVehicleId });
  });

  afterEach(async () => {
    // Clean up
    await Vehicle.deleteMany({ vin: 'TEST123456789' });
    await TrustEvent.deleteMany({ vehicleId: testVehicleId });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('updateTrustScore', () => {
    it('should apply single negative delta correctly', async () => {
      const result = await TrustScoreService.updateTrustScore({
        vehicleId: testVehicleId,
        change: -30,
        reason: 'Mileage rollback detected',
        source: 'fraudEngine'
      });

      expect(result.success).toBe(true);
      expect(result.previousScore).toBe(100);
      expect(result.newScore).toBe(70);
      expect(result.eventId).toBeDefined();

      // Verify vehicle was updated
      const vehicle = await Vehicle.findById(testVehicleId);
      expect(vehicle?.trustScore).toBe(70);
      expect(vehicle?.trustHistoryCount).toBe(1);

      // Verify trust event was created
      const event = await TrustEvent.findOne({ vehicleId: testVehicleId });
      expect(event).toBeTruthy();
      expect(event?.change).toBe(-30);
      expect(event?.previousScore).toBe(100);
      expect(event?.newScore).toBe(70);
    });

    it('should apply cumulative negative deltas correctly', async () => {
      // First event: 100 -> 70
      const result1 = await TrustScoreService.updateTrustScore({
        vehicleId: testVehicleId,
        change: -30,
        reason: 'First rollback',
        source: 'fraudEngine'
      });

      expect(result1.success).toBe(true);
      expect(result1.previousScore).toBe(100);
      expect(result1.newScore).toBe(70);

      // Second event: 70 -> 40
      const result2 = await TrustScoreService.updateTrustScore({
        vehicleId: testVehicleId,
        change: -30,
        reason: 'Second rollback',
        source: 'fraudEngine'
      });

      expect(result2.success).toBe(true);
      expect(result2.previousScore).toBe(70);
      expect(result2.newScore).toBe(40);

      // Verify final state
      const vehicle = await Vehicle.findById(testVehicleId);
      expect(vehicle?.trustScore).toBe(40);
      expect(vehicle?.trustHistoryCount).toBe(2);

      // Verify both events exist
      const events = await TrustEvent.find({ vehicleId: testVehicleId }).sort({ createdAt: 1 });
      expect(events).toHaveLength(2);
      expect(events[0].change).toBe(-30);
      expect(events[0].previousScore).toBe(100);
      expect(events[0].newScore).toBe(70);
      expect(events[1].change).toBe(-30);
      expect(events[1].previousScore).toBe(70);
      expect(events[1].newScore).toBe(40);
    });

    it('should clamp scores to 0-100 range', async () => {
      // Test lower bound
      const result1 = await TrustScoreService.updateTrustScore({
        vehicleId: testVehicleId,
        change: -150, // Would go below 0
        reason: 'Large penalty',
        source: 'fraudEngine'
      });

      expect(result1.success).toBe(true);
      expect(result1.newScore).toBe(0);

      // Test upper bound
      const result2 = await TrustScoreService.updateTrustScore({
        vehicleId: testVehicleId,
        change: 150, // Would go above 100
        reason: 'Large bonus',
        source: 'manual'
      });

      expect(result2.success).toBe(true);
      expect(result2.newScore).toBe(100);
    });

    it('should handle concurrent updates atomically', async () => {
      // Simulate concurrent updates
      const promises = [
        TrustScoreService.updateTrustScore({
          vehicleId: testVehicleId,
          change: -20,
          reason: 'Concurrent event 1',
          source: 'fraudEngine'
        }),
        TrustScoreService.updateTrustScore({
          vehicleId: testVehicleId,
          change: -15,
          reason: 'Concurrent event 2',
          source: 'fraudEngine'
        })
      ];

      const results = await Promise.all(promises);

      // Both should succeed
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);

      // Final score should be 100 - 20 - 15 = 65
      const vehicle = await Vehicle.findById(testVehicleId);
      expect(vehicle?.trustScore).toBe(65);
      expect(vehicle?.trustHistoryCount).toBe(2);

      // Both events should exist
      const events = await TrustEvent.find({ vehicleId: testVehicleId });
      expect(events).toHaveLength(2);
    });

    it('should reject out-of-order events', async () => {
      const now = new Date();
      const pastTime = new Date(now.getTime() - 60000); // 1 minute ago

      // Create first event with current time
      await TrustScoreService.updateTrustScore({
        vehicleId: testVehicleId,
        change: -10,
        reason: 'First event',
        source: 'fraudEngine',
        eventTimestamp: now
      });

      // Try to create second event with past time
      const result = await TrustScoreService.updateTrustScore({
        vehicleId: testVehicleId,
        change: -10,
        reason: 'Out of order event',
        source: 'fraudEngine',
        eventTimestamp: pastTime
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Out-of-order event detected');
    });

    it('should handle non-existent vehicle', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      
      const result = await TrustScoreService.updateTrustScore({
        vehicleId: fakeId,
        change: -30,
        reason: 'Test event',
        source: 'fraudEngine'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('getCurrentTrustScore', () => {
    it('should return current trust score', async () => {
      const result = await TrustScoreService.getCurrentTrustScore(testVehicleId);

      expect(result.currentScore).toBe(100);
      expect(result.previousScore).toBe(100);
      expect(result.lastUpdated).toBeUndefined();
    });

    it('should return updated score after changes', async () => {
      await TrustScoreService.updateTrustScore({
        vehicleId: testVehicleId,
        change: -30,
        reason: 'Test event',
        source: 'fraudEngine'
      });

      const result = await TrustScoreService.getCurrentTrustScore(testVehicleId);

      expect(result.currentScore).toBe(70);
      expect(result.previousScore).toBe(100);
      expect(result.latestEventId).toBeDefined();
    });
  });

  describe('getTrustScoreHistory', () => {
    it('should return empty array for new vehicle', async () => {
      const history = await TrustScoreService.getTrustScoreHistory(testVehicleId);
      expect(history).toHaveLength(0);
    });

    it('should return events in reverse chronological order', async () => {
      // Create multiple events
      await TrustScoreService.updateTrustScore({
        vehicleId: testVehicleId,
        change: -10,
        reason: 'First event',
        source: 'fraudEngine'
      });

      await TrustScoreService.updateTrustScore({
        vehicleId: testVehicleId,
        change: -20,
        reason: 'Second event',
        source: 'fraudEngine'
      });

      const history = await TrustScoreService.getTrustScoreHistory(testVehicleId);

      expect(history).toHaveLength(2);
      expect(history[0].reason).toBe('Second event');
      expect(history[1].reason).toBe('First event');
    });
  });

  describe('recomputeTrustScore', () => {
    it('should recompute score from history', async () => {
      // Create events manually
      await TrustScoreService.updateTrustScore({
        vehicleId: testVehicleId,
        change: -30,
        reason: 'Event 1',
        source: 'fraudEngine'
      });

      await TrustScoreService.updateTrustScore({
        vehicleId: testVehicleId,
        change: -20,
        reason: 'Event 2',
        source: 'fraudEngine'
      });

      // Manually corrupt the vehicle score
      await Vehicle.findByIdAndUpdate(testVehicleId, { trustScore: 999 });

      // Recompute
      const newScore = await TrustScoreService.recomputeTrustScore(testVehicleId);

      expect(newScore).toBe(50); // 100 - 30 - 20 = 50

      // Verify vehicle was updated
      const vehicle = await Vehicle.findById(testVehicleId);
      expect(vehicle?.trustScore).toBe(50);
    });
  });

  describe('seedTrustScore', () => {
    it('should seed initial score correctly', async () => {
      const result = await TrustScoreService.seedTrustScore(testVehicleId, 80);

      expect(result.success).toBe(true);
      expect(result.previousScore).toBe(100);
      expect(result.newScore).toBe(80);

      const vehicle = await Vehicle.findById(testVehicleId);
      expect(vehicle?.trustScore).toBe(80);
    });
  });
});
