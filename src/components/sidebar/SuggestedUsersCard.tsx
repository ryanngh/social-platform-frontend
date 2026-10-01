import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Sparkles, UserPlus, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useSuggestedUsers } from '../../hooks/useSuggestedUsers';
import { userService } from '../../services/userService';
import UserAvatar from '../common/UserAvatar';
import type { SuggestedUser } from '../../types';
import clsx from 'clsx';

// ============================================================
// Subcomponent: Suggested User Item
// ============================================================
export interface SuggestedUserItemProps {
  user: SuggestedUser;
  onDismiss?: (userId: string) => void;
}

export const SuggestedUserItem: React.FC<SuggestedUserItemProps> = ({ user, onDismiss }) => {
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
      console.error('Failed to toggle follow in suggestions:', err);
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

    if (!onDismiss) return;

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
        {onDismiss && (
          <button
            type="button"
            onClick={handleDismiss}
            className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-full transition-all duration-150 cursor-pointer"
            title={language === 'vi' ? 'Bỏ qua gợi ý' : 'Dismiss suggestion'}
            aria-label="Dismiss suggestion"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

// ============================================================
// Main Reusable SuggestedUsersCard Component
// ============================================================
export interface SuggestedUsersCardProps {
  limit?: number;
  title?: string;
  showHeader?: boolean;
  showSeeAll?: boolean;
  className?: string;
}

export const SuggestedUsersCard: React.FC<SuggestedUsersCardProps> = ({
  limit = 5,
  title,
  showHeader = true,
  showSeeAll = true,
  className,
}) => {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();

  const {
    data: suggestedUsers,
    isLoading: isLoadingSuggestions,
    dismissUser,
  } = useSuggestedUsers(limit);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <section
      aria-labelledby="suggestions-heading"
      className={clsx(
        'bg-white dark:bg-[#121212] rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-[#262626] transition-colors duration-200',
        className
      )}
    >
      {showHeader && (
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-[#004AC6] dark:text-[#0095F6]" />
            <h4
              id="suggestions-heading"
              className="font-bold text-gray-900 dark:text-[#F5F5F5] text-sm"
            >
              {title || t('rightSidebar.suggestions', { defaultValue: 'Gợi ý cho bạn' })}
            </h4>
          </div>

          {showSeeAll && suggestedUsers && suggestedUsers.length > 0 && (
            <Link
              to="/explore"
              className="text-xs font-semibold text-[#004AC6] dark:text-[#0095F6] hover:underline cursor-pointer"
            >
              {t('rightSidebar.seeAll', { defaultValue: 'Xem tất cả' })}
            </Link>
          )}
        </div>
      )}

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
            {t('rightSidebar.noSuggestions', { defaultValue: 'Chưa có gợi ý nào' })}
          </p>
        </div>
      )}
    </section>
  );
};

export default SuggestedUsersCard;
