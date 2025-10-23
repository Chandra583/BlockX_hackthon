import request from 'supertest';
import { app } from '../app';
import { connectDatabase } from '../config/database';
import { User } from '../models/core/User.model';
import { Notification } from '../models/core/Notification.model';
import jwt from 'jsonwebtoken';

// Test database setup
beforeAll(async () => {
  await connectDatabase();
});

afterAll(async () => {
  // Clean up test data
  await User.deleteMany({ email: /test.*@example\.com/ });
  await Notification.deleteMany({ userId: /test.*/ });
});

describe('Notification API Endpoints', () => {
  let authToken: string;
  let testUser: any;
  let testNotifications: any[];

  beforeAll(async () => {
    // Create test user
    testUser = await User.create({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'hashedpassword',
      role: 'owner',
      isVerified: true
    });

    // Create auth token
    authToken = jwt.sign(
      { userId: testUser._id, role: testUser.role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    // Create test notifications
    testNotifications = await Notification.insertMany([
      {
        userId: testUser._id.toString(),
        userRole: 'owner',
        title: 'Vehicle Registered',
        message: 'Your Honda Civic has been successfully registered',
        type: 'verification',
        priority: 'medium',
        channels: ['in_app'],
        read: false
      },
      {
        userId: testUser._id.toString(),
        userRole: 'owner',
        title: 'TrustScore Update',
        message: 'Your Toyota Camry TrustScore decreased to 85',
        type: 'update',
        priority: 'high',
        channels: ['in_app'],
        read: true
      },
      {
        userId: testUser._id.toString(),
        userRole: 'owner',
        title: 'Device Installed',
        message: 'ESP32 device successfully installed on Ford Mustang',
        type: 'system',
        priority: 'medium',
        channels: ['in_app'],
        read: false
      }
    ]);
  });

  describe('GET /api/users/notifications', () => {
    it('should fetch user notifications with pagination', async () => {
      const response = await request(app)
        .get('/api/users/notifications?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.notifications).toHaveLength(3);
      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.unreadCount).toBe(2);
    });

    it('should fetch only unread notifications when unread=true', async () => {
      const response = await request(app)
        .get('/api/users/notifications?unread=true')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.notifications).toHaveLength(2);
      expect(response.body.data.notifications.every((n: any) => !n.readAt)).toBe(true);
    });

    it('should return empty array for user with no notifications', async () => {
      // Create another user
      const anotherUser = await User.create({
        firstName: 'Another',
        lastName: 'User',
        email: 'another@example.com',
        password: 'hashedpassword',
        role: 'owner',
        isVerified: true
      });

      const anotherToken = jwt.sign(
        { userId: anotherUser._id, role: anotherUser.role },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/users/notifications')
        .set('Authorization', `Bearer ${anotherToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.notifications).toHaveLength(0);
      expect(response.body.data.unreadCount).toBe(0);
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/users/notifications')
        .expect(401);
    });
  });

  describe('PATCH /api/users/notifications/:id/read', () => {
    it('should mark notification as read', async () => {
      const unreadNotification = testNotifications.find(n => !n.read);
      
      const response = await request(app)
        .patch(`/api/users/notifications/${unreadNotification._id}/read`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.message).toContain('marked as read');

      // Verify notification is marked as read in database
      const updatedNotification = await Notification.findById(unreadNotification._id);
      expect(updatedNotification.readAt).toBeDefined();
    });

    it('should return 404 for non-existent notification', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      await request(app)
        .patch(`/api/users/notifications/${fakeId}/read`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return 403 for notification belonging to another user', async () => {
      // Create another user and notification
      const anotherUser = await User.create({
        firstName: 'Another',
        lastName: 'User',
        email: 'another2@example.com',
        password: 'hashedpassword',
        role: 'owner',
        isVerified: true
      });

      const anotherNotification = await Notification.create({
        userId: anotherUser._id.toString(),
        userRole: 'owner',
        title: 'Another User Notification',
        message: 'This belongs to another user',
        type: 'system',
        priority: 'medium',
        channels: ['in_app']
      });

      await request(app)
        .patch(`/api/users/notifications/${anotherNotification._id}/read`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });

    it('should require authentication', async () => {
      const notificationId = testNotifications[0]._id;
      
      await request(app)
        .patch(`/api/users/notifications/${notificationId}/read`)
        .expect(401);
    });
  });

  describe('PATCH /api/users/notifications/read-all', () => {
    it('should mark all user notifications as read', async () => {
      const response = await request(app)
        .patch('/api/users/notifications/read-all')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.message).toContain('marked as read');
      expect(response.body.data.markedCount).toBeGreaterThan(0);

      // Verify all notifications are marked as read
      const userNotifications = await Notification.find({ userId: testUser._id });
      expect(userNotifications.every(n => n.readAt)).toBe(true);
    });

    it('should return 0 marked count when no unread notifications', async () => {
      // All notifications are already read from previous test
      const response = await request(app)
        .patch('/api/users/notifications/read-all')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.markedCount).toBe(0);
    });

    it('should require authentication', async () => {
      await request(app)
        .patch('/api/users/notifications/read-all')
        .expect(401);
    });
  });

  describe('GET /api/users/activity', () => {
    it('should fetch user activity history', async () => {
      const response = await request(app)
        .get('/api/users/activity?limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.activity).toHaveLength(3);
      expect(response.body.data.pagination).toBeDefined();
    });

    it('should return activity with correct structure', async () => {
      const response = await request(app)
        .get('/api/users/activity')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const activity = response.body.data.activity[0];
      expect(activity).toHaveProperty('id');
      expect(activity).toHaveProperty('title');
      expect(activity).toHaveProperty('subtext');
      expect(activity).toHaveProperty('icon');
      expect(activity).toHaveProperty('createdAt');
      expect(activity).toHaveProperty('type');
    });

    it('should respect limit parameter', async () => {
      const response = await request(app)
        .get('/api/users/activity?limit=2')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.activity).toHaveLength(2);
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/users/activity')
        .expect(401);
    });
  });
});
