import request from 'supertest';
import { app } from '../app';

// Mock auth middleware to bypass real JWT
jest.mock('../middleware/auth.middleware', () => ({
  authenticate: (_req: any, _res: any, next: any) => {
    _req.user = { id: '507f1f77bcf86cd799439011', role: 'buyer', roles: ['buyer'] };
    next();
  }
}));

// Mock Vehicle model
jest.mock('../models/core/Vehicle.model', () => ({
  __esModule: true,
  default: {
    findById: jest.fn().mockImplementation((id: string) => ({
      populate: () => ({
        ownershipHistory: [],
        ownerId: '507f1f77bcf86cd799439012',
      }),
    })),
  },
}));

describe('GET /api/vehicles/:vehicleId/ownership-history', () => {
  it('returns 200 with data array', async () => {
    const res = await request(app)
      .get('/api/vehicles/507f1f77bcf86cd799439013/ownership-history')
      .set('Authorization', 'Bearer dummy');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});


