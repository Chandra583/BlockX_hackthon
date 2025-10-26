import request from 'supertest';
import { app } from '../app';
import { connectDB, disconnectDB } from '../config/database';
import { User } from '../models/core/User.model';
import { Notification } from '../models/core/Notification.model';

describe('Notification API Integration Tests', () => {
  let authToken: string;
  let testUser: any;

  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  beforeEach(async () => {
    // Create test user
    testUser = await User.create({
      email: 'test@example.com',
      password: 'hashedPassword',
      firstName: 'Test',
      lastName: 'User',
      role: 'owner',
      isActive: true,
      isVerified: true
    });

    // Create test notifications
    await Notification.create([
      {
        userId: testUser._id,
        title: 'Test Notification 1',
        message: 'This is a test notification',
        type: 'system',
        priority: 'medium',
        channels: ['in_app'],
        readAt: null
      },
      {
        userId: testUser._id,
        title: 'Test Notification 2',
        message: 'This is a read notification',
        type: 'system',
        priority: 'low',
        channels: ['in_app'],
        readAt: new Date()
      }
    ]);

    // Mock authentication token
    authToken = 'mock-jwt-token';
  });

  afterEach(async () => {
    await User.deleteMany({});
    await Notification.deleteMany({});
  });

  describe('GET /api/users/notifications', () => {
    it('should fetch notifications for authenticated user', async () => {
      const response = await request(app)
        .get('/api/users/notifications')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.notifications).toHaveLength(2);
      expect(response.body.data.unreadCount).toBe(1);
    });

    it('should fetch only unread notifications when unread=true', async () => {
      const response = await request(app)
        .get('/api/users/notifications?unread=true')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.notifications).toHaveLength(1);
      expect(response.body.data.notifications[0].readAt).toBeNull();
    });

    it('should limit notifications when limit is specified', async () => {
      const response = await request(app)
        .get('/api/users/notifications?limit=1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.notifications).toHaveLength(1);
    });

    it('should return 401 for unauthenticated requests', async () => {
      await request(app)
        .get('/api/users/notifications')
        .expect(401);
    });
  });

  describe('PATCH /api/users/notifications/:id/read', () => {
    it('should mark notification as read', async () => {
      const notification = await Notification.findOne({ userId: testUser._id });
      
      const response = await request(app)
        .patch(`/api/users/notifications/${notification._id}/read`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      
      // Verify notification is marked as read
      const updatedNotification = await Notification.findById(notification._id);
      expect(updatedNotification.readAt).not.toBeNull();
    });

    it('should return 404 for non-existent notification', async () => {
      await request(app)
        .patch('/api/users/notifications/507f1f77bcf86cd799439011/read')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PATCH /api/users/notifications/read-all', () => {
    it('should mark all notifications as read', async () => {
      const response = await request(app)
        .patch('/api/users/notifications/read-all')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.markedCount).toBe(1);
      
      // Verify all notifications are marked as read
      const unreadCount = await Notification.countDocuments({ 
        userId: testUser._id, 
        readAt: null 
      });
      expect(unreadCount).toBe(0);
    });
  });
});
