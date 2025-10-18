import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../app';
import { Install } from '../models/Install.model';
import { User } from '../models/core/User.model';
import Vehicle from '../models/core/Vehicle.model';
import { TelemetryBatch } from '../models/TelemetryBatch.model';

// Import Jest globals
import { describe, beforeAll, afterAll, it, expect } from '@jest/globals';

// Import Jest globals
import { describe, beforeAll, afterAll, it, expect } from '@jest/globals';

// Mock user data
const mockServiceProvider = {
  email: 'service@example.com',
  password: 'Password123!',
  firstName: 'Service',
  lastName: 'Provider',
  role: 'service'
};

const mockAdmin = {
  email: 'admin@example.com',
  password: 'AdminPassword123!',
  firstName: 'Admin',
  lastName: 'User',
  role: 'admin'
};

// Mock vehicle data
const mockVehicle = {
  vin: '1HGBH41JXMN109186',
  vehicleNumber: 'ABC123',
  make: 'Honda',
  vehicleModel: 'Civic',
  year: 2020,
  color: 'White',
  bodyType: 'sedan',
  fuelType: 'gasoline',
  transmission: 'automatic',
  currentMileage: 15000,
  lastMileageUpdate: new Date(),
  mileageHistory: [],
  verificationStatus: 'verified',
  trustScore: 95,
  fraudAlerts: [],
  isForSale: false,
  listingStatus: 'not_listed',
  features: [],
  condition: 'good',
  accidentHistory: [],
  serviceHistory: [],
  lastVerifiedMileage: 15000
};

describe('Install Start API', () => {
  let serviceProviderToken: string;
  let adminToken: string;
  let serviceProviderId: string;
  let adminId: string;
  let vehicleId: string;
  let installId: string;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/blockx_test');
    
    // Create service provider
    const serviceProviderResponse = await request(app)
      .post('/api/auth/register')
      .send(mockServiceProvider);
    serviceProviderId = serviceProviderResponse.body.data.user.id;
    serviceProviderToken = serviceProviderResponse.body.data.token;
    
    // Create admin
    const adminResponse = await request(app)
      .post('/api/auth/register')
      .send({ ...mockAdmin, role: 'admin' });
    adminId = adminResponse.body.data.user.id;
    adminToken = adminResponse.body.data.token;
    
    // Create test vehicle
    const vehicleResponse = await request(app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${serviceProviderToken}`)
      .send({ ...mockVehicle, ownerId: serviceProviderId });
    vehicleId = vehicleResponse.body.data.vehicle.id;
    
    // Create install request
    const installResponse = await request(app)
      .post('/api/v1/installation-requests')
      .set('Authorization', `Bearer ${serviceProviderToken}`)
      .send({
        ownerId: serviceProviderId,
        vehicleId: vehicleId,
        notes: 'Please install device'
      });
    
    // Assign install to service provider
    const assignResponse = await request(app)
      .post('/api/admin/assign-install')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        installId: installResponse.body.data.id,
        serviceProviderId: serviceProviderId
      });
    
    installId = installResponse.body.data.id;
  });

  afterAll(async () => {
    // Clean up test data
    await User.deleteMany({});
    await Vehicle.deleteMany({});
    await Install.deleteMany({});
    await TelemetryBatch.deleteMany({});
    await mongoose.connection.close();
  });

  describe('POST /api/service/install/start', () => {
    it('should start installation successfully', async () => {
      const response = await request(app)
        .post('/api/service/install/start')
        .set('Authorization', `Bearer ${serviceProviderToken}`)
        .send({
          installId: installId,
          deviceId: 'ESP32_001234',
          initialMileage: 15500
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('in_progress');
      expect(response.body.data.deviceId).toBe('ESP32_001234');
      expect(response.body.data.initialMileage).toBe(15500);
      expect(response.body.data).toHaveProperty('solanaTx');
      expect(response.body.data).toHaveProperty('arweaveTx');
    });

    it('should flag installation when initial mileage is less than last verified mileage', async () => {
      // Create another install request
      const installResponse = await request(app)
        .post('/api/v1/installation-requests')
        .set('Authorization', `Bearer ${serviceProviderToken}`)
        .send({
          ownerId: serviceProviderId,
          vehicleId: vehicleId,
          notes: 'Please install device'
        });
      
      // Assign install to service provider
      await request(app)
        .post('/api/admin/assign-install')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          installId: installResponse.body.data.id,
          serviceProviderId: serviceProviderId
        });
      
      const response = await request(app)
        .post('/api/service/install/start')
        .set('Authorization', `Bearer ${serviceProviderToken}`)
        .send({
          installId: installResponse.body.data.id,
          deviceId: 'ESP32_001235',
          initialMileage: 14000 // Less than lastVerifiedMileage (15000)
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.flagged).toBe(true);
      expect(response.body.message).toContain('Initial mileage is less than last verified mileage');
    });

    it('should fail when install is not assigned to service provider', async () => {
      // Create another user
      const otherServiceProviderResponse = await request(app)
        .post('/api/auth/register')
        .send({
          ...mockServiceProvider,
          email: 'other-service@example.com'
        });
      const otherServiceProviderToken = otherServiceProviderResponse.body.data.token;

      const response = await request(app)
        .post('/api/service/install/start')
        .set('Authorization', `Bearer ${otherServiceProviderToken}`)
        .send({
          installId: installId,
          deviceId: 'ESP32_001236',
          initialMileage: 16000
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied. Installation not assigned to this service provider.');
    });

    it('should fail when install is not in assigned status', async () => {
      const response = await request(app)
        .post('/api/service/install/start')
        .set('Authorization', `Bearer ${serviceProviderToken}`)
        .send({
          installId: installId,
          deviceId: 'ESP32_001237',
          initialMileage: 16500
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Installation must be in assigned status to start');
    });
  });
});