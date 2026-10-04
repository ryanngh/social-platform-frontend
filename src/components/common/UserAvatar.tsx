import React from 'react';
import { getAvatarUrl, DEFAULT_AVATAR_FALLBACK } from '../../utils/media';
import { useUserPresence } from '../../contexts/PresenceContext';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import type { PresenceStatus } from '../../types';
import clsx from 'clsx';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'custom';

export interface UserAvatarProps {
  src?: string | null;
  alt?: string;
  userId?: string;
  size?: AvatarSize;
  showPresence?: boolean;
  showOfflineIndicator?: boolean;
  presenceStatus?: PresenceStatus;
  forceShowPresence?: boolean;
  isSelf?: boolean;
  className?: string;
  containerClassName?: string;
  badgeBorderClassName?: string;
  badgeClassName?: string;
  isVerified?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  title?: string;
}

const sizeConfig: Record<
  Exclude<AvatarSize, 'custom'>,
  {
    avatar: string;
    badge: string;
  }
> = {
  xs: {
    avatar: 'w-6 h-6',
    badge: 'w-2 h-2 border-[1.5px] -bottom-0.5 -right-0.5',
  },
  sm: {
    avatar: 'w-8 h-8',
    badge: 'w-2.5 h-2.5 border-[1.5px] -bottom-0.5 -right-0.5',
  },
  md: {
    avatar: 'w-10 h-10',
    badge: 'w-3 h-3 border-2 bottom-0 right-0',
  },
  lg: {
    avatar: 'w-12 h-12',
    badge: 'w-3.5 h-3.5 border-2 bottom-0 right-0',
  },
  xl: {
    avatar: 'w-14 h-14 sm:w-16 sm:h-16',
    badge: 'w-4 h-4 border-2 bottom-0.5 right-0.5',
  },
  '2xl': {
    avatar: 'w-24 h-24 sm:w-32 sm:h-32',
    badge: 'w-6 h-6 border-[3px] bottom-1.5 right-1.5',
  },
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  src,
  alt = 'Avatar',
  userId,
  size = 'md',
  showPresence = false,
  showOfflineIndicator: _showOfflineIndicator = false,
  presenceStatus,
  forceShowPresence = false,
  isSelf,
  className,
  containerClassName,
  badgeBorderClassName,
  badgeClassName,
  isVerified: _isVerified = false,
  onClick,
  title,
}) => {
  const { user: currentUser } = useAuth();
  const { language } = useLanguage();

  const isCurrentUser = isSelf ?? (currentUser?.id && userId ? currentUser.id === userId : false);
  const shouldTrackPresence = Boolean(userId && (forceShowPresence || !isCurrentUser) && showPresence);

  // Auto-subscribe to presence for this user via viewport hook
  const { status: trackedStatus } = useUserPresence(userId, shouldTrackPresence);

  // Effective status: explicit override prop takes precedence, otherwise tracked status
  const effectiveStatus: PresenceStatus = presenceStatus || (shouldTrackPresence ? trackedStatus : 'offline');
  const isOnline = effectiveStatus === 'online';
  const hasVisiblePresence = (forceShowPresence || !isCurrentUser) && showPresence && isOnline;

  const resolvedSize = size !== 'custom' ? sizeConfig[size] : null;

  const defaultBorderClass = badgeBorderClassName || 'border-white dark:border-[#121212]';

  const presenceLabel = language === 'vi' ? 'Đang hoạt động' : 'Active now';

  return (
    <div
      className={clsx(
        'relative inline-block flex-shrink-0 select-none',
        containerClassName
      )}
      onClick={onClick}
      title={title || (hasVisiblePresence ? `${alt} (${presenceLabel})` : alt)}
    >
      {/* Avatar Image */}
      <img
        src={getAvatarUrl(src)}
        alt={alt}
        className={clsx(
          'rounded-full object-cover border border-gray-100 dark:border-[#363636] shadow-xs transition-opacity duration-200',
          resolvedSize?.avatar,
          className
        )}
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = DEFAULT_AVATAR_FALLBACK;
        }}
      />

      {/* Online / Away / DND / Offline (Gray) Presence Indicator Badge */}
      {hasVisiblePresence && (
        <span
          role="status"
          aria-label={presenceLabel}
          className={clsx(
            'absolute rounded-full shadow-xs transition-all duration-200 z-10',
            defaultBorderClass,
            isOnline && 'bg-[#22c55e]',
            resolvedSize?.badge || 'w-3 h-3 border-2 bottom-0 right-0',
            badgeClassName
          )}
        />
      )}

    </div>
  );
};

export default UserAvatar;
