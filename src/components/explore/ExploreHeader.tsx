import React, { useState } from 'react';
import {
  Compass,
  Search,
  X,
  TrendingUp,
  Sparkles,
  UserPlus,
  UserCheck,
} from 'lucide-react';
import clsx from 'clsx';
import { Link } from 'react-router-dom';
import type { ExploreTrendingHashtag, SuggestedUser } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { getProfileUrl } from '../../utils/user';
import { getAvatarUrl } from '../../utils/media';

interface ExploreHeaderProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  selectedMediaType: 'ALL' | 'IMAGE' | 'VIDEO';
  onMediaTypeChange: (val: 'ALL' | 'IMAGE' | 'VIDEO') => void;
  selectedHashtag?: string;
  onHashtagSelect: (tag: string | null) => void;
  trendingHashtags?: ExploreTrendingHashtag[];
  suggestedUsers?: SuggestedUser[];
  onToggleFollowUser?: (userId: string, isFollowing: boolean) => Promise<void>;
  totalItemsCount?: number;
}

export const ExploreHeader: React.FC<ExploreHeaderProps> = ({
  searchQuery,
  onSearchChange,
  selectedMediaType,
  onMediaTypeChange,
  selectedHashtag,
  onHashtagSelect,
  trendingHashtags = [],
  suggestedUsers = [],
  onToggleFollowUser,
  totalItemsCount,
}) => {
  const { t } = useLanguage();
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());

  const handleFollowClick = async (userId: string) => {
    const isCurrentlyFollowing = followedIds.has(userId);
    const nextSet = new Set(followedIds);
    if (isCurrentlyFollowing) {
      nextSet.delete(userId);
    } else {
      nextSet.add(userId);
    }
    setFollowedIds(nextSet);

    if (onToggleFollowUser) {
      await onToggleFollowUser(userId, isCurrentlyFollowing);
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Main Discovery Card */}
      <div className="bg-white dark:bg-[#121212] rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-gray-100 dark:border-[#262626] shadow-2xs transition-colors duration-200">
        {/* Title */}
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-[#004AC6] to-[#0095F6] flex items-center justify-center text-white shadow-xs shrink-0">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-[#F5F5F5] leading-tight">
                {t('explore.title') || 'Khám phá'}
              </h1>
              <p className="text-xs text-gray-500 dark:text-[#A8A8A8] hidden sm:block">
                Khám phá xu hướng, hình ảnh, video và cộng đồng sáng tạo trên RySocial
              </p>
            </div>
          </div>
        </div>

        {/* Search Input Box */}
        <div className="relative mb-3">
          <Search className="w-4 h-4 text-gray-400 dark:text-[#737373] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t('explore.searchPlaceholder') || 'Tìm kiếm người, thẻ hoặc chủ đề...'}
            className="w-full pl-10 pr-10 py-2 sm:py-2.5 bg-gray-100/80 dark:bg-[#1A1A1A] border border-transparent dark:border-[#363636] rounded-xl sm:rounded-2xl text-sm text-gray-900 dark:text-[#F5F5F5] placeholder-gray-400 dark:placeholder-[#737373] focus:bg-white dark:focus:bg-[#000000] focus:border-[#004AC6] dark:focus:border-[#0095F6] outline-none transition"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition rounded-full"
              aria-label="Xóa tìm kiếm"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Trending Hashtags Horizontal Scroll */}
        {trendingHashtags.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
            <span className="text-gray-400 dark:text-[#737373] font-medium flex items-center gap-1 shrink-0">
              <TrendingUp className="w-3.5 h-3.5 text-rose-500" />
              Hot:
            </span>
            {trendingHashtags.map((item) => {
              const cleanTag = item.tag.replace(/^#/, '');
              const isSelected = selectedHashtag?.toLowerCase() === cleanTag.toLowerCase();
              return (
                <button
                  key={cleanTag}
                  onClick={() => onHashtagSelect(isSelected ? null : cleanTag)}
                  className={clsx(
                    'px-3 py-1 rounded-full whitespace-nowrap font-medium transition cursor-pointer flex items-center gap-1 shrink-0',
                    isSelected
                      ? 'bg-[#004AC6] text-white shadow-xs'
                      : 'bg-gray-100 dark:bg-[#1E1E1E] text-gray-700 dark:text-[#D4D4D4] hover:bg-gray-200 dark:hover:bg-[#2A2A2A]'
                  )}
                >
                  <span>#{cleanTag}</span>
                  {item.postCount > 0 && (
                    <span className="text-[10px] opacity-70">
                      ({item.postCount >= 1000 ? `${(item.postCount / 1000).toFixed(1)}k` : item.postCount})
                    </span>
                  )}
                </button>
              );
            })}
            {selectedHashtag && (
              <button
                onClick={() => onHashtagSelect(null)}
                className="text-[11px] text-rose-500 hover:underline shrink-0 font-medium ml-1 cursor-pointer"
              >
                Xóa bộ lọc tag
              </button>
            )}
          </div>
        )}
      </div>

      {/* 2. Featured Creators Section */}
      {suggestedUsers.length > 0 && (
        <section className="bg-white dark:bg-[#121212] rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-gray-100 dark:border-[#262626] shadow-2xs transition-colors duration-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-bold text-gray-900 dark:text-[#F5F5F5]">
                {t('explore.featuredCreators') || 'Nhà sáng tạo nổi bật'}
              </h2>
            </div>
            <span className="text-[11px] sm:text-xs text-gray-400 dark:text-[#737373]">
              Gợi ý cho bạn
            </span>
          </div>

          <div className="flex sm:grid sm:grid-cols-4 gap-2.5 sm:gap-3 overflow-x-auto no-scrollbar pb-1">
            {suggestedUsers.slice(0, 4).map((creator) => {
              const displayName = `${creator.firstName || ''} ${creator.lastName || ''}`.trim() || creator.username;
              const isFollowing = followedIds.has(creator.id);

              return (
                <div
                  key={creator.id}
                  className="w-32 sm:w-auto shrink-0 group relative bg-gray-50 dark:bg-[#1A1A1A] border border-gray-100 dark:border-[#262626] rounded-xl sm:rounded-2xl p-2.5 sm:p-3 flex flex-col items-center text-center transition hover:shadow-md hover:border-gray-200 dark:hover:border-[#363636]"
                >
                  <Link
                    to={getProfileUrl(creator.username || creator.id)}
                    className="relative mb-2 block"
                  >
                    <img
                      src={getAvatarUrl(creator.avatarUrl)}
                      alt={displayName}
                      className="w-14 h-14 rounded-full object-cover border-2 border-white dark:border-[#262626] shadow-xs group-hover:scale-105 transition"
                    />
                  </Link>

                  <Link
                    to={getProfileUrl(creator.username || creator.id)}
                    className="font-bold text-xs text-gray-900 dark:text-[#F5F5F5] hover:underline truncate w-full"
                  >
                    {displayName}
                  </Link>
                  <p className="text-[11px] text-gray-400 dark:text-[#737373] truncate w-full mb-1">
                    @{creator.username}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-[#A8A8A8] line-clamp-1 mb-2.5 px-1">
                    {creator.bio || creator.reason || `${creator.followerCount || 0} người theo dõi`}
                  </p>

                  <button
                    type="button"
                    onClick={() => handleFollowClick(creator.id)}
                    className={clsx(
                      'w-full py-1.5 px-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition cursor-pointer whitespace-nowrap',
                      isFollowing
                        ? 'bg-gray-200 dark:bg-[#2A2A2A] text-gray-700 dark:text-[#D4D4D4] hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400'
                        : 'bg-[#004AC6] dark:bg-[#0095F6] text-white hover:opacity-90 shadow-xs'
                    )}
                  >
                    {isFollowing ? (
                      <>
                        <UserCheck className="w-3 h-3 shrink-0" />
                        <span>{t('explore.following') || 'Đang theo dõi'}</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3 h-3 shrink-0" />
                        <span>{t('explore.follow') || 'Theo dõi'}</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 3. Media Filter Tabs (Matching Mock Design Exactly) */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5 bg-gray-100/80 dark:bg-[#1A1A1A] p-1 rounded-2xl border border-gray-200/50 dark:border-[#262626] text-xs font-semibold text-gray-600 dark:text-[#A8A8A8]">
          <button
            onClick={() => onMediaTypeChange('ALL')}
            className={clsx(
              'px-3.5 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap',
              selectedMediaType === 'ALL'
                ? 'bg-white dark:bg-[#262626] text-gray-900 dark:text-white shadow-xs font-bold'
                : 'hover:text-gray-900 dark:hover:text-white'
            )}
          >
            {t('explore.tabs.all') || 'Tất cả'}
          </button>

          <button
            onClick={() => onMediaTypeChange('IMAGE')}
            className={clsx(
              'px-3.5 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap',
              selectedMediaType === 'IMAGE'
                ? 'bg-white dark:bg-[#262626] text-gray-900 dark:text-white shadow-xs font-bold'
                : 'hover:text-gray-900 dark:hover:text-white'
            )}
          >
            {t('explore.tabs.photos') || 'Ảnh'}
          </button>

          <button
            onClick={() => onMediaTypeChange('VIDEO')}
            className={clsx(
              'px-3.5 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap',
              selectedMediaType === 'VIDEO'
                ? 'bg-white dark:bg-[#262626] text-gray-900 dark:text-white shadow-xs font-bold'
                : 'hover:text-gray-900 dark:hover:text-white'
            )}
          >
            {t('explore.tabs.videos') || 'Reels & Video'}
          </button>
        </div>

        {totalItemsCount !== undefined && totalItemsCount > 0 && (
          <span className="text-xs text-gray-400 dark:text-[#737373] tabular-nums font-medium">
            {totalItemsCount} nội dung
          </span>
        )}
      </div>
    </div>
  );
};

export default ExploreHeader;
