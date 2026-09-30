import React from 'react';
import { Heart, MessageCircle, AtSign, UserPlus, Bell, Check, CheckCheck } from 'lucide-react';
import type { NotificationItem, NotificationType } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { getAvatarUrl, DEFAULT_AVATAR_FALLBACK } from '../../utils/media';
import {
  formatNotificationTime,
  parsePreviewText,
  getNotificationTypeMeta,
} from '../../utils/notification';

interface NotificationItemComponentProps {
  item: NotificationItem;
  onClick: (item: NotificationItem) => void;
  onToggleRead?: (e: React.MouseEvent, item: NotificationItem) => void;
  variant?: 'popup' | 'full';
}

export const NotificationItemComponent: React.FC<NotificationItemComponentProps> = ({
  item,
  onClick,
  onToggleRead,
  variant = 'popup',
}) => {
  const { language } = useLanguage();
  const meta = getNotificationTypeMeta(item.type);
  const { mainText, quoteSnippet } = parsePreviewText(item.previewText);

  // Render vector badge on top of avatar
  const renderBadgeIcon = (type: NotificationType) => {
    switch (type) {
      case 'POST_REACTED':
      case 'COMMENT_REACTED':
        return <Heart className="w-2.5 h-2.5 fill-current" />;
      case 'POST_COMMENTED':
      case 'COMMENT_REPLIED':
        return <MessageCircle className="w-2.5 h-2.5 fill-current" />;
      case 'USER_MENTIONED':
        return <AtSign className="w-2.5 h-2.5 stroke-[2.5]" />;
      case 'USER_FOLLOWED':
      case 'FRIEND_REQUEST':
        return <UserPlus className="w-2.5 h-2.5 stroke-[2.5]" />;
      default:
        return <Bell className="w-2.5 h-2.5" />;
    }
  };

  const primaryActor = item.latestActors?.[0];
  const avatarSrc = getAvatarUrl(primaryActor?.avatarUrl);
  const timeFormatted = formatNotificationTime(item.updatedAt, language);

  const isFull = variant === 'full';

  return (
    <div
      onClick={() => onClick(item)}
      className={`group relative flex items-start gap-3.5 transition-all duration-150 cursor-pointer ${
        isFull
          ? 'p-4 sm:p-5 rounded-2xl hover:bg-gray-50/90 dark:hover:bg-[#1A1A1A] border border-transparent'
          : 'p-3.5 hover:bg-gray-50/90 dark:hover:bg-[#1A1A1A]'
      } ${
        !item.isRead
          ? 'bg-blue-50/40 dark:bg-blue-950/20'
          : 'bg-white dark:bg-[#121212]'
      }`}
    >
      {/* 1. Left Avatar with vector icon badge */}
      <div className="relative shrink-0 mt-0.5">
        <img
          src={avatarSrc}
          alt={primaryActor?.displayName || 'User'}
          className={`${
            isFull ? 'w-12 h-12' : 'w-10 h-10'
          } rounded-full object-cover border border-gray-200/80 dark:border-[#333333] shadow-xs`}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = DEFAULT_AVATAR_FALLBACK;
          }}
        />

        {/* Small badge icon */}
        <span
          className={`absolute -bottom-1 -right-1 ${meta.badgeBg} ${meta.badgeText} rounded-full p-1 border-2 ${meta.borderBadge} shadow-xs flex items-center justify-center`}
        >
          {renderBadgeIcon(item.type)}
        </span>

        {/* Multiple actors count indicator */}
        {item.actorCount > 1 && (
          <span className="absolute -top-1 -right-1 bg-gray-800 text-white text-[9px] font-bold px-1 rounded-full border border-white dark:border-[#121212]">
            +{item.actorCount - 1}
          </span>
        )}
      </div>

      {/* 2. Middle Content Preview */}
      <div className="flex-1 min-w-0 pr-1">
        <div className="text-gray-900 dark:text-[#F5F5F5] leading-snug">
          <p className={`${isFull ? 'text-sm' : 'text-xs'} text-gray-800 dark:text-[#E0E0E0] line-clamp-2`}>
            {mainText}
          </p>

          {/* Quoted Snippet if exists */}
          {quoteSnippet && (
            <div
              className={`mt-1.5 px-2.5 py-1 rounded-xl bg-gray-100/80 dark:bg-[#202020] text-gray-600 dark:text-[#B0B0B0] italic border-l-2 border-[#004AC6] dark:border-[#0095F6] ${
                isFull ? 'text-xs max-w-xl' : 'text-[11px]'
              } line-clamp-2`}
            >
              &ldquo;{quoteSnippet}&rdquo;
            </div>
          )}
        </div>

        {/* Relative Timestamp */}
        <div className="flex items-center gap-2 mt-1.5 text-[11px] text-gray-400 dark:text-[#7E7E7E]">
          <span>{timeFormatted}</span>
        </div>
      </div>

      {/* 3. Right Thumbnail (if post/comment has image) */}
      {item.target?.thumbnailUrl && (
        <div className="shrink-0 self-center">
          <img
            src={item.target.thumbnailUrl}
            alt="Thumbnail"
            className={`${
              isFull ? 'w-14 h-14 rounded-xl' : 'w-11 h-11 rounded-lg'
            } object-cover border border-gray-200 dark:border-[#2F2F2F] shadow-xs group-hover:scale-105 transition-transform duration-200`}
          />
        </div>
      )}

      {/* 4. Unread Blue Indicator Dot & Quick Actions */}
      <div className="shrink-0 flex items-center gap-2 mt-1.5 self-center">
        {!item.isRead && (
          <span
            className="w-2.5 h-2.5 rounded-full bg-[#004AC6] dark:bg-[#0095F6] shrink-0"
            title="Chưa đọc"
          />
        )}

        {/* Action button on hover in full view */}
        {isFull && onToggleRead && (
          <button
            type="button"
            onClick={(e) => onToggleRead(e, item)}
            className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-gray-700 dark:text-[#888888] dark:hover:text-[#F5F5F5] rounded-full hover:bg-gray-100 dark:hover:bg-[#2A2A2A] transition"
            title={item.isRead ? 'Đánh dấu chưa đọc' : 'Đánh dấu đã đọc'}
          >
            {item.isRead ? <Check className="w-4 h-4" /> : <CheckCheck className="w-4 h-4 text-blue-500" />}
          </button>
        )}
      </div>
    </div>
  );
};
