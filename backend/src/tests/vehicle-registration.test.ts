import request from 'supertest';
import { app } from '../server';
import { User } from '../models/core/User.model';
import { Vehicle } from '../models/core/Vehicle.model';
import mongoose from 'mongoose';

describe('Vehicle Registration API', () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    // Create test user
    const user = new User({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'password123',
      role: 'owner'
    });
    await user.save();
    userId = user._id.toString();

    // Login to get auth token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });
    
    authToken = loginResponse.body.data.token;
  });

  afterAll(async () => {
    // Cleanup
    await User.deleteMany({ email: 'test@example.com' });
    await Vehicle.deleteMany({});
    await mongoose.connection.close();
  });

  describe('POST /api/vehicles/register', () => {
    it('should register a new vehicle successfully', async () => {
      const vehicleData = {
        vin: '1HGCM82633A123456',
        vehicleNumber: 'ABC1234',
        make: 'Honda',
        model: 'Civic',
        year: 2023,
        initialMileage: 15000,
        color: 'White',
        bodyType: 'sedan',
        fuelType: 'gasoline',
        transmission: 'automatic',
        engineSize: '2.0L',
        condition: 'good',
        description: 'Test vehicle'
      };

      const response = await request(app)
        .post('/api/vehicles/register')
        .set('Authorization', `Bearer ${authToken}`)
        .send(vehicleData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.vehicle.vin).toBe('1HGCM82633A123456');
      expect(response.body.data.vehicle.verificationStatus).toBe('pending');
    });

    it('should return 400 for missing required fields', async () => {
      const incompleteData = {
        vin: '1HGCM82633A123456',
        make: 'Honda'
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/vehicles/register')
        .set('Authorization', `Bearer ${authToken}`)
        .send(incompleteData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Missing required fields');
    });

    it('should return 409 for duplicate VIN', async () => {
      // First registration
      const vehicleData = {
        vin: '1HGCM82633A123456',
        vehicleNumber: 'ABC1234',
        make: 'Honda',
        model: 'Civic',
        year: 2023,
        initialMileage: 15000
      };

      await request(app)
        .post('/api/vehicles/register')
        .set('Authorization', `Bearer ${authToken}`)
        .send(vehicleData);

      // Second registration with same VIN
      const duplicateData = {
        vin: '1HGCM82633A123456',
        vehicleNumber: 'XYZ5678',
        make: 'Toyota',
        model: 'Camry',
        year: 2022,
        initialMileage: 20000
      };

      const response = await request(app)
        .post('/api/vehicles/register')
        .set('Authorization', `Bearer ${authToken}`)
        .send(duplicateData);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Vehicle with this VIN already exists');
    });

    it('should return 409 for duplicate vehicle number', async () => {
      const vehicleData = {
        vin: '2HGCM82633A123456',
        vehicleNumber: 'ABC1234',
        make: 'Honda',
        model: 'Civic',
        year: 2023,
        initialMileage: 15000
      };

      const response = await request(app)
        .post('/api/vehicles/register')
        .set('Authorization', `Bearer ${authToken}`)
        .send(vehicleData);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Vehicle with this vehicle number already exists');
    });

    it('should validate VIN format', async () => {
      const vehicleData = {
        vin: 'INVALID123456789', // Invalid VIN with I and O
        vehicleNumber: 'XYZ5678',
        make: 'Honda',
        model: 'Civic',
        year: 2023,
        initialMileage: 15000
      };

      const response = await request(app)
        .post('/api/vehicles/register')
        .set('Authorization', `Bearer ${authToken}`)
        .send(vehicleData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should validate mileage is not negative', async () => {
      const vehicleData = {
        vin: '3HGCM82633A123456',
        vehicleNumber: 'XYZ5678',
        make: 'Honda',
        model: 'Civic',
        year: 2023,
        initialMileage: -1000 // Negative mileage
      };

      const response = await request(app)
        .post('/api/vehicles/register')
        .set('Authorization', `Bearer ${authToken}`)
        .send(vehicleData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 401 for unauthenticated request', async () => {
      const vehicleData = {
        vin: '4HGCM82633A123456',
        vehicleNumber: 'XYZ5678',
        make: 'Honda',
        model: 'Civic',
        year: 2023,
        initialMileage: 15000
      };

      const response = await request(app)
        .post('/api/vehicles/register')
        .send(vehicleData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('User authentication required');
    });
  });

  describe('POST /api/vehicles/upload', () => {
    it('should upload files successfully', async () => {
      const response = await request(app)
        .post('/api/vehicles/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from('test file content'), 'test.jpg')
        .field('type', 'photo');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.files).toHaveLength(1);
      expect(response.body.data.files[0].type).toBe('photo');
    });

    it('should validate file type', async () => {
      const response = await request(app)
        .post('/api/vehicles/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from('test file content'), 'test.txt')
        .field('type', 'photo');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should validate file size', async () => {
      // Create a large file (11MB)
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024);
      
      const response = await request(app)
        .post('/api/vehicles/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', largeBuffer, 'large.jpg')
        .field('type', 'photo');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/external/vin-decode', () => {
    it('should return VIN decode result when service is configured', async () => {
      // Mock environment variables
      process.env.VIN_DECODE_API_KEY = 'test-key';
      process.env.VIN_DECODE_URL = 'https://api.example.com/vin-decode';

      // Mock fetch
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          make: 'Honda',
          model: 'Civic',
          year: 2023,
          manufacturer: 'Honda Motor Co.'
        })
      });

      const response = await request(app)
        .get('/api/external/vin-decode?vin=1HGCM82633A123456')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.found).toBe(true);
      expect(response.body.data.make).toBe('Honda');
    });

    it('should return not found when VIN decode service is not configured', async () => {
      delete process.env.VIN_DECODE_API_KEY;
      delete process.env.VIN_DECODE_URL;

      const response = await request(app)
        .get('/api/external/vin-decode?vin=1HGCM82633A123456')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.found).toBe(false);
    });

    it('should return 400 for invalid VIN', async () => {
      const response = await request(app)
        .get('/api/external/vin-decode?vin=INVALID')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});
