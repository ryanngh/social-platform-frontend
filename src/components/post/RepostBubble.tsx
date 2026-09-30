import React, { useState } from 'react';
import { Repeat2 } from 'lucide-react';
import type { PostAuthor, RepostUserEntry, User } from '../../types';
import { getAvatarUrl, DEFAULT_AVATAR_FALLBACK } from '../../utils/media';
import { useAuth } from '../../contexts/AuthContext';

export interface RepostBubbleProps {
  repostedByFollowing?: RepostUserEntry[] | PostAuthor[];
  repostCount: number;
  isRepostedByMe?: boolean;
  myCaption?: string | null;
  currentUser?: User | PostAuthor | null;
  language?: string;
  onOpenReposters?: () => void;
  onOpenWriteCaption?: () => void;
}

interface NormalizedReposter {
  user: PostAuthor;
  caption?: string | null;
}

/**
 * RepostBubble — Floating social activity bubble with Instagram Thought Note on Avatar:
 * - Thought bubble (speech/thought balloon) positioned right on top of user avatar
 * - Overlapping avatars stack if multiple reposters
 * - Purple gradient badge (🔁) at the bottom-right of the avatar
 * - Authentic thought bubble tail with comic circles
 * - Displays context / caption directly from repostedByFollowing API
 * - Gentle floating bobbing animation (animate-float)
 * - Click > 3 opens reposters list modal; <= 3 opens write/edit caption modal
 */
