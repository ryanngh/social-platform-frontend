import api from '../lib/axios';
import type {
  NotificationPageResponse,
  UnreadCountResponse,
  NotificationSettings,
  UpdateNotificationSettingsRequest,
} from '../types';

export const notificationService = {
  /**
   * Lấy danh sách thông báo phân trang bằng cursor
   */
  async getFeed(cursor?: string | null, limit: number = 20): Promise<NotificationPageResponse> {
    const params: Record<string, string | number> = { limit };
    if (cursor) {
      params.cursor = cursor;
    }
    const response = await api.get<NotificationPageResponse>('/notifications', { params });
    return response.data;
  },

  /**
   * Lấy số lượng thông báo chưa đọc
   */
  async getUnreadCount(): Promise<UnreadCountResponse> {
    const response = await api.get<UnreadCountResponse>('/notifications/unread-count');
    return response.data;
  },

  /**
   * Đánh dấu một thông báo là đã đọc
   */
  async markAsRead(id: string): Promise<{ success: boolean }> {
    const response = await api.patch<{ success: boolean }>(`/notifications/${id}/read`);
    return response.data;
  },

  /**
   * Đánh dấu tất cả thông báo là đã đọc
   */
  async markAllAsRead(): Promise<{ success: boolean }> {
    const response = await api.post<{ success: boolean }>('/notifications/mark-all-read');
    return response.data;
  },

  /**
   * Lấy cài đặt nhận thông báo
   */
  async getSettings(): Promise<NotificationSettings> {
    const response = await api.get<NotificationSettings>('/notifications/settings');
    return response.data;
  },

  /**
   * Cập nhật cài đặt nhận thông báo
   */
  async updateSettings(data: UpdateNotificationSettingsRequest): Promise<NotificationSettings> {
    const response = await api.put<NotificationSettings>('/notifications/settings', data);
    return response.data;
  },
};
