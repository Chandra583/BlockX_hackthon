import { Router } from 'express';
import { UserController } from '../../controllers/user/user.controller';
import { authenticate, rateLimit } from '../../middleware/auth.middleware';

const router = Router();

// Rate limiting for user endpoints
const userRateLimit = rateLimit(100, 15 * 60 * 1000); // 100 requests per 15 minutes
const updateRateLimit = rateLimit(20, 15 * 60 * 1000); // 20 update requests per 15 minutes
const strictRateLimit = rateLimit(5, 15 * 60 * 1000); // 5 requests per 15 minutes

// All user routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/users/dashboard
 * @desc    Get user dashboard data
 * @access  Private
 */
router.get('/dashboard', userRateLimit, UserController.getDashboard);

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile
 * @access  Private
 * @body    { firstName?, lastName?, phoneNumber?, dateOfBirth?, address?, preferences?, roleSpecificData? }
 */
router.put('/profile', updateRateLimit, UserController.updateProfile);

/**
 * @route   POST /api/users/profile/avatar
 * @desc    Upload profile picture
 * @access  Private
 * @body    { avatarUrl }
 */
router.post('/profile/avatar', updateRateLimit, UserController.uploadAvatar);

/**
 * @route   GET /api/users/notifications
 * @desc    Get user notifications
 * @access  Private
 * @query   page?, limit?, unread?
 */
router.get('/notifications', userRateLimit, UserController.getNotifications);

/**
 * @route   PATCH /api/users/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private
 */
router.patch('/notifications/:id/read', userRateLimit, UserController.markNotificationAsRead);

/**
 * @route   PATCH /api/users/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.patch('/notifications/read-all', updateRateLimit, UserController.markAllNotificationsAsRead);

/**
 * @route   PUT /api/users/preferences/notifications
 * @desc    Update notification preferences
 * @access  Private
 * @body    { preferences }
 */
router.put('/preferences/notifications', updateRateLimit, UserController.updateNotificationPreferences);

/**
 * @route   GET /api/users/activity
 * @desc    Get user activity history
 * @access  Private
 * @query   page?, limit?
 */
router.get('/activity', userRateLimit, UserController.getActivityHistory);

/**
 * @route   DELETE /api/users/account
 * @desc    Delete user account
 * @access  Private
 * @body    { password, reason? }
 */
router.delete('/account', strictRateLimit, UserController.deleteAccount);

export default router; 