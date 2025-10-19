import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { User } from '../../models/core/User.model';
import { Notification } from '../../models/core/Notification.model';
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
   * @desc    List vehicles with optional status filter
   * @route   GET /api/admin/vehicles
   * @access  Private (Admin only)
   */
  static async listVehicles(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;
      const status = (req.query.status as string) || undefined; // pending | verified | rejected | flagged
      const search = (req.query.search as string) || '';

      const Vehicle = mongoose.model('Vehicle');

      const filter: any = {};
      if (status) filter.verificationStatus = status;
      if (search) {
        filter.$or = [
          { vin: { $regex: search, $options: 'i' } },
          { vehicleNumber: { $regex: search, $options: 'i' } },
          { make: { $regex: search, $options: 'i' } },
          { vehicleModel: { $regex: search, $options: 'i' } }
        ];
      }

      const [vehicles, total] = await Promise.all([
        Vehicle.find(filter)
          .populate('ownerId', 'firstName lastName email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Vehicle.countDocuments(filter)
      ]);

      res.status(HttpStatusCodes.OK).json({
        status: 'success',
        message: 'Vehicles retrieved successfully',
        data: {
          vehicles,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalVehicles: total,
            limit,
            hasNextPage: page < Math.ceil(total / limit),
            hasPrevPage: page > 1
          }
        }
      });
    } catch (error) {
      logger.error('Error listing vehicles:', error);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to fetch vehicles'
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

  /**
   * @desc    Get pending vehicle registrations
   * @route   GET /api/admin/vehicles/pending
   * @access  Private (Admin only)
   */
  static async getPendingVehicles(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const Vehicle = mongoose.model('Vehicle');

      const pendingVehicles = await Vehicle.find({ verificationStatus: 'pending' })
        .populate('ownerId', 'firstName lastName email phoneNumber')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const totalPending = await Vehicle.countDocuments({ verificationStatus: 'pending' });

      res.status(HttpStatusCodes.OK).json({
        status: 'success',
        message: 'Pending vehicles retrieved successfully',
        data: {
          vehicles: pendingVehicles,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalPending / limit),
            totalPending,
            limit,
            hasNextPage: page < Math.ceil(totalPending / limit),
            hasPrevPage: page > 1
          }
        }
      });
    } catch (error) {
      logger.error('Error fetching pending vehicles:', error);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to fetch pending vehicles'
      });
    }
  }

  /**
   * @desc    Approve vehicle registration and send to blockchain
   * @route   POST /api/admin/vehicles/:vehicleId/approve
   * @access  Private (Admin only)
   */
  static async approveVehicle(req: Request, res: Response): Promise<void> {
    try {
      const { vehicleId } = req.params;
      const adminId = req.user?.id;

      const Vehicle = mongoose.model('Vehicle');
      
      // Get vehicle
      const vehicle = await Vehicle.findById(vehicleId).populate('ownerId');
      if (!vehicle) {
        res.status(HttpStatusCodes.NOT_FOUND).json({
          status: 'error',
          message: 'Vehicle not found'
        });
        return;
      }

      // Check if already verified
      if (vehicle.verificationStatus === 'verified') {
        res.status(HttpStatusCodes.BAD_REQUEST).json({
          status: 'error',
          message: 'Vehicle is already verified'
        });
        return;
      }

      // Check if not pending
      if (vehicle.verificationStatus !== 'pending') {
        res.status(HttpStatusCodes.BAD_REQUEST).json({
          status: 'error',
          message: 'Vehicle is not in pending status'
        });
        return;
      }

      // Import required services
      const { walletService } = require('../../services/blockchain/wallet.service');
      const { getSolanaService } = require('../../services/blockchain/solana.service');

      // Get owner's wallet
      const ownerWallet = await walletService.getUserWallet(vehicle.ownerId._id.toString());
      if (!ownerWallet) {
        res.status(HttpStatusCodes.BAD_REQUEST).json({
          status: 'error',
          message: 'Owner does not have a blockchain wallet. Please ask the owner to create a wallet first.'
        });
        return;
      }

      try {
        // Register vehicle on blockchain using owner's wallet
        const blockchainRecord = await getSolanaService().registerVehicle(
          vehicle._id.toString(),
          vehicle.vin,
          vehicle.vehicleNumber,
          vehicle.currentMileage,
          ownerWallet
        );

      // Update vehicle with blockchain info and mark as verified
        vehicle.blockchainHash = blockchainRecord.transactionHash;
        vehicle.blockchainAddress = blockchainRecord.blockchainAddress;
        vehicle.verificationStatus = 'verified';
        vehicle.updatedAt = new Date();

        await vehicle.save();

        logger.info(`✅ Admin ${adminId} approved vehicle ${vehicleId} and registered on blockchain: ${blockchainRecord.transactionHash}`);

        // Save registration transaction to blockchain history
        try {
          const { VehicleBlockchainService } = await import('../../services/vehicleBlockchain.service');
          await VehicleBlockchainService.addTransaction(vehicle._id.toString(), {
            transactionType: 'registration',
            transactionHash: blockchainRecord.transactionHash,
            blockchainAddress: ownerWallet.publicKey,
            network: process.env.NODE_ENV === 'production' ? 'mainnet' : 'devnet',
            metadata: {
              vin: vehicle.vin,
              vehicleNumber: vehicle.vehicleNumber,
              make: vehicle.make,
              model: vehicle.vehicleModel,
              year: vehicle.year,
              initialMileage: vehicle.currentMileage,
              ownerName: `${vehicle.ownerId.firstName} ${vehicle.ownerId.lastName}`,
              ownerEmail: vehicle.ownerId.email
            }
          });
          logger.info(`✅ Saved registration transaction to blockchain history`);
        } catch (historyError) {
          logger.warn('Failed to save to blockchain history (non-fatal):', historyError);
        }

      // Notify owner
      try {
        await Notification.create({
          userId: vehicle.ownerId._id.toString(),
          userRole: 'owner',
          title: 'Vehicle Approved',
          message: `Your vehicle ${vehicle.vin} (${vehicle.vehicleNumber}) has been approved and registered on Solana.`,
          type: 'verification',
          priority: 'high',
          channels: ['in_app'],
          actionUrl: `/vehicles/${vehicle._id}`,
          actionLabel: 'View vehicle'
        });
      } catch (notifyErr) {
        logger.warn('Failed to create approval notification:', notifyErr);
      }

        res.status(HttpStatusCodes.OK).json({
          status: 'success',
          message: 'Vehicle approved and registered on blockchain successfully',
          data: {
            vehicle: {
              id: vehicle._id,
              vin: vehicle.vin,
              vehicleNumber: vehicle.vehicleNumber,
              make: vehicle.make,
              model: vehicle.vehicleModel,
              year: vehicle.year,
              verificationStatus: vehicle.verificationStatus,
              blockchainHash: vehicle.blockchainHash,
              blockchainAddress: vehicle.blockchainAddress,
              explorerUrl: `https://explorer.solana.com/tx/${blockchainRecord.transactionHash}${process.env.NODE_ENV === 'production' ? '' : '?cluster=devnet'}`
            },
            owner: {
              id: vehicle.ownerId._id,
              name: `${vehicle.ownerId.firstName} ${vehicle.ownerId.lastName}`,
              email: vehicle.ownerId.email,
              walletAddress: ownerWallet.publicKey
            }
          }
        });
      } catch (blockchainError) {
        logger.error('Blockchain registration failed:', blockchainError);
        res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
          status: 'error',
          message: 'Failed to register vehicle on blockchain',
          error: blockchainError instanceof Error ? blockchainError.message : 'Unknown error'
        });
      }
    } catch (error) {
      logger.error('Error approving vehicle:', error);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to approve vehicle'
      });
    }
  }

  /**
   * @desc    Reject vehicle registration
   * @route   POST /api/admin/vehicles/:vehicleId/reject
   * @access  Private (Admin only)
   */
  static async rejectVehicle(req: Request, res: Response): Promise<void> {
    try {
      const { vehicleId } = req.params;
      const { reason } = req.body;
      const adminId = req.user?.id;

      if (!reason) {
        res.status(HttpStatusCodes.BAD_REQUEST).json({
          status: 'error',
          message: 'Rejection reason is required'
        });
        return;
      }

      const Vehicle = mongoose.model('Vehicle');
      
      // Get vehicle
      const vehicle = await Vehicle.findById(vehicleId);
      if (!vehicle) {
        res.status(HttpStatusCodes.NOT_FOUND).json({
          status: 'error',
          message: 'Vehicle not found'
        });
        return;
      }

      // Check if already rejected
      if (vehicle.verificationStatus === 'rejected') {
        res.status(HttpStatusCodes.BAD_REQUEST).json({
          status: 'error',
          message: 'Vehicle is already rejected'
        });
        return;
      }

      // Check if not pending
      if (vehicle.verificationStatus !== 'pending') {
        res.status(HttpStatusCodes.BAD_REQUEST).json({
          status: 'error',
          message: 'Vehicle is not in pending status'
        });
        return;
      }

      // Update vehicle status to rejected
      vehicle.verificationStatus = 'rejected';
      vehicle.rejectionReason = reason;
      vehicle.rejectedBy = adminId;
      vehicle.rejectedAt = new Date();
      vehicle.updatedAt = new Date();

      await vehicle.save();

      logger.info(`⛔ Admin ${adminId} rejected vehicle ${vehicleId}. Reason: ${reason}`);

      // Notify owner with reason
      try {
        await Notification.create({
          userId: vehicle.ownerId.toString(),
          userRole: 'owner',
          title: 'Vehicle Rejected',
          message: `Your vehicle ${vehicle.vin} (${vehicle.vehicleNumber}) was rejected. Reason: ${reason}`,
          type: 'verification',
          priority: 'high',
          channels: ['in_app'],
          actionUrl: `/vehicles/${vehicle._id}`,
          actionLabel: 'Fix & resubmit'
        });
      } catch (notifyErr) {
        logger.warn('Failed to create rejection notification:', notifyErr);
      }

      res.status(HttpStatusCodes.OK).json({
        status: 'success',
        message: 'Vehicle registration rejected',
        data: {
          vehicle: {
            id: vehicle._id,
            vin: vehicle.vin,
            vehicleNumber: vehicle.vehicleNumber,
            make: vehicle.make,
            model: vehicle.vehicleModel,
            year: vehicle.year,
            verificationStatus: vehicle.verificationStatus,
            rejectionReason: reason
          }
        }
      });
    } catch (error) {
      logger.error('Error rejecting vehicle:', error);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to reject vehicle'
      });
    }
  }
} 