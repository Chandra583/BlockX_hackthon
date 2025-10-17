import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../app';
import { InstallationRequest } from '../models/InstallationRequest.model';
import { User } from '../models/core/User.model';
import Vehicle from '../models/core/Vehicle.model';

// Mock user data
const mockUser = {
  email: 'test@example.com',
  password: 'Password123!',
  firstName: 'Test',
  lastName: 'User',
  role: 'owner'
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
  serviceHistory: []
};

describe('Installation Request API', () => {
  let userToken: string;
  let adminToken: string;
  let userId: string;
  let adminId: string;
  let vehicleId: string;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/veridrive_test');
    
    // Create test user
    const userResponse = await request(app)
      .post('/api/auth/register')
      .send(mockUser);
    userId = userResponse.body.data.user.id;
    userToken = userResponse.body.data.token;
    
    // Create test admin
    const adminResponse = await request(app)
      .post('/api/auth/register')
      .send({ ...mockAdmin, role: 'admin' });
    adminId = adminResponse.body.data.user.id;
    adminToken = adminResponse.body.data.token;
    
    // Create test vehicle
    const vehicleResponse = await request(app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ ...mockVehicle, ownerId: userId });
    vehicleId = vehicleResponse.body.data.vehicle.id;
  });

  afterAll(async () => {
    // Clean up test data
    await User.deleteMany({});
    await Vehicle.deleteMany({});
    await InstallationRequest.deleteMany({});
    await mongoose.connection.close();
  });

  describe('POST /api/v1/installation-requests', () => {
    it('should create a new installation request', async () => {
      const response = await request(app)
        .post('/api/v1/installation-requests')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          ownerId: userId,
          vehicleId: vehicleId,
          notes: 'Please install device as soon as possible'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('requested');
      expect(response.body.data).toHaveProperty('id');
    });

    it('should not allow creating request for another user\'s vehicle', async () => {
      // Create another user
      const otherUserResponse = await request(app)
        .post('/api/auth/register')
        .send({
          ...mockUser,
          email: 'other@example.com'
        });
      const otherUserToken = otherUserResponse.body.data.token;

      const response = await request(app)
        .post('/api/v1/installation-requests')
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({
          ownerId: userId, // Try to create request for another user's vehicle
          vehicleId: vehicleId,
          notes: 'Should fail'
        })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/installation-requests', () => {
    it('should get installation requests for the user', async () => {
      const response = await request(app)
        .get('/api/v1/installation-requests')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.requests).toHaveLength(1);
    });
  });

  describe('GET /api/v1/owners/:ownerId/vehicles', () => {
    it('should get owner\'s vehicles', async () => {
      const response = await request(app)
        .get(`/api/v1/owners/${userId}/vehicles`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.vehicles).toHaveLength(1);
      expect(response.body.data.vehicles[0].vin).toBe(mockVehicle.vin);
    });
  });

  describe('GET /api/v1/vehicles/search', () => {
    it('should search vehicles by registration', async () => {
      const response = await request(app)
        .get('/api/v1/vehicles/search')
        .set('Authorization', `Bearer ${userToken}`)
        .query({ q: 'ABC123' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.vehicles).toHaveLength(1);
      expect(response.body.data.vehicles[0].registration).toBe('ABC123');
    });
  });
});