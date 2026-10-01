import type { NotificationType } from '../types';

/**
 * Format relative time for notifications
 */
export function formatNotificationTime(dateStr: string, lang: string = 'vi'): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  if (diffMs < 0) {
    return lang === 'vi' ? 'Vừa xong' : 'Just now';
  }

  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) {
    return lang === 'vi' ? 'Vừa xong' : 'Just now';
  }
  if (minutes < 60) {
    return lang === 'vi' ? `${minutes} phút trước` : `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return lang === 'vi' ? `${hours} giờ trước` : `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  if (days === 1) {
    return lang === 'vi' ? 'Hôm qua' : 'Yesterday';
  }
  if (days < 7) {
    return lang === 'vi' ? `${days} ngày trước` : `${days}d ago`;
  }

  const weeks = Math.floor(days / 7);
  if (weeks < 4) {
    return lang === 'vi' ? `${weeks} tuần trước` : `${weeks}w ago`;
  }

  return date.toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', {
    day: 'numeric',
    month: 'short',
  });
}

/**
 * Phân nhóm thông báo theo mốc thời gian (Hôm nay, Tuần này, Cũ hơn)
 */
export function getNotificationTimeGroup(dateStr: string): 'today' | 'this_week' | 'earlier' {
  if (!dateStr) return 'earlier';
  const date = new Date(dateStr);
  const now = new Date();

  // Kiểm tra cùng ngày
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();
  if (isToday) return 'today';

  // Kiểm tra trong vòng 7 ngày
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 7) return 'this_week';

  return 'earlier';
}

export function getTimeGroupTitle(group: 'today' | 'this_week' | 'earlier', lang: string = 'vi'): string {
  switch (group) {
    case 'today':
      return lang === 'vi' ? 'Hôm nay' : 'Today';
    case 'this_week':
      return lang === 'vi' ? 'Tuần này' : 'This week';
    case 'earlier':
      return lang === 'vi' ? 'Trước đó' : 'Earlier';
  }
}

/**
 * Tách nội dung preview thành phần hành động và phần trích dẫn quote (nếu có ": \"...\"")
 */
export function parsePreviewText(previewText: string): { mainText: string; quoteSnippet: string | null } {
  if (!previewText) return { mainText: '', quoteSnippet: null };

  const quoteMatch = previewText.match(/^(.*?)(?::\s*"([^"]+)")?$/s);
  if (quoteMatch && quoteMatch[2]) {
    return {
      mainText: quoteMatch[1].trim(),
      quoteSnippet: quoteMatch[2].trim(),
    };
  }

  return { mainText: previewText, quoteSnippet: null };
}

/**
 * Cấu hình màu sắc & biểu tượng theo từng loại thông báo
 */
export interface NotificationTypeMeta {
  badgeBg: string;
  badgeText: string;
  borderBadge: string;
  category: 'reaction' | 'comment' | 'mention' | 'friend' | 'repost' | 'share';
}

export function getNotificationTypeMeta(type: NotificationType): NotificationTypeMeta {
  switch (type) {
    case 'POST_REACTED':
    case 'COMMENT_REACTED':
      return {
        badgeBg: 'bg-rose-500',
        badgeText: 'text-white',
        borderBadge: 'border-white dark:border-[#121212]',
        category: 'reaction',
      };
    case 'POST_COMMENTED':
    case 'COMMENT_REPLIED':
      return {
        badgeBg: 'bg-emerald-500',
        badgeText: 'text-white',
        borderBadge: 'border-white dark:border-[#121212]',
        category: 'comment',
      };
    case 'USER_MENTIONED':
      return {
        badgeBg: 'bg-amber-500',
        badgeText: 'text-white',
        borderBadge: 'border-white dark:border-[#121212]',
        category: 'mention',
      };
    case 'USER_FOLLOWED':
    case 'FRIEND_REQUEST':
      return {
        badgeBg: 'bg-blue-600',
        badgeText: 'text-white',
        borderBadge: 'border-white dark:border-[#121212]',
        category: 'friend',
      };
    case 'POST_REPOSTED':
      return {
        badgeBg: 'bg-teal-500',
        badgeText: 'text-white',
        borderBadge: 'border-white dark:border-[#121212]',
        category: 'repost',
      };
    case 'POST_SHARED':
      return {
        badgeBg: 'bg-sky-500',
        badgeText: 'text-white',
        borderBadge: 'border-white dark:border-[#121212]',
        category: 'share',
      };
    default:
      return {
        badgeBg: 'bg-gray-500',
        badgeText: 'text-white',
        borderBadge: 'border-white dark:border-[#121212]',
        category: 'reaction',
      };
  }
}
