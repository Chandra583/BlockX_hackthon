import { apiService } from '../services/api';

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
  actionLabel?: string;
}

export interface AdminActivity {
  id: string;
  title: string;
  subtext: string;
  icon: string;
  entityType: string;
  entityId: string | null;
  createdAt: string;
  type: string;
  actionUrl?: string;
}

export interface AdminNotificationsResponse {
  status: string;
  message: string;
  data: {
    notifications: AdminNotification[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalNotifications: number;
      limit: number;
    };
    unreadCount: number;
  };
}

export interface AdminActivityResponse {
  status: string;
  message: string;
  data: {
    activity: AdminActivity[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      limit: number;
    };
  };
}

export class AdminNotificationService {
  /**
   * Get admin notifications
   */
  static async getNotifications(params?: { 
    page?: number; 
    limit?: number; 
    unread?: boolean 
  }): Promise<AdminNotificationsResponse> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.unread) query.set('unread', 'true');
    
    return await apiService.get<AdminNotificationsResponse>(
      `/admin/notifications${query.toString() ? `?${query.toString()}` : ''}`
    );
  }

  /**
   * Mark admin notification as read
   */
  static async markAsRead(id: string): Promise<{ status: string; message: string }> {
    return await apiService.post(`/admin/notifications/${id}/read`, {});
  }

  /**
   * Mark all admin notifications as read
   */
  static async markAllAsRead(): Promise<{ 
    status: string; 
    message: string; 
    data: { markedCount: number } 
  }> {
    return await apiService.post(`/admin/notifications/read-all`, {});
  }

  /**
   * Get admin activity feed
   */
  static async getActivity(params?: { 
    page?: number; 
    limit?: number 
  }): Promise<AdminActivityResponse> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    
    return await apiService.get<AdminActivityResponse>(
      `/admin/activity${query.toString() ? `?${query.toString()}` : ''}`
    );
  }
}

export default AdminNotificationService;
