import { useState, useCallback, useEffect, useRef } from 'react';
import type { PostResponse, FeedResponse } from '../types';
import { postService } from '../services/postService';

export type FeedTabType = 'for-you' | 'following' | 'trending';

export interface UseFeedOptions {
  tab?: FeedTabType;
  limit?: number;
  autoFetch?: boolean;
}

export function useFeed({
  tab = 'for-you',
  limit = 10,
  autoFetch = true,
}: UseFeedOptions = {}) {
  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [loadMoreError, setLoadMoreError] = useState<boolean>(false);

  // Keep track of current tab inside refs to prevent race conditions during async operations
  const currentTabRef = useRef(tab);
  currentTabRef.current = tab;

  // 1. Tải mới hoặc Refresh Feed (Pull-to-refresh / F5 / Đổi Tab)
  // Quy tắc chuẩn: Tuyệt đối KHÔNG gửi sessionId và cursor khi làm mới
  const refreshFeed = useCallback(async () => {
    const activeTab = currentTabRef.current;
    setIsRefreshing(true);
    setError(null);
    setLoadMoreError(false);

    try {
      let response: FeedResponse;
      if (activeTab === 'following') {
        response = await postService.getFollowingFeed({ limit });
      } else if (activeTab === 'trending') {
        response = await postService.getTrendingFeed({ limit });
      } else {
        response = await postService.getFeed({ limit });
      }

      // Only update state if the tab hasn't changed while request was in flight
      if (currentTabRef.current === activeTab) {
        setPosts(response.content || []);
        setSessionId(response.sessionId);
        setNextCursor(response.nextCursor);
        setHasMore(response.hasMore);
      }
    } catch (err: unknown) {
      if (currentTabRef.current === activeTab) {
        const fetchError = err instanceof Error ? err : new Error('Failed to fetch feed');
        setError(fetchError);
        console.error('Lỗi khi làm mới bảng tin:', err);
      }
    } finally {
      if (currentTabRef.current === activeTab) {
        setIsRefreshing(false);
        setIsLoading(false);
      }
    }
  }, [limit]);

  // 2. Cuộn tải trang tiếp theo (Infinite Scroll Load More)
  const loadMore = useCallback(async () => {
    const activeTab = currentTabRef.current;
    // For personalized / trending feeds, sessionId is required. For following feed, sessionId is null (cursor-based pagination)
    const isSessionRequired = activeTab !== 'following';
    if (isLoadingMore || !hasMore || !nextCursor || (isSessionRequired && !sessionId)) {
      return;
    }

    setIsLoadingMore(true);
    setLoadMoreError(false);

    try {
      let response: FeedResponse;
      if (activeTab === 'following') {
        response = await postService.getFollowingFeed({
          limit,
          cursor: nextCursor,
        });
      } else if (activeTab === 'trending') {
        response = await postService.getTrendingFeed({
          limit,
          sessionId: sessionId || undefined,
          cursor: nextCursor,
        });
      } else {
        response = await postService.getFeed({
          limit,
          sessionId: sessionId || undefined,
          cursor: nextCursor,
        });
      }

      if (currentTabRef.current === activeTab) {
        setPosts((prevPosts) => {
          const existingIds = new Set(prevPosts.map((p) => p.id));
          const newUniquePosts = (response.content || []).filter((p) => !existingIds.has(p.id));
          return [...prevPosts, ...newUniquePosts];
        });
        setNextCursor(response.nextCursor);
        setHasMore(response.hasMore);
      }
    } catch (err) {
      if (currentTabRef.current === activeTab) {
        setLoadMoreError(true);
        console.error('Lỗi khi tải thêm bài viết:', err);
      }
    } finally {
      if (currentTabRef.current === activeTab) {
        setIsLoadingMore(false);
      }
    }
  }, [isLoadingMore, hasMore, nextCursor, sessionId, limit]);

  // Helper: Thêm bài viết mới vào đầu danh sách (khi user đăng bài)
  const addPost = useCallback((newPost: PostResponse) => {
    setPosts((prev) => [newPost, ...prev.filter((p) => p.id !== newPost.id)]);
  }, []);

  // Helper: Cập nhật bài viết trong feed (khi user like, comment, repost, edit)
  const updatePost = useCallback((updatedPost: PostResponse) => {
    setPosts((prev) =>
      prev.map((post) => (post.id === updatedPost.id ? { ...post, ...updatedPost } : post))
    );
  }, []);

  // Helper: Xóa bài viết khỏi feed
  const deletePost = useCallback((postId: string) => {
    setPosts((prev) => prev.filter((post) => post.id !== postId));
  }, []);

  // Khi thay đổi Tab: Reset trạng thái và fetch lại
  useEffect(() => {
    if (!autoFetch) return;
    setIsLoading(true);
    setPosts([]);
    setSessionId(null);
    setNextCursor(null);
    setHasMore(true);
    setError(null);
    setLoadMoreError(false);

    refreshFeed();
  }, [tab, autoFetch, refreshFeed]);

  return {
    posts,
    sessionId,
    nextCursor,
    hasMore,
    isLoading,
    isLoadingMore,
    isRefreshing,
    error,
    loadMoreError,
    refreshFeed,
    loadMore,
    addPost,
    updatePost,
    deletePost,
  };
}
