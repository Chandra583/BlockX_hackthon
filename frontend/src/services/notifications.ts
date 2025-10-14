import { apiService } from './api';

export interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  type: 'security' | 'fraud_alert' | 'transaction' | 'system' | 'verification' | 'reminder' | 'marketing' | 'update';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  channels: Array<'email' | 'sms' | 'push' | 'in_app'>;
  readAt?: string;
  createdAt: string;
  actionUrl?: string;
  actionLabel?: string;
}

export interface NotificationsResponse {
  status: 'success' | 'error';
  message: string;
  data: {
    notifications: NotificationItem[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalNotifications: number;
      limit: number;
    };
    unreadCount: number;
  };
}

export class NotificationService {
  static async getNotifications(params?: { page?: number; limit?: number; unread?: boolean }): Promise<NotificationsResponse> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.unread) query.set('unread', 'true');
    return await apiService.get<NotificationsResponse>(`/users/notifications${query.toString() ? `?${query.toString()}` : ''}`);
  }

  static async markAsRead(id: string): Promise<{ status: string; message: string; }> {
    return await apiService.patch(`/users/notifications/${id}/read`, {});
  }

  static async markAllAsRead(): Promise<{ status: string; message: string; data: { markedCount: number } }> {
    return await apiService.patch(`/users/notifications/read-all`, {});
  }
}

export default NotificationService;



