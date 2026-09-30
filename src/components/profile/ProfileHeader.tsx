import { useState, useRef, useEffect } from 'react';
import { 
  MapPin, 
  Link2, 
  Calendar, 
  UserPlus, 
  UserCheck, 
  UserMinus, 
  Star, 
  ChevronDown, 
  MessageCircle, 
  MoreHorizontal, 
  Loader2, 
  Share2, 
  ShieldAlert 
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { User } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { getBannerUrl } from '../../utils/media';


import { copyToClipboard } from '../../utils/share';
import UserAvatar from '../common/UserAvatar';

interface ProfileHeaderProps {
  user: User;
  isOwnProfile: boolean;
  onEditProfile: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isFollowing?: boolean;
  isFollowPending?: boolean;
  isCloseFriend?: boolean;
  isCloseFriendPending?: boolean;
  isBlockedByMe?: boolean;
  isBlockedByThem?: boolean;
  onFollowToggle?: () => void;
  onToggleCloseFriend?: () => void;
  onUnfollowClick?: () => void;
  onBlockClick?: () => void;
  onUnblockClick?: () => void;
  onOpenFollowers?: () => void;
  onOpenFollowing?: () => void;
}

export const ProfileHeader = ({
  user,
  isOwnProfile,
  onEditProfile,
  activeTab,
  setActiveTab,
  isFollowing = false,
  isFollowPending = false,
  isCloseFriend = false,
  isCloseFriendPending = false,
  isBlockedByMe = false,
  isBlockedByThem = false,
  onFollowToggle,
  onToggleCloseFriend,
  onUnfollowClick,
  onBlockClick,
  onUnblockClick,
  onOpenFollowers,
  onOpenFollowing,
}: ProfileHeaderProps) => {
  const { t, language } = useLanguage();
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username || t('topNav.userFallback');
  const joinedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { month: 'long', year: 'numeric' })
    : language === 'vi' ? 'Tháng 10, 2021' : 'October 2021';

  // Dropdown states
  const [isFollowingDropdownOpen, setIsFollowingDropdownOpen] = useState(false);
  const [isMoreDropdownOpen, setIsMoreDropdownOpen] = useState(false);

  const followingMenuRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (followingMenuRef.current && !followingMenuRef.current.contains(event.target as Node)) {
        setIsFollowingDropdownOpen(false);
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setIsMoreDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsFollowingDropdownOpen(false);
        setIsMoreDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleCopyLink = async () => {
    setIsMoreDropdownOpen(false);
    const profileUrl = `${window.location.origin}/${user.username || user.id}`;
    await copyToClipboard(profileUrl);
    toast.success(t('profile.copiedLinkToast', { defaultValue: 'Đã sao chép liên kết trang cá nhân vào bộ nhớ tạm!' }));
  };

  const handleShareProfile = async () => {
    setIsMoreDropdownOpen(false);
    const profileUrl = `${window.location.origin}/${user.username || user.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: fullName,
          text: `Xem trang cá nhân của ${fullName} (@${user.username})`,
          url: profileUrl,
        });
      } catch {
        // User cancelled share
      }
    } else {
      await copyToClipboard(profileUrl);
      toast.success(t('profile.copiedLinkToast', { defaultValue: 'Đã sao chép liên kết trang cá nhân vào bộ nhớ tạm!' }));
    }
  };

  const tabs = [
    { id: 'Posts', label: t('profile.tabs.posts') },
    { id: 'Replies', label: t('profile.tabs.replies') },
    { id: 'Reposts', label: t('profile.tabs.reposts') },
    { id: 'Media', label: t('profile.tabs.media') },
    { id: 'Likes', label: t('profile.tabs.likes') },
  ];

  return (
    <section className="bg-white dark:bg-[#121212] border border-gray-100 dark:border-[#262626] rounded-3xl overflow-hidden shadow-sm">
      {/* Header Banner */}
      <div className={`h-36 sm:h-44 w-full relative overflow-hidden ${
        isBlockedByThem
          ? 'bg-gray-100 dark:bg-[#1A1A1A]'
          : isBlockedByMe
          ? 'bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-[#1A1A1A] dark:via-slate-900 dark:to-[#1A1A1A]'
          : 'bg-gradient-to-r from-[#DFE6F5] via-[#E8EDFB] to-[#F1F3FB] dark:from-[#1A1A1A] dark:via-[#222222]/80 dark:to-[#121212]'
      }`}>
        {/* Subtle decorative graphic pattern */}
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#003594_1px,transparent_1px)] [background-size:16px_16px]"></div>
        {user.bannerUrl && !isBlockedByThem && (
          <img
            src={getBannerUrl(user.bannerUrl)}
            alt="Profile banner"
            className={`absolute inset-0 w-full h-full object-cover z-10 ${isBlockedByMe ? 'filter grayscale opacity-60' : ''}`}
            onError={(e) => {
              // Hide broken image gracefully
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        )}
      </div>

      <div className="px-5 sm:px-6 pb-5">
        {/* Avatar and Action Row */}
        <div className="flex justify-between items-end -mt-14 sm:-mt-16 mb-4">
          <div className="relative z-20">
            <UserAvatar
              userId={isBlockedByThem ? undefined : user.id}
              src={isBlockedByThem ? null : user.avatarUrl}
              alt={fullName}
              size="2xl"
              className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white dark:border-[#121212] object-cover shadow-md bg-white dark:bg-[#121212] ${
                isBlockedByMe ? 'filter grayscale opacity-80' : ''
              }`}
              isSelf={isOwnProfile}
            />
          </div>

          <div className="flex items-center gap-2">
            {isOwnProfile ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={onEditProfile}
                  className="h-9 px-4 border border-gray-200 dark:border-[#363636] rounded-xl text-xs sm:text-sm font-semibold text-gray-800 dark:text-[#F5F5F5] hover:bg-gray-50 dark:hover:bg-[#262626] transition shadow-2xs cursor-pointer inline-flex items-center justify-center"
                  type="button"
                >
                  {t('profile.editProfile')}
                </button>

                {/* More options for own profile (Share & Copy Link) */}
                <div className="relative" ref={moreMenuRef}>
                  <button
                    onClick={() => setIsMoreDropdownOpen(!isMoreDropdownOpen)}
                    className="w-9 h-9 flex items-center justify-center border border-gray-200 dark:border-[#363636] hover:bg-gray-50 dark:hover:bg-[#262626] text-gray-700 dark:text-[#F5F5F5] rounded-xl transition cursor-pointer"
                    type="button"
                    title={t('topNav.options', { defaultValue: 'Tùy chọn' })}
                    aria-expanded={isMoreDropdownOpen}
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>

                  {isMoreDropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-[#1E1E1E] rounded-2xl shadow-xl border border-gray-100 dark:border-[#363636] z-50 p-1.5 animate-in fade-in zoom-in-95 duration-150">
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-[#262626] text-xs font-semibold text-gray-700 dark:text-[#E5E5E5] transition cursor-pointer"
                      >
                        <Link2 className="w-4 h-4 text-gray-500 dark:text-[#A8A8A8]" />
                        <span>{t('profile.copyLink', { defaultValue: 'Sao chép liên kết trang cá nhân' })}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleShareProfile}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-[#262626] text-xs font-semibold text-gray-700 dark:text-[#E5E5E5] transition cursor-pointer"
                      >
                        <Share2 className="w-4 h-4 text-gray-500 dark:text-[#A8A8A8]" />
                        <span>{t('profile.shareProfile', { defaultValue: 'Chia sẻ trang cá nhân' })}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : isBlockedByThem ? (
              // Blocked by them: No action buttons
              null
            ) : isBlockedByMe ? (
              // Blocked by me: Show Unblock button
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onUnblockClick}
                  className="h-9 px-4 rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>{t('profile.unblock', { defaultValue: 'Bỏ chặn' })}</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {/* Follow / Following Button */}
                {!isFollowing ? (
                  <button
                    onClick={onFollowToggle}
                    disabled={isFollowPending}
                    className="h-9 px-4 rounded-xl text-xs sm:text-sm font-semibold shadow-sm transition flex items-center gap-1.5 cursor-pointer bg-[#004AC6] hover:bg-[#003A9F] dark:bg-[#0095F6] dark:hover:bg-[#1877F2] text-white disabled:opacity-60 disabled:cursor-not-allowed"
                    type="button"
                  >
                    {isFollowPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <UserPlus className="w-4 h-4" />
                    )}
                    <span>{t('profile.follow')}</span>
                  </button>
                ) : (
                  <div className="relative" ref={followingMenuRef}>
                    <button
                      onClick={() => setIsFollowingDropdownOpen(!isFollowingDropdownOpen)}
                      disabled={isFollowPending}
                      className={`h-9 px-3.5 rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer border ${
                        isCloseFriend
                          ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/40'
                          : 'border-gray-200 dark:border-[#363636] bg-white dark:bg-[#1A1A1A] text-gray-800 dark:text-[#F5F5F5] hover:bg-gray-50 dark:hover:bg-[#363636]'
                      }`}
                      type="button"
                      aria-expanded={isFollowingDropdownOpen}
                    >
                      {isFollowPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : isCloseFriend ? (
                        <Star className="w-4 h-4 fill-emerald-500 text-emerald-500" />
                      ) : (
                        <UserCheck className="w-4 h-4 text-[#004AC6] dark:text-[#0095F6]" />
                      )}
                      <span>{t('profile.following')}</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-150 ${
                          isFollowingDropdownOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {/* Following Dropdown Menu */}
                    {isFollowingDropdownOpen && (
                      <div className="absolute left-0 sm:right-0 sm:left-auto top-full mt-2 w-64 bg-white dark:bg-[#1E1E1E] rounded-2xl shadow-xl border border-gray-100 dark:border-[#363636] z-50 p-1.5 animate-in fade-in zoom-in-95 duration-150">
                        {/* Close Friends Toggle Option */}
                        <button
                          type="button"
                          onClick={() => {
                            setIsFollowingDropdownOpen(false);
                            onToggleCloseFriend?.();
                          }}
                          disabled={isCloseFriendPending}
                          className="w-full flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-[#262626] transition text-left cursor-pointer group"
                        >
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                              isCloseFriend
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                                : 'bg-gray-100 dark:bg-[#1A1A1A] text-gray-500 dark:text-[#A8A8A8] group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/40 group-hover:text-emerald-600 dark:group-hover:text-emerald-400'
                            }`}
                          >
                            {isCloseFriendPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Star
                                className={`w-4 h-4 ${
                                  isCloseFriend ? 'fill-emerald-500 text-emerald-500' : ''
                                }`}
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-gray-900 dark:text-[#F5F5F5]">
                                {isCloseFriend
                                  ? t('profile.removeFromCloseFriends', { defaultValue: 'Xóa khỏi Bạn thân' })
                                  : t('profile.addToCloseFriends', { defaultValue: 'Thêm vào Bạn thân' })}
                              </span>
                              {isCloseFriend && (
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              )}
                            </div>
                            <p className="text-[11px] text-gray-400 dark:text-[#A8A8A8] leading-tight mt-0.5">
                              {t('profile.closeFriendDesc', { defaultValue: 'Chia sẻ và xem các bài viết, tin riêng tư' })}
                            </p>
                          </div>
                        </button>

                        <div className="border-t border-gray-100 dark:border-[#262626] my-1" />

                        {/* Unfollow Option */}
                        <button
                          type="button"
                          onClick={() => {
                            setIsFollowingDropdownOpen(false);
                            onUnfollowClick?.();
                          }}
                          className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 transition text-left cursor-pointer text-rose-600 dark:text-rose-400"
                        >
                          <div className="w-8 h-8 rounded-full bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center flex-shrink-0 text-rose-600 dark:text-rose-400">
                            <UserMinus className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-bold">
                              {t('profile.unfollow', { defaultValue: 'Hủy theo dõi' })} @{user.username}
                            </span>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Message button */}
                <button
                  className="h-9 px-3.5 border border-gray-200 dark:border-[#363636] hover:bg-gray-50 dark:hover:bg-[#262626] text-gray-800 dark:text-[#F5F5F5] text-xs sm:text-sm font-semibold rounded-xl transition cursor-pointer flex items-center gap-1.5"
                  type="button"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{t('profile.message')}</span>
                </button>

                {/* Profile More Options Button (...) */}
                <div className="relative" ref={moreMenuRef}>
                  <button
                    onClick={() => setIsMoreDropdownOpen(!isMoreDropdownOpen)}
                    className="w-9 h-9 flex items-center justify-center border border-gray-200 dark:border-[#363636] hover:bg-gray-50 dark:hover:bg-[#262626] text-gray-700 dark:text-[#F5F5F5] rounded-xl transition cursor-pointer"
                    type="button"
                    title={t('topNav.options', { defaultValue: 'Tùy chọn' })}
                    aria-expanded={isMoreDropdownOpen}
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>

                  {isMoreDropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-[#1E1E1E] rounded-2xl shadow-xl border border-gray-100 dark:border-[#363636] z-50 p-1.5 animate-in fade-in zoom-in-95 duration-150">
                      {/* Copy Link */}
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-[#262626] text-xs font-semibold text-gray-700 dark:text-[#E5E5E5] transition cursor-pointer"
                      >
                        <Link2 className="w-4 h-4 text-gray-500 dark:text-[#A8A8A8]" />
                        <span>{t('profile.copyLink', { defaultValue: 'Sao chép liên kết trang cá nhân' })}</span>
                      </button>

                      {/* Share Profile */}
                      <button
                        type="button"
                        onClick={handleShareProfile}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-[#262626] text-xs font-semibold text-gray-700 dark:text-[#E5E5E5] transition cursor-pointer"
                      >
                        <Share2 className="w-4 h-4 text-gray-500 dark:text-[#A8A8A8]" />
                        <span>{t('profile.shareProfile', { defaultValue: 'Chia sẻ trang cá nhân' })}</span>
                      </button>

                      <div className="border-t border-gray-100 dark:border-[#262626] my-1" />

                      {/* Block User */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsMoreDropdownOpen(false);
                          onBlockClick?.();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold text-rose-600 dark:text-rose-400 transition cursor-pointer"
                      >
                        <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                        <span>{t('profile.blockUser', { username: user.username, defaultValue: `Chặn @${user.username}` })}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* User Identity: Full Name & Nickname */}
        <div className="mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-[#F5F5F5] tracking-tight leading-tight">
              {isBlockedByThem ? `@${user.username || 'user'}` : fullName}
            </h1>
            {isBlockedByMe && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60">
                {t('profile.blockedBadge', { defaultValue: 'Đã chặn' })}
              </span>
            )}
          </div>
          {!isBlockedByThem && (
            <p className="text-xs sm:text-sm text-gray-500 dark:text-[#A8A8A8] font-normal">
              @{user.username || 'user'}
            </p>
          )}
        </div>

        {/* Profile Metadata */}
        {!isBlockedByThem && (
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-[13px] text-gray-500 dark:text-[#A8A8A8]">
              {user.location && (
                <span className="flex items-center gap-1.5 text-gray-700 dark:text-[#E5E5E5]">
                  <MapPin className="w-3.5 h-3.5 text-gray-400 dark:text-[#A8A8A8] shrink-0" />
                  <span>{user.location}</span>
                </span>
              )}

              {user.websiteUrl && (
                <a
                  className="flex items-center gap-1.5 text-[#004AC6] dark:text-[#0095F6] font-medium hover:underline"
                  href={user.websiteUrl.startsWith('http') ? user.websiteUrl : `https://${user.websiteUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Link2 className="w-3.5 h-3.5 text-[#004AC6] dark:text-[#0095F6] shrink-0" />
                  <span>{user.websiteUrl.replace(/^https?:\/\//, '')}</span>
                </a>
              )}

              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-gray-400 dark:text-[#A8A8A8] shrink-0" />
                <span>{t('profile.joined', { date: joinedDate })}</span>
              </span>
            </div>

            {/* Bio */}
            {user.bio ? (
              <p className="text-xs sm:text-sm text-gray-800 dark:text-[#E5E5E5] pt-0.5 leading-relaxed">
                {user.bio}
              </p>
            ) : isOwnProfile ? (
              <p className="text-xs sm:text-sm text-gray-400 dark:text-[#737373] italic pt-0.5 leading-relaxed">
                {language === 'vi' 
                  ? 'Chưa có tiểu sử. Bấm "Chỉnh sửa" để cập nhật giới thiệu về bản thân.' 
                  : 'No bio yet. Click "Edit profile" to introduce yourself.'}
              </p>
            ) : null}

            {/* Following & Follower counts (hidden when blocked by me) */}
            {!isBlockedByMe && (
              <div className="flex items-center gap-4 text-xs sm:text-sm pt-2">
                <button
                  type="button"
                  onClick={onOpenFollowing}
                  className="flex items-center gap-1.5 cursor-pointer group hover:underline transition-colors"
                  title={t('profile.followingTitle', { defaultValue: 'Đang theo dõi' })}
                >
                  <span className="tabular-nums font-bold text-gray-900 dark:text-[#F5F5F5] group-hover:text-[#004AC6] dark:group-hover:text-[#0095F6] transition-colors">
                    {user.followingCount ?? 0}
                  </span>
                  <span className="text-gray-500 dark:text-[#A8A8A8] group-hover:text-gray-800 dark:group-hover:text-slate-200 transition-colors">{t('leftNav.following')}</span>
                </button>
                <button
                  type="button"
                  onClick={onOpenFollowers}
                  className="flex items-center gap-1.5 cursor-pointer group hover:underline transition-colors"
                  title={t('profile.followersTitle', { defaultValue: 'Người theo dõi' })}
                >
                  <span className="tabular-nums font-bold text-gray-900 dark:text-[#F5F5F5] group-hover:text-[#004AC6] dark:group-hover:text-[#0095F6] transition-colors">
                    {user.followerCount ?? user.followersCount ?? 0}
                  </span>
                  <span className="text-gray-500 dark:text-[#A8A8A8] group-hover:text-gray-800 dark:group-hover:text-slate-200 transition-colors">{t('leftNav.followers')}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Profile Tabs (only render if not blocked) */}
      {!isBlockedByMe && !isBlockedByThem && (
        <nav aria-label="Profile navigation" className="flex border-t border-gray-100 dark:border-[#262626] text-xs sm:text-sm font-semibold text-gray-500 dark:text-[#A8A8A8] px-3 overflow-x-auto custom-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-4 transition border-b-2 whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'border-[#004AC6] text-[#004AC6] dark:border-blue-400 dark:text-[#0095F6] font-bold'
                  : 'border-transparent hover:text-gray-900 dark:hover:text-[#F5F5F5]'
              }`}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </nav>
      )}
    </section>
  );
};

export default ProfileHeader;
