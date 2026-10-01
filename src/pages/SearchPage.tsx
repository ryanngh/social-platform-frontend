import React, { useState, useEffect, useRef, useCallback, Component, type ErrorInfo, type ReactNode } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  Users,
  FileText,
  ArrowRight,
  Loader2,
  X,
  Compass,
  AlertCircle,
  RotateCw,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import {
  useUniversalSearch,
  useInfiniteUserSearch,
  useInfinitePostSearch,
} from '../hooks/useSearch';
import { UserSearchCard } from '../components/search/UserSearchCard';
import { PostCard } from '../components/post/PostCard';
import PostMediaLightbox from '../components/post/PostMediaLightbox';
import type { PostResponse, UserSearchResult } from '../types';
import clsx from 'clsx';

type SearchTab = 'all' | 'users' | 'posts';

// ============================================================
// Robust Error Boundary to guarantee 0 white screens
// ============================================================
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class SearchErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[SearchErrorBoundary] Caught render error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-white dark:bg-[#121212] rounded-3xl p-8 sm:p-12 border border-gray-100 dark:border-[#262626] shadow-sm text-center">
          <div className="w-16 h-16 rounded-3xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-4 shadow-sm">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-base sm:text-lg text-gray-900 dark:text-[#F5F5F5] mb-2">
            Đã có lỗi xảy ra khi hiển thị kết quả tìm kiếm
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-[#A8A8A8] max-w-md mx-auto leading-relaxed mb-6">
            Vui lòng thử lại hoặc làm mới trang để tiếp tục.
          </p>
          <button
            type="button"
            onClick={this.handleRetry}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#004AC6] dark:bg-[#0095F6] text-white rounded-2xl text-xs font-bold shadow-xs hover:opacity-95 transition cursor-pointer"
          >
            <RotateCw className="w-4 h-4" />
            <span>Thử lại</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// ============================================================
// Main Search Page Content Component
// ============================================================
const SearchPageContent: React.FC = () => {
  const { t, language } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();

  const rawQuery = searchParams.get('q') || '';
  const queryFromUrl = rawQuery.trim();
  const tabFromUrl = (searchParams.get('tab') as SearchTab) || 'all';

  const [activeTab, setActiveTab] = useState<SearchTab>(tabFromUrl);
  const [localQuery, setLocalQuery] = useState(rawQuery);

  // Lightbox state for posts
  const [lightboxState, setLightboxState] = useState<{
    isOpen: boolean;
    post: PostResponse | null;
    mediaIndex: number;
  }>({
    isOpen: false,
    post: null,
    mediaIndex: 0,
  });

  // Sync tab & localQuery with URL params
  useEffect(() => {
    setLocalQuery(rawQuery);
  }, [rawQuery]);

  useEffect(() => {
    if (tabFromUrl && ['all', 'users', 'posts'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  const handleTabChange = (newTab: SearchTab) => {
    setActiveTab(newTab);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (newTab === 'all') {
          next.delete('tab');
        } else {
          next.set('tab', newTab);
        }
        return next;
      },
      { replace: true }
    );
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = localQuery.trim();
    if (!trimmed) return;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('q', trimmed);
        return next;
      },
      { replace: true }
    );
  };

  // 1. Data queries
  // Tab "Tất cả"
  const {
    data: universalData,
    isLoading: isLoadingUniversal,
    isError: isUniversalError,
    refetch: refetchUniversal,
  } = useUniversalSearch(queryFromUrl, 5, 10);

  // Tab "Mọi người"
  const {
    data: usersInfiniteData,
    isLoading: isLoadingUsers,
    isError: isUsersError,
    isFetchingNextPage: isFetchingNextUsers,
    hasNextPage: hasNextUsers,
    fetchNextPage: fetchNextUsers,
    refetch: refetchUsers,
  } = useInfiniteUserSearch(queryFromUrl, 10);

  // Tab "Bài viết"
  const {
    data: postsInfiniteData,
    isLoading: isLoadingPosts,
    isError: isPostsError,
    isFetchingNextPage: isFetchingNextPosts,
    hasNextPage: hasNextPosts,
    fetchNextPage: fetchNextPosts,
    refetch: refetchPosts,
  } = useInfinitePostSearch(queryFromUrl, 10);

  // Intersection observers for infinite scroll
  const usersObserverTarget = useRef<HTMLDivElement>(null);
  const postsObserverTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTab !== 'users' || !hasNextUsers || isFetchingNextUsers) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextUsers();
        }
      },
      { threshold: 0.2 }
    );

    const el = usersObserverTarget.current;
    if (el) observer.observe(el);
    return () => {
      if (el) observer.unobserve(el);
    };
  }, [activeTab, hasNextUsers, isFetchingNextUsers, fetchNextUsers]);

  useEffect(() => {
    if (activeTab !== 'posts' || !hasNextPosts || isFetchingNextPosts) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPosts();
        }
      },
      { threshold: 0.2 }
    );

    const el = postsObserverTarget.current;
    if (el) observer.observe(el);
    return () => {
      if (el) observer.unobserve(el);
    };
  }, [activeTab, hasNextPosts, isFetchingNextPosts, fetchNextPosts]);

  const handleOpenLightbox = useCallback((post: PostResponse, mediaIndex: number) => {
    if (!post) return;
    setLightboxState({
      isOpen: true,
      post,
      mediaIndex,
    });
  }, []);

  // Safe normalized lists
  const topUsers: UserSearchResult[] = Array.isArray(universalData?.topUsers)
    ? universalData.topUsers.filter((u): u is UserSearchResult => Boolean(u && (u.userId || u.username)))
    : Array.isArray((universalData as any)?.users)
    ? (universalData as any).users.filter((u: any): u is UserSearchResult => Boolean(u && (u.userId || u.username)))
    : [];

  const universalPosts: PostResponse[] = Array.isArray(universalData?.posts)
    ? universalData.posts.filter((p): p is PostResponse => Boolean(p && p.id && p.author))
    : [];

  const allUsersList: UserSearchResult[] = usersInfiniteData?.pages
    ? usersInfiniteData.pages.flatMap((page) =>
        Array.isArray(page?.content)
          ? page.content.filter((u): u is UserSearchResult => Boolean(u && (u.userId || u.username)))
          : []
      )
    : [];

  const allPostsList: PostResponse[] = postsInfiniteData?.pages
    ? postsInfiniteData.pages.flatMap((page) =>
        Array.isArray(page?.content)
          ? page.content.filter((p): p is PostResponse => Boolean(p && p.id && p.author))
          : []
      )
    : [];

  const hasSearchText = queryFromUrl.length > 0;
  const isUniversalEmpty = hasSearchText && !isLoadingUniversal && !isUniversalError && topUsers.length === 0 && universalPosts.length === 0;

  return (
    <div className="space-y-4 pb-12">
      {/* 1. Page Header & Inline Search Bar */}
      <div className="bg-white dark:bg-[#121212] rounded-3xl p-4 sm:p-5 border border-gray-100 dark:border-[#262626] shadow-sm transition-colors duration-200">
        <form onSubmit={handleSearchSubmit} className="relative mb-3.5">
          <Search className="w-4 h-4 text-gray-400 dark:text-[#737373] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            placeholder={t('search.searchPlaceholder')}
            className="w-full pl-10 pr-24 py-2.5 bg-gray-100/80 dark:bg-[#1A1A1A] border border-transparent dark:border-[#363636] rounded-2xl text-sm text-gray-900 dark:text-[#F5F5F5] placeholder-gray-400 dark:placeholder-[#737373] focus:bg-white dark:focus:bg-[#000000] focus:border-[#004AC6] dark:focus:border-[#0095F6] focus:ring-1 focus:ring-[#004AC6] outline-none transition"
          />

          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {localQuery && (
              <button
                type="button"
                onClick={() => setLocalQuery('')}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition rounded-full cursor-pointer"
                title={t('search.deleteItem')}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="submit"
              className="px-3 py-1 bg-[#004AC6] dark:bg-[#0095F6] text-white rounded-xl text-xs font-bold shadow-xs hover:opacity-95 transition cursor-pointer"
            >
              {language === 'vi' ? 'Tìm' : 'Search'}
            </button>
          </div>
        </form>

        {/* Search Query Info */}
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            {hasSearchText ? (
              <h1 className="text-sm sm:text-base font-bold text-gray-900 dark:text-[#F5F5F5] truncate">
                {language === 'vi' ? 'Kết quả tìm kiếm cho:' : 'Search results for:'}{' '}
                <span className="text-[#004AC6] dark:text-[#0095F6]">"{queryFromUrl}"</span>
              </h1>
            ) : (
              <h1 className="text-sm sm:text-base font-bold text-gray-900 dark:text-[#F5F5F5]">
                {t('search.title')}
              </h1>
            )}
          </div>
        </div>

        {/* Tab Navigation Pill Bar - Clean, Content-First, No Icon Slop */}
        <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-gray-100 dark:border-[#262626] overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => handleTabChange('all')}
            className={clsx(
              'px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap active:scale-95',
              activeTab === 'all'
                ? 'bg-[#004AC6] dark:bg-[#0095F6] text-white shadow-xs font-bold'
                : 'bg-gray-100 dark:bg-[#1A1A1A] text-gray-600 dark:text-[#A8A8A8] hover:bg-gray-200 dark:hover:bg-[#262626]'
            )}
          >
            <span>{t('search.tabs.all')}</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('users')}
            className={clsx(
              'flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap active:scale-95',
              activeTab === 'users'
                ? 'bg-[#004AC6] dark:bg-[#0095F6] text-white shadow-xs font-bold'
                : 'bg-gray-100 dark:bg-[#1A1A1A] text-gray-600 dark:text-[#A8A8A8] hover:bg-gray-200 dark:hover:bg-[#262626]'
            )}
          >
            <span>{t('search.tabs.people')}</span>
            {allUsersList.length > 0 && activeTab === 'users' && (
              <span className="px-1.5 py-0.2 bg-white/20 dark:bg-white/20 rounded-full text-[10px] font-bold">
                {allUsersList.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('posts')}
            className={clsx(
              'flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap active:scale-95',
              activeTab === 'posts'
                ? 'bg-[#004AC6] dark:bg-[#0095F6] text-white shadow-xs font-bold'
                : 'bg-gray-100 dark:bg-[#1A1A1A] text-gray-600 dark:text-[#A8A8A8] hover:bg-gray-200 dark:hover:bg-[#262626]'
            )}
          >
            <span>{t('search.tabs.posts')}</span>
            {allPostsList.length > 0 && activeTab === 'posts' && (
              <span className="px-1.5 py-0.2 bg-white/20 dark:bg-white/20 rounded-full text-[10px] font-bold">
                {allPostsList.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 2. TAB CONTENT: TẤT CẢ (UNIVERSAL SEARCH) */}
      {activeTab === 'all' && (
        <div className="space-y-4">
          {isLoadingUniversal ? (
            <SearchLoadingSkeleton />
          ) : isUniversalError ? (
            <SearchErrorCard onRetry={() => refetchUniversal()} />
          ) : !hasSearchText ? (
            <SearchInitialPrompt t={t} />
          ) : isUniversalEmpty ? (
            <SearchEmptyState query={queryFromUrl} t={t} />
          ) : (
            <>
              {/* Section: Top Matching Users */}
              {topUsers.length > 0 && (
                <section className="bg-white dark:bg-[#121212] rounded-3xl p-4 sm:p-5 border border-gray-100 dark:border-[#262626] shadow-sm transition-colors duration-200">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100 dark:border-[#262626]">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#004AC6] dark:text-[#0095F6]" />
                      <h2 className="text-sm font-bold text-gray-900 dark:text-[#F5F5F5]">
                        {t('search.tabs.people')}
                      </h2>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleTabChange('users')}
                      className="text-xs font-bold text-[#004AC6] dark:text-[#0095F6] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>{t('common.seeAll')}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {topUsers.map((user, idx) => (
                      <UserSearchCard
                        key={user.userId || `top-u-${idx}`}
                        user={user}
                        compact
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Section: Matching Posts */}
              {universalPosts.length > 0 && (
                <section className="space-y-4">
                  <div className="flex items-center gap-2 px-2">
                    <FileText className="w-4 h-4 text-[#004AC6] dark:text-[#0095F6]" />
                    <h2 className="text-sm font-bold text-gray-900 dark:text-[#F5F5F5]">
                      {t('search.tabs.posts')}
                    </h2>
                  </div>

                  {universalPosts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onOpenLightbox={handleOpenLightbox}
                    />
                  ))}
                </section>
              )}
            </>
          )}
        </div>
      )}

      {/* 3. TAB CONTENT: MỌI NGƯỜI (INFINITE USER SEARCH) */}
      {activeTab === 'users' && (
        <div className="space-y-3">
          {isLoadingUsers ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-[#121212] rounded-3xl p-4 border border-gray-100 dark:border-[#262626] animate-pulse flex items-center gap-3.5"
                >
                  <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-[#262626]"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-[#262626] rounded w-1/3"></div>
                    <div className="h-3 bg-gray-200 dark:bg-[#262626] rounded w-1/4"></div>
                  </div>
                  <div className="w-20 h-8 bg-gray-200 dark:bg-[#262626] rounded-xl"></div>
                </div>
              ))}
            </div>
          ) : isUsersError ? (
            <SearchErrorCard onRetry={() => refetchUsers()} />
          ) : !hasSearchText ? (
            <SearchInitialPrompt t={t} />
          ) : allUsersList.length === 0 ? (
            <SearchEmptyState
              query={queryFromUrl}
              t={t}
              subtitle={t('search.noUsersDesc')}
            />
          ) : (
            <>
              {allUsersList.map((user, idx) => (
                <UserSearchCard
                  key={user.userId || `usr-${idx}`}
                  user={user}
                />
              ))}

              {/* Infinite Scroll Trigger */}
              <div ref={usersObserverTarget} className="py-4 text-center">
                {isFetchingNextUsers ? (
                  <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin text-[#004AC6] dark:text-[#0095F6]" />
                    <span>
                      {language === 'vi' ? 'Đang tải thêm người dùng...' : 'Loading more users...'}
                    </span>
                  </div>
                ) : hasNextUsers ? (
                  <button
                    type="button"
                    onClick={() => fetchNextUsers()}
                    className="px-4 py-2 bg-gray-100 dark:bg-[#1E1E1E] hover:bg-gray-200 dark:hover:bg-[#262626] text-gray-700 dark:text-[#D4D4D4] rounded-2xl text-xs font-semibold transition cursor-pointer"
                  >
                    {language === 'vi' ? 'Xem thêm' : 'Load more'}
                  </button>
                ) : (
                  <p className="text-xs text-gray-400 dark:text-[#737373]">
                    {t('search.allUsersLoaded')}
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* 4. TAB CONTENT: BÀI VIẾT (INFINITE POST SEARCH) */}
      {activeTab === 'posts' && (
        <div className="space-y-4">
          {isLoadingPosts ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-[#121212] rounded-3xl p-5 border border-gray-100 dark:border-[#262626] animate-pulse space-y-3"
                >
                  <div className="flex gap-3 items-center">
                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-[#262626]"></div>
                    <div className="space-y-1.5 flex-1">
                      <div className="h-3.5 bg-gray-200 dark:bg-[#262626] rounded w-36"></div>
                      <div className="h-3 bg-gray-200 dark:bg-[#262626] rounded w-24"></div>
                    </div>
                  </div>
                  <div className="h-24 bg-gray-100 dark:bg-[#1A1A1A] rounded-2xl"></div>
                </div>
              ))}
            </div>
          ) : isPostsError ? (
            <SearchErrorCard onRetry={() => refetchPosts()} />
          ) : !hasSearchText ? (
            <SearchInitialPrompt t={t} />
          ) : allPostsList.length === 0 ? (
            <SearchEmptyState
              query={queryFromUrl}
              t={t}
              subtitle={t('search.noPostsDesc')}
            />
          ) : (
            <>
              {allPostsList.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onOpenLightbox={handleOpenLightbox}
                />
              ))}

              {/* Infinite Scroll Trigger */}
              <div ref={postsObserverTarget} className="py-4 text-center">
                {isFetchingNextPosts ? (
                  <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin text-[#004AC6] dark:text-[#0095F6]" />
                    <span>
                      {language === 'vi' ? 'Đang tải thêm bài viết...' : 'Loading more posts...'}
                    </span>
                  </div>
                ) : hasNextPosts ? (
                  <button
                    type="button"
                    onClick={() => fetchNextPosts()}
                    className="px-4 py-2 bg-gray-100 dark:bg-[#1E1E1E] hover:bg-gray-200 dark:hover:bg-[#262626] text-gray-700 dark:text-[#D4D4D4] rounded-2xl text-xs font-semibold transition cursor-pointer"
                  >
                    {language === 'vi' ? 'Xem thêm' : 'Load more'}
                  </button>
                ) : (
                  <p className="text-xs text-gray-400 dark:text-[#737373]">
                    {t('search.allPostsLoaded')}
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Lightbox for post media */}
      {lightboxState.isOpen && lightboxState.post && (
        <PostMediaLightbox
          post={lightboxState.post}
          initialMediaIndex={lightboxState.mediaIndex}
          isOpen={lightboxState.isOpen}
          onClose={() =>
            setLightboxState({ isOpen: false, post: null, mediaIndex: 0 })
          }
        />
      )}
    </div>
  );
};

// ============================================================
// Subcomponents
// ============================================================

// Loading Skeleton
const SearchLoadingSkeleton: React.FC = () => (
  <div className="space-y-4">
    {/* Users Skeleton */}
    <div className="bg-white dark:bg-[#121212] rounded-3xl p-4 sm:p-5 border border-gray-100 dark:border-[#262626] animate-pulse">
      <div className="h-4 bg-gray-200 dark:bg-[#262626] rounded w-28 mb-3.5"></div>
      <div className="space-y-3">
        <div className="h-16 bg-gray-100 dark:bg-[#1A1A1A] rounded-2xl"></div>
        <div className="h-16 bg-gray-100 dark:bg-[#1A1A1A] rounded-2xl"></div>
      </div>
    </div>
    {/* Posts Skeleton */}
    <div className="bg-white dark:bg-[#121212] rounded-3xl p-5 border border-gray-100 dark:border-[#262626] animate-pulse space-y-3">
      <div className="flex gap-3 items-center">
        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-[#262626]"></div>
        <div className="space-y-1.5 flex-1">
          <div className="h-3.5 bg-gray-200 dark:bg-[#262626] rounded w-36"></div>
          <div className="h-3 bg-gray-200 dark:bg-[#262626] rounded w-24"></div>
        </div>
      </div>
      <div className="h-20 bg-gray-100 dark:bg-[#1A1A1A] rounded-2xl"></div>
    </div>
  </div>
);

// Error Card
const SearchErrorCard: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <div className="bg-white dark:bg-[#121212] rounded-3xl p-8 border border-gray-100 dark:border-[#262626] shadow-sm text-center">
    <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center mx-auto mb-3">
      <AlertCircle className="w-6 h-6" />
    </div>
    <h3 className="font-bold text-sm text-gray-900 dark:text-[#F5F5F5] mb-1">
      Không thể tải kết quả tìm kiếm
    </h3>
    <p className="text-xs text-gray-500 dark:text-[#A8A8A8] mb-4">
      Đã có lỗi xảy ra trong quá trình kết nối với máy chủ.
    </p>
    <button
      type="button"
      onClick={onRetry}
      className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-100 dark:bg-[#1E1E1E] hover:bg-gray-200 dark:hover:bg-[#262626] text-gray-700 dark:text-[#D4D4D4] rounded-2xl text-xs font-semibold transition cursor-pointer"
    >
      <RotateCw className="w-3.5 h-3.5" />
      <span>Thử lại</span>
    </button>
  </div>
);

// Empty State
const SearchEmptyState: React.FC<{
  query: string;
  t: (key: any, params?: any) => string;
  subtitle?: string;
}> = ({ query, t, subtitle }) => {
  return (
    <div className="bg-white dark:bg-[#121212] rounded-3xl p-8 sm:p-12 border border-gray-100 dark:border-[#262626] shadow-sm text-center">
      <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-blue-950/40 text-[#004AC6] dark:text-[#0095F6] flex items-center justify-center mx-auto mb-4 shadow-sm">
        <Search className="w-8 h-8" />
      </div>

      <h3 className="font-bold text-base sm:text-lg text-gray-900 dark:text-[#F5F5F5] mb-2">
        {t('search.noResultsTitle', { query })}
      </h3>

      <p className="text-xs sm:text-sm text-gray-500 dark:text-[#A8A8A8] max-w-md mx-auto leading-relaxed mb-6">
        {subtitle || t('search.noResultsDesc')}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
        <Link
          to="/explore"
          className="px-4 py-2 rounded-2xl bg-gray-100 dark:bg-[#1E1E1E] text-gray-700 dark:text-[#D4D4D4] hover:bg-gray-200 dark:hover:bg-[#262626] font-semibold transition"
        >
          {t('search.exploreCommunity')}
        </Link>
        <Link
          to="/feed"
          className="px-4 py-2 rounded-2xl bg-[#004AC6] dark:bg-[#0095F6] text-white font-semibold hover:opacity-95 shadow-xs transition"
        >
          {t('search.backToFeed')}
        </Link>
      </div>
    </div>
  );
};

// Initial Prompt when no query entered yet
const SearchInitialPrompt: React.FC<{ t: (key: any, params?: any) => string }> = ({ t }) => {
  return (
    <div className="bg-white dark:bg-[#121212] rounded-3xl p-8 sm:p-12 border border-gray-100 dark:border-[#262626] shadow-sm text-center">
      <div className="w-16 h-16 rounded-3xl bg-gray-100 dark:bg-[#1E1E1E] text-gray-400 dark:text-[#737373] flex items-center justify-center mx-auto mb-4">
        <Compass className="w-8 h-8" />
      </div>

      <h3 className="font-bold text-base sm:text-lg text-gray-900 dark:text-[#F5F5F5] mb-2">
        {t('search.startSearching')}
      </h3>

      <p className="text-xs sm:text-sm text-gray-500 dark:text-[#A8A8A8] max-w-md mx-auto leading-relaxed">
        {t('search.startSearchingDesc')}
      </p>
    </div>
  );
};

// Default export wrapped with Error Boundary
export const SearchPage: React.FC = () => {
  return (
    <SearchErrorBoundary>
      <SearchPageContent />
    </SearchErrorBoundary>
  );
};

export default SearchPage;
