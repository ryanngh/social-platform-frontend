import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
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

export const ProfilePage = () => {
  const { identifier } = useParams<{ identifier?: string }>();
  const { user: currentUser } = useAuth();

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Posts');
  const [isFollowing, setIsFollowing] = useState(false);

  const isOwnProfile =
    !identifier || (currentUser && (identifier === currentUser.username || identifier === currentUser.id));

  useEffect(() => {
    let isMounted = true;

    const fetchUser = async () => {
      setIsLoading(true);
      setError(null);
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
        // If current user is logged in, fallback to currentUser data
        if (isOwnProfile && currentUser) {
          if (isMounted) setUser(currentUser);
        } else {
          if (isMounted) setError('User not found or error loading profile');
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

  const displayUser: User = user || currentUser || {
    id: 'user',
    username: 'user',
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
          <ProfileInfoCard user={displayUser} />
          <ProfileBookmarksCard />
        </aside>

        {/* Center Column (md: 8 cols, lg: 6 cols) */}
        <div className="md:col-span-8 lg:col-span-6 space-y-4" data-purpose="feed-column">
          <ProfileHeader
            user={displayUser}
            isOwnProfile={!!isOwnProfile}
            onEditProfile={() => setIsEditModalOpen(true)}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isFollowing={isFollowing}
            onFollowToggle={() => setIsFollowing(!isFollowing)}
          />

          {isLoading ? (
            <ProfileSkeleton />
          ) : error ? (
            <div className="bg-white border border-[#E2E2EC] rounded-xl p-8 text-center shadow-card">
              <h3 className="text-base font-bold text-[#1A1C1E] mb-1">Không tìm thấy người dùng</h3>
              <p className="text-xs text-[#535F70]">{error}</p>
            </div>
          ) : (
            <ProfileTabs
              activeTab={activeTab}
              user={displayUser}
              isOwnProfile={!!isOwnProfile}
            />
          )}
        </div>

        {/* Right Column (hidden on mobile & tablet, visible on lg: 3 cols) */}
        <ProfileRightSidebar />
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav />

      {/* Edit Profile Modal Dialog */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={displayUser}
        onSave={(updated) => setUser(updated)}
      />
    </div>
  );
};

export default ProfilePage;
