import React, { useState, useEffect, useRef, useCallback } from 'react';
import PostComposer from '../components/feed/PostComposer';
import StoriesCarousel from '../components/feed/StoriesCarousel';
import FeedTabs, { type FeedTabId } from '../components/feed/FeedTabs';
import FeedEmptyState from '../components/feed/FeedEmptyState';
import FeedAllCaughtUpState from '../components/feed/FeedAllCaughtUpState';
import FeedNetworkErrorState from '../components/feed/FeedNetworkErrorState';
import FeedSkeleton from '../components/feed/FeedSkeleton';
import PostCard from '../components/post/PostCard';
import CreatePostModal from '../components/feed/CreatePostModal';
import PostMediaLightbox from '../components/post/PostMediaLightbox';
import { useFeed } from '../hooks/useFeed';
import { postService } from '../services/postService';
import type { PostResponse, PostMediaRequest, PostVisibility } from '../types';
import { Loader2, ArrowUp, RotateCw } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import toast from 'react-hot-toast';
import type { FeedTabType } from '../hooks/useFeed';

interface FeedPageProps {
  defaultTab?: FeedTabType;
}

const FeedPage: React.FC<FeedPageProps> = ({ defaultTab = 'for-you' }) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<FeedTabId>(
    defaultTab === 'trending' ? 'for-you' : (defaultTab as FeedTabId)
  );
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Listen to open-create-post from mobile bottom bar
  useEffect(() => {
    const handleOpenModal = () => setIsCreateModalOpen(true);
    window.addEventListener('open-create-post', handleOpenModal);
    return () => window.removeEventListener('open-create-post', handleOpenModal);
  }, []);

  // Lightbox Modal State
  const [lightboxState, setLightboxState] = useState<{
    isOpen: boolean;
    post: PostResponse | null;
    initialIndex: number;
  }>({
    isOpen: false,
    post: null,
    initialIndex: 0,
  });

  const effectiveTab: FeedTabType = defaultTab === 'trending' ? 'trending' : activeTab;

  // Feed Hook with cursor pagination & session snapshot
  const {
    posts,
    hasMore,
    isLoading,
    isLoadingMore,
    error,
    loadMoreError,
    refreshFeed,
    loadMore,
    addPost,
    updatePost,
    deletePost,
  } = useFeed({
    tab: effectiveTab,
    limit: 10,
  });

  // IntersectionObserver Sentinel for Infinite Scroll
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!sentinelRef.current || !hasMore || isLoading || isLoadingMore || loadMoreError) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      {
        rootMargin: '400px 0px', // Pre-fetch before user reaches absolute bottom
        threshold: 0.1,
      }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, isLoading, isLoadingMore, loadMoreError, loadMore]);

  // Scroll to Top Listener
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 600) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Lightbox Handlers
  const handleOpenLightbox = useCallback((post: PostResponse, mediaIndex: number) => {
    setLightboxState({
      isOpen: true,
      post,
      initialIndex: mediaIndex,
    });
  }, []);

  const handleCloseLightbox = useCallback(() => {
    setLightboxState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  // Submit new post to server & prepend to feed
  const handleCreatePost = async (
    content: string,
    media?: PostMediaRequest[],
    visibility?: PostVisibility
  ) => {
    try {
      const newPost = await postService.createPost({
        content,
        media,
        visibility: visibility || 'PUBLIC',
      });
      addPost(newPost);
      toast.success(t('feed.postSuccess'));
      scrollToTop();
    } catch (err) {
      console.error('Failed to create post:', err);
      toast.error(t('feed.postEmptyError'));
      throw err;
    }
  };

  return (
    <div className="flex flex-col gap-4 pb-12 relative">
      {/* 1. Post Composer Box */}
      <PostComposer onOpenCreateModal={() => setIsCreateModalOpen(true)} />

      {/* 2. Stories Carousel */}
      <StoriesCarousel />

      {/* 3. Feed Tab Selector (For You | Following) */}
      {defaultTab !== 'trending' && (
        <FeedTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      )}

      {/* 4. Main Feed Stream */}
      {/* State: Initial Loading Skeleton */}
      {isLoading && posts.length === 0 && <FeedSkeleton />}

      {/* State: Network Error on Initial Load */}
      {!isLoading && error && posts.length === 0 && (
        <FeedNetworkErrorState onRetry={refreshFeed} />
      )}

      {/* State: Empty Feed */}
      {!isLoading && !error && posts.length === 0 && <FeedEmptyState />}

      {/* State: Posts Render List */}
      {posts.length > 0 && (
        <div className="flex flex-col gap-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onOpenLightbox={handleOpenLightbox}
              onPostUpdated={updatePost}
              onPostDeleted={deletePost}
            />
          ))}
        </div>
      )}

      {/* 5. Infinite Scroll Sentinel & Load More States */}
      {posts.length > 0 && (
        <div ref={sentinelRef} className="py-2 flex flex-col items-center justify-center">
          {isLoadingMore && (
            <div className="flex items-center gap-2 py-4 text-xs font-semibold text-gray-500 dark:text-[#A8A8A8] animate-fadeIn">
              <Loader2 className="w-4 h-4 animate-spin text-[#004AC6] dark:text-[#0095F6]" />
              <span>{t('common.loading')}</span>
            </div>
          )}

          {loadMoreError && (
            <div className="py-4 text-center">
              <p className="text-xs text-rose-500 mb-2">{t('feed.loadMoreError')}</p>
              <button
                type="button"
                onClick={loadMore}
                className="px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#004AC6] dark:text-[#0095F6] text-xs font-semibold hover:bg-blue-100 transition flex items-center gap-1.5 mx-auto cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>{t('feed.tapToRetry')}</span>
              </button>
            </div>
          )}

          {!hasMore && !isLoading && !isLoadingMore && (
            <div className="w-full mt-2">
              <FeedAllCaughtUpState />
            </div>
          )}
        </div>
      )}

      {/* 6. Floating Scroll to Top Button */}
      {showScrollTop && (
        <button
          type="button"
          onClick={scrollToTop}
          className="fixed bottom-20 md:bottom-8 right-6 z-30 w-11 h-11 rounded-full bg-[#004AC6] hover:bg-[#003A9F] dark:bg-[#0095F6] dark:hover:bg-[#1877F2] text-white shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer animate-fadeIn"
          title={t('feed.allCaughtUp')}
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-5 h-5 stroke-[2.5]" />
        </button>
      )}

      {/* 7. Create Post Modal */}
      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmitPost={handleCreatePost}
      />

      {/* 8. Global Post Media Lightbox */}
      {lightboxState.isOpen && lightboxState.post && (
        <PostMediaLightbox
          post={lightboxState.post}
          initialMediaIndex={lightboxState.initialIndex}
          isOpen={lightboxState.isOpen}
          onClose={handleCloseLightbox}
          onPostUpdated={updatePost}
          onPostDeleted={deletePost}
        />
      )}
    </div>
  );
};

export default FeedPage;
