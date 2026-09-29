import api from '../lib/axios';
import type { CloseFriendResponse, PaginatedResponse, PaginationParams } from '../types';

export const closeFriendService = {
  /**
   * Thêm người dùng vào danh sách Bạn thân (Close Friends)
   * POST /close-friends/{friendId}
   */
  async addCloseFriend(friendId: string): Promise<CloseFriendResponse> {
    const response = await api.post<CloseFriendResponse>(`/close-friends/${friendId}`);
    return response.data;
  },

  /**
   * Xóa người dùng khỏi danh sách Bạn thân
   * DELETE /close-friends/{friendId}
   */
  async removeCloseFriend(friendId: string): Promise<void> {
    await api.delete(`/close-friends/${friendId}`);
  },

  /**
   * Lấy danh sách Bạn thân (phân trang)
   * GET /close-friends?page=0&size=20
   */
  async getCloseFriends(params?: PaginationParams): Promise<PaginatedResponse<CloseFriendResponse>> {
    const response = await api.get<PaginatedResponse<CloseFriendResponse>>('/close-friends', { params });
    return response.data;
  },

  /**
   * Kiểm tra nhanh xem 1 người dùng có nằm trong danh sách bạn thân không
   */
  async checkIsCloseFriend(friendId: string): Promise<boolean> {
    try {
      const data = await this.getCloseFriends({ page: 0, size: 100 });
      return (data.content || []).some(
        (item) => item.friend?.id === friendId || item.id === friendId
      );
    } catch (err) {
      console.warn('Failed to check close friend status:', err);
      return false;
    }
  },
};
