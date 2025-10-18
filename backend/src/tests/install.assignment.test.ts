import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../app';
import { User } from '../models/core/User.model';
import Vehicle from '../models/core/Vehicle.model';
import { Install } from '../models/Install.model';

// Import Jest globals
import { describe, beforeAll, afterAll, it, expect } from '@jest/globals';

// Mock data
const mockAdmin = {
  email: 'admin-install-test@example.com',
  password: 'TestPass123!',
  confirmPassword: 'TestPass123!',
  firstName: 'Admin',
  lastName: 'User',
  role: 'admin',
  termsAccepted: true,
  privacyAccepted: true,
  roleSpecificData: {
    adminLevel: 'junior'
  }
};

const mockServiceProvider = {
  email: 'sp-install-test@example.com',
  password: 'TestPass123!',
  confirmPassword: 'TestPass123!',
  firstName: 'Service',
  lastName: 'Provider',
  role: 'service',
  termsAccepted: true,
  privacyAccepted: true,
  roleSpecificData: {
    businessName: 'Test Service Company',
    businessType: 'mechanic',
    licenseNumber: 'SP123456',
    licenseExpiry: new Date('2026-12-31')
  }
};

const mockVehicle = {
  vin: '1HGBH41JXMN109186',
  vehicleNumber: 'TEST123',
  make: 'Honda',
  model: 'Civic', // This is what the API expects
  year: 2020,
  color: 'White'
};

describe('Installation Assignment and Fetching', () => {
  let adminId: string;
  let adminToken: string;
  let serviceProviderId: string;
  let serviceProviderToken: string;
  let vehicleId: string;
  let installId: string;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/blockx_test');
    
    // Create admin user
    const adminResponse = await request(app)
      .post('/api/auth/register')
      .send(mockAdmin);
    adminId = adminResponse.body.data.user.id;
    adminToken = adminResponse.body.data.tokens.accessToken;
    
    // Create service provider user
    const spResponse = await request(app)
      .post('/api/auth/register')
      .send(mockServiceProvider);
    serviceProviderId = spResponse.body.data.user.id;
    serviceProviderToken = spResponse.body.data.tokens.accessToken;
    
    // Create test vehicle
    const vehicleResponse = await request(app)
      .post('/api/vehicles/register')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...mockVehicle, initialMileage: 10000 });
    
    console.log('Vehicle response:', JSON.stringify(vehicleResponse.body, null, 2));
    
    vehicleId = vehicleResponse.body.data.vehicle.id;
    
    // Create install request
    const installResponse = await request(app)
      .post(`/api/installs/vehicles/${vehicleId}/request-install`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        notes: 'Please install device'
      });
    
    installId = installResponse.body.data.installId;
  });

  afterAll(async () => {
    // Clean up test data
    await User.deleteMany({});
    await Vehicle.deleteMany({});
    await Install.deleteMany({});
    await mongoose.connection.close();
  });

  describe('POST /api/service/admin/assign-install', () => {
    it('should assign installation to service provider successfully', async () => {
      const response = await request(app)
        .post('/api/service/admin/assign-install')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          installId,
          serviceProviderId
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.installId).toBe(installId);
      expect(response.body.data.serviceProviderId).toBe(serviceProviderId);
      expect(response.body.data.status).toBe('assigned');
      expect(response.body.data.assignedAt).toBeDefined();
    });

    it('should have properly stored serviceProviderId as ObjectId in database', async () => {
      const install = await Install.findById(installId);
      expect(install).toBeDefined();
      expect(install!.serviceProviderId).toBeDefined();
      expect(install!.serviceProviderId!.toString()).toBe(serviceProviderId);
      expect(install!.status).toBe('assigned');
    });
  });

  describe('GET /api/service/installs/assigned', () => {
    it('should fetch assigned installations for service provider', async () => {
      const response = await request(app)
        .get('/api/service/installs/assigned')
        .set('Authorization', `Bearer ${serviceProviderToken}`)
        .set('Cache-Control', 'no-cache')
        .set('Pragma', 'no-cache');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.installations).toHaveLength(1);
      expect(response.body.data.installations[0].id).toBe(installId);
      expect(response.body.data.installations[0].serviceProviderId.toString()).toBe(serviceProviderId);
      expect(response.body.data.installations[0].status).toBe('assigned');
      expect(response.headers).toHaveProperty('cache-control');
    });

    it('should return empty array for service provider with no assigned installations', async () => {
      // Create another service provider
      const anotherSpResponse = await request(app)
        .post('/api/auth/register')
        .send({
          ...mockServiceProvider,
          email: 'another-sp-install-test@example.com',
          confirmPassword: 'TestPass123!'
        });
      const anotherSpToken = anotherSpResponse.body.data.tokens.accessToken;
      
      const response = await request(app)
        .get('/api/service/installs/assigned')
        .set('Authorization', `Bearer ${anotherSpToken}`)
        .set('Cache-Control', 'no-cache')
        .set('Pragma', 'no-cache');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.installations).toHaveLength(0);
    });

    it('should filter installations by status when provided', async () => {
      const response = await request(app)
        .get('/api/service/installs/assigned?status=assigned')
        .set('Authorization', `Bearer ${serviceProviderToken}`)
        .set('Cache-Control', 'no-cache')
        .set('Pragma', 'no-cache');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.installations).toHaveLength(1);
      expect(response.body.data.installations[0].status).toBe('assigned');
    });
  });
});