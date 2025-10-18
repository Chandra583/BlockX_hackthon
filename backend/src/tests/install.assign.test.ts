import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../app';
import { Install } from '../models/Install.model';
import { User } from '../models/core/User.model';
import Vehicle from '../models/core/Vehicle.model';

// Import Jest globals
import { describe, beforeAll, afterAll, it, expect } from '@jest/globals';

// Mock user data
const mockServiceProvider1 = {
  email: 'service1@example.com',
  password: 'Password123!',
  firstName: 'Service',
  lastName: 'Provider1',
  role: 'service'
};

const mockServiceProvider2 = {
  email: 'service2@example.com',
  password: 'Password123!',
  firstName: 'Service',
  lastName: 'Provider2',
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
  vin: '2T1BURHE5JC012345',
  vehicleNumber: 'XYZ789',
  make: 'Toyota',
  vehicleModel: 'Camry',
  year: 2021,
  color: 'Black',
  bodyType: 'sedan',
  fuelType: 'gasoline',
  transmission: 'automatic',
  currentMileage: 22500,
  lastMileageUpdate: new Date(),
  mileageHistory: [],
  verificationStatus: 'verified',
  trustScore: 92,
  fraudAlerts: [],
  isForSale: false,
  listingStatus: 'not_listed',
  features: [],
  condition: 'good',
  accidentHistory: [],
  serviceHistory: [],
  lastVerifiedMileage: 22500
};

describe('Install Assign API', () => {
  let adminToken: string;
  let serviceProvider1Token: string;
  let serviceProvider2Token: string;
  let adminId: string;
  let serviceProvider1Id: string;
  let serviceProvider2Id: string;
  let vehicleId: string;
  let installId: string;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/blockx_test');
    
    // Create service providers
    const serviceProvider1Response = await request(app)
      .post('/api/auth/register')
      .send(mockServiceProvider1);
    serviceProvider1Id = serviceProvider1Response.body.data.user.id;
    serviceProvider1Token = serviceProvider1Response.body.data.token;
    
    const serviceProvider2Response = await request(app)
      .post('/api/auth/register')
      .send(mockServiceProvider2);
    serviceProvider2Id = serviceProvider2Response.body.data.user.id;
    serviceProvider2Token = serviceProvider2Response.body.data.token;
    
    // Create admin
    const adminResponse = await request(app)
      .post('/api/auth/register')
      .send({ ...mockAdmin, role: 'admin' });
    adminId = adminResponse.body.data.user.id;
    adminToken = adminResponse.body.data.token;
    
    // Create test vehicle
    const vehicleResponse = await request(app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${serviceProvider1Token}`)
      .send({ ...mockVehicle, ownerId: serviceProvider1Id });
    vehicleId = vehicleResponse.body.data.vehicle.id;
    
    // Create install request
    const installResponse = await request(app)
      .post('/api/v1/installation-requests')
      .set('Authorization', `Bearer ${serviceProvider1Token}`)
      .send({
        ownerId: serviceProvider1Id,
        vehicleId: vehicleId,
        notes: 'Please install device'
      });
    
    installId = installResponse.body.data.id;
  });

  afterAll(async () => {
    // Clean up test data
    await User.deleteMany({});
    await Vehicle.deleteMany({});
    await Install.deleteMany({});
    await mongoose.connection.close();
  });

  describe('POST /api/admin/assign-install', () => {
    it('should assign installation to service provider successfully', async () => {
      const response = await request(app)
        .post('/api/admin/assign-install')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          installId: installId,
          serviceProviderId: serviceProvider1Id
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('assigned');
      expect(response.body.data.serviceProviderId).toBe(serviceProvider1Id);
      expect(response.body.data).toHaveProperty('assignedAt');
    });

    it('should fail when non-admin user tries to assign installation', async () => {
      const response = await request(app)
        .post('/api/admin/assign-install')
        .set('Authorization', `Bearer ${serviceProvider1Token}`)
        .send({
          installId: installId,
          serviceProviderId: serviceProvider2Id
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied. Required roles: admin');
    });

    it('should fail when installation does not exist', async () => {
      const response = await request(app)
        .post('/api/admin/assign-install')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          installId: 'nonexistent_install_id',
          serviceProviderId: serviceProvider2Id
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Installation request not found');
    });

    it('should reassign installation to different service provider', async () => {
      const response = await request(app)
        .post('/api/admin/assign-install')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          installId: installId,
          serviceProviderId: serviceProvider2Id
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.serviceProviderId).toBe(serviceProvider2Id);
    });
  });
});