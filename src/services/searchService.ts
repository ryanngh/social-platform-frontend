import api from '../lib/axios';
import type {
  TypeaheadSearchResponse,
  UniversalSearchResponse,
  UserSearchResult,
  PostResponse,
  SliceResponse,
  SearchHistoryItem,
} from '../types';

export const searchService = {
  /**
   * Gợi ý tức thì khi gõ phím (Instant Typeahead / Autocomplete)
   * GET /search/typeahead?q={query}&limit={limit}
   */
  async getTypeahead(query: string, limit = 6): Promise<TypeaheadSearchResponse> {
    const response = await api.get<TypeaheadSearchResponse>('/search/typeahead', {
      params: { q: query, limit },
    });
    return response.data;
  },

  /**
   * Tìm kiếm tổng hợp Universal Search (Top Users + Posts)
   * GET /search?q={query}&userLimit={userLimit}&postLimit={postLimit}
   */
  async getUniversalSearch(
    query: string,
    userLimit = 5,
    postLimit = 10
  ): Promise<UniversalSearchResponse> {
    const response = await api.get<UniversalSearchResponse>('/search', {
      params: { q: query, userLimit, postLimit },
    });
    return response.data;
  },

  /**
   * Tìm kiếm Người dùng phân trang (User Search - Slice/Infinite)
   * GET /search/users?q={query}&page={page}&size={size}
   */
  async searchUsersPaged(
    query: string,
    page = 0,
    size = 10
  ): Promise<SliceResponse<UserSearchResult>> {
    const response = await api.get<SliceResponse<UserSearchResult>>('/search/users', {
      params: { q: query, page, size },
    });
    return response.data;
  },

  /**
   * Tìm kiếm Bài viết phân trang (Post Search - Slice/Infinite)
   * GET /search/posts?q={query}&page={page}&size={size}
   */
  async searchPostsPaged(
    query: string,
    page = 0,
    size = 10
  ): Promise<SliceResponse<PostResponse>> {
    const response = await api.get<SliceResponse<PostResponse>>('/search/posts', {
      params: { q: query, page, size },
    });
    return response.data;
  },

  /**
   * Lấy lịch sử tìm kiếm gần đây của người dùng
   * GET /search/history?limit={limit}
   */
  async getHistory(limit = 10): Promise<SearchHistoryItem[]> {
    const response = await api.get<SearchHistoryItem[]>('/search/history', {
      params: { limit },
    });
    return response.data;
  },

  /**
   * Xóa 1 từ khóa khỏi lịch sử tìm kiếm
   * DELETE /search/history/{id}
   */
  async deleteHistoryItem(id: string): Promise<void> {
    await api.delete(`/search/history/${id}`);
  },

  /**
   * Xóa toàn bộ lịch sử tìm kiếm của người dùng
   * DELETE /search/history
   */
  async clearAllHistory(): Promise<void> {
    await api.delete('/search/history');
  },
};
