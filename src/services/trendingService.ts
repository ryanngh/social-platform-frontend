import api from '../lib/axios';
import type { TrendingHashtag } from '../types';

export const trendingService = {
  /**
   * Lấy danh sách Top Hashtag thịnh hành trong Rolling 7 Days (có Cache Redis phía Backend)
   * GET /hashtags/trending?limit={limit}
   */
  async getTrendingHashtags(limit = 10): Promise<TrendingHashtag[]> {
    const response = await api.get<TrendingHashtag[]>('/hashtags/trending', {
      params: { limit },
    });
    return response.data;
  },
};
