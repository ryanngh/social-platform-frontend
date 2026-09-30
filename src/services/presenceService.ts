import api from '../lib/axios';
import type { UserPresence, BatchPresenceRequest, BatchPresenceResponse } from '../types';

export const presenceService = {
  /**
   * Lấy trạng thái Presence của 1 người dùng cụ thể
   * GET /presence/{userId}
   */
  async getPresence(userId: string): Promise<UserPresence> {
    const response = await api.get<UserPresence>(`/presence/${userId}`);
    return response.data;
  },

  /**
   * Lấy trạng thái Presence hàng loạt (Batch Query)
   * POST /presence/batch
   */
  async getBatchPresence(userIds: string[]): Promise<BatchPresenceResponse> {
    if (!userIds || userIds.length === 0) {
      return {};
    }
    const payload: BatchPresenceRequest = { userIds };
    const response = await api.post<BatchPresenceResponse>('/presence/batch', payload);
    return response.data;
  },

  /**
   * Định dạng thời gian Last Seen sang chuỗi thân thiện với người dùng
   * @param epochSeconds Thời gian Unix timestamp tính bằng giây
   * @param language Ngôn ngữ 'vi' | 'en'
   */
  formatLastSeen(epochSeconds?: number | null, language: string = 'vi'): string {
    if (!epochSeconds) {
      return language === 'vi' ? 'Ngoại tuyến' : 'Offline';
    }

    const nowSeconds = Math.floor(Date.now() / 1000);
    const diff = Math.max(0, nowSeconds - epochSeconds);

    if (diff < 60) {
      return language === 'vi' ? 'Vừa mới truy cập' : 'Just now';
    }
    if (diff < 3600) {
      const mins = Math.floor(diff / 60);
      return language === 'vi'
        ? `Hoạt động ${mins} phút trước`
        : `Active ${mins}m ago`;
    }
    if (diff < 86400) {
      const hours = Math.floor(diff / 3600);
      return language === 'vi'
        ? `Hoạt động ${hours} giờ trước`
        : `Active ${hours}h ago`;
    }
    if (diff < 604800) {
      const days = Math.floor(diff / 86400);
      return language === 'vi'
        ? `Hoạt động ${days} ngày trước`
        : `Active ${days}d ago`;
    }

    const date = new Date(epochSeconds * 1000);
    return language === 'vi'
      ? `Hoạt động ${date.toLocaleDateString('vi-VN')}`
      : `Active on ${date.toLocaleDateString('en-US')}`;
  },
};
