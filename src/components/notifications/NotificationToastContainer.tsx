import React from 'react';
import { X, Heart, MessageCircle, AtSign, UserPlus, Bell, Repeat, Share2 } from 'lucide-react';
import type { NotificationItem, NotificationType } from '../../types';
import { getAvatarUrl, getMediaUrl, isVideoMedia, DEFAULT_AVATAR_FALLBACK } from '../../utils/media';
import { parsePreviewText, getNotificationTypeMeta } from '../../utils/notification';

export interface FloatingToast {
  id: string;
  item: NotificationItem;
  createdAt: number;
}

interface NotificationToastContainerProps {
  toasts: FloatingToast[];
  onDismiss: (id: string) => void;
  onSelect: (item: NotificationItem) => void;
}

export const NotificationToastContainer: React.FC<NotificationToastContainerProps> = ({
  toasts,
  onDismiss,
  onSelect,
}) => {
  if (toasts.length === 0) return null;

  const renderBadgeIcon = (type: NotificationType) => {
    switch (type) {
      case 'POST_REACTED':
      case 'COMMENT_REACTED':
        return <Heart className="w-2.5 h-2.5 fill-current text-white" />;
      case 'POST_COMMENTED':
      case 'COMMENT_REPLIED':
        return <MessageCircle className="w-2.5 h-2.5 fill-current text-white" />;
      case 'USER_MENTIONED':
        return <AtSign className="w-2.5 h-2.5 stroke-[2.5] text-white" />;
      case 'USER_FOLLOWED':
      case 'FRIEND_REQUEST':
        return <UserPlus className="w-2.5 h-2.5 stroke-[2.5] text-white" />;
      case 'POST_REPOSTED':
        return <Repeat className="w-2.5 h-2.5 stroke-[2.5] text-white" />;
      case 'POST_SHARED':
        return <Share2 className="w-2.5 h-2.5 stroke-[2.5] text-white" />;
      default:
        return <Bell className="w-2.5 h-2.5 text-white" />;
    }
  };

  return (
    <aside
      aria-label="Thông báo mới"
      className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-[9999] flex flex-col-reverse gap-3 max-w-[360px] sm:max-w-[400px] w-[calc(100vw-2rem)] pointer-events-none"
    >
      {toasts.map(({ id, item }) => {
        const meta = getNotificationTypeMeta(item.type);
        const { mainText, quoteSnippet } = parsePreviewText(item.previewText);
        const primaryActor = item.latestActors?.[0];
        const avatarSrc = getAvatarUrl(primaryActor?.avatarUrl);

        return (
          <div
            key={id}
            onClick={() => onSelect(item)}
            className="pointer-events-auto group relative w-full bg-white dark:bg-[#1A1A1A] rounded-2xl shadow-2xl border-l-4 border-l-[#004AC6] dark:border-l-[#0095F6] border border-gray-200/90 dark:border-[#333333] p-3.5 flex items-start gap-3 cursor-pointer hover:bg-gray-50/90 dark:hover:bg-[#222222] transition-all duration-200 transform animate-slideUp overflow-hidden"
          >
            {/* 1. Avatar with vector badge */}
            <div className="relative shrink-0 mt-0.5">
              <img
                src={avatarSrc}
                alt={primaryActor?.displayName || 'User'}
                className="w-11 h-11 rounded-full object-cover border border-gray-200 dark:border-[#383838] shadow-xs"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = DEFAULT_AVATAR_FALLBACK;
                }}
              />
              <span
                className={`absolute -bottom-1 -right-1 ${meta.badgeBg} rounded-full p-1 border-2 border-white dark:border-[#1A1A1A] shadow-xs flex items-center justify-center`}
              >
                {renderBadgeIcon(item.type)}
              </span>
            </div>

            {/* 2. Text Content */}
            <div className="flex-1 min-w-0 pr-5">
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <span className="text-[11px] font-black text-[#004AC6] dark:text-[#0095F6] uppercase tracking-wider">
                  Thông báo mới
                </span>
                <span className="text-[10px] text-gray-400 dark:text-[#7A7A7A]">
                  Vừa xong
                </span>
              </div>

              <p className="text-xs text-gray-900 dark:text-[#F5F5F5] font-semibold leading-snug line-clamp-2">
                {mainText}
              </p>

              {quoteSnippet && (
                <p className="mt-1 text-[11px] text-gray-600 dark:text-[#A0A0A0] italic bg-gray-100/90 dark:bg-[#282828] px-2 py-0.5 rounded-md border-l-2 border-[#004AC6] dark:border-[#0095F6] line-clamp-1">
                  &ldquo;{quoteSnippet}&rdquo;
                </p>
              )}
            </div>

            {/* 3. Right Thumbnail (if post has thumbnail) */}
            {item.target?.thumbnailUrl && (
              <div className="shrink-0 self-center">
                {isVideoMedia(item.target.thumbnailUrl) ? (
                  <div className="relative overflow-hidden rounded-xl">
                    <video
                      src={getMediaUrl(item.target.thumbnailUrl)}
                      className="w-11 h-11 rounded-xl object-cover border border-gray-200 dark:border-[#363636] shadow-xs bg-black"
                      muted
                      playsInline
                      preload="metadata"
                    />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none">
                      <span className="w-3.5 h-3.5 rounded-full bg-black/60 text-white flex items-center justify-center text-[7px] pl-0.5">
                        ▶
                      </span>
                    </div>
                  </div>
                ) : (
                  <img
                    src={getMediaUrl(item.target.thumbnailUrl)}
                    alt="Post thumbnail"
                    className="w-11 h-11 rounded-xl object-cover border border-gray-200 dark:border-[#363636] shadow-xs group-hover:scale-105 transition-transform"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}
              </div>
            )}

            {/* 4. Close (X) button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDismiss(id);
              }}
              className="absolute top-2.5 right-2.5 p-1 text-gray-400 hover:text-gray-700 dark:text-[#737373] dark:hover:text-[#D4D4D4] rounded-full hover:bg-gray-100 dark:hover:bg-[#2E2E2E] transition"
              aria-label="Đóng thông báo"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </aside>
  );
};