export const RepostBubble: React.FC<RepostBubbleProps> = ({
  repostedByFollowing = [],
  repostCount,
  isRepostedByMe = false,
  myCaption,
  currentUser: propUser,
  language = 'vi',
  onOpenReposters,
  onOpenWriteCaption,
}) => {
  const { user: authUser } = useAuth();
  const effectiveUser = propUser !== undefined ? propUser : authUser;
  const isVi = language === 'vi';
  const [activeAvatarIndex, setActiveAvatarIndex] = useState<number>(0);

  // Chuẩn hóa danh sách repostedByFollowing
  const normalizedList: NormalizedReposter[] = (repostedByFollowing || []).map((item: any) => {
    if (item && 'user' in item && item.user) {
      return {
        user: item.user,
        caption: item.caption ?? null,
      };
    }
    return {
      user: item,
      caption: null,
    };
  });

  // Lọc ra các following khác để tránh trùng lặp chính account hiện tại
  const otherReposters = normalizedList.filter(
    (r) => r.user.id !== effectiveUser?.id && r.user.username !== effectiveUser?.username
  );

  // Không có ai repost và mình cũng chưa repost => không hiển thị
  if (!isRepostedByMe && otherReposters.length === 0 && repostCount <= 0) {
    return null;
  }

  // Tạo thông tin author cho chính mình nếu đã repost
  const myAuthor: PostAuthor | null = isRepostedByMe && effectiveUser
    ? {
        id: effectiveUser.id,
        username: effectiveUser.username,
        firstName: effectiveUser.firstName || '',
        lastName: effectiveUser.lastName || '',
        fullName:
          ('fullName' in effectiveUser && effectiveUser.fullName)
            ? effectiveUser.fullName
            : [effectiveUser.firstName, effectiveUser.lastName].filter(Boolean).join(' ') ||
              effectiveUser.username,
        avatarUrl: effectiveUser.avatarUrl || null,
      }
    : null;

  const myReposter: NormalizedReposter | null = myAuthor
    ? {
        user: myAuthor,
        caption: myCaption ?? null,
      }
    : null;

  // Danh sách reposter hiển thị (tối đa 3 avatar)
  const displayReposters: NormalizedReposter[] = myReposter
    ? [myReposter, ...otherReposters].slice(0, 3)
    : otherReposters.slice(0, 3);

  if (displayReposters.length === 0) {
    return null;
  }

  // Số lượng còn lại ngoài các avatar đang hiển thị
  const remainingCount = Math.max(0, repostCount - displayReposters.length);
  const hasMoreThan3 = repostCount > 3 || remainingCount > 0;

  // Lấy reposter đang active (mặc định là index 0)
  const currentReposter = displayReposters[activeAvatarIndex] || displayReposters[0];
  const isCurrentMe = isRepostedByMe && activeAvatarIndex === 0;

  // Xác định nội dung text hiển thị trong Bong bóng suy nghĩ (Thought Bubble)
  let bubbleText = '';
  if (isCurrentMe) {
    if (myCaption && myCaption.trim()) {
      bubbleText = myCaption.trim();
    } else {
      bubbleText = isVi ? 'Thả suy nghĩ...' : 'Add a thought...';
    }
  } else if (currentReposter && currentReposter.caption && currentReposter.caption.trim()) {
    // Có caption trực tiếp từ API backend!
    bubbleText = currentReposter.caption.trim();
  } else if (otherReposters.length > 0) {
    const friend = currentReposter?.user || otherReposters[0].user;
    const friendName = friend.firstName || friend.username;
    if (otherReposters.length === 1 && remainingCount === 0) {
      bubbleText = isVi ? `${friendName} đã repost` : `${friendName} reposted`;
    } else if (otherReposters.length === 2 && remainingCount === 0) {
      const friend2 = otherReposters[1].user.firstName || otherReposters[1].user.username;
      bubbleText = `${friendName}, ${friend2}`;
    } else {
      bubbleText = isVi
        ? `${friendName} +${repostCount - 1} khác`
        : `${friendName} +${repostCount - 1} others`;
    }
  } else {
    bubbleText = isVi ? 'Đã repost' : 'Reposted';
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasMoreThan3) {
      onOpenReposters?.();
    } else {
      onOpenWriteCaption?.();
    }
  };

  return (
    <div
      onClick={handleClick}
      className="absolute bottom-4 left-4 z-20 pointer-events-auto cursor-pointer select-none animate-fadeIn animate-float group/bubble"
      title={
        hasMoreThan3
          ? isVi ? 'Bấm để xem danh sách người đã repost' : 'Click to view repost list'
          : isVi ? 'Bấm để viết/chỉnh sửa suy nghĩ của bạn' : 'Click to write/edit your thought'
      }
    >
      <div className="relative flex flex-col items-start transition-transform duration-200 group-hover/bubble:scale-[1.04]">
        {/* Instagram Thought Bubble (Bong bóng suy nghĩ trên Avatar) */}
        <div className="relative mb-2.5 ml-1">
          {/* Bubble Box */}
          <div className="bg-[#242528]/95 dark:bg-[#1C1D20]/95 text-white/95 backdrop-blur-md rounded-[16px] px-3 py-1.5 shadow-xl border border-white/15 max-w-[140px] sm:max-w-[170px] min-w-[70px] text-center">
            <p className="text-[11px] sm:text-xs font-medium leading-tight line-clamp-2 break-words text-white">
              {bubbleText}
            </p>
          </div>

          {/* Comic Thought Bubble Tail Dots (Chấm tròn đuôi bong bóng suy nghĩ kiểu Instagram) */}
          {/* Chấm tròn nhỡ */}
          <div className="absolute -bottom-1.5 left-3.5 w-2.5 h-2.5 rounded-full bg-[#242528] dark:bg-[#1C1D20] border border-white/15 shadow-sm" />
          {/* Chấm tròn nhỏ sát avatar */}
          <div className="absolute -bottom-3 left-2 w-1.5 h-1.5 rounded-full bg-[#242528] dark:bg-[#1C1D20] border border-white/15 shadow-sm" />
        </div>

        {/* Avatars Container */}
        <div className="flex items-center">
          {/* Overlapping Avatar Stack */}
          <div className="flex items-center -space-x-3">
            {displayReposters.map((reposter, idx) => {
              const user = reposter.user;
              const isMainAvatar = idx === 0;
              const isActive = idx === activeAvatarIndex;
              return (
                <div
                  key={user.id || idx}
                  className="relative block flex-shrink-0"
                  style={{ zIndex: 3 - idx }}
                  onMouseEnter={(e) => {
                    e.stopPropagation();
                    setActiveAvatarIndex(idx);
                  }}
                >
                  {/* User Circular Avatar */}
                  <img
                    src={getAvatarUrl(user.avatarUrl)}
                    alt={user.username}
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border-2 shadow-lg shadow-black/40 bg-zinc-800 transition-all ${
                      isActive
                        ? 'border-purple-400 dark:border-purple-400 scale-105'
                        : 'border-white dark:border-[#121212]'
                    }`}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = DEFAULT_AVATAR_FALLBACK;
                    }}
                  />

                  {/* Purple Gradient Repost Badge on the primary avatar (như Instagram) */}
                  {isMainAvatar && (
                    <div
                      className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-tr from-[#7B2CBF] via-[#8338EC] to-[#C77DFF] text-white flex items-center justify-center shadow-md border-2 border-white dark:border-[#121212]"
                      title={isVi ? 'Đã repost' : 'Reposted'}
                    >
                      <Repeat2 className="w-2.5 h-2.5 text-white stroke-[2.5]" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* +N Badge if more than 3 reposters */}
          {remainingCount > 0 && (
            <span className="ml-2 text-[11px] font-bold text-white px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 shadow-md flex items-center justify-center">
              +{remainingCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default RepostBubble;
