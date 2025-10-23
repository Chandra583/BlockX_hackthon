import { Notification } from '../models/core/Notification.model';
import { emitToUser, emitToRoom } from '../utils/socketEmitter';
import { logger } from '../utils/logger';

export interface CreateNotificationData {
  userId: string;
  userRole: string;
  title: string;
  message: string;
  type: string;
  priority?: string;
  channels?: string[];
  data?: any;
  actionUrl?: string;
  actionLabel?: string;
}

export class NotificationService {
  /**
   * Create a new notification and emit socket event
   */
  static async createNotification(data: CreateNotificationData) {
    try {
      const notification = await Notification.create({
        userId: data.userId,
        userRole: data.userRole,
        title: data.title,
        message: data.message,
        type: data.type,
        priority: data.priority || 'medium',
        channels: data.channels || ['in_app'],
        data: data.data,
        actionUrl: data.actionUrl,
        actionLabel: data.actionLabel
      });

      // Emit socket event to user
      emitToUser(data.userId, 'notification_created', {
        notification: {
          id: notification._id.toString(),
          title: notification.title,
          message: notification.message,
          type: notification.type,
          priority: notification.priority,
          createdAt: notification.createdAt,
          read: false,
          actionUrl: notification.actionUrl,
          actionLabel: notification.actionLabel
        }
      });

      // Emit to role-based room for real-time updates
      emitToRoom(`role_${data.userRole}`, 'activity_created', {
        activity: {
          id: notification._id.toString(),
          title: notification.title,
          subtext: notification.message,
          icon: this.getActivityIcon(notification.type),
          entityId: data.data?.vehicleId || data.data?.deviceId || null,
          createdAt: notification.createdAt,
          type: notification.type
        }
      });

      logger.info(`📧 Notification created and emitted: ${notification.title} for user ${data.userId}`);
      return notification;
    } catch (error) {
      logger.error('Failed to create notification:', error);
      throw error;
    }
  }

  /**
   * Create multiple notifications for different users
   */
  static async createBulkNotifications(notifications: CreateNotificationData[]) {
    try {
      const createdNotifications = await Notification.insertMany(notifications);
      
      // Emit socket events for each notification
      for (let i = 0; i < createdNotifications.length; i++) {
        const notification = createdNotifications[i];
        const data = notifications[i];
        
        emitToUser(data.userId, 'notification_created', {
          notification: {
            id: notification._id.toString(),
            title: notification.title,
            message: notification.message,
            type: notification.type,
            priority: notification.priority,
            createdAt: notification.createdAt,
            read: false,
            actionUrl: notification.actionUrl,
            actionLabel: notification.actionLabel
          }
        });

        emitToRoom(`role_${data.userRole}`, 'activity_created', {
          activity: {
            id: notification._id.toString(),
            title: notification.title,
            subtext: notification.message,
            icon: this.getActivityIcon(notification.type),
            entityId: data.data?.vehicleId || data.data?.deviceId || null,
            createdAt: notification.createdAt,
            type: notification.type
          }
        });
      }

      logger.info(`📧 Bulk notifications created and emitted: ${createdNotifications.length} notifications`);
      return createdNotifications;
    } catch (error) {
      logger.error('Failed to create bulk notifications:', error);
      throw error;
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
      'install_request': 'wrench'
    };
    return iconMap[type] || 'bell';
  }
}

export default NotificationService;
