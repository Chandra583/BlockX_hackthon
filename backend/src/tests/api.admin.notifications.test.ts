import request from 'supertest';
import { app } from '../app';
import { connectDB, disconnectDB } from '../config/database';
import { User } from '../models/core/User.model';
import { Notification } from '../models/core/Notification.model';
import jwt from 'jsonwebtoken';

describe('Admin Notifications API', () => {
  let adminToken: string;
  let adminUser: any;
  let testNotifications: any[];

  beforeAll(async () => {
    await connectDB();
    
    // Create admin user
    adminUser = await User.create({
      email: 'admin@test.com',
      password: 'password123',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      accountStatus: 'active',
      isEmailVerified: true
    });

    // Generate JWT token
    adminToken = jwt.sign(
      { userId: adminUser._id, role: 'admin' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    // Create test notifications
    testNotifications = await Notification.insertMany([
      {
        userId: adminUser._id,
        userRole: 'admin',
        title: 'System Alert',
        message: 'Database maintenance scheduled',
        type: 'system',
        priority: 'high',
        channels: ['in_app'],
        data: { systemId: 'db-maintenance' }
      },
      {
        userId: adminUser._id,
        userRole: 'admin',
        title: 'New User Registration',
        message: 'User john.doe@example.com registered',
        type: 'user_registration',
        priority: 'medium',
        channels: ['in_app'],
        data: { userId: 'user123' }
      },
      {
        userRole: 'admin',
        title: 'Global Admin Notification',
        message: 'System update available',
        type: 'update',
        priority: 'low',
        channels: ['in_app'],
        data: { version: '2.1.0' }
      }
    ]);
  });

  afterAll(async () => {
    await Notification.deleteMany({});
    await User.deleteMany({});
    await disconnectDB();
  });

  describe('GET /api/admin/notifications', () => {
    it('should get admin notifications successfully', async () => {
      const response = await request(app)
        .get('/api/admin/notifications')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.notifications).toHaveLength(3);
      expect(response.body.data.unreadCount).toBe(3);
      expect(response.body.data.pagination).toBeDefined();
    });

    it('should get admin notifications with pagination', async () => {
      const response = await request(app)
        .get('/api/admin/notifications?page=1&limit=2')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.notifications).toHaveLength(2);
      expect(response.body.data.pagination.currentPage).toBe(1);
      expect(response.body.data.pagination.limit).toBe(2);
    });

    it('should require admin authentication', async () => {
      const response = await request(app)
        .get('/api/admin/notifications')
        .expect(401);

      expect(response.body.status).toBe('error');
    });
  });

  describe('POST /api/admin/notifications/:id/read', () => {
    it('should mark notification as read', async () => {
      const notificationId = testNotifications[0]._id;
      
      const response = await request(app)
        .post(`/api/admin/notifications/${notificationId}/read`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('Notification marked as read');

      // Verify notification is marked as read
      const updatedNotification = await Notification.findById(notificationId);
      expect(updatedNotification?.readAt).toBeDefined();
    });

    it('should return 404 for non-existent notification', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .post(`/api/admin/notifications/${fakeId}/read`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.status).toBe('error');
    });
  });

  describe('POST /api/admin/notifications/read-all', () => {
    it('should mark all notifications as read', async () => {
      const response = await request(app)
        .post('/api/admin/notifications/read-all')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.markedCount).toBeGreaterThan(0);

      // Verify all notifications are marked as read
      const unreadCount = await Notification.countDocuments({
        $or: [
          { userId: adminUser._id, userRole: 'admin' },
          { userRole: 'admin', userId: { $exists: false } }
        ],
        readAt: { $exists: false }
      });
      expect(unreadCount).toBe(0);
    });
  });

  describe('GET /api/admin/activity', () => {
    it('should get admin activity successfully', async () => {
      const response = await request(app)
        .get('/api/admin/activity')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.activity).toHaveLength(3);
      expect(response.body.data.activity[0]).toHaveProperty('id');
      expect(response.body.data.activity[0]).toHaveProperty('title');
      expect(response.body.data.activity[0]).toHaveProperty('icon');
      expect(response.body.data.activity[0]).toHaveProperty('entityType');
    });

    it('should get admin activity with pagination', async () => {
      const response = await request(app)
        .get('/api/admin/activity?page=1&limit=2')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.activity).toHaveLength(2);
      expect(response.body.data.pagination.currentPage).toBe(1);
    });
  });
});
