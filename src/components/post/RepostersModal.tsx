import React, { useState, useEffect, useCallback } from 'react';
import { X, Repeat2, Loader2, MessageSquareQuote } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { getAvatarUrl, DEFAULT_AVATAR_FALLBACK } from '../../utils/media';
import { getProfileUrl } from '../../utils/user';
import { repostService } from '../../services/repostService';
import type { RepostUserEntry } from '../../types';

interface RepostersModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  totalReposts?: number;
}

export const RepostersModal: React.FC<RepostersModalProps> = ({
  isOpen,
  onClose,
  postId,
  totalReposts,
}) => {
  const { language } = useLanguage();
  const [reposters, setReposters] = useState<RepostUserEntry[]>([]);
  const [page, setPage] = useState(0);
  const [isLastPage, setIsLastPage] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReposters = useCallback(
    async (pageToLoad: number, append: boolean = false) => {
      if (!postId) return;

      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        const data = await repostService.getReposters(postId, {
          page: pageToLoad,
          size: 20,
        });

        setReposters((prev) => (append ? [...prev, ...data.content] : data.content));
        setIsLastPage(data.last);
        setPage(pageToLoad);
      } catch (err) {
        console.error('Failed to load reposters:', err);
        setError(
          language === 'vi'
            ? 'Không thể tải danh sách người đã repost'
            : 'Failed to load reposters'
        );
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [postId, language]
  );

  useEffect(() => {
    if (isOpen && postId) {
      setReposters([]);
      setPage(0);
      setIsLastPage(true);
      fetchReposters(0, false);
    }
  }, [isOpen, postId, fetchReposters]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const formatRepostTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return language === 'vi' ? 'Vừa xong' : 'Just now';
    if (minutes < 60) return language === 'vi' ? `${minutes} phút trước` : `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return language === 'vi' ? `${hours} giờ trước` : `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return language === 'vi' ? `${days} ngày trước` : `${days}d ago`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#121212] w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl border-t sm:border border-gray-100 dark:border-[#262626] overflow-hidden flex flex-col max-h-[85dvh] sm:max-h-[85vh] transition-all pb-safe sm:pb-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 sm:py-4 border-b border-gray-100 dark:border-[#262626]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Repeat2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-[#F5F5F5] text-base leading-tight">
                {language === 'vi' ? 'Người đã repost' : 'Reposts'}
              </h3>
              {totalReposts !== undefined && (
                <p className="text-xs text-gray-400 dark:text-[#A8A8A8]">
                  {totalReposts} {language === 'vi' ? 'lượt repost' : 'reposts'}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-[#F5F5F5] rounded-full hover:bg-gray-100 dark:hover:bg-[#262626] transition-colors cursor-pointer"
            title={language === 'vi' ? 'Đóng' : 'Close'}
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-50 dark:divide-[#262626]">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-7 h-7 text-emerald-500 animate-spin" />
              <p className="text-xs text-gray-400">
                {language === 'vi' ? 'Đang tải danh sách...' : 'Loading reposts...'}
              </p>
            </div>
          )}

          {error && !isLoading && (
            <div className="py-12 px-6 text-center">
              <p className="text-sm text-red-500 mb-3">{error}</p>
              <button
                type="button"
                onClick={() => fetchReposters(0, false)}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-full transition cursor-pointer"
              >
                {language === 'vi' ? 'Thử lại' : 'Retry'}
              </button>
            </div>
          )}

          {!isLoading && !error && reposters.length === 0 && (
            <div className="py-12 px-6 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 mx-auto flex items-center justify-center mb-3">
                <Repeat2 className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">
                {language === 'vi' ? 'Chưa có lượt repost nào' : 'No reposts yet'}
              </p>
              <p className="text-xs text-gray-400 max-w-xs mx-auto">
                {language === 'vi'
                  ? 'Hãy là người đầu tiên repost bài viết này để chia sẻ cho mọi người!'
                  : 'Be the first to repost this post to share it with your followers!'}
              </p>
            </div>
          )}

          {!isLoading &&
            !error &&
            reposters.map((entry, idx) => {
              const u = entry.user;
              const displayName =
                u.fullName ||
                [u.firstName, u.lastName].filter(Boolean).join(' ') ||
                u.username;

              return (
                <div
                  key={`${u.id}-${idx}`}
                  className="p-3.5 hover:bg-gray-50/70 dark:hover:bg-[#222222] transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      to={getProfileUrl(u)}
                      onClick={onClose}
                      className="flex items-center gap-3 group min-w-0 flex-1 cursor-pointer"
                    >
                      <div className="relative flex-shrink-0">
                        <img
                          src={getAvatarUrl(u.avatarUrl)}
                          alt={displayName}
                          className="w-10 h-10 rounded-full object-cover border border-gray-100 dark:border-[#333]"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = DEFAULT_AVATAR_FALLBACK;
                          }}
                        />
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs border border-white dark:border-[#1A1A1A]">
                          <Repeat2 className="w-2.5 h-2.5 stroke-[2.5]" />
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:underline">
                          {displayName}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                          @{u.username}
                        </p>
                      </div>
                    </Link>

                    {entry.repostedAt && (
                      <span className="text-[11px] text-gray-400 whitespace-nowrap flex-shrink-0 mt-0.5">
                        {formatRepostTime(entry.repostedAt)}
                      </span>
                    )}
                  </div>

                  {/* Caption nếu có */}
                  {entry.caption && (
                    <div className="mt-2 ml-13 flex items-start gap-1.5 p-2 bg-gray-50 dark:bg-[#252525] rounded-xl text-xs text-gray-700 dark:text-gray-300">
                      <MessageSquareQuote className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <p className="italic line-clamp-2">{entry.caption}</p>
                    </div>
                  )}
                </div>
              );
            })}

          {/* Load more button */}
          {!isLoading && !isLastPage && (
            <div className="p-3 text-center">
              <button
                type="button"
                onClick={() => fetchReposters(page + 1, true)}
                disabled={isLoadingMore}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1.5 py-1 px-3 rounded-lg hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition cursor-pointer disabled:opacity-50"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{language === 'vi' ? 'Đang tải thêm...' : 'Loading more...'}</span>
                  </>
                ) : (
                  <span>{language === 'vi' ? 'Xem thêm' : 'View more'}</span>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RepostersModal;
