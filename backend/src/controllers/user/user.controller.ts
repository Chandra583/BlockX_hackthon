import { Request, Response } from 'express';
import { User } from '../../models/core/User.model';
import { Notification, INotification } from '../../models/core/Notification.model';
import { AuthService } from '../../services/core/auth.service';
import { ApiError, HttpStatusCodes } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { UserRole } from '../../types/user.types';
import bcrypt from 'bcryptjs';

export class UserController {
  /**
   * @desc    Update user profile
   * @route   PUT /api/users/profile
   * @access  Private
   */
  static async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const {
        firstName,
        lastName,
        phoneNumber,
        dateOfBirth,
        address,
        roleSpecificData
      } = req.body;

      const user = await User.findById(userId);
      if (!user) {
        res.status(HttpStatusCodes.NOT_FOUND).json({
          status: 'error',
          message: 'User not found'
        });
        return;
      }

      // Update basic profile fields
      if (firstName) user.firstName = firstName;
      if (lastName) user.lastName = lastName;
      if (phoneNumber) user.phoneNumber = phoneNumber;
      if (dateOfBirth) user.dateOfBirth = new Date(dateOfBirth);
      if (address) user.address = { ...user.address, ...address };
      
      // Update role-specific data if provided
      if (roleSpecificData) {
        user.roleData = { ...user.roleData, ...roleSpecificData };
      }

      user.updatedAt = new Date();

      await user.save();

      // Remove sensitive data from response
      const userResponse = user.toObject();
      delete (userResponse as any).password;
      delete (userResponse as any).twoFactorSecret;

