export interface ExploreMedia {
  id: string;
  url: string;
  mediaType: 'IMAGE' | 'VIDEO' | 'GIF';
  aspectRatio?: number;
  hasMultipleMedia: boolean;
  mediaCount: number;
}

export interface ExploreMetrics {
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  bookmarksCount: number;
}

export interface ExploreAuthor {
  id: string;
  username: string;
  fullName: string;
  avatarUrl?: string | null;
  isVerified: boolean;
}

export interface ExplorePost {
  id: string;
  caption?: string;
  createdAt: string;
  media: ExploreMedia;
  metrics: ExploreMetrics;
  author: ExploreAuthor;
  isLiked?: boolean;
  isSaved?: boolean;
}

export interface ExploreTrendingHashtag {
  tag: string;
  postCount: number;
}

export interface ExploreFeedData {
  items: ExplorePost[];
  trendingHashtags: ExploreTrendingHashtag[];
  page: number;
  size: number;
  hasMore: boolean;
}

export interface ExploreQueryParams {
  mediaType?: 'ALL' | 'IMAGE' | 'VIDEO';
  hashtag?: string;
  page?: number;
  size?: number;
}
