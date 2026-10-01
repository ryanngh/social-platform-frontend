import React, { useState, useEffect, useCallback } from 'react';
import { X, Users, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { getProfileUrl } from '../../utils/user';

import { userService } from '../../services/userService';
import type { UserSummary } from '../../types';
import UserAvatar from '../common/UserAvatar';

export type FollowListType = 'followers' | 'following';

interface FollowListModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  initialType?: FollowListType;
  followersCount?: number;
  followingCount?: number;
  username?: string;
}

export const FollowListModal: React.FC<FollowListModalProps> = ({
  isOpen,
  onClose,
  userId,
  initialType = 'followers',
  followersCount,
  followingCount,
  username,
}) => {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<FollowListType>(initialType);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [page, setPage] = useState(0);
  const [isLastPage, setIsLastPage] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync activeTab when initialType changes upon opening
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialType);
    }
  }, [isOpen, initialType]);

  const fetchUsers = useCallback(
    async (targetTab: FollowListType, pageToLoad: number, append: boolean = false) => {
      if (!userId) return;

      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        const data =
          targetTab === 'followers'
            ? await userService.getFollowers(userId, { page: pageToLoad, size: 20 })
            : await userService.getFollowing(userId, { page: pageToLoad, size: 20 });

        setUsers((prev) => (append ? [...prev, ...data.content] : data.content));
        setIsLastPage(data.last);
        setPage(pageToLoad);
      } catch (err) {
        console.error(`Failed to load ${targetTab}:`, err);
        setError(
          language === 'vi'
            ? targetTab === 'followers'
              ? 'Không thể tải danh sách người theo dõi'
              : 'Không thể tải danh sách đang theo dõi'
            : targetTab === 'followers'
              ? 'Failed to load followers'
              : 'Failed to load following'
        );
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [userId, language]
  );

  useEffect(() => {
    if (isOpen && userId) {
      setUsers([]);
      setPage(0);
      setIsLastPage(true);
      fetchUsers(activeTab, 0, false);
    }
  }, [isOpen, userId, activeTab, fetchUsers]);

  // Handle escape key and prevent body scroll
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const followersLabel = t('profile.followersTitle', { defaultValue: 'Người theo dõi' });
  const followingLabel = t('profile.followingTitle', { defaultValue: 'Đang theo dõi' });

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#121212] rounded-t-3xl sm:rounded-3xl shadow-2xl border-t sm:border border-gray-100 dark:border-[#262626] w-full max-w-md max-h-[85dvh] sm:max-h-[85vh] overflow-hidden flex flex-col transition-all relative pb-safe sm:pb-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Title and Tabs */}
        <div className="border-b border-gray-100 dark:border-[#262626] flex-shrink-0">
          <div className="flex items-center justify-between px-4 sm:px-5 pt-3.5 sm:pt-4 pb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-[#0095F6]/15 flex items-center justify-center text-[#004AC6] dark:text-[#0095F6]">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-[#F5F5F5] leading-tight">
                  {activeTab === 'followers' ? followersLabel : followingLabel}
                </h3>
                {username && (
                  <p className="text-xs text-gray-400 dark:text-[#737373] font-medium">@{username}</p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-full text-gray-400 dark:text-[#A8A8A8] hover:text-gray-700 dark:hover:text-[#F5F5F5] hover:bg-gray-100 dark:hover:bg-[#262626] transition cursor-pointer"
              title={t('common.close', { defaultValue: 'Đóng' })}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Followers / Following Toggle Tabs */}
          <div className="flex px-5 gap-4">
            <button
              type="button"
              onClick={() => setActiveTab('followers')}
              className={`pb-2.5 text-xs font-semibold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'followers'
                  ? 'border-[#004AC6] dark:border-[#0095F6] text-[#004AC6] dark:text-[#0095F6]'
                  : 'border-transparent text-gray-500 dark:text-[#A8A8A8] hover:text-gray-800 dark:hover:text-[#F5F5F5]'
              }`}
            >
              <span>{followersLabel}</span>
              {typeof followersCount === 'number' && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                    activeTab === 'followers'
                      ? 'bg-blue-100 dark:bg-[#0095F6]/15 text-[#004AC6] dark:text-[#3897F0] font-bold'
                      : 'bg-gray-100 dark:bg-[#1A1A1A] text-gray-500 dark:text-[#A8A8A8]'
                  }`}
                >
                  {followersCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('following')}
              className={`pb-2.5 text-xs font-semibold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'following'
                  ? 'border-[#004AC6] dark:border-[#0095F6] text-[#004AC6] dark:text-[#0095F6]'
                  : 'border-transparent text-gray-500 dark:text-[#A8A8A8] hover:text-gray-800 dark:hover:text-[#F5F5F5]'
              }`}
            >
              <span>{followingLabel}</span>
              {typeof followingCount === 'number' && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                    activeTab === 'following'
                      ? 'bg-blue-100 dark:bg-[#0095F6]/15 text-[#004AC6] dark:text-[#3897F0] font-bold'
                      : 'bg-gray-100 dark:bg-[#1A1A1A] text-gray-500 dark:text-[#A8A8A8]'
                  }`}
                >
                  {followingCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto flex-1 divide-y divide-gray-50 dark:divide-[#262626] custom-scrollbar max-h-[60vh]">
          {isLoading && users.length === 0 ? (
            /* Skeleton Loading State */
            <div className="space-y-3 py-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-[#262626] flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 bg-gray-200 dark:bg-[#262626] rounded w-1/2" />
                    <div className="h-2.5 bg-gray-100 dark:bg-[#1A1A1A] rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            /* Error State */
            <div className="text-center py-8">
              <p className="text-xs text-rose-500 mb-3">{error}</p>
              <button
                type="button"
                onClick={() => fetchUsers(activeTab, 0, false)}
                className="px-3 py-1.5 bg-gray-100 dark:bg-[#1A1A1A] hover:bg-gray-200 dark:hover:bg-[#363636] text-xs font-semibold text-gray-700 dark:text-[#E5E5E5] rounded-xl transition cursor-pointer"
              >
                {t('feed.retry', { defaultValue: 'Thử lại' })}
              </button>
            </div>
          ) : users.length === 0 ? (
            /* Empty State */
            <div className="text-center py-10 flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-[#0095F6]/15 flex items-center justify-center text-blue-300 dark:text-[#0095F6] mb-3">
                <Users className="w-7 h-7" />
              </div>
              <p className="text-sm font-semibold text-gray-800 dark:text-[#E5E5E5] mb-1">
                {activeTab === 'followers'
                  ? t('profile.noFollowersYet', { defaultValue: 'Chưa có người theo dõi nào' })
                  : t('profile.noFollowingYet', { defaultValue: 'Chưa theo dõi người nào' })}
              </p>
            </div>
          ) : (
            /* User List */
            <div className="space-y-1">
              {users.map((item, idx) => {
                const displayName =
                  item.fullName ||
                  [item.firstName, item.lastName].filter(Boolean).join(' ') ||
                  item.username;

                return (
                  <Link
                    key={`${item.id}-${idx}`}
                    to={getProfileUrl(item)}
                    onClick={onClose}
                    className="flex items-center justify-between p-2 rounded-2xl hover:bg-gray-50 dark:hover:bg-[#1A1A1A] transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative flex-shrink-0">
                        <UserAvatar
                          userId={item.id}
                          src={item.avatarUrl}
                          alt={displayName}
                          size="md"
                        />
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 dark:text-[#F5F5F5] truncate group-hover:text-[#004AC6] dark:group-hover:text-[#0095F6] transition-colors">
                          {displayName}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-[#A8A8A8] truncate">
                          @{item.username}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Load More Button */}
          {!isLastPage && users.length > 0 && (
            <div className="pt-3 text-center">
              <button
                type="button"
                onClick={() => fetchUsers(activeTab, page + 1, true)}
                disabled={isLoadingMore}
                className="w-full py-2 bg-gray-50 dark:bg-[#1A1A1A] hover:bg-gray-100 dark:hover:bg-[#262626] text-xs font-semibold text-[#004AC6] dark:text-[#0095F6] rounded-xl transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{t('profile.loadingMore', { defaultValue: 'Đang tải thêm...' })}</span>
                  </>
                ) : (
                  <span>{t('profile.loadMore', { defaultValue: 'Xem thêm' })}</span>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FollowListModal;
