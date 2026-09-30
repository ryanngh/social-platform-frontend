import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getAvatarUrl, DEFAULT_AVATAR_FALLBACK } from '../../utils/media';
import { getProfileUrl } from '../../utils/user';
import { userService } from '../../services/userService';
import { friendService } from '../../services/friendService';
import type { UserSummary } from '../../types';
import UserAvatar from '../common/UserAvatar';

const StoriesCarousel: React.FC = () => {
  const { user } = useAuth();
  const [userList, setUserList] = useState<UserSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!user?.id) return;

    let isMounted = true;
    setIsLoading(true);

    const loadUsers = async () => {
      try {
        // Fetch following users first
        const followingRes = await userService.getFollowing(user.id, { page: 0, size: 25 });
        if (isMounted && followingRes.content && followingRes.content.length > 0) {
          setUserList(followingRes.content);
          return;
        }

        // Fallback to friends if following list is empty
        const friendsRes = await friendService.getMyFriends({ page: 0, size: 25 });
        if (isMounted && friendsRes.content && friendsRes.content.length > 0) {
          const mapped: UserSummary[] = friendsRes.content.map((f) => ({
            id: f.id,
            username: f.username,
            firstName: f.firstName,
            lastName: f.lastName,
            fullName: `${f.firstName || ''} ${f.lastName || ''}`.trim() || f.username,
            avatarUrl: f.avatarUrl || null,
          }));
          setUserList(mapped);
        }
      } catch (err) {
        console.warn('[StoriesCarousel] Failed to load horizontal users list:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadUsers();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  return (
    <section className="bg-white dark:bg-[#121212] rounded-3xl p-4 shadow-sm border border-gray-100 dark:border-[#262626] flex items-center overflow-x-auto custom-scrollbar transition-colors duration-200">
      <div className="flex items-center gap-6 px-2 py-1 overflow-x-auto custom-scrollbar">
        {/* Story 1: Tạo tin (Current User) */}
        <div className="flex flex-col items-center cursor-pointer flex-shrink-0 group">
          <div className="relative w-16 h-16">
            <img
              alt="Tạo tin"
              className="w-16 h-16 rounded-full object-cover border border-gray-100 dark:border-[#363636] shadow-sm group-hover:opacity-90 transition"
              src={getAvatarUrl(user?.avatarUrl)}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = DEFAULT_AVATAR_FALLBACK;
              }}
            />
            <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-[#004AC6] dark:bg-[#0095F6] text-white flex items-center justify-center text-xs font-bold border-2 border-white dark:border-[#121212] shadow-sm">
              <Plus className="w-3 h-3 stroke-[3]" />
            </div>
          </div>
          <span className="text-xs font-medium text-gray-700 dark:text-[#D4D4D4] text-center mt-2">
            Tạo tin
          </span>
        </div>

        {/* Loading Skeletons */}
        {isLoading && userList.length === 0 && (
          <>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col items-center flex-shrink-0 animate-pulse">
                <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-[#262626]" />
                <div className="h-3 w-12 bg-gray-200 dark:bg-[#262626] rounded-full mt-2" />
              </div>
            ))}
          </>
        )}

        {/* Horizontal User List with Presence Indicator */}
        {userList.map((item) => {
          const displayName =
            item.fullName?.split(' ')[0] ||
            item.firstName ||
            item.username ||
            'User';

          return (
            <Link
              key={item.id}
              to={getProfileUrl(item)}
              className="flex flex-col items-center cursor-pointer flex-shrink-0 group"
            >
              <div className="relative">
                <UserAvatar
                  userId={item.id}
                  src={item.avatarUrl}
                  alt={item.fullName || item.username}
                  size="xl"
                  className="w-16 h-16 object-cover border border-gray-100 dark:border-[#363636] shadow-sm group-hover:opacity-90 transition"
                />
              </div>
              <span className="text-xs font-medium text-gray-700 dark:text-[#D4D4D4] text-center mt-2 truncate max-w-[68px]">
                {displayName}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default StoriesCarousel;
