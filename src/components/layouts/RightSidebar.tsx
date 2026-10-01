import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  TrendingUp,
  Sparkles,
  UserPlus,
  X,
  Loader2,
  ChevronRight,
  Flame,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTrendingHashtags } from '../../hooks/useTrending';
import { useSuggestedUsers } from '../../hooks/useSuggestedUsers';
import { userService } from '../../services/userService';
import UserAvatar from '../common/UserAvatar';
import type { SuggestedUser, TrendingHashtag } from '../../types';
import clsx from 'clsx';

// ============================================================
// Subcomponent: Suggested User Item
// ============================================================
interface SuggestedUserItemProps {
  user: SuggestedUser;
  onDismiss: (userId: string) => void;
}

const SuggestedUserItem: React.FC<SuggestedUserItemProps> = ({ user, onDismiss }) => {
  const { t, language } = useLanguage();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [isHoveredFollowing, setIsHoveredFollowing] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const displayName =
    `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'User';

  const handleToggleFollow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isPending) return;

    const nextState = !isFollowing;
    setIsFollowing(nextState);
    setIsPending(true);

    try {
      if (nextState) {
        await userService.followUser(user.id);
        toast.success(
          language === 'vi'
            ? `Đã theo dõi @${user.username}`
            : `Following @${user.username}`
        );
      } else {
        await userService.unfollowUser(user.id);
        toast.success(
          language === 'vi'
            ? `Đã hủy theo dõi @${user.username}`
            : `Unfollowed @${user.username}`
        );
      }
    } catch (err) {
      console.error('Failed to toggle follow in sidebar:', err);
      setIsFollowing(!nextState); // Revert
      toast.error(
        language === 'vi'
          ? 'Không thể cập nhật trạng thái theo dõi'
          : 'Failed to update follow status'
      );
    } finally {
      setIsPending(false);
    }
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsExiting(true);
    setTimeout(() => {
      onDismiss(user.id);
    }, 200);
  };

  return (
    <div
      className={clsx(
        'group relative flex items-center justify-between gap-2.5 p-2 -mx-2 rounded-2xl transition-all duration-200 hover:bg-gray-50 dark:hover:bg-[#1A1A1A]',
        isExiting ? 'opacity-0 scale-95 max-h-0 py-0 my-0 overflow-hidden' : 'opacity-100'
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <Link
          to={`/${user.username || user.id}`}
          className="relative shrink-0 hover:opacity-90 transition cursor-pointer"
        >
          <UserAvatar
            userId={user.id}
            src={user.avatarUrl}
            alt={displayName}
            size="md"
          />
        </Link>

        <div className="leading-tight min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <Link
              to={`/${user.username || user.id}`}
              className="text-xs font-bold text-gray-900 dark:text-[#F5F5F5] hover:underline hover:text-[#004AC6] dark:hover:text-[#0095F6] transition-colors truncate cursor-pointer block"
              title={displayName}
            >
              {displayName}
            </Link>
          </div>

          <Link
            to={`/${user.username || user.id}`}
            className="text-[11px] text-gray-400 dark:text-[#A8A8A8] hover:underline hover:text-[#004AC6] dark:hover:text-[#0095F6] transition-colors truncate cursor-pointer block"
          >
            @{user.username}
          </Link>

          {/* Reason / Mutual Follower indicator */}
          {user.mutualFollowersCount > 0 ? (
            <p className="text-[10.5px] text-emerald-600 dark:text-emerald-400 truncate mt-0.5 flex items-center gap-1 font-medium">
              <Sparkles className="w-2.5 h-2.5 shrink-0" />
              <span>
                {language === 'vi'
                  ? `${user.mutualFollowersCount} bạn chung`
                  : user.reason || `${user.mutualFollowersCount} mutuals`}
              </span>
            </p>
          ) : user.reason ? (
            <p className="text-[10.5px] text-gray-400 dark:text-[#737373] truncate mt-0.5">
              {user.reason}
            </p>
          ) : null}
        </div>
      </div>

      {/* Action Buttons Right */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Follow Button */}
        <button
          type="button"
          onClick={handleToggleFollow}
          onMouseEnter={() => setIsHoveredFollowing(true)}
          onMouseLeave={() => setIsHoveredFollowing(false)}
          disabled={isPending}
          className={clsx(
            'text-xs font-semibold px-3 py-1.5 rounded-full transition-all duration-150 flex items-center justify-center gap-1 cursor-pointer min-w-[76px]',
            isFollowing
              ? isHoveredFollowing
                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40'
                : 'bg-gray-100 dark:bg-[#262626] text-gray-600 dark:text-[#A8A8A8] border border-transparent'
              : 'bg-[#EFF6FF] dark:bg-blue-950/60 text-[#003A9F] dark:text-[#0095F6] hover:bg-blue-100 dark:hover:bg-blue-900/60'
          )}
        >
          {isPending ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : isFollowing ? (
            isHoveredFollowing ? (
              <span>{t('search.unfollow', { defaultValue: 'Hủy' })}</span>
            ) : (
              <span>{t('rightSidebar.following', { defaultValue: 'Đang theo dõi' })}</span>
            )
          ) : (
            <>
              <UserPlus className="w-3 h-3" />
              <span>{t('rightSidebar.follow', { defaultValue: 'Theo dõi' })}</span>
            </>
          )}
        </button>

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-full transition-all duration-150 cursor-pointer"
          title={language === 'vi' ? 'Bỏ qua gợi ý' : 'Dismiss suggestion'}
          aria-label="Dismiss suggestion"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

// ============================================================
// Subcomponent: Trending Topic Item
// ============================================================
interface TrendingTopicItemProps {
  trend: TrendingHashtag;
  rank: number;
}

const TrendingTopicItem: React.FC<TrendingTopicItemProps> = ({ trend, rank }) => {
  const { language } = useLanguage();
  const navigate = useNavigate();

  const handleHashtagClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(`/search?q=${encodeURIComponent('#' + trend.tag)}`);
  };

  const getRankBadgeClass = (pos: number) => {
    if (pos === 1) {
      return 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-300/60 dark:border-amber-700/50';
    }
    if (pos === 2) {
      return 'bg-blue-100 text-[#004AC6] dark:bg-blue-950/60 dark:text-[#0095F6] border border-blue-300/60 dark:border-blue-700/50';
    }
    if (pos === 3) {
      return 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-300/60 dark:border-rose-700/50';
    }
    return 'bg-gray-100 text-gray-500 dark:bg-[#262626] dark:text-[#888888] border border-transparent';
  };

  return (
    <div
      onClick={handleHashtagClick}
      className="group flex items-center justify-between p-2 -mx-2 rounded-2xl cursor-pointer transition-all duration-150 hover:bg-gray-50 dark:hover:bg-[#1A1A1A]"
    >
      <div className="flex items-start gap-3 min-w-0">
        <span
          className={clsx(
            'w-5 h-5 rounded-lg flex items-center justify-center text-[11px] font-black shrink-0 mt-0.5',
            getRankBadgeClass(rank)
          )}
        >
          {rank}
        </span>

        <div className="leading-snug min-w-0">
          <p className="text-xs font-bold text-gray-900 dark:text-[#F5F5F5] group-hover:text-[#004AC6] dark:group-hover:text-[#0095F6] transition-colors truncate">
            #{trend.tag}
          </p>
          <p className="text-[11px] text-gray-400 dark:text-[#A8A8A8] mt-0.5">
            {language === 'vi'
              ? `${trend.formattedCount} bài viết`
              : `${trend.formattedCount} posts`}
          </p>
        </div>
      </div>

      <ChevronRight className="w-3.5 h-3.5 text-gray-300 dark:text-[#525252] group-hover:text-[#004AC6] dark:group-hover:text-[#0095F6] group-hover:translate-x-0.5 transition-all shrink-0" />
    </div>
  );
};

// ============================================================
// Main RightSidebar Component
// ============================================================
const RightSidebar: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  const { isAuthenticated } = useAuth();

  // 1. Fetch real Suggested Users
  const {
    data: suggestedUsers,
    isLoading: isLoadingSuggestions,
    dismissUser,
  } = useSuggestedUsers(5);

  // 2. Fetch real Trending Hashtags
  const {
    data: trendingHashtags,
    isLoading: isLoadingTrends,
  } = useTrendingHashtags(5);

  return (
    <div className="flex flex-col gap-4">
      {/* 1. Friend Suggestions Card (Who to Follow) */}
      {isAuthenticated && (
        <section className="bg-white dark:bg-[#121212] rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-[#262626] transition-colors duration-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-[#004AC6] dark:text-[#0095F6]" />
              <h4 className="font-bold text-gray-900 dark:text-[#F5F5F5] text-sm">
                {t('rightSidebar.suggestions')}
              </h4>
            </div>

            {suggestedUsers && suggestedUsers.length > 0 && (
              <Link
                to="/explore"
                className="text-xs font-semibold text-[#004AC6] dark:text-[#0095F6] hover:underline cursor-pointer"
              >
                {t('rightSidebar.seeAll')}
              </Link>
            )}
          </div>

          {isLoadingSuggestions ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between animate-pulse">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-[#262626]" />
                    <div className="space-y-1.5">
                      <div className="w-24 h-3 bg-gray-200 dark:bg-[#262626] rounded" />
                      <div className="w-16 h-2.5 bg-gray-200 dark:bg-[#262626] rounded" />
                    </div>
                  </div>
                  <div className="w-16 h-6 rounded-full bg-gray-200 dark:bg-[#262626]" />
                </div>
              ))}
            </div>
          ) : suggestedUsers && suggestedUsers.length > 0 ? (
            <div className="flex flex-col gap-1">
              {suggestedUsers.map((user) => (
                <SuggestedUserItem
                  key={user.id}
                  user={user}
                  onDismiss={(id) => dismissUser(id)}
                />
              ))}
            </div>
          ) : (
            <div className="py-5 text-center text-gray-400 dark:text-[#737373]">
              <Users className="w-7 h-7 mx-auto mb-2 text-gray-300 dark:text-[#525252] stroke-[1.5]" />
              <p className="text-xs text-gray-400 dark:text-[#737373]">
                {t('rightSidebar.noSuggestions')}
              </p>
            </div>
          )}
        </section>
      )}

      {/* 2. Trending Hashtags Card */}
      <section className="bg-white dark:bg-[#121212] rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-[#262626] transition-colors duration-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-rose-500 fill-rose-500/20" />
            <h4 className="font-bold text-gray-900 dark:text-[#F5F5F5] text-sm">
              {t('rightSidebar.trending')}
            </h4>
          </div>
        </div>

        {isLoadingTrends ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-5 h-5 rounded bg-gray-200 dark:bg-[#262626]" />
                <div className="space-y-1.5 flex-1">
                  <div className="w-28 h-3 bg-gray-200 dark:bg-[#262626] rounded" />
                  <div className="w-16 h-2.5 bg-gray-200 dark:bg-[#262626] rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : trendingHashtags && trendingHashtags.length > 0 ? (
          <div className="flex flex-col gap-1">
            {trendingHashtags.map((trend, idx) => (
              <TrendingTopicItem
                key={trend.id || `tr-${idx}`}
                trend={trend}
                rank={idx + 1}
              />
            ))}
          </div>
        ) : (
          <div className="py-5 text-center text-gray-400 dark:text-[#737373]">
            <TrendingUp className="w-7 h-7 mx-auto mb-2 text-gray-300 dark:text-[#525252] stroke-[1.5]" />
            <p className="text-xs text-gray-400 dark:text-[#737373]">
              {t('rightSidebar.noTrending')}
            </p>
          </div>
        )}
      </section>

      {/* 3. Footer Info */}
      <footer className="px-2 text-xs text-gray-400 dark:text-[#737373] leading-relaxed">
        <div className="flex flex-wrap gap-x-2 gap-y-1 mb-1">
          <Link to="/terms" className="hover:underline hover:text-gray-600 dark:hover:text-[#F5F5F5]">
            {language === 'vi' ? 'Điều khoản' : 'Terms'}
          </Link>
          <span>·</span>
          <Link to="/privacy" className="hover:underline hover:text-gray-600 dark:hover:text-[#F5F5F5]">
            {language === 'vi' ? 'Quyền riêng tư' : 'Privacy'}
          </Link>
          <span>·</span>
          <Link to="/help" className="hover:underline hover:text-gray-600 dark:hover:text-[#F5F5F5]">
            {language === 'vi' ? 'Trợ giúp' : 'Help'}
          </Link>
          <span>·</span>
          <button
            onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
            className="hover:underline text-[#004AC6] dark:text-[#0095F6] font-medium cursor-pointer"
          >
            {language === 'vi' ? 'English' : 'Tiếng Việt'}
          </button>
        </div>
        <p>© 2026 Mo3Studio. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default RightSidebar;
