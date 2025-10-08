import mongoose, { Schema, Model, Document } from 'mongoose';

// Notification Types
export type NotificationType = 
  | 'security'
  | 'fraud_alert'
  | 'transaction'
  | 'system'
  | 'verification'
  | 'reminder'
  | 'marketing'
  | 'update';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export type NotificationChannel = 'email' | 'sms' | 'push' | 'in_app';

export type NotificationStatus = 'sent' | 'delivered' | 'read' | 'failed';

// Notification Interface
export interface INotification extends Document {
  _id: string;
  
  // Recipient
  userId: string;
  userRole: string;
  
  // Content
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  
  // Delivery
  channels: NotificationChannel[];
  status: Record<NotificationChannel, NotificationStatus>;
  
  // Metadata
  data?: any; // Additional data for the notification
  actionUrl?: string; // URL to navigate when notification is clicked
  actionLabel?: string; // Label for the action button
  
  // Scheduling
  scheduledFor?: Date;
  expiresAt?: Date;
  
  // Tracking
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  markAsRead(): Promise<void>;
  markAsDelivered(channel: NotificationChannel): Promise<void>;
}

// Notification Schema
const NotificationSchema = new Schema<INotification>({
  // Recipient
  userId: { 
    type: String, 
    required: true,
    ref: 'User',
    index: true
  },
  userRole: { 
    type: String, 
    required: true,
    enum: ['admin', 'owner', 'buyer', 'service', 'insurance', 'government']
  },
  
  // Content
  title: { 
    type: String, 
    required: true,
    maxlength: 200
  },
  message: { 
    type: String, 
    required: true,
    maxlength: 1000
  },
  type: { 
    type: String, 
    required: true,
    enum: ['security', 'fraud_alert', 'transaction', 'system', 'verification', 'reminder', 'marketing', 'update']
  },
  priority: { 
    type: String, 
    required: true,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Delivery
  channels: [{ 
    type: String, 
    enum: ['email', 'sms', 'push', 'in_app'],
    required: true
  }],
  status: {
    email: { 
      type: String, 
      enum: ['sent', 'delivered', 'read', 'failed'],
      default: 'sent'
    },
    sms: { 
      type: String, 
      enum: ['sent', 'delivered', 'read', 'failed'],
      default: 'sent'
    },
    push: { 
      type: String, 
      enum: ['sent', 'delivered', 'read', 'failed'],
      default: 'sent'
    },
    in_app: { 
      type: String, 
      enum: ['sent', 'delivered', 'read', 'failed'],
      default: 'sent'
    }
  },
  
  // Metadata
  data: { type: Schema.Types.Mixed },
  actionUrl: { type: String },
  actionLabel: { type: String, maxlength: 50 },
  
  // Scheduling
  scheduledFor: { type: Date },
  expiresAt: { type: Date },
  
  // Tracking
  sentAt: { type: Date },
  deliveredAt: { type: Date },
  readAt: { type: Date }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ type: 1 });
NotificationSchema.index({ priority: 1 });
NotificationSchema.index({ scheduledFor: 1 });
NotificationSchema.index({ expiresAt: 1 });
NotificationSchema.index({ 'status.in_app': 1, userId: 1 });

// Virtual fields
NotificationSchema.virtual('isRead').get(function() {
  return !!this.readAt;
});

NotificationSchema.virtual('isExpired').get(function() {
  return this.expiresAt && this.expiresAt < new Date();
});

NotificationSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now.getTime() - this.createdAt.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
});

// Instance Methods
NotificationSchema.methods.markAsRead = async function(): Promise<void> {
  const notification = this as INotification;
  if (!notification.readAt) {
    notification.readAt = new Date();
    if (notification.channels.includes('in_app')) {
      notification.status.in_app = 'read';
    }
    await notification.save();
  }
};

NotificationSchema.methods.markAsDelivered = async function(channel: NotificationChannel): Promise<void> {
  const notification = this as INotification;
  if (notification.channels.includes(channel)) {
    notification.status[channel] = 'delivered';
    if (!notification.deliveredAt) {
      notification.deliveredAt = new Date();
    }
    await notification.save();
  }
};

// Static Methods
NotificationSchema.statics.findUnreadByUser = function(userId: string) {
  return this.find({ 
    userId, 
    readAt: { $exists: false },
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gte: new Date() } }
    ]
  }).sort({ createdAt: -1 });
};

NotificationSchema.statics.findByUserAndType = function(userId: string, type: NotificationType) {
  return this.find({ userId, type }).sort({ createdAt: -1 });
};

NotificationSchema.statics.markAllAsReadForUser = function(userId: string) {
  return this.updateMany(
    { 
      userId, 
      readAt: { $exists: false },
      channels: 'in_app'
    },
    { 
      readAt: new Date(),
      'status.in_app': 'read'
    }
  );
};

NotificationSchema.statics.cleanupExpired = function() {
  return this.deleteMany({
    expiresAt: { $lt: new Date() }
  });
};

NotificationSchema.statics.getNotificationStats = function(userId: string) {
  return this.aggregate([
    { $match: { userId } },
    {
      $group: {
        _id: '$type',
        total: { $sum: 1 },
        unread: {
          $sum: {
            $cond: [{ $eq: ['$readAt', null] }, 1, 0]
          }
        }
      }
    }
  ]);
};

// Pre-save middleware
NotificationSchema.pre('save', function(next) {
  const notification = this as INotification;
  
  // Set sentAt timestamp
  if (notification.isNew && !notification.sentAt) {
    notification.sentAt = new Date();
  }
  
  // Set default expiration for certain types
  if (notification.isNew && !notification.expiresAt) {
    const daysToExpire = getDefaultExpirationDays(notification.type);
    if (daysToExpire > 0) {
      notification.expiresAt = new Date(Date.now() + daysToExpire * 24 * 60 * 60 * 1000);
    }
  }
  
  next();
});

// Helper function for default expiration
function getDefaultExpirationDays(type: NotificationType): number {
  switch (type) {
    case 'security':
    case 'fraud_alert':
      return 30; // Security notifications expire in 30 days
    case 'verification':
      return 7; // Verification notifications expire in 7 days
    case 'reminder':
      return 3; // Reminders expire in 3 days
    case 'marketing':
      return 14; // Marketing notifications expire in 2 weeks
    case 'system':
    case 'update':
      return 30; // System updates expire in 30 days
    case 'transaction':
      return 90; // Transaction notifications kept for 90 days
    default:
      return 0; // No expiration
  }
}

// Create and export the model
export const Notification: Model<INotification> = mongoose.model<INotification>('Notification', NotificationSchema); 