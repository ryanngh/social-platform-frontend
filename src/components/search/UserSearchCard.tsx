import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, UserCheck, Sparkles, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { UserSearchResult } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { userService } from '../../services/userService';
import UserAvatar from '../common/UserAvatar';

import clsx from 'clsx';


export interface UserSearchCardProps {
  user: UserSearchResult;
  compact?: boolean;
  onUserUpdated?: (updated: UserSearchResult) => void;
}

export function formatSearchCount(count?: number | null): string {
  if (count === undefined || count === null || isNaN(count)) return '0';
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return String(count);
}

export const UserSearchCard: React.FC<UserSearchCardProps> = ({
  user,
  compact = false,
  onUserUpdated,
}) => {
  const { user: currentUser } = useAuth();
  const { t, language } = useLanguage();

  const isMe = currentUser?.id === user?.userId;
  const [isFollowing, setIsFollowing] = useState(user?.isFollowing ?? false);
  const [followerCount, setFollowerCount] = useState(user?.followerCount ?? 0);
  const [isPending, setIsPending] = useState(false);
  const [isHoveredFollowing, setIsHoveredFollowing] = useState(false);

  const displayName =
    user?.fullName ||
    `${user?.firstName || ''} ${user?.lastName || ''}`.trim() ||
    user?.username ||
    'User';
  const username = user?.username || (user?.userId ? user.userId.slice(0, 8) : 'user');


  const handleToggleFollow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isPending || isMe) return;

    const previousFollowing = isFollowing;
    const previousFollowerCount = followerCount;
    const nextFollowing = !previousFollowing;
    const nextFollowerCount = nextFollowing
      ? previousFollowerCount + 1
      : Math.max(0, previousFollowerCount - 1);

    // Optimistic update
    setIsFollowing(nextFollowing);
    setFollowerCount(nextFollowerCount);
    setIsPending(true);

    try {
      if (nextFollowing) {
        await userService.followUser(user.userId);
        toast.success(
          language === 'vi'
            ? `Đã theo dõi @${username}`
            : `Following @${username}`
        );
      } else {
        await userService.unfollowUser(user.userId);
        toast.success(
          language === 'vi'
            ? `Đã hủy theo dõi @${username}`
            : `Unfollowed @${username}`
        );
      }

      onUserUpdated?.({
        ...user,
        isFollowing: nextFollowing,
        followerCount: nextFollowerCount,
      });
    } catch (err) {
      console.error('Failed to toggle follow:', err);
      // Revert on failure
      setIsFollowing(previousFollowing);
      setFollowerCount(previousFollowerCount);
      toast.error(
        language === 'vi'
          ? 'Không thể cập nhật trạng thái theo dõi'
          : 'Failed to update follow status'
      );
    } finally {
      setIsPending(false);
    }
  };

  const userProfileLink = user?.username ? `/${user.username}` : user?.userId ? `/${user.userId}` : '/feed';

  return (
    <div
      className={clsx(
        'group bg-white dark:bg-[#121212] rounded-3xl border border-gray-100 dark:border-[#262626] transition-all duration-200 hover:shadow-md hover:border-gray-200 dark:hover:border-[#363636]',
        compact ? 'p-3.5 sm:p-4' : 'p-4 sm:p-5'
      )}
    >
      <div className="flex items-start justify-between gap-3 sm:gap-4">
        {/* User Info Left */}
        <div className="flex items-start gap-3 sm:gap-3.5 min-w-0 flex-1">
          <Link
            to={userProfileLink}
            className="relative shrink-0 cursor-pointer hover:opacity-90 transition group-hover:scale-105 duration-200"
          >
            <UserAvatar
              userId={user.userId}
              src={user.avatarUrl}
              alt={displayName}
              isVerified={user.isVerified}
              size={compact ? 'lg' : 'xl'}
              className={clsx(
                compact ? 'w-11 h-11' : 'w-12 h-12 sm:w-14 sm:h-14'
              )}
            />
          </Link>

          <div className="min-w-0 flex-1">
            <div className="flex items-center flex-wrap gap-1.5 leading-tight mb-0.5">
              <Link
                to={userProfileLink}
                className="font-bold text-sm sm:text-base text-gray-900 dark:text-[#F5F5F5] hover:underline hover:text-[#004AC6] dark:hover:text-[#0095F6] transition-colors truncate"
              >
                {displayName}
              </Link>

              {/* Mutual Friends Badge */}
              {user.isMutual && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>{t('search.friends')}</span>
                </span>
              )}

              {/* Follows You Badge */}
              {!isMe && user.isFollower && !user.isMutual && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-gray-100 dark:bg-[#262626] text-gray-600 dark:text-gray-300 border border-gray-200/60 dark:border-[#363636]">
                  {t('search.followsYou', { defaultValue: 'Theo dõi bạn' })}
                </span>
              )}

              {/* You Badge */}
              {isMe && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-[#004AC6] dark:text-[#0095F6] border border-blue-200/60 dark:border-blue-800/40">
                  {language === 'vi' ? 'Bạn' : 'You'}
                </span>
              )}
            </div>

            <p className="text-xs text-gray-500 dark:text-[#A8A8A8] truncate mb-1">
              @{username}
            </p>

            {/* Follower Stats */}
            <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-[#737373] tabular-nums mb-1.5">
              <span>
                <strong className="font-semibold text-gray-700 dark:text-[#D4D4D4]">
                  {formatSearchCount(followerCount)}
                </strong>{' '}
                {t('search.followers')}
              </span>
              <span>·</span>
              <span>
                <strong className="font-semibold text-gray-700 dark:text-[#D4D4D4]">
                  {formatSearchCount(user?.followingCount)}
                </strong>{' '}
                {t('search.followingCount')}
              </span>
            </div>

            {/* Bio snippet */}
            {user?.bio && (
              <p
                className={clsx(
                  'text-xs text-gray-600 dark:text-[#CCCCCC] leading-relaxed whitespace-pre-line break-words',
                  compact ? 'line-clamp-1' : 'line-clamp-2'
                )}
              >
                {user.bio.replace(/\\n/g, '\n')}
              </p>
            )}
          </div>
        </div>

        {/* Action Button Right */}
        {!isMe && user?.userId && (
          <div className="shrink-0 pt-0.5">
            <button
              onClick={handleToggleFollow}
              onMouseEnter={() => setIsHoveredFollowing(true)}
              onMouseLeave={() => setIsHoveredFollowing(false)}
              disabled={isPending}
              className={clsx(
                'min-w-[96px] sm:min-w-[110px] px-3.5 py-1.5 sm:py-2 rounded-2xl text-xs font-bold transition-all duration-150 flex items-center justify-center gap-1.5 shadow-xs cursor-pointer',
                isFollowing
                  ? isHoveredFollowing
                    ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-100'
                    : 'bg-gray-100 dark:bg-[#1E1E1E] text-gray-700 dark:text-[#D4D4D4] border border-gray-200/80 dark:border-[#333333]'
                  : 'bg-[#004AC6] dark:bg-[#0095F6] text-white hover:bg-[#003A9F] dark:hover:bg-[#1877F2]'
              )}
            >
              {isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : isFollowing ? (
                isHoveredFollowing ? (
                  <span>{t('search.unfollow')}</span>
                ) : (
                  <>
                    <UserCheck className="w-3.5 h-3.5 text-blue-600 dark:text-[#0095F6]" />
                    <span>{t('search.following')}</span>
                  </>
                )
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>
                    {user.isFollower
                      ? t('search.followBack', { defaultValue: 'Theo dõi lại' })
                      : t('search.follow')}
                  </span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserSearchCard;
