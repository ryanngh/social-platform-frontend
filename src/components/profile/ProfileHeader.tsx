import { MapPin, Link2, Calendar, UserPlus, MessageCircle, MoreHorizontal } from 'lucide-react';
import type { User } from '../../types';
import { getAvatarUrl, getBannerUrl, DEFAULT_AVATAR_FALLBACK } from '../../utils/media';

interface ProfileHeaderProps {
  user: User;
  isOwnProfile: boolean;
  onEditProfile: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isFollowing?: boolean;
  onFollowToggle?: () => void;
}

const TABS = ['Posts', 'Replies', 'Reposts', 'Media', 'Likes'];

export const ProfileHeader = ({
  user,
  isOwnProfile,
  onEditProfile,
  activeTab,
  setActiveTab,
  isFollowing = false,
  onFollowToggle,
}: ProfileHeaderProps) => {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username || 'User';
  const joinedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'October 2021';

  return (
    <section className="bg-white border border-[#E2E2EC] rounded-xl overflow-hidden shadow-card">
      {/* Header Banner */}
      <div className="h-32 sm:h-40 w-full bg-gradient-to-r from-[#DFE6F5] via-[#E8EDFB] to-[#F1F3FB] relative overflow-hidden">
        {/* Subtle decorative graphic pattern */}
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#003594_1px,transparent_1px)] [background-size:16px_16px]"></div>
        {user.bannerUrl && (
          <img
            src={getBannerUrl(user.bannerUrl)}
            alt="Profile banner"
            className="absolute inset-0 w-full h-full object-cover z-10"
            onError={(e) => {
              // Hide broken image gracefully
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        )}
      </div>

      <div className="px-5 pb-5">
        {/* Avatar and Action Row */}
        <div className="flex justify-between items-end -mt-12 sm:-mt-14 mb-3.5">
          <div className="relative z-20">
            <img
              alt={fullName}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white object-cover shadow bg-white"
              src={getAvatarUrl(user.avatarUrl)}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = DEFAULT_AVATAR_FALLBACK;
              }}
            />
          </div>

          <div className="flex items-center gap-2">
            {isOwnProfile ? (
              <button
                onClick={onEditProfile}
                className="px-4 py-1.5 border border-[#E2E2EC] rounded-full text-xs font-semibold text-[#1A1C1E] hover:bg-[#EDEDF8] transition shadow-sm cursor-pointer"
                type="button"
              >
                Edit profile
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={onFollowToggle}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold shadow-sm transition flex items-center gap-1.5 cursor-pointer ${
                    isFollowing
                      ? 'border border-[#E2E2EC] bg-white text-[#1A1C1E] hover:bg-gray-50'
                      : 'bg-[#004AC6] hover:bg-[#003A9F] text-white'
                  }`}
                  type="button"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{isFollowing ? 'Following' : 'Follow'}</span>
                </button>
                <button
                  className="px-3.5 py-1.5 border border-[#E2E2EC] hover:bg-[#EDEDF8] text-[#1A1C1E] text-xs font-semibold rounded-full transition cursor-pointer flex items-center gap-1"
                  type="button"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Message</span>
                </button>
                <button
                  className="p-1.5 border border-[#E2E2EC] hover:bg-[#EDEDF8] text-[#1A1C1E] rounded-full transition cursor-pointer"
                  type="button"
                  title="More options"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* User Identity: Full Name & Nickname */}
        <div className="mb-3">
          <h1 className="text-xl sm:text-2xl font-bold text-[#1A1C1E] tracking-tight leading-tight">
            {fullName}
          </h1>
          <p className="text-xs sm:text-sm text-[#535F70] font-normal">
            @{user.username || 'user'}
          </p>
        </div>

        {/* Profile Metadata */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#535F70]">
            {user.location && (
              <span className="flex items-center gap-1 text-[#1A1C1E]">
                <MapPin className="w-3.5 h-3.5 text-[#535F70] shrink-0" />
                <span>{user.location}</span>
              </span>
            )}

            {user.websiteUrl && (
              <a
                className="flex items-center gap-1 text-[#004AC6] font-medium hover:underline"
                href={user.websiteUrl.startsWith('http') ? user.websiteUrl : `https://${user.websiteUrl}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Link2 className="w-3.5 h-3.5 text-[#535F70] shrink-0" />
                <span>{user.websiteUrl.replace(/^https?:\/\//, '')}</span>
              </a>
            )}

            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#535F70] shrink-0" />
              <span>Tham gia {joinedDate}</span>
            </span>
          </div>

          {/* Bio */}
          {user.bio ? (
            <p className="text-xs text-[#1A1C1E] pt-1 leading-relaxed">
              {user.bio}
            </p>
          ) : isOwnProfile ? (
            <p className="text-xs text-gray-400 italic pt-1 leading-relaxed">
              Chưa có tiểu sử. Bấm "Edit profile" để cập nhật giới thiệu về bản thân.
            </p>
          ) : null}

          {/* Following & Follower counts */}
          <div className="flex items-center gap-4 text-xs pt-2">
            <div className="flex items-center gap-1">
              <span className="font-bold text-[#1A1C1E]">
                {user.followingCount ?? 0}
              </span>
              <span className="text-[#535F70]">Đang theo dõi</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-bold text-[#1A1C1E]">
                {user.followersCount ?? 0}
              </span>
              <span className="text-[#535F70]">Người theo dõi</span>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Tabs */}
      <nav aria-label="Profile navigation" className="flex border-t border-[#E2E2EC] text-xs font-semibold text-[#535F70] px-2 overflow-x-auto custom-scrollbar">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-3 px-4 transition border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === tab
                ? 'border-[#004AC6] text-[#004AC6] font-bold'
                : 'border-transparent hover:text-[#1A1C1E]'
            }`}
            type="button"
          >
            {tab}
          </button>
        ))}
      </nav>
    </section>
  );
};

export default ProfileHeader;
