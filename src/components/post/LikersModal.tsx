import React, { useState, useEffect, useCallback } from 'react';
import { X, Heart, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { getAvatarUrl, DEFAULT_AVATAR_FALLBACK } from '../../utils/media';
import { postService } from '../../services/postService';
import { commentService } from '../../services/commentService';
import type { LikerResponse } from '../../types';

interface LikersModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetId: string;
  type: 'post' | 'comment';
  totalLikes?: number;
}

export const LikersModal: React.FC<LikersModalProps> = ({
  isOpen,
  onClose,
  targetId,
  type,
  totalLikes,
}) => {
  const { t, language } = useLanguage();
  const [likers, setLikers] = useState<LikerResponse[]>([]);
  const [page, setPage] = useState(0);
  const [isLastPage, setIsLastPage] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLikers = useCallback(
    async (pageToLoad: number, append: boolean = false) => {
      if (!targetId) return;

      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        const data =
          type === 'post'
            ? await postService.getPostLikers(targetId, { page: pageToLoad, size: 20 })
            : await commentService.getCommentLikers(targetId, { page: pageToLoad, size: 20 });

        setLikers((prev) => (append ? [...prev, ...data.content] : data.content));
        setIsLastPage(data.last);
        setPage(pageToLoad);
      } catch (err) {
        console.error('Failed to load likers:', err);
        setError(language === 'vi' ? 'Không thể tải danh sách người thích' : 'Failed to load likers');
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [targetId, type, language]
  );

  useEffect(() => {
    if (isOpen && targetId) {
      setLikers([]);
      setPage(0);
      setIsLastPage(true);
      fetchLikers(0, false);
    }
  }, [isOpen, targetId, fetchLikers]);

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

  const title =
    type === 'post'
      ? t('postDetail.postLikersTitle')
      : t('postDetail.commentLikersTitle');

  const formatReactionTime = (dateStr?: string) => {
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
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col transition-all relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-500">
              <Heart className="w-4 h-4 fill-rose-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 leading-tight">
                {title}
              </h3>
              {typeof totalLikes === 'number' && totalLikes > 0 && (
                <p className="text-xs text-gray-400 font-medium">
                  {totalLikes} {t('postDetail.likes')}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
            title={t('common.close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto flex-1 divide-y divide-gray-50 custom-scrollbar max-h-[60vh]">
          {isLoading && likers.length === 0 ? (
            /* Skeleton Loading */
            <div className="space-y-3 py-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 bg-gray-200 rounded w-1/2" />
                    <div className="h-2.5 bg-gray-100 rounded w-1/3" />
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
                onClick={() => fetchLikers(0, false)}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-700 rounded-xl transition cursor-pointer"
              >
                {t('feed.retry')}
              </button>
            </div>
          ) : likers.length === 0 ? (
            /* Empty State */
            <div className="text-center py-10 flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center text-rose-300 mb-3">
                <Heart className="w-7 h-7" />
              </div>
              <p className="text-sm font-semibold text-gray-800 mb-1">
                {t('postDetail.noLikersYet')}
              </p>
              <p className="text-xs text-gray-400 max-w-xs">
                {language === 'vi'
                  ? 'Hãy là người đầu tiên bày tỏ cảm xúc với nội dung này!'
                  : 'Be the first to react to this content!'}
              </p>
            </div>
          ) : (
            /* Likers List */
            <div className="space-y-1">
              {likers.map((liker, idx) => {
                const user = liker.user;
                const displayName =
                  user.fullName ||
                  `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
                  user.username;

                return (
                  <Link
                    key={`${user.id}-${idx}`}
                    to={`/profile/${user.username || user.id}`}
                    onClick={onClose}
                    className="flex items-center justify-between p-2 rounded-2xl hover:bg-gray-50 transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative flex-shrink-0">
                        <img
                          src={getAvatarUrl(user.avatarUrl)}
                          alt={displayName}
                          className="w-10 h-10 rounded-full object-cover border border-gray-100"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = DEFAULT_AVATAR_FALLBACK;
                          }}
                        />
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-rose-500 border border-white flex items-center justify-center text-white shadow-xs">
                          <Heart className="w-2.5 h-2.5 fill-white" />
                        </div>
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate group-hover:text-[#004AC6] transition-colors">
                          {displayName}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          @{user.username}
                        </p>
                      </div>
                    </div>

                    {liker.reactedAt && (
                      <span className="text-[11px] text-gray-400 flex-shrink-0 pl-2">
                        {formatReactionTime(liker.reactedAt)}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          )}

          {/* Load More Button */}
          {!isLastPage && likers.length > 0 && (
            <div className="pt-3 text-center">
              <button
                type="button"
                onClick={() => fetchLikers(page + 1, true)}
                disabled={isLoadingMore}
                className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-xs font-semibold text-[#004AC6] rounded-xl transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{t('postDetail.loadingLikers')}</span>
                  </>
                ) : (
                  <span>{t('postDetail.loadMoreLikers')}</span>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LikersModal;
