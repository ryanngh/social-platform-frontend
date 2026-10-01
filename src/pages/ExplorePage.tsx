import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  Compass,
  RotateCcw,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '../contexts/LanguageContext';
import { useExploreFeed } from '../hooks/useExploreFeed';
import { useSuggestedUsers } from '../hooks/useSuggestedUsers';
import { useTrendingHashtags } from '../hooks/useTrending';
import type { ExplorePost, ExploreFeedData } from '../types';
import { ExploreGrid } from '../components/explore/ExploreGrid';
import { ExploreHeader } from '../components/explore/ExploreHeader';
import { ExploreSkeleton } from '../components/explore/ExploreSkeleton';
import { ExploreDetailModal } from '../components/explore/ExploreDetailModal';

export const ExplorePage: React.FC = () => {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  // Read initial query params from URL
  const initialMediaType = (searchParams.get('mediaType')?.toUpperCase() as 'ALL' | 'IMAGE' | 'VIDEO') || 'ALL';
  const initialHashtag = searchParams.get('hashtag') || '';
  const initialSearch = searchParams.get('q') || '';

  const [selectedMediaType, setSelectedMediaType] = useState<'ALL' | 'IMAGE' | 'VIDEO'>(
    ['ALL', 'IMAGE', 'VIDEO'].includes(initialMediaType) ? initialMediaType : 'ALL'
  );
  const [selectedHashtag, setSelectedHashtag] = useState<string | undefined>(
    initialHashtag ? initialHashtag.replace(/^#/, '') : undefined
  );
  const [searchQuery, setSearchQuery] = useState(initialSearch);

  // Selected Post for Detail Lightbox Modal
  const [activeModalPost, setActiveModalPost] = useState<ExplorePost | null>(null);

  // Fetch Explore Feed API via React Query infinite query
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useExploreFeed(selectedMediaType, selectedHashtag, 20);

  // Fetch Suggested Creators & Trending Topics fallback
  const { data: suggestedUsers, toggleFollow: toggleFollowUser } = useSuggestedUsers(6);
  const { data: fallbackTrending } = useTrendingHashtags(10);

  // Sync state changes to URL search params
  const updateUrlParams = useCallback(
    (media: 'ALL' | 'IMAGE' | 'VIDEO', tag?: string, query?: string) => {
      const nextParams = new URLSearchParams();
      if (media !== 'ALL') nextParams.set('mediaType', media);
      if (tag) nextParams.set('hashtag', tag);
      if (query?.trim()) nextParams.set('q', query.trim());
      setSearchParams(nextParams, { replace: true });
    },
    [setSearchParams]
  );

  const handleMediaTypeChange = (media: 'ALL' | 'IMAGE' | 'VIDEO') => {
    setSelectedMediaType(media);
    updateUrlParams(media, selectedHashtag, searchQuery);
  };

  const handleHashtagSelect = (tag: string | null) => {
    const cleanTag = tag ? tag.trim().replace(/^#/, '') : undefined;
    setSelectedHashtag(cleanTag);
    updateUrlParams(selectedMediaType, cleanTag, searchQuery);
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    updateUrlParams(selectedMediaType, selectedHashtag, val);
  };

  // Flattened posts from all infinite pages
  const allPosts = useMemo(() => {
    return (
      data?.pages?.flatMap((page) => (page && Array.isArray(page.items) ? page.items : [])) || []
    ).filter((post): post is ExplorePost => Boolean(post && post.id));
  }, [data]);

  // Trending hashtags from Explore response or fallback hook
  const trendingHashtags = useMemo(() => {
    const fromExplore = data?.pages?.[0]?.trendingHashtags;
    if (fromExplore && Array.isArray(fromExplore) && fromExplore.length > 0) return fromExplore;
    if (fallbackTrending && fallbackTrending.length > 0) {
      return fallbackTrending.map((t) => ({ tag: t.tag, postCount: t.postCount || 0 }));
    }
    return [];
  }, [data, fallbackTrending]);

  // Client-side text filter for instant search responsiveness
  const filteredPosts = useMemo(() => {
    if (!searchQuery.trim()) return allPosts;
    const q = searchQuery.toLowerCase().trim();

    return allPosts.filter((post) => {
      if (!post) return false;
      const matchCaption = post.caption?.toLowerCase().includes(q);
      const matchAuthorName = post.author?.fullName?.toLowerCase().includes(q);
      const matchAuthorUser = post.author?.username?.toLowerCase().includes(q);
      return Boolean(matchCaption || matchAuthorName || matchAuthorUser);
    });
  }, [allPosts, searchQuery]);

  // Infinite Scroll Sentinel observer
  const loadMoreRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.2, rootMargin: '200px' }
    );

    const currentTarget = loadMoreRef.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) observer.unobserve(currentTarget);
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  // Handle follow creator toggle
  const handleToggleFollowUser = async (userId: string, isFollowing: boolean) => {
    try {
      await toggleFollowUser({ userId, isFollowing });
      toast.success(isFollowing ? 'Đã hủy theo dõi' : 'Đã theo dõi người dùng');
    } catch (err) {
      toast.error('Không thể cập nhật theo dõi');
      console.error(err);
    }
  };

  // Sync Likes in Query Cache
  const handleToggleLike = (postId: string, isLiked: boolean, likesCount: number) => {
    queryClient.setQueriesData<{ pages: ExploreFeedData[]; pageParams: number[] }>(
      { queryKey: ['explore', 'feed'] },
      (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            items: (page.items || []).map((item) =>
              item.id === postId
                ? {
                    ...item,
                    isLiked,
                    metrics: {
                      ...item.metrics,
                      likesCount,
                    },
                  }
                : item
            ),
          })),
        };
      }
    );

    if (activeModalPost && activeModalPost.id === postId) {
      setActiveModalPost((prev) =>
        prev
          ? {
              ...prev,
              isLiked,
              metrics: { ...prev.metrics, likesCount },
            }
          : null
      );
    }
  };

  // Sync Saves in Query Cache
  const handleToggleSave = (postId: string, isSaved: boolean) => {
    queryClient.setQueriesData<{ pages: ExploreFeedData[]; pageParams: number[] }>(
      { queryKey: ['explore', 'feed'] },
      (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            items: (page.items || []).map((item) =>
              item.id === postId ? { ...item, isSaved } : item
            ),
          })),
        };
      }
    );

    if (activeModalPost && activeModalPost.id === postId) {
      setActiveModalPost((prev) => (prev ? { ...prev, isSaved } : null));
    }
  };

  // Update post in modal
  const handlePostUpdate = (updatedFields: Partial<ExplorePost>) => {
    if (activeModalPost) {
      const updated = {
        ...activeModalPost,
        ...updatedFields,
      };
      setActiveModalPost(updated);

      if (updatedFields.isLiked !== undefined && updatedFields.metrics?.likesCount !== undefined) {
        handleToggleLike(activeModalPost.id, updatedFields.isLiked, updatedFields.metrics.likesCount);
      }
    }
  };

  return (
    <div className="space-y-4 pb-12">
      {/* 1. Exploration Header Bar & Filters */}
      <ExploreHeader
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        selectedMediaType={selectedMediaType}
        onMediaTypeChange={handleMediaTypeChange}
        selectedHashtag={selectedHashtag}
        onHashtagSelect={handleHashtagSelect}
        trendingHashtags={trendingHashtags}
        suggestedUsers={suggestedUsers}
        onToggleFollowUser={handleToggleFollowUser}
        totalItemsCount={filteredPosts.length}
      />

      {/* 2. Main Content Area */}
      {isLoading ? (
        <ExploreSkeleton count={6} />
      ) : isError ? (
        <div className="bg-white dark:bg-[#121212] rounded-3xl p-8 sm:p-12 border border-rose-100 dark:border-rose-950/40 text-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-gray-900 dark:text-[#F5F5F5] text-base mb-1">
            Không thể tải nội dung khám phá
          </h3>
          <p className="text-xs text-gray-500 dark:text-[#A8A8A8] max-w-md mx-auto mb-4">
            {error instanceof Error ? error.message : 'Đã có lỗi kết nối tới máy chủ. Vui lòng thử lại.'}
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-[#004AC6] dark:bg-[#0095F6] text-white rounded-xl text-xs font-bold hover:opacity-90 transition cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Thử lại</span>
          </button>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="bg-white dark:bg-[#121212] rounded-3xl p-10 sm:p-14 border border-gray-100 dark:border-[#262626] text-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-[#1C1C1C] text-gray-400 dark:text-[#737373] flex items-center justify-center mx-auto mb-3">
            <Compass className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-gray-900 dark:text-[#F5F5F5] text-base mb-1">
            {t('explore.noResults') || 'Không tìm thấy nội dung phù hợp'}
          </h3>
          <p className="text-xs text-gray-500 dark:text-[#A8A8A8] max-w-sm mx-auto mb-4">
            {t('explore.noResultsDesc') ||
              'Hãy thử tìm kiếm với từ khóa khác hoặc đặt lại bộ lọc để khám phá các nội dung xu hướng mới nhất.'}
          </p>
          {(selectedMediaType !== 'ALL' || selectedHashtag || searchQuery) && (
            <button
              onClick={() => {
                setSelectedMediaType('ALL');
                setSelectedHashtag(undefined);
                setSearchQuery('');
                updateUrlParams('ALL');
              }}
              className="px-4 py-2 bg-[#004AC6] dark:bg-[#0095F6] text-white rounded-xl text-xs font-bold hover:opacity-90 transition cursor-pointer shadow-xs"
            >
              Đặt lại tất cả bộ lọc
            </button>
          )}
        </div>
      ) : (
        <>
          {/* 3. Post Grid (Square Fixed Aspect Ratio) */}
          <ExploreGrid
            posts={filteredPosts}
            onSelect={(post) => setActiveModalPost(post)}
            onToggleLike={handleToggleLike}
            onToggleSave={handleToggleSave}
          />

          {/* 4. Infinite Scroll Sentinel & Loading Indicator */}
          <div ref={loadMoreRef} className="py-6 flex items-center justify-center">
            {isFetchingNextPage ? (
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-[#A8A8A8] bg-white dark:bg-[#181818] px-4 py-2 rounded-full border border-gray-100 dark:border-[#282828] shadow-xs">
                <Loader2 className="w-4 h-4 animate-spin text-[#004AC6] dark:text-[#0095F6]" />
                <span>Đang tải thêm nội dung khám phá...</span>
              </div>
            ) : !hasNextPage && allPosts.length > 0 ? (
              <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-[#737373] py-4">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Bạn đã khám phá hết nội dung mới nhất hôm nay</span>
              </div>
            ) : null}
          </div>
        </>
      )}

      {/* 5. Detail Modal Lightbox */}
      {activeModalPost && (
        <ExploreDetailModal
          post={activeModalPost}
          onClose={() => setActiveModalPost(null)}
          onPostUpdate={handlePostUpdate}
        />
      )}
    </div>
  );
};

export default ExplorePage;
