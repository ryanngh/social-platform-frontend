import api from '../lib/axios';
import type { ApiResponse, ExploreFeedData, ExploreQueryParams } from '../types';

export const exploreService = {
  /**
   * Lấy danh sách bài viết trên lưới khám phá kèm các hashtag xu hướng
   * GET /api/explore
   */
  async getExploreFeed(params?: ExploreQueryParams): Promise<ExploreFeedData> {
    const cleanHashtag = params?.hashtag ? params.hashtag.trim().replace(/^#/, '') : undefined;
    const mediaType = params?.mediaType && params.mediaType !== 'ALL' ? params.mediaType : undefined;

    const response = await api.get<ApiResponse<ExploreFeedData> | ExploreFeedData>('/api/explore', {
      params: {
        mediaType,
        hashtag: cleanHashtag,
        page: params?.page ?? 0,
        size: params?.size ?? 20,
      },
    });

    if (response.data && typeof response.data === 'object' && 'data' in response.data && response.data.data) {
      return response.data.data;
    }
    return response.data as ExploreFeedData;
  },
};
