import { Request, Response } from 'express';
import { Notification } from '../../models/core/Notification.model';
import { HttpStatusCodes } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { emitToUser, emitToRoom } from '../../utils/socketEmitter';

export class AdminNotificationController {
  /**
   * @desc    Get admin notifications
   * @route   GET /api/admin/notifications
   * @access  Private (Admin only)
   */
  static async getNotifications(req: Request, res: Response): Promise<void> {
    try {
      const adminId = req.user!.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      // Get admin notifications (admin role or global admin notifications)
      const filter: any = {
        $or: [
          { userId: adminId, userRole: 'admin' },
          { userRole: 'admin', userId: { $exists: false } } // Global admin notifications
        ]
      };

      const notifications = await Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const totalNotifications = await Notification.countDocuments(filter);
      const unreadCount = await Notification.countDocuments({
        ...filter,
        readAt: { $exists: false }
      });

      res.status(HttpStatusCodes.OK).json({
        status: 'success',
        message: 'Admin notifications retrieved successfully',
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
      logger.error('Error fetching admin notifications:', error);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to fetch admin notifications'
      });
    }
  }

  /**
   * @desc    Mark admin notification as read
   * @route   POST /api/admin/notifications/:id/read
   * @access  Private (Admin only)
   */
  static async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const adminId = req.user!.id;

      const notification = await Notification.findOne({
        _id: id,
        $or: [
          { userId: adminId, userRole: 'admin' },
          { userRole: 'admin', userId: { $exists: false } }
        ]
      });

      if (!notification) {
        res.status(HttpStatusCodes.NOT_FOUND).json({
          status: 'error',
          message: 'Notification not found or access denied'
        });
        return;
      }

      notification.readAt = new Date();
      await notification.save();

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
   * @desc    Mark all admin notifications as read
   * @route   POST /api/admin/notifications/read-all
   * @access  Private (Admin only)
   */
  static async markAllAsRead(req: Request, res: Response): Promise<void> {
    try {
      const adminId = req.user!.id;

      const filter = {
        $or: [
          { userId: adminId, userRole: 'admin' },
          { userRole: 'admin', userId: { $exists: false } }
        ],
        readAt: { $exists: false }
      };

      const result = await Notification.updateMany(
        filter,
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
   * @desc    Get admin activity feed
   * @route   GET /api/admin/activity
   * @access  Private (Admin only)
   */
  static async getActivity(req: Request, res: Response): Promise<void> {
    try {
      const adminId = req.user!.id;
      const limit = parseInt(req.query.limit as string) || 10;
      const page = parseInt(req.query.page as string) || 1;
      const skip = (page - 1) * limit;

      // Get admin notifications as activity items
      const filter: any = {
        $or: [
          { userId: adminId, userRole: 'admin' },
          { userRole: 'admin', userId: { $exists: false } }
        ]
      };

      const notifications = await Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('title message type createdAt data actionUrl');

      // Transform notifications to activity format
      const activity = notifications.map(notification => ({
        id: notification._id.toString(),
        title: notification.title,
        subtext: notification.message,
        icon: this.getActivityIcon(notification.type),
        entityType: this.getEntityType(notification.type),
        entityId: notification.data?.vehicleId || notification.data?.batchId || notification.data?.userId || null,
        createdAt: notification.createdAt,
        type: notification.type,
        actionUrl: notification.actionUrl
      }));

      res.status(HttpStatusCodes.OK).json({
        status: 'success',
        message: 'Admin activity retrieved successfully',
        data: {
          activity,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(activity.length / limit),
            totalItems: activity.length,
            limit
          }
        }
      });
    } catch (error) {
      logger.error('Error fetching admin activity:', error);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to fetch admin activity'
      });
    }
  }

  /**
   * Helper function to get activity icon based on notification type
   */
  static getActivityIcon(type: string): string {
    const iconMap: { [key: string]: string } = {
      'security': 'shield',
      'fraud_alert': 'alert-triangle',
      'transaction': 'dollar-sign',
      'system': 'settings',
      'verification': 'check-circle',
      'reminder': 'clock',
      'marketing': 'megaphone',
      'update': 'refresh-cw',
      'install_request': 'wrench',
      'batch_anchor': 'link',
      'user_registration': 'user-plus',
      'vehicle_approval': 'car',
      'vehicle_registration': 'car',
      'obd_installation': 'wrench',
      'device_activation': 'check-circle',
      'telemetry_received': 'activity',
      'batch_processing': 'database',
      'blockchain_anchor': 'link',
      'user_login': 'user-plus',
      'vehicle_verification': 'car',
      'fraud_detection': 'alert-triangle',
      'system_health': 'settings',
      'data_export': 'database',
      'audit_log': 'file-text'
    };
    return iconMap[type] || 'bell';
  }

  /**
   * Helper function to get entity type based on notification type
   */
  static getEntityType(type: string): string {
    const entityMap: { [key: string]: string } = {
      'security': 'security',
      'fraud_alert': 'fraud',
      'transaction': 'transaction',
      'system': 'system',
      'verification': 'vehicle',
      'install_request': 'device',
      'batch_anchor': 'batch',
      'user_registration': 'user',
      'vehicle_approval': 'vehicle',
      'vehicle_registration': 'vehicle',
      'obd_installation': 'device',
      'device_activation': 'device',
      'telemetry_received': 'data',
      'batch_processing': 'system',
      'blockchain_anchor': 'blockchain',
      'user_login': 'user',
      'vehicle_verification': 'vehicle',
      'fraud_detection': 'security',
      'system_health': 'system',
      'data_export': 'data',
      'audit_log': 'system'
    };
    return entityMap[type] || 'general';
  }
}

export default AdminNotificationController;
