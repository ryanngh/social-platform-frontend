import api from '../lib/axios';
import type { ApiResponse, ExploreFeedData, ExploreQueryParams } from '../types';

const EMPTY_EXPLORE_FEED: ExploreFeedData = {
  items: [],
  trendingHashtags: [],
  page: 0,
  size: 20,
  hasMore: false,
};

export const exploreService = {
  /**
   * Lấy danh sách bài viết trên lưới khám phá kèm các hashtag xu hướng
   * GET /explore
   */
  async getExploreFeed(params?: ExploreQueryParams): Promise<ExploreFeedData> {
    const cleanHashtag = params?.hashtag ? params.hashtag.trim().replace(/^#/, '') : undefined;
    const mediaType = params?.mediaType && params.mediaType !== 'ALL' ? params.mediaType : undefined;

    try {
      const response = await api.get<ApiResponse<ExploreFeedData> | ExploreFeedData>('/explore', {
        params: {
          mediaType,
          hashtag: cleanHashtag,
          page: params?.page ?? 0,
          size: params?.size ?? 20,
        },
      });

      let rawData: unknown = response.data;
      if (rawData && typeof rawData === 'object' && 'data' in rawData && (rawData as { data: unknown }).data) {
        rawData = (rawData as { data: unknown }).data;
      }

      if (rawData && typeof rawData === 'object' && Array.isArray((rawData as ExploreFeedData).items)) {
        return rawData as ExploreFeedData;
      }

      return EMPTY_EXPLORE_FEED;
    } catch (err) {
      console.error('getExploreFeed error:', err);
      return EMPTY_EXPLORE_FEED;
    }
  },
};
