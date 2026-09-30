// ============================================================
// Search Types & Interfaces
// ============================================================

import type { PostResponse, SliceResponse } from './index';

// User trong kết quả tìm kiếm
export interface UserSearchResult {
  userId: string;
  username: string | null;
  firstName: string;
  lastName: string;
  fullName: string;
  avatarUrl: string | null;
  bio: string | null;
  isVerified: boolean;
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
  isFollower: boolean;
  isMutual: boolean;
}

// Media đính kèm bài viết trong search
export interface PostSearchMedia {
  id: string;
  mediaType: 'IMAGE' | 'VIDEO' | 'GIF';
  mediaUrl: string;
  thumbnailUrl: string | null;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
  displayOrder: number;
}

// Tác giả bài viết tóm tắt
export interface AuthorSummary {
  id: string;
  username: string | null;
  firstName: string;
  lastName: string;
  fullName: string;
  avatarUrl: string | null;
}

// Response cho ô gợi ý tức thì (Instant Typeahead)
export interface TypeaheadSearchResponse {
  users: UserSearchResult[];
  recentSearches: string[];
}

// Response cho trang tìm kiếm tổng hợp (Universal Search)
export interface UniversalSearchResponse {
  topUsers: UserSearchResult[];
  posts: PostResponse[];
}

// Bản ghi lịch sử tìm kiếm (Search History Item)
export interface SearchHistoryItem {
  id: string;
  keyword: string;
  createdAt: string;
}

export type { SliceResponse };
