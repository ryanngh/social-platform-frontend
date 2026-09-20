import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, Navigate } from 'react-router-dom';
import { 
  User as UserIcon, 
  AlertTriangle, 
  MapPin, 
  Link2, 
  Calendar, 
  ArrowLeft 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { userService } from '../services/userService';
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

export const ProfilePage: React.FC = () => {
  const { identifier } = useParams<{ identifier?: string }>();
  const { user: currentUser } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Posts');
  const [isFollowing, setIsFollowing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // If user visits /profile without identifier, redirect to own username
  if (!identifier && currentUser?.username) {
    return <Navigate to={`/profile/${currentUser.username}`} replace />;
  }

  const isOwnProfile =
    !identifier || (currentUser && (identifier === currentUser.username || identifier === currentUser.id));

  useEffect(() => {
    let isMounted = true;

    const fetchUser = async () => {
      setIsLoading(true);
      setIsNotFound(false);
      try {
        if (isOwnProfile) {
          const profile = await userService.getMyProfile();
          if (isMounted) setUser(profile);
        } else if (identifier) {
          const profile = await userService.getUserByIdentifier(identifier);
          if (isMounted) setUser(profile);
        }
      } catch (err) {
        console.warn('Error loading profile from API:', err);
        if (isOwnProfile && currentUser) {
          if (isMounted) setUser(currentUser);
        } else {
          if (isMounted) {
            setUser(null);
            setIsNotFound(true);
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
      navigate(`/profile/${q}`);
    }
  };

  const displayUser: User = user || currentUser || {
    id: 'user',
    username: identifier || 'user',
    firstName: 'Người',
    lastName: 'dùng',
  };

  return (
    <div className="min-h-screen bg-[#F9F9FB] text-[#1A1C1E] flex flex-col font-sans">
      {/* Fixed/Sticky Top Navigation Bar */}
      <TopNavBar />

      {/* Main 3-Column Profile Container matching Stitch UI */}
      <main className="flex-1 max-w-[1240px] w-full mx-auto px-4 pt-20 pb-16 md:pb-8 grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Left Column (md: 4 cols, lg: 3 cols) */}
        <aside className="md:col-span-4 lg:col-span-3 space-y-4" data-purpose="left-sidebar">
          {isNotFound ? (
            <section className="bg-white border border-[#E2E2EC] rounded-xl p-5 shadow-card">
              {/* Avatar & Identity with Warning Badge */}
              <div className="flex flex-col items-center text-center pb-5 border-b border-[#E2E2EC]">
                <div className="relative w-20 h-20 rounded-full bg-[#EDEDF8] flex items-center justify-center mb-3">
                  <UserIcon className="w-10 h-10 text-[#8C93A8]" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-amber-50 border border-amber-300 flex items-center justify-center shadow-xs">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                </div>
                <h2 className="text-base font-bold text-[#1A1C1E] leading-tight">
                  {t('profile.userNotFound')}
                </h2>
                <span className="text-xs text-[#535F70] mt-0.5">@{identifier || 'username'}</span>
              </div>

              {/* Personal Info Unavailable */}
              <div className="py-4 border-b border-[#E2E2EC] space-y-2.5 text-xs text-[#535F70]">
                <h3 className="text-xs font-bold text-[#1A1C1E] uppercase tracking-wider mb-2">
                  {t('profile.personalInfo')}
                </h3>
                <div className="flex items-center gap-2.5 text-gray-400 italic">
                  <MapPin className="w-4 h-4 text-[#8C93A8] shrink-0" />
                  <span>{t('profile.locationUnavailable')}</span>
                </div>
                <div className="flex items-center gap-2.5 text-gray-400 italic">
                  <Link2 className="w-4 h-4 text-[#8C93A8] shrink-0" />
                  <span>{t('profile.noLinkAvailable')}</span>
                </div>
                <div className="flex items-center gap-2.5 text-gray-400 italic">
                  <Calendar className="w-4 h-4 text-[#8C93A8] shrink-0" />
                  <span>{t('profile.joinedDateUnknown')}</span>
                </div>
              </div>

              {/* Notice Box */}
              <div className="mt-4 p-3.5 bg-[#F9F9FB] border border-[#E2E2EC] rounded-xl text-left">
                <p className="text-xs text-[#535F70] leading-relaxed">
                  {t('profile.accountDeactivatedNotice')}
                </p>
              </div>
            </section>
          ) : (
            <ProfileInfoCard user={displayUser} />
          )}

          <ProfileBookmarksCard />
        </aside>

        {/* Center Column (md: 8 cols, lg: 6 cols) */}
        <div className="md:col-span-8 lg:col-span-6 space-y-4" data-purpose="feed-column">
          {isLoading ? (
            <ProfileSkeleton />
          ) : isNotFound ? (
            /* 404 User Not Found Center Card matching design mockup */
            <div className="bg-white border border-[#E2E2EC] rounded-2xl p-8 sm:p-12 flex flex-col items-center justify-center text-center shadow-card">
              {/* Circle avatar placeholder */}
              <div className="w-20 h-20 rounded-full bg-[#EDEDF8] flex items-center justify-center mb-5">
                <UserIcon className="w-10 h-10 text-[#8C93A8]" />
              </div>

              {/* Red pill badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-200/80 mb-4">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                <span>Error 404 • Profile Not Found</span>
              </div>

              {/* Headline */}
              <h2 className="text-2xl sm:text-3xl font-bold text-[#1A1C1E] mb-3 tracking-tight">
                {t('profile.userNotFoundTitle')}
              </h2>

              {/* Description */}
              <p className="text-sm text-[#535F70] max-w-md mb-7 leading-relaxed">
                {t('profile.userNotFoundDesc')}
              </p>

              {/* Return to Feed Button */}
              <Link
                to="/feed"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#004AC6] hover:bg-[#003da3] text-white font-semibold text-sm shadow-sm transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t('profile.returnToFeed')}</span>
              </Link>

              {/* Looking for someone else? */}
              <p className="text-xs text-[#8C93A8] mt-9 mb-3">
                {t('profile.lookingForSomeoneElse')}
              </p>

              {/* Pill Search Input */}
              <form
                onSubmit={handleSearch}
                className="w-full max-w-md flex items-center bg-[#EDEDF8]/60 border border-[#E2E2EC] rounded-full p-1.5 shadow-2xs"
              >
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('profile.searchPlaceholder')}
                  className="flex-1 bg-transparent px-4 py-1.5 text-sm text-[#1A1C1E] placeholder-[#8C93A8] outline-none"
                />
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#004AC6] text-white text-xs font-semibold rounded-full hover:bg-[#003da3] transition cursor-pointer"
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
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                isFollowing={isFollowing}
                onFollowToggle={() => setIsFollowing(!isFollowing)}
              />

              <ProfileTabs
                activeTab={activeTab}
                user={displayUser}
                isOwnProfile={!!isOwnProfile}
              />
            </>
          )}
        </div>

        {/* Right Column (hidden on mobile & tablet, visible on lg: 3 cols) */}
        <ProfileRightSidebar />
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav />

      {/* Edit Profile Modal Dialog */}
      {!isNotFound && (
        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          user={displayUser}
          onSave={(updated) => setUser(updated)}
        />
      )}
    </div>
  );
};

export default ProfilePage;
