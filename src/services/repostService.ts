import api from '../lib/axios';
import type {
  RepostToggleResponse,
  RepostUserEntry,
  UserRepostEntry,
  SliceResponse,
} from '../types';

export const repostService = {
  /** POST /posts/{postId}/reposts — Repost một bài viết (có caption tùy chọn) */
  async repost(postId: string, caption?: string): Promise<RepostToggleResponse> {
    const response = await api.post<RepostToggleResponse>(`/posts/${postId}/reposts`, {
      caption: caption || undefined,
    });
    return response.data;
  },

  /** DELETE /posts/{postId}/reposts — Hủy repost */
  async unrepost(postId: string): Promise<RepostToggleResponse> {
    const response = await api.delete<RepostToggleResponse>(`/posts/${postId}/reposts`);
    return response.data;
  },

  /** GET /posts/{postId}/reposts — Danh sách người đã repost bài */
  async getReposters(
    postId: string,
    params?: { page?: number; size?: number }
  ): Promise<SliceResponse<RepostUserEntry>> {
    const response = await api.get<SliceResponse<RepostUserEntry>>(
      `/posts/${postId}/reposts`,
      { params }
    );
    return response.data;
  },

  /** GET /users/{userId}/reposts — Danh sách bài user X đã repost */
  async getUserReposts(
    userId: string,
    params?: { page?: number; size?: number }
  ): Promise<SliceResponse<UserRepostEntry>> {
    const response = await api.get<SliceResponse<UserRepostEntry>>(
      `/users/${userId}/reposts`,
      { params }
    );
    return response.data;
  },

  /** GET /users/me/reposts — Danh sách bài mình đã repost */
  async getMyReposts(
    params?: { page?: number; size?: number }
  ): Promise<SliceResponse<UserRepostEntry>> {
    const response = await api.get<SliceResponse<UserRepostEntry>>('/users/me/reposts', { params });
    return response.data;
  },

  /** PATCH /posts/{postId}/reposts — Cập nhật caption repost (truyền caption: null để xóa) */
  async updateCaption(postId: string, caption: string | null): Promise<UserRepostEntry> {
    const response = await api.patch<UserRepostEntry>(`/posts/${postId}/reposts`, {
      caption,
    });
    return response.data;
  },
};
