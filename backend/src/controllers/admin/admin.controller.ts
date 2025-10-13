import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { User } from '../../models/core/User.model';
import { AuthService } from '../../services/core/auth.service';
import { ApiError, HttpStatusCodes } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { UserRole, AccountStatus } from '../../types/user.types';

export class AdminController {
  /**
   * @desc    Admin dashboard statistics
   * @route   GET /api/admin/dashboard
   * @access  Private (Admin only)
   */
  static async getDashboard(req: Request, res: Response): Promise<void> {
    try {
      const totalUsers = await User.countDocuments();
      const activeUsers = await User.countDocuments({ accountStatus: 'active' });
      const pendingUsers = await User.countDocuments({ accountStatus: 'pending' });
      const suspendedUsers = await User.countDocuments({ accountStatus: 'suspended' });
      const lockedUsers = await User.countDocuments({ accountStatus: 'locking' });

      // Role distribution
      const roleDistribution = await User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      // Recent registrations (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentRegistrations = await User.countDocuments({
        createdAt: { $gte: thirtyDaysAgo }
      });

      // Users by status
      const usersByStatus = await User.aggregate([
        { $group: { _id: '$accountStatus', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      res.status(HttpStatusCodes.OK).json({
        status: 'success',
        message: 'Admin dashboard data retrieved successfully',
        data: {
          overview: {
            totalUsers,
            activeUsers,
            pendingUsers,
            suspendedUsers,
            lockedUsers,
            recentRegistrations
          },
          roleDistribution,
          usersByStatus,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Error fetching admin dashboard:', error);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to fetch dashboard data'
      });
    }
  }

  /**
   * @desc    Get all users with filters and pagination
   * @route   GET /api/admin/users
   * @access  Private (Admin only)
   */
  static async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;
      
      const role = req.query.role as UserRole;
      const status = req.query.status as AccountStatus;
      const search = req.query.search as string;
      const sortBy = req.query.sortBy as string || 'createdAt';
      const sortOrder = req.query.sortOrder as string || 'desc';

      // Build filter object
      const filter: any = {};
      if (role) filter.role = role;
      if (status) filter.accountStatus = status;
      if (search) {
        filter.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      // Build sort object
      const sort: any = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const users = await User.find(filter)
        .select('-password -refreshTokens -__v')
        .sort(sort)
        .skip(skip)
        .limit(limit);

      const totalUsers = await User.countDocuments(filter);
      const totalPages = Math.ceil(totalUsers / limit);

      res.status(HttpStatusCodes.OK).json({
        status: 'success',
        message: 'Users retrieved successfully',
        data: {
          users,
          pagination: {
            currentPage: page,
            totalPages,
            totalUsers,
            limit,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
          }
        }
      });
    } catch (error) {
      logger.error('Error fetching users:', error);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to fetch users'
      });
    }
  }

  /**
   * @desc    Get user by ID
   * @route   GET /api/admin/users/:id
   * @access  Private (Admin only)
   */
  static async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const user = await User.findById(id).select('-password -refreshTokens -__v');
      
      if (!user) {
        res.status(HttpStatusCodes.NOT_FOUND).json({
          status: 'error',
          message: 'User not found'
        });
        return;
      }

