import api from '../lib/axios';
import type { UserBlockResponse, PaginatedResponse, PaginationParams } from '../types';

export const relationshipService = {
  /**
   * Chặn người dùng (Block User)
   * POST /relationships/blocks/{targetUserId}
   */
  async blockUser(targetUserId: string): Promise<UserBlockResponse> {
    const response = await api.post<UserBlockResponse>(`/relationships/blocks/${targetUserId}`);
    return response.data;
  },

  /**
   * Bỏ chặn người dùng (Unblock User)
   * DELETE /relationships/blocks/{targetUserId}
   */
  async unblockUser(targetUserId: string): Promise<void> {
    await api.delete(`/relationships/blocks/${targetUserId}`);
  },

  /**
   * Lấy danh sách những người mình đã chặn
   * GET /relationships/blocks
   */
  async getBlockedUsers(params?: PaginationParams): Promise<PaginatedResponse<UserBlockResponse>> {
    const response = await api.get<PaginatedResponse<UserBlockResponse>>('/relationships/blocks', { params });
    return response.data;
  },

  /**
   * Kiểm tra nhanh xem targetUserId có nằm trong danh sách mình đã chặn không
   */
  async checkIsBlocked(targetUserId: string): Promise<boolean> {
    try {
      const res = await this.getBlockedUsers({ page: 0, size: 100 });
      return (res.content || []).some(
        (item) => item.blocked?.id === targetUserId || item.id === targetUserId
      );
    } catch (err) {
      console.warn('Failed to check blocked status:', err);
      return false;
    }
  },
};

