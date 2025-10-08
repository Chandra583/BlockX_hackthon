import { Router } from 'express';
import { AdminController } from '../../controllers/admin/admin.controller';
import { authenticate, requireAdmin, rateLimit } from '../../middleware/auth.middleware';

const router = Router();

// Rate limiting for admin endpoints
const adminRateLimit = rateLimit(50, 15 * 60 * 1000); // 50 requests per 15 minutes
const strictAdminRateLimit = rateLimit(10, 15 * 60 * 1000); // 10 requests per 15 minutes

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

/**
 * @route   GET /api/admin/dashboard
 * @desc    Get admin dashboard statistics
 * @access  Private (Admin only)
 */
router.get('/dashboard', adminRateLimit, AdminController.getDashboard);

/**
 * @route   GET /api/admin/users
 * @desc    Get all users with filters and pagination
 * @access  Private (Admin only)
 * @query   page, limit, role, status, search, sortBy, sortOrder
 */
router.get('/users', adminRateLimit, AdminController.getUsers);

/**
 * @route   GET /api/admin/users/search
 * @desc    Search users by name or email
 * @access  Private (Admin only)
 * @query   query, limit
 */
router.get('/users/search', adminRateLimit, AdminController.searchUsers);

/**
 * @route   GET /api/admin/users/:id
 * @desc    Get user by ID
 * @access  Private (Admin only)
 */
router.get('/users/:id', adminRateLimit, AdminController.getUserById);

/**
 * @route   PATCH /api/admin/users/:id/status
 * @desc    Update user status
 * @access  Private (Admin only)
 * @body    { status, reason? }
 */
router.patch('/users/:id/status', strictAdminRateLimit, AdminController.updateUserStatus);

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Delete user (soft delete)
 * @access  Private (Admin only)
 * @body    { reason? }
 */
router.delete('/users/:id', strictAdminRateLimit, AdminController.deleteUser);

/**
 * @route   GET /api/admin/users/:id/activity
 * @desc    Get user activity logs
 * @access  Private (Admin only)
 * @query   page, limit
 */
router.get('/users/:id/activity', adminRateLimit, AdminController.getUserActivity);

/**
 * @route   GET /api/admin/vehicles/stats
 * @desc    Get vehicle statistics
 * @access  Private (Admin only)
 */
router.get('/vehicles/stats', adminRateLimit, AdminController.getVehicleStats);

/**
 * @route   GET /api/admin/transactions/stats
 * @desc    Get blockchain transaction statistics
 * @access  Private (Admin only)
 */
router.get('/transactions/stats', adminRateLimit, AdminController.getTransactionStats);

export default router; 