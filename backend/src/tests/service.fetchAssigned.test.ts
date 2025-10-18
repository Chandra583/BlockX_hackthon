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
  email: 'admin2@test.com',
  password: 'TestPass123!',
  firstName: 'Admin',
  lastName: 'User',
  role: 'admin'
};

const mockServiceProvider = {
  email: 'sp2@test.com',
  password: 'TestPass123!',
  firstName: 'Service',
  lastName: 'Provider',
  role: 'service'
};

const mockVehicle = {
  vin: '2HGBH41JXMN109187',
  vehicleNumber: 'TEST124',
  make: 'Toyota',
  vehicleModel: 'Camry',
  year: 2021,
  color: 'Black'
};

describe('Service Provider Fetch Assigned Installations', () => {
  let adminId: string;
  let adminToken: string;
  let serviceProviderId: string;
  let serviceProviderToken: string;
  let vehicleId: string;
  let installId: string;

  beforeAll(async () => {
    // Create admin user
    const adminResponse = await request(app)
      .post('/api/auth/register')
      .send(mockAdmin);
    adminId = adminResponse.body.data.user.id;
    adminToken = adminResponse.body.data.token;
    
    // Create service provider user
    const spResponse = await request(app)
      .post('/api/auth/register')
      .send(mockServiceProvider);
    serviceProviderId = spResponse.body.data.user.id;
    serviceProviderToken = spResponse.body.data.token;
    
    // Create test vehicle
    const vehicleResponse = await request(app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...mockVehicle, ownerId: adminId });
    vehicleId = vehicleResponse.body.data.vehicle.id;
    
    // Create install request
    const installResponse = await request(app)
      .post('/api/installs/vehicles/' + vehicleId + '/request-install')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        notes: 'Please install device'
      });
    
    installId = installResponse.body.data.installId;
    
    // Assign installation to service provider
    await request(app)
      .post('/api/admin/assign-install')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        installId,
        serviceProviderId
      });
  });

  afterAll(async () => {
    // Clean up test data
    await User.deleteMany({});
    await Vehicle.deleteMany({});
    await Install.deleteMany({});
    await mongoose.connection.close();
  });

  describe('GET /api/service/installs/assigned', () => {
    it('should fetch assigned installations for service provider', async () => {
      const response = await request(app)
        .get('/api/service/installs/assigned')
        .set('Authorization', `Bearer ${serviceProviderToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.installations).toHaveLength(1);
      expect(response.body.data.installations[0].id).toBe(installId);
      expect(response.body.data.installations[0].serviceProviderId).toBe(serviceProviderId);
      expect(response.body.data.installations[0].status).toBe('assigned');
    });

    it('should return empty array for service provider with no assigned installations', async () => {
      // Create another service provider
      const anotherSpResponse = await request(app)
        .post('/api/auth/register')
        .send({
          ...mockServiceProvider,
          email: 'another-sp@test.com'
        });
      const anotherSpToken = anotherSpResponse.body.data.token;
      
      const response = await request(app)
        .get('/api/service/installs/assigned')
        .set('Authorization', `Bearer ${anotherSpToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.installations).toHaveLength(0);
    });

    it('should filter installations by status when provided', async () => {
      const response = await request(app)
        .get('/api/service/installs/assigned?status=assigned')
        .set('Authorization', `Bearer ${serviceProviderToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.installations).toHaveLength(1);
      expect(response.body.data.installations[0].status).toBe('assigned');
    });
  });
});