      res.status(HttpStatusCodes.OK).json({
        status: 'success',
        message: 'Profile updated successfully',
        data: { user: userResponse }
      });
    } catch (error) {
      logger.error('Error updating profile:', error);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to update profile'
      });
    }
  }

  /**
   * @desc    Upload profile picture
   * @route   POST /api/users/profile/avatar
   * @access  Private
   */
  static async uploadAvatar(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { avatarUrl } = req.body;

      if (!avatarUrl) {
        res.status(HttpStatusCodes.BAD_REQUEST).json({
          status: 'error',
          message: 'Avatar URL is required'
        });
        return;
      }

      const user = await User.findById(userId);
      if (!user) {
        res.status(HttpStatusCodes.NOT_FOUND).json({
          status: 'error',
          message: 'User not found'
        });
        return;
      }

      user.profileImage = avatarUrl;
      user.updatedAt = new Date();

      await user.save();

      res.status(HttpStatusCodes.OK).json({
        status: 'success',
        message: 'Avatar updated successfully',
        data: {
          avatarUrl: user.profileImage
        }
      });
    } catch (error) {
      logger.error('Error uploading avatar:', error);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to upload avatar'
      });
    }
  }

  /**
   * @desc    Get user notifications
   * @route   GET /api/users/notifications
   * @access  Private
   */
  static async getNotifications(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      const unreadOnly = req.query.unread === 'true';

      const filter: any = { userId };
      if (unreadOnly) filter.readAt = { $exists: false };

      const notifications = await Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const totalNotifications = await Notification.countDocuments(filter);
      const unreadCount = await Notification.countDocuments({ userId, readAt: { $exists: false } });

      res.status(HttpStatusCodes.OK).json({
        status: 'success',
        message: 'Notifications retrieved successfully',
        data: {
          notifications,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalNotifications / limit),
            totalNotifications,
            limit
          },
          unreadCount
        }
      });
    } catch (error) {
      logger.error('Error fetching notifications:', error);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to fetch notifications'
      });
    }
  }

  /**
   * @desc    Mark notification as read
   * @route   PATCH /api/users/notifications/:id/read
   * @access  Private
   */
  static async markNotificationAsRead(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const notification = await Notification.findOne({ _id: id, userId });
      if (!notification) {
        res.status(HttpStatusCodes.NOT_FOUND).json({
          status: 'error',
          message: 'Notification not found'
        });
        return;
      }

      await notification.markAsRead();

      res.status(HttpStatusCodes.OK).json({
        status: 'success',
        message: 'Notification marked as read'
      });
    } catch (error) {
      logger.error('Error marking notification as read:', error);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to mark notification as read'
      });
    }
  }

  /**
   * @desc    Mark all notifications as read
   * @route   PATCH /api/users/notifications/read-all
   * @access  Private
   */
  static async markAllNotificationsAsRead(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      const result = await Notification.updateMany(
        { userId, readAt: { $exists: false } },
        { readAt: new Date() }
      );

      res.status(HttpStatusCodes.OK).json({
        status: 'success',
        message: 'All notifications marked as read',
        data: {
          markedCount: result.modifiedCount
        }
      });
    } catch (error) {
      logger.error('Error marking all notifications as read:', error);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to mark all notifications as read'
      });
    }
  }

  /**
   * @desc    Update notification preferences
   * @route   PUT /api/users/preferences/notifications
   * @access  Private
   */
  static async updateNotificationPreferences(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { preferences } = req.body;

      if (!preferences || typeof preferences !== 'object') {
        res.status(HttpStatusCodes.BAD_REQUEST).json({
          status: 'error',
          message: 'Valid preferences object is required'
        });
        return;
      }

      const user = await User.findById(userId);
      if (!user) {
        res.status(HttpStatusCodes.NOT_FOUND).json({
          status: 'error',
          message: 'User not found'
        });
        return;
      }

      // Update notification preferences
      user.notifications = {
        ...user.notifications,
        ...preferences
      };

      user.updatedAt = new Date();
      await user.save();

      res.status(HttpStatusCodes.OK).json({
        status: 'success',
        message: 'Notification preferences updated successfully',
        data: {
          preferences: user.notifications
        }
      });
    } catch (error) {
      logger.error('Error updating notification preferences:', error);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to update notification preferences'
      });
    }
  }

  /**
   * @desc    Get user activity history
   * @route   GET /api/users/activity
   * @access  Private
   */
  static async getActivityHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      res.status(HttpStatusCodes.OK).json({
        status: 'success',
        message: 'Activity history retrieved successfully',
        data: {
          activity: [],
          message: 'Activity tracking will be implemented in future versions'
        }
      });
    } catch (error) {
      logger.error('Error fetching activity history:', error);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to fetch activity history'
      });
    }
  }

  /**
   * @desc    Delete user account
   * @route   DELETE /api/users/account
   * @access  Private
   */
  static async deleteAccount(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { password, reason } = req.body;

      if (!password) {
        res.status(HttpStatusCodes.BAD_REQUEST).json({
          status: 'error',
          message: 'Password is required to delete account'
        });
        return;
      }

      const user = await User.findById(userId).select('+password');
      if (!user) {
        res.status(HttpStatusCodes.NOT_FOUND).json({
          status: 'error',
          message: 'User not found'
        });
        return;
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        res.status(HttpStatusCodes.UNAUTHORIZED).json({
          status: 'error',
          message: 'Invalid password'
        });
        return;
      }

      // Mark account as suspended (soft delete)
      user.accountStatus = 'suspended';
      user.updatedAt = new Date();

      await user.save();

      logger.info(`User ${user.email} deleted their account`);

      res.status(HttpStatusCodes.OK).json({
        status: 'success',
        message: 'Account deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting account:', error);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to delete account'
      });
    }
  }

  /**
   * @desc    Get user dashboard data
   * @route   GET /api/users/dashboard
   * @access  Private
   */
  static async getDashboard(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      const user = await User.findById(userId).select('-password -twoFactorSecret');
      if (!user) {
        res.status(HttpStatusCodes.NOT_FOUND).json({
          status: 'error',
          message: 'User not found'
        });
        return;
      }

      // Get unread notifications count
      const unreadNotifications = await Notification.countDocuments({
        userId,
        readAt: { $exists: false }
      });

      res.status(HttpStatusCodes.OK).json({
        status: 'success',
        message: 'Dashboard data retrieved successfully',
        data: {
          user,
          unreadNotifications,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Error fetching dashboard data:', error);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to fetch dashboard data'
      });
    }
  }
} 