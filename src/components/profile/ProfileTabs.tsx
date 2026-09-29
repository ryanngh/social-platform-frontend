import { useState, useEffect } from 'react';
import {
  Edit3,
  Plus,
  Zap,
  Lock,
  UserPlus,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { User, PostResponse, PostVisibility } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { postService } from '../../services/postService';
import { extractHashtags } from '../../utils/text';
import PostMediaLightbox from '../post/PostMediaLightbox';
import PostComposer from '../feed/PostComposer';
import CreatePostModal from '../feed/CreatePostModal';
import PostCard from '../post/PostCard';

interface ProfileTabsProps {
  activeTab: string;
  user: User;
  isOwnProfile: boolean;
  isPrivate?: boolean;
}



// ============================================================
// Loading skeleton for posts
// ============================================================

const PostSkeleton = () => (
  <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 animate-pulse">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 rounded-full bg-gray-200" />
      <div>
        <div className="h-4 w-32 bg-gray-200 rounded mb-1" />
        <div className="h-3 w-20 bg-gray-200 rounded" />
      </div>
    </div>
    <div className="h-4 w-full bg-gray-200 rounded mb-2" />
    <div className="h-4 w-3/4 bg-gray-200 rounded mb-3" />
    <div className="h-48 bg-gray-200 rounded-2xl mb-3" />
    <div className="h-8 bg-gray-100 rounded" />
  </div>
);

// ============================================================
// Main ProfileTabs
// ============================================================

export const ProfileTabs = ({ activeTab, user, isOwnProfile, isPrivate = false }: ProfileTabsProps) => {
  const { t, language } = useLanguage();
  const { user: currentUser } = useAuth();
  const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username || t('topNav.userFallback');

  // Posts state
  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [hasLoadedPosts, setHasLoadedPosts] = useState(false);

  // Lightbox state
  const [lightboxPost, setLightboxPost] = useState<PostResponse | null>(null);
  const [lightboxMediaIndex, setLightboxMediaIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Create post state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handlePostUpdated = (updatedPost: PostResponse) => {
    setPosts((prev) => prev.map((p) => (p.id === updatedPost.id ? updatedPost : p)));
    if (lightboxPost?.id === updatedPost.id) {
      setLightboxPost(updatedPost);
    }
  };

  const handlePostDeleted = (deletedPostId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== deletedPostId));
    if (lightboxPost?.id === deletedPostId) {
      setIsLightboxOpen(false);
      setLightboxPost(null);
    }
  };

  // Fetch posts when on Posts tab
  useEffect(() => {
    if (activeTab !== 'Posts' || hasLoadedPosts) return;

    const fetchPosts = async () => {
      setIsLoadingPosts(true);
      try {
        const data = isOwnProfile
          ? await postService.getMyPosts({ page: 0, size: 20 })
          : await postService.getUserPosts(user.id, { page: 0, size: 20 });
        setPosts(data.content);
      } catch (err) {
        console.warn('Error fetching posts:', err);
        // Posts will remain empty, showing empty state
      } finally {
        setIsLoadingPosts(false);
        setHasLoadedPosts(true);
      }
    };

    fetchPosts();
  }, [activeTab, hasLoadedPosts, isOwnProfile, user.id]);

  const openLightbox = (post: PostResponse, mediaIndex: number) => {
    setLightboxPost(post);
    setLightboxMediaIndex(mediaIndex);
    setIsLightboxOpen(true);
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
    setLightboxPost(null);
  };

  const handleCreatePost = async (
    content: string,
    media?: import('../../types').PostMediaRequest[],
    visibility: PostVisibility = 'PUBLIC'
  ) => {
    try {
      // Auto-extract hashtags from text
      const hashtags = extractHashtags(content);

      // Call the API endpoint with all required fields including uploaded media
      const newPost = await postService.createPost({
        content,
        visibility,
        media: media || [],
        hashtags,
        taggedUserIds: [],
      });
      setPosts((prev) => [newPost, ...prev]);
      toast.success(t('feed.postSuccess'));
    } catch (err) {
      console.error('Failed to create post via API:', err);
      toast.error(language === 'vi' ? 'Lỗi khi đăng bài viết' : 'Failed to create post');
      throw err; // Re-throw so the modal can handle it
    }
  };

  if (activeTab === 'Posts') {
    // 1. Private Account State
    if (isPrivate && !isOwnProfile) {
      return (
        <div className="bg-white border border-[#E2E2EC] rounded-xl p-8 sm:p-12 shadow-card text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-[#EDEDF8] border border-[#E2E2EC] flex items-center justify-center text-[#1A1C1E] mb-4 shadow-sm">
            <Lock className="w-8 h-8 text-[#535F70]" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-[#1A1C1E] mb-2">
            {t('profile.privateAccount')}
          </h3>
          <p className="text-xs sm:text-sm text-[#535F70] max-w-md leading-relaxed mb-6">
            {t('profile.privateAccountDesc', { name: displayName })}
          </p>
          <button
            className="px-6 py-2.5 bg-[#004AC6] hover:bg-[#003A9F] text-white text-xs sm:text-sm font-semibold rounded-full transition shadow flex items-center gap-2 cursor-pointer"
            type="button"
          >
            <UserPlus className="w-4 h-4" />
            <span>{t('profile.requestFollow')}</span>
          </button>
        </div>
      );
    }

    // 2. Loading State
    if (isLoadingPosts) {
      return (
        <div className="space-y-4">
          <PostSkeleton />
          <PostSkeleton />
        </div>
      );
    }

    // 3. Has Posts — render post cards
    if (posts.length > 0) {
      return (
        <>
          <div className="space-y-4">
            {isOwnProfile && <PostComposer onOpenCreateModal={() => setIsCreateModalOpen(true)} />}
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onOpenLightbox={openLightbox}
                language={language}
                isAuthor={currentUser?.id === post.author.id}
                onPostUpdated={handlePostUpdated}
                onPostDeleted={handlePostDeleted}
              />
            ))}
          </div>

          {/* Lightbox Modal */}
          {lightboxPost && (
            <PostMediaLightbox
              post={lightboxPost}
              initialMediaIndex={lightboxMediaIndex}
              isOpen={isLightboxOpen}
              onClose={closeLightbox}
              onPostUpdated={handlePostUpdated}
              onPostDeleted={handlePostDeleted}
            />
          )}

          {/* Create Post Modal */}
          <CreatePostModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onSubmitPost={handleCreatePost}
          />
        </>
      );
    }

    // 4. Empty Posts State
    return (
      <div className="bg-white border border-[#E2E2EC] rounded-xl p-8 sm:p-12 text-center shadow-card flex flex-col items-center justify-center">
        <div className="w-20 h-20 rounded-full bg-[#EFF4FF] border border-[#d6e0f1] flex items-center justify-center text-[#004AC6] mb-4 shadow-sm">
          <Edit3 className="w-10 h-10 text-[#004AC6]" />
        </div>
        <h3 className="text-lg font-bold text-[#1A1C1E] mb-2">{t('profile.noPosts')}</h3>
        <p className="text-xs sm:text-sm text-[#535F70] max-w-[420px] leading-relaxed mb-6">
          {t('profile.noPostsDesc', { name: displayName })}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {isOwnProfile && (
            <button
              className="bg-[#004AC6] hover:bg-[#002970] text-white text-xs font-semibold px-5 py-2.5 rounded-full transition shadow-sm flex items-center gap-1.5 cursor-pointer"
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus className="w-4 h-4" />
              <span>{t('profile.createNewPost')}</span>
            </button>
          )}
          <button
            className="bg-[#EDEDF8] hover:bg-slate-200 text-[#1A1C1E] text-xs font-semibold px-5 py-2.5 rounded-full transition flex items-center gap-1.5 cursor-pointer"
            type="button"
          >
            <Zap className="w-4 h-4 text-[#535F70]" />
            <span>{language === 'vi' ? 'Khám phá các bài viết thịnh hành' : 'Discover trending posts'}</span>
          </button>
        </div>
        
        {/* Create Post Modal */}
        <CreatePostModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmitPost={handleCreatePost}
        />
      </div>
    );
  }

  // Other Tabs (Replies, Reposts, Media, Likes)
  return (
    <div className="bg-white border border-[#E2E2EC] rounded-xl p-8 text-center shadow-card flex flex-col items-center justify-center">
      <h3 className="text-sm font-semibold text-[#1A1C1E] mb-1">
        {language === 'vi' ? `Mục ${activeTab} trống` : `${activeTab} section is empty`}
      </h3>
      <p className="text-xs text-[#535F70]">
        {language === 'vi' ? 'Chưa có nội dung nào trong phần này.' : 'No content available in this section yet.'}
      </p>
    </div>
  );
};

export default ProfileTabs;
