import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, Navigate } from 'react-router-dom';
import { 
  User as UserIcon, 
  MapPin, 
  Link2, 
  Calendar, 
  ArrowLeft 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { userService } from '../services/userService';
import { closeFriendService } from '../services/closeFriendService';
import { relationshipService } from '../services/relationshipService';
import type { User } from '../types';
import TopNavBar from '../components/layouts/TopNavBar';
import MobileBottomNav from '../components/layouts/MobileBottomNav';
import ProfileInfoCard from '../components/profile/ProfileInfoCard';
import ProfileBookmarksCard from '../components/profile/ProfileBookmarksCard';
import ProfileHeader from '../components/profile/ProfileHeader';
import ProfileTabs from '../components/profile/ProfileTabs';
import ProfileRightSidebar from '../components/profile/ProfileRightSidebar';
import EditProfileModal from '../components/profile/EditProfileModal';
import ProfileSkeleton from '../components/profile/ProfileSkeleton';
import FollowListModal, { type FollowListType } from '../components/profile/FollowListModal';
import UnfollowConfirmModal from '../components/profile/UnfollowConfirmModal';
import BlockUserModal from '../components/profile/BlockUserModal';
import BlockedProfileView from '../components/profile/BlockedProfileView';
import UnblockConfirmModal from '../components/profile/UnblockConfirmModal';
import toast from 'react-hot-toast';

export const ProfilePage = () => {
  const { identifier } = useParams<{ identifier?: string }>();
  const { user: currentUser } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Posts');
  
  // Follow state
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowPending, setIsFollowPending] = useState(false);
  const [isUnfollowModalOpen, setIsUnfollowModalOpen] = useState(false);

  // Close friend state
  const [isCloseFriend, setIsCloseFriend] = useState(false);
  const [isCloseFriendPending, setIsCloseFriendPending] = useState(false);

  // Block user modal state
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [isBlockPending, setIsBlockPending] = useState(false);

  // Blocked status and unblock state
  const [isBlockedByMe, setIsBlockedByMe] = useState(false);
  const [isBlockedByThem, setIsBlockedByThem] = useState(false);
  const [isUnblockModalOpen, setIsUnblockModalOpen] = useState(false);
  const [isUnblockPending, setIsUnblockPending] = useState(false);

  // Follow list modal state
  const [followModal, setFollowModal] = useState<{
    isOpen: boolean;
    type: FollowListType;
  }>({
    isOpen: false,
    type: 'followers',
  });
  const [searchQuery, setSearchQuery] = useState('');

  // If user visits /profile without identifier, redirect to own username
  if (!identifier && currentUser?.username) {
    return <Navigate to={`/${currentUser.username}`} replace />;
  }

  const isOwnProfile =
    !identifier || (currentUser && (identifier === currentUser.username || identifier === currentUser.id));

  useEffect(() => {
    let isMounted = true;

    const fetchUser = async () => {
      setIsLoading(true);
      setIsNotFound(false);
      setIsBlockedByMe(false);
      setIsBlockedByThem(false);
      try {
        if (isOwnProfile) {
          const profile = await userService.getMyProfile();
          if (isMounted) {
            setUser(profile);
            setIsFollowing(false);
            setIsCloseFriend(false);
            setIsBlockedByMe(false);
            setIsBlockedByThem(false);
          }
        } else if (identifier) {
          try {
            const profile = await userService.getUserByIdentifier(identifier);
            if (isMounted) {
              setUser(profile);
              setIsFollowing(Boolean(profile.isFollowing));
              if (profile.isBlocked) {
                setIsBlockedByMe(true);
              }
              if (profile.isBlockedBy) {
                setIsBlockedByThem(true);
                setIsFollowing(false);
                setIsCloseFriend(false);
              }
              // Check blocked status if profile has id
              if (profile.id && !profile.isBlocked) {
                relationshipService.checkIsBlocked(profile.id).then((blocked) => {
                  if (isMounted && blocked) {
                    setIsBlockedByMe(true);
                  }
                }).catch(() => {});

                // Check close friend status if profile has id
                closeFriendService.checkIsCloseFriend(profile.id).then((inCloseFriends) => {
                  if (isMounted) {
                    setIsCloseFriend(inCloseFriends);
                  }
                }).catch(() => {});
              }
            }
          } catch (err: any) {
            if (err?.response?.status === 403) {
              // Blocked by them (target user blocked current user)
              if (isMounted) {
                setIsBlockedByThem(true);
                setUser({
                  id: identifier,
                  username: identifier,
                  firstName: '',
                  lastName: identifier,
                });
                setIsFollowing(false);
                setIsCloseFriend(false);
              }
              return;
            }
            throw err;
          }
        }
      } catch (err) {
        console.warn('Error loading profile from API:', err);
        if (isOwnProfile && currentUser) {
          if (isMounted) {
            setUser(currentUser);
            setIsFollowing(false);
            setIsCloseFriend(false);
            setIsBlockedByMe(false);
            setIsBlockedByThem(false);
          }
        } else {
          if (isMounted) {
            setUser(null);
            setIsNotFound(true);
            setIsFollowing(false);
            setIsCloseFriend(false);
            setIsBlockedByMe(false);
            setIsBlockedByThem(false);
          }
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchUser();

    return () => {
      isMounted = false;
    };
  }, [identifier, isOwnProfile, currentUser]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim().replace(/^@/, '');
    if (q) {
      setSearchQuery('');
      navigate(`/${q}`);
    }
  };

  const displayUser: User = user || currentUser || {
    id: 'user',
    username: identifier || 'user',
    firstName: 'Người',
    lastName: 'dùng',
  };

  const displayName =
    [displayUser.firstName, displayUser.lastName].filter(Boolean).join(' ') ||
    displayUser.username ||
    'User';

  /**
   * Handle initial follow button click (when not following)
   */
  const handleFollowToggle = async () => {
    if (!displayUser?.id || isFollowPending || isOwnProfile) return;

    if (isFollowing) {
      // If already following, opening the unfollow modal
      setIsUnfollowModalOpen(true);
      return;
    }

    // Follow action
    setIsFollowPending(true);
    setIsFollowing(true);
    setUser((prev) => {
      if (!prev) return prev;
      const curCount = prev.followerCount ?? prev.followersCount ?? 0;
      return {
        ...prev,
        isFollowing: true,
        followerCount: curCount + 1,
        followersCount: curCount + 1,
      };
    });

    try {
      await userService.followUser(displayUser.id);
      toast.success(t('profile.following', { defaultValue: 'Đang theo dõi' }));
    } catch (err) {
      console.error('Failed to follow user:', err);
      // Revert optimistic update
      setIsFollowing(false);
      setUser((prev) => {
        if (!prev) return prev;
        const curCount = prev.followerCount ?? prev.followersCount ?? 0;
        return {
          ...prev,
          isFollowing: false,
          followerCount: Math.max(0, curCount - 1),
          followersCount: Math.max(0, curCount - 1),
        };
      });
      toast.error(t('profile.followFailed', { defaultValue: 'Thao tác không thành công, vui lòng thử lại sau' }));
    } finally {
      setIsFollowPending(false);
    }
  };

  /**
   * Handle confirmed unfollow action
   */
  const handleConfirmUnfollow = async () => {
    if (!displayUser?.id || isFollowPending) return;

    setIsFollowPending(true);
    try {
      await userService.unfollowUser(displayUser.id);
      setIsFollowing(false);
      setIsCloseFriend(false); // Side-effect: unfollow cleans close friends relationship
      setUser((prev) => {
        if (!prev) return prev;
        const curCount = prev.followerCount ?? prev.followersCount ?? 0;
        const nextCount = Math.max(0, curCount - 1);
        return {
          ...prev,
          isFollowing: false,
          followerCount: nextCount,
          followersCount: nextCount,
        };
      });
      setIsUnfollowModalOpen(false);
      toast.success(t('profile.unfollowSuccess', { username: displayUser.username, defaultValue: `Đã hủy theo dõi @${displayUser.username}` }));
    } catch (err) {
      console.error('Failed to unfollow user:', err);
      toast.error(t('profile.followFailed', { defaultValue: 'Thao tác không thành công, vui lòng thử lại sau' }));
    } finally {
      setIsFollowPending(false);
    }
  };

  /**
   * Toggle Close Friend status
   */
  const handleToggleCloseFriend = async () => {
    if (!displayUser?.id || isCloseFriendPending) return;

    const previousState = isCloseFriend;
    const nextState = !previousState;

    setIsCloseFriend(nextState);
    setIsCloseFriendPending(true);

    try {
      if (nextState) {
        await closeFriendService.addCloseFriend(displayUser.id);
        toast.success(
          t('profile.addedToCloseFriendsToast', {
            name: displayName,
            defaultValue: `Đã thêm ${displayName} vào danh sách Bạn thân ⭐`,
          }),
          { icon: '⭐' }
        );
      } else {
        await closeFriendService.removeCloseFriend(displayUser.id);
        toast.success(
          t('profile.removedFromCloseFriendsToast', {
            name: displayName,
            defaultValue: `Đã xóa ${displayName} khỏi danh sách Bạn thân`,
          })
        );
      }
    } catch (err: any) {
      console.error('Failed to toggle close friend:', err);
      setIsCloseFriend(previousState);
      const msg = err?.response?.data?.message || 'Không thể cập nhật danh sách bạn thân';
      toast.error(msg);
    } finally {
      setIsCloseFriendPending(false);
    }
  };

  /**
   * Handle confirmed block user action
   */
  const handleConfirmBlock = async () => {
    if (!displayUser?.id || isBlockPending) return;

    setIsBlockPending(true);
    try {
      await relationshipService.blockUser(displayUser.id);
      setIsBlockedByMe(true);
      setIsFollowing(false);
      setIsCloseFriend(false);
      setUser((prev) => {
        if (!prev) return prev;
        const curCount = prev.followerCount ?? prev.followersCount ?? 0;
        return {
          ...prev,
          isFollowing: false,
          isBlocked: true,
          followerCount: Math.max(0, curCount - 1),
          followersCount: Math.max(0, curCount - 1),
        };
      });
      setIsBlockModalOpen(false);
      toast.success(
        t('profile.blockSuccess', {
          username: displayUser.username,
          defaultValue: `Đã chặn @${displayUser.username}`,
        })
      );
    } catch (err: any) {
      console.error('Failed to block user:', err);
      const msg = err?.response?.data?.message || 'Không thể chặn người dùng';
      toast.error(msg);
    } finally {
      setIsBlockPending(false);
    }
  };

  /**
   * Handle confirmed unblock user action
   */
  const handleConfirmUnblock = async () => {
    if (!displayUser?.id || isUnblockPending) return;

    setIsUnblockPending(true);
    try {
      await relationshipService.unblockUser(displayUser.id);
      setIsBlockedByMe(false);
      setUser((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          isBlocked: false,
        };
      });
      setIsUnblockModalOpen(false);
      toast.success(
        t('profile.unblockSuccess', {
          username: displayUser.username,
          defaultValue: `Đã bỏ chặn @${displayUser.username}`,
        })
      );
    } catch (err: any) {
      console.error('Failed to unblock user:', err);
      const msg = err?.response?.data?.message || 'Không thể bỏ chặn người dùng';
      toast.error(msg);
    } finally {
      setIsUnblockPending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9FB] dark:bg-[#000000] text-[#1A1C1E] dark:text-[#F5F5F5] flex flex-col font-sans">
      {/* Fixed/Sticky Top Navigation Bar */}
      <TopNavBar />

      {/* If blocked by them, show Instagram-style Page Unavailable view */}
      {isBlockedByThem ? (
        <main className="flex-1 max-w-[720px] w-full mx-auto px-4 pt-28 pb-16 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#EDEDF8] dark:bg-[#1A1A1A] flex items-center justify-center mb-6">
            <Link2 className="w-8 h-8 sm:w-10 sm:h-10 text-[#8C93A8] dark:text-[#A8A8A8]" />
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-[#1A1C1E] dark:text-[#F5F5F5] mb-3 tracking-tight">
            {t('profile.pageUnavailableTitle', { defaultValue: 'Rất tiếc, trang này hiện không khả dụng.' })}
          </h2>

          <p className="text-sm sm:text-base text-[#535F70] dark:text-[#A8A8A8] max-w-md mb-8 leading-relaxed">
            {t('profile.pageUnavailableDesc', {
              defaultValue: 'Liên kết bạn theo dõi có thể bị hỏng hoặc trang này có thể đã bị gỡ.',
            })}{' '}
            <Link
              to="/feed"
              className="text-[#004AC6] dark:text-[#0095F6] hover:underline font-semibold cursor-pointer"
            >
              {t('profile.goBackToApp', { defaultValue: 'Quay lại RySocial.' })}
            </Link>
          </p>

          <Link
            to="/feed"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#004AC6] hover:bg-[#003da3] dark:bg-[#0095F6] dark:hover:bg-[#1877F2] text-white font-semibold text-sm shadow-sm transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('profile.returnToFeed', { defaultValue: 'Quay lại Bảng tin' })}</span>
          </Link>
        </main>
      ) : (
        /* Main 3-Column Profile Container matching standard app layout */
        <main className="max-w-[1340px] w-full mx-auto pt-20 pb-16 px-3 sm:px-4 flex justify-center gap-5 lg:gap-6 items-start">
          {/* Left Column: Profile Info & Saved Bookmarks (hidden on mobile, sticky when scrolling) */}
          <aside className="hidden md:block w-[260px] flex-shrink-0 sticky top-20 self-start max-h-[calc(100vh-6rem)] overflow-y-auto custom-scrollbar space-y-4" data-purpose="sidebar-column">
            {isLoading ? (
              <div className="bg-white dark:bg-[#121212] border border-gray-100 dark:border-[#262626] rounded-3xl p-5 shadow-sm animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 dark:bg-[#262626] rounded w-1/3"></div>
                <div className="h-3 bg-gray-100 dark:bg-[#1A1A1A] rounded w-full"></div>
                <div className="h-3 bg-gray-100 dark:bg-[#1A1A1A] rounded w-2/3"></div>
              </div>
            ) : isNotFound ? (
              <section className="bg-white dark:bg-[#121212] border border-gray-100 dark:border-[#262626] rounded-3xl p-5 shadow-sm text-center">
                <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/40 text-red-500 dark:text-red-400 mx-auto flex items-center justify-center mb-3">
                  <UserIcon className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-[#1A1C1E] dark:text-[#F5F5F5] mb-1">
                  {t('profile.profileUnavailableTitle')}
                </h3>
                <p className="text-xs text-[#535F70] dark:text-[#A8A8A8] mb-4">
                  {t('profile.profileUnavailableDesc')}
                </p>

                <div className="border-t border-[#E2E2EC] dark:border-[#262626] pt-3 text-xs text-[#535F70] dark:text-[#A8A8A8] space-y-2 text-left">
                  <div className="flex items-center gap-2.5 text-gray-400 dark:text-[#737373] italic">
                    <MapPin className="w-4 h-4 text-[#8C93A8] dark:text-[#737373] shrink-0" />
                    <span>{t('profile.locationUnavailable')}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-gray-400 dark:text-[#737373] italic">
                    <Link2 className="w-4 h-4 text-[#8C93A8] dark:text-[#737373] shrink-0" />
                    <span>{t('profile.noLinkAvailable')}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-gray-400 dark:text-[#737373] italic">
                    <Calendar className="w-4 h-4 text-[#8C93A8] dark:text-[#737373] shrink-0" />
                    <span>{t('profile.joinedDateUnknown')}</span>
                  </div>
                </div>

                {/* Notice Box */}
                <div className="mt-4 p-3.5 bg-[#F9F9FB] dark:bg-[#121212]/50 border border-[#E2E2EC] dark:border-[#262626] rounded-xl text-left">
                  <p className="text-xs text-[#535F70] dark:text-[#A8A8A8] leading-relaxed">
                    {t('profile.accountDeactivatedNotice')}
                  </p>
                </div>
              </section>
            ) : (
              <ProfileInfoCard user={displayUser} />
            )}

            <ProfileBookmarksCard />
          </aside>

          {/* Center Column */}
          <div className="w-full max-w-[640px] flex-shrink-0 min-w-0 space-y-4" data-purpose="feed-column">
            {isLoading ? (
              <ProfileSkeleton />
            ) : isNotFound ? (
              /* 404 User Not Found Center Card matching design */
              <div className="bg-white dark:bg-[#121212] border border-gray-100 dark:border-[#262626] rounded-3xl p-8 sm:p-12 flex flex-col items-center justify-center text-center shadow-sm">
                {/* Circle avatar placeholder */}
                <div className="w-20 h-20 rounded-full bg-[#EDEDF8] dark:bg-[#1A1A1A] flex items-center justify-center mb-5">
                  <UserIcon className="w-10 h-10 text-[#8C93A8] dark:text-[#A8A8A8]" />
                </div>

                {/* Red pill badge */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200/80 dark:border-red-900/60 mb-4">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  <span>Error 404 • Profile Not Found</span>
                </div>

                {/* Headline */}
                <h2 className="text-2xl sm:text-3xl font-bold text-[#1A1C1E] dark:text-[#F5F5F5] mb-3 tracking-tight">
                  {t('profile.userNotFoundTitle')}
                </h2>

                {/* Description */}
                <p className="text-sm text-[#535F70] dark:text-[#A8A8A8] max-w-md mb-7 leading-relaxed">
                  {t('profile.userNotFoundDesc')}
                </p>

                {/* Return to Feed Button */}
                <Link
                  to="/feed"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#004AC6] hover:bg-[#003da3] dark:bg-[#0095F6] dark:hover:bg-[#1877F2] text-white font-semibold text-sm shadow-sm transition cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{t('profile.returnToFeed')}</span>
                </Link>

                {/* Looking for someone else? */}
                <p className="text-xs text-[#8C93A8] dark:text-[#A8A8A8] mt-9 mb-3">
                  {t('profile.lookingForSomeoneElse')}
                </p>

                {/* Pill Search Input */}
                <form
                  onSubmit={handleSearch}
                  className="w-full max-w-md flex items-center bg-[#EDEDF8]/60 dark:bg-[#1A1A1A] border border-[#E2E2EC] dark:border-[#363636] rounded-full p-1.5 shadow-2xs"
                >
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('profile.searchPlaceholder')}
                    className="flex-1 bg-transparent px-4 py-1.5 text-sm text-[#1A1C1E] dark:text-[#F5F5F5] placeholder-[#8C93A8] dark:placeholder-[#737373] outline-none"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#004AC6] hover:bg-[#003da3] dark:bg-[#0095F6] dark:hover:bg-[#1877F2] text-white text-xs font-semibold rounded-full transition cursor-pointer"
                  >
                    {t('profile.searchButton')}
                  </button>
                </form>
              </div>
            ) : (
              <>
                <ProfileHeader
                  user={displayUser}
                  isOwnProfile={!!isOwnProfile}
                  onEditProfile={() => setIsEditModalOpen(true)}
                  onUserUpdate={(updated) => setUser(updated)}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  isFollowing={isFollowing}
                  isFollowPending={isFollowPending}
                  isCloseFriend={isCloseFriend}
                  isCloseFriendPending={isCloseFriendPending}
                  isBlockedByMe={isBlockedByMe}
                  isBlockedByThem={false}
                  onFollowToggle={handleFollowToggle}
                  onToggleCloseFriend={handleToggleCloseFriend}
                  onUnfollowClick={() => setIsUnfollowModalOpen(true)}
                  onBlockClick={() => setIsBlockModalOpen(true)}
                  onUnblockClick={() => setIsUnblockModalOpen(true)}
                  onOpenFollowers={() => setFollowModal({ isOpen: true, type: 'followers' })}
                  onOpenFollowing={() => setFollowModal({ isOpen: true, type: 'following' })}
                />

                {isBlockedByMe ? (
                  <BlockedProfileView
                    type="BLOCKED_BY_ME"
                    user={displayUser}
                    onUnblockClick={() => setIsUnblockModalOpen(true)}
                    isUnblocking={isUnblockPending}
                  />
                ) : (
                  <ProfileTabs
                    activeTab={activeTab}
                    user={displayUser}
                    isOwnProfile={!!isOwnProfile}
                  />
                )}
              </>
            )}
          </div>

          {/* Right Column (hidden on mobile & tablet, visible on lg: 3 cols) */}
          <ProfileRightSidebar />
        </main>
      )}

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav />

      {/* Edit Profile Modal Dialog */}
      {!isNotFound && !isBlockedByThem && (
        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          user={displayUser}
          onSave={(updated) => setUser(updated)}
        />
      )}

      {/* Follow List Modal Dialog */}
      {!isNotFound && !isBlockedByThem && !isBlockedByMe && displayUser.id && (
        <FollowListModal
          isOpen={followModal.isOpen}
          onClose={() => setFollowModal((prev) => ({ ...prev, isOpen: false }))}
          userId={displayUser.id}
          initialType={followModal.type}
          followersCount={displayUser.followerCount ?? displayUser.followersCount ?? 0}
          followingCount={displayUser.followingCount ?? 0}
          username={displayUser.username}
        />
      )}

      {/* Unfollow Confirmation Modal */}
      {!isNotFound && !isBlockedByThem && displayUser.id && (
        <UnfollowConfirmModal
          isOpen={isUnfollowModalOpen}
          onClose={() => setIsUnfollowModalOpen(false)}
          onConfirm={handleConfirmUnfollow}
          user={displayUser}
          isLoading={isFollowPending}
        />
      )}

      {/* Block User Confirmation Modal */}
      {!isNotFound && !isBlockedByThem && displayUser.id && (
        <BlockUserModal
          isOpen={isBlockModalOpen}
          onClose={() => setIsBlockModalOpen(false)}
          onConfirm={handleConfirmBlock}
          user={displayUser}
          isLoading={isBlockPending}
        />
      )}

      {/* Unblock User Confirmation Modal */}
      {!isNotFound && displayUser.id && (
        <UnblockConfirmModal
          isOpen={isUnblockModalOpen}
          onClose={() => setIsUnblockModalOpen(false)}
          onConfirm={handleConfirmUnblock}
          user={displayUser}
          isLoading={isUnblockPending}
        />
      )}
    </div>
  );
};

export default ProfilePage;