      res.status(HttpStatusCodes.OK).json({
        status: 'success',
        message: 'User retrieved successfully',
        data: { user }
      });
    } catch (error) {
      logger.error('Error fetching user:', error);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to fetch user'
      });
    }
  }

  /**
   * @desc    Update user status
   * @route   PATCH /api/admin/users/:id/status
   * @access  Private (Admin only)
   */
  static async updateUserStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;

      if (!['active', 'pending', 'suspended', 'locked', 'deactivated'].includes(status)) {
        res.status(HttpStatusCodes.BAD_REQUEST).json({
          status: 'error',
          message: 'Invalid status value'
        });
        return;
      }

      const user = await User.findById(id);
      if (!user) {
        res.status(HttpStatusCodes.NOT_FOUND).json({
          status: 'error',
          message: 'User not found'
        });
        return;
      }

      // Prevent admin from changing their own status
      if (user._id.toString() === req.user?.id) {
        res.status(HttpStatusCodes.FORBIDDEN).json({
          status: 'error',
          message: 'Cannot change your own status'
        });
        return;
      }

      const oldStatus = user.accountStatus;
      user.accountStatus = status;
      user.updatedAt = new Date();

      // Skip audit log for now

      await user.save();

      logger.info(`User ${user.email} status changed from ${oldStatus} to ${status} by admin ${req.user!.email}`);

      res.status(HttpStatusCodes.OK).json({
        status: 'success',
        message: 'User status updated successfully',
        data: {
          user: {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            accountStatus: user.accountStatus,
            updatedAt: user.updatedAt
          }
        }
      });
    } catch (error) {
      logger.error('Error updating user status:', error);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to update user status'
      });
    }
  }

  /**
   * @desc    Delete user (soft delete)
   * @route   DELETE /api/admin/users/:id
   * @access  Private (Admin only)
   */
  static async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const user = await User.findById(id);
      if (!user) {
        res.status(HttpStatusCodes.NOT_FOUND).json({
          status: 'error',
          message: 'User not found'
        });
        return;
      }

      // Prevent admin from deleting themselves
      if (user._id.toString() === req.user?.id) {
        res.status(HttpStatusCodes.FORBIDDEN).json({
          status: 'error',
          message: 'Cannot delete your own account'
        });
        return;
      }

      // Soft delete - mark as suspended
      user.accountStatus = 'suspended';
      user.updatedAt = new Date();

      await user.save();

      logger.info(`User ${user.email} deleted by admin ${req.user!.email}`);

      res.status(HttpStatusCodes.OK).json({
        status: 'success',
        message: 'User deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting user:', error);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to delete user'
      });
    }
  }

  /**
   * @desc    Get user activity logs
   * @route   GET /api/admin/users/:id/activity
   * @access  Private (Admin only)
   */
  static async getUserActivity(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const user = await User.findById(id);
      if (!user) {
        res.status(HttpStatusCodes.NOT_FOUND).json({
          status: 'error',
          message: 'User not found'
        });
        return;
      }

      res.status(HttpStatusCodes.OK).json({
        status: 'success',
        message: 'User activity retrieved successfully',
        data: {
          userId: user._id,
          userEmail: user.email,
          activity: [],
          message: 'Activity tracking will be implemented in future versions'
        }
      });
    } catch (error) {
      logger.error('Error fetching user activity:', error);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to fetch user activity'
      });
    }
  }

  /**
   * @desc    Search users
   * @route   GET /api/admin/users/search
   * @access  Private (Admin only)
   */
  static async searchUsers(req: Request, res: Response): Promise<void> {
    try {
      const { query } = req.query;
      const limit = parseInt(req.query.limit as string) || 10;

      if (!query || typeof query !== 'string') {
        res.status(HttpStatusCodes.BAD_REQUEST).json({
          status: 'error',
          message: 'Search query is required'
        });
        return;
      }

      const users = await User.find({
        $or: [
          { firstName: { $regex: query, $options: 'i' } },
          { lastName: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } }
        ]
      })
      .select('_id firstName lastName email role accountStatus createdAt')
      .limit(limit);

      res.status(HttpStatusCodes.OK).json({
        status: 'success',
        message: 'Users search completed',
        data: {
          query,
          users,
          count: users.length
        }
      });
    } catch (error) {
      logger.error('Error searching users:', error);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to search users'
      });
    }
  }

  /**
   * @desc    Get vehicle statistics
   * @route   GET /api/admin/vehicles/stats
   * @access  Private (Admin only)
   */
  static async getVehicleStats(req: Request, res: Response): Promise<void> {
    try {
      // Get Vehicle model from mongoose
      const Vehicle = mongoose.model('Vehicle');

      const totalVehicles = await Vehicle.countDocuments();
      const verifiedVehicles = await Vehicle.countDocuments({ verificationStatus: 'verified' });
      const pendingVehicles = await Vehicle.countDocuments({ verificationStatus: 'pending' });
      const rejectedVehicles = await Vehicle.countDocuments({ verificationStatus: 'rejected' });

      // Vehicles by status
      const vehiclesByStatus = await Vehicle.aggregate([
        { $group: { _id: '$verificationStatus', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      // Recent vehicles (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentVehicles = await Vehicle.countDocuments({
        createdAt: { $gte: thirtyDaysAgo }
      });

      res.status(HttpStatusCodes.OK).json({
        status: 'success',
        message: 'Vehicle statistics retrieved successfully',
        data: {
          totalVehicles,
          verifiedVehicles,
          pendingVehicles,
          rejectedVehicles,
          recentVehicles,
          vehiclesByStatus,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Error fetching vehicle stats:', error);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to fetch vehicle statistics'
      });
    }
  }

  /**
   * @desc    Get blockchain transaction statistics
   * @route   GET /api/admin/transactions/stats
   * @access  Private (Admin only)
   */
  static async getTransactionStats(req: Request, res: Response): Promise<void> {
    try {
      // Get Transaction model from mongoose
      const Transaction = mongoose.model('Transaction');

      const totalTransactions = await Transaction.countDocuments();
      const confirmedTransactions = await Transaction.countDocuments({ status: 'confirmed' });
      const pendingTransactions = await Transaction.countDocuments({ status: 'pending' });
      const failedTransactions = await Transaction.countDocuments({ status: 'failed' });

      // Transactions by type
      const transactionsByType = await Transaction.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      // Transactions by blockchain
      const transactionsByBlockchain = await Transaction.aggregate([
        { $group: { _id: '$blockchain', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      // Recent transactions (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentTransactions = await Transaction.countDocuments({
        createdAt: { $gte: thirtyDaysAgo }
      });

      res.status(HttpStatusCodes.OK).json({
        status: 'success',
        message: 'Transaction statistics retrieved successfully',
        data: {
          totalTransactions,
          confirmedTransactions,
          pendingTransactions,
          failedTransactions,
          recentTransactions,
          transactionsByType,
          transactionsByBlockchain,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Error fetching transaction stats:', error);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to fetch transaction statistics'
      });
    }
  }
} 