import api from '../lib/axios';
import type { SuggestedUser } from '../types';

export const suggestedUserService = {
  /**
   * Lấy danh sách gợi ý tài khoản đáng theo dõi (Who to Follow / Suggested For You)
   * GET /users/suggested?limit={limit}
   */
  async getSuggestedUsers(limit = 10): Promise<SuggestedUser[]> {
    const response = await api.get<SuggestedUser[]>('/users/suggested', {
      params: { limit },
    });
    return response.data;
  },

  /**
   * Bỏ qua gợi ý theo dõi (Dismiss Recommendation)
   * POST /users/suggested/{targetUserId}/dismiss
   */
  async dismissSuggestedUser(targetUserId: string): Promise<void> {
    await api.post(`/users/suggested/${targetUserId}/dismiss`);
  },
};
