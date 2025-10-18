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
  email: 'admin@test.com',
  password: 'TestPass123!',
  firstName: 'Admin',
  lastName: 'User',
  role: 'admin'
};

const mockServiceProvider = {
  email: 'sp@test.com',
  password: 'TestPass123!',
  firstName: 'Service',
  lastName: 'Provider',
  role: 'service'
};

const mockVehicle = {
  vin: '1HGBH41JXMN109186',
  vehicleNumber: 'TEST123',
  make: 'Honda',
  vehicleModel: 'Civic',
  year: 2020,
  color: 'White'
};

describe('Admin Assign Installation', () => {
  let adminId: string;
  let adminToken: string;
  let serviceProviderId: string;
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

    it('should return 409 when trying to assign already assigned installation', async () => {
      const response = await request(app)
        .post('/api/admin/assign-install')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          installId,
          serviceProviderId
        });
      
      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Installation already assigned to a service provider');
    });

    it('should return 404 for non-existent installation', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const response = await request(app)
        .post('/api/admin/assign-install')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          installId: fakeId,
          serviceProviderId
        });
      
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Installation request not found');
    });

    it('should return 400 for invalid service provider', async () => {
      const response = await request(app)
        .post('/api/admin/assign-install')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          installId,
          serviceProviderId: 'invalid-id'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});