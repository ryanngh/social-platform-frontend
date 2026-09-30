import { useState, useEffect } from 'react';
import {
  Edit3,
  Plus,
  Zap,
  Lock,
  UserPlus,
  Repeat2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { User, PostResponse, PostVisibility } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { postService } from '../../services/postService';
import { repostService } from '../../services/repostService';
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
  <div className="bg-white dark:bg-[#121212] rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-[#262626] animate-pulse">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-[#262626]" />
      <div>
        <div className="h-4 w-32 bg-gray-200 dark:bg-[#262626] rounded mb-1" />
        <div className="h-3 w-20 bg-gray-200 dark:bg-[#262626] rounded" />
      </div>
    </div>
    <div className="h-4 w-full bg-gray-200 dark:bg-[#262626] rounded mb-2" />
    <div className="h-4 w-3/4 bg-gray-200 dark:bg-[#262626] rounded mb-3" />
    <div className="h-48 bg-gray-200 dark:bg-[#262626] rounded-2xl mb-3" />
    <div className="h-8 bg-gray-100 dark:bg-[#1A1A1A] rounded" />
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

  // Reposts tab state
  const [repostedPosts, setRepostedPosts] = useState<PostResponse[]>([]);
  const [isLoadingReposts, setIsLoadingReposts] = useState(false);
  const [hasLoadedReposts, setHasLoadedReposts] = useState(false);

  // Lightbox state
  const [lightboxPost, setLightboxPost] = useState<PostResponse | null>(null);
  const [lightboxMediaIndex, setLightboxMediaIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Create post state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handlePostUpdated = (updatedPost: PostResponse) => {
    setPosts((prev) => prev.map((p) => (p.id === updatedPost.id ? updatedPost : p)));
    setRepostedPosts((prev) => prev.map((p) => (p.id === updatedPost.id ? updatedPost : p)));
    if (lightboxPost?.id === updatedPost.id) {
      setLightboxPost(updatedPost);
    }
  };

  const handlePostDeleted = (deletedPostId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== deletedPostId));
    setRepostedPosts((prev) => prev.filter((p) => p.id !== deletedPostId));
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
      } finally {
        setIsLoadingPosts(false);
        setHasLoadedPosts(true);
      }
    };

    fetchPosts();
  }, [activeTab, hasLoadedPosts, isOwnProfile, user.id]);

  // Fetch reposts when on Reposts tab
  useEffect(() => {
    if (activeTab !== 'Reposts' || hasLoadedReposts) return;

    const fetchReposts = async () => {
      setIsLoadingReposts(true);
      try {
        // Get repost entries (list of originalPostId)
        const repostEntries = isOwnProfile
          ? await repostService.getMyReposts({ page: 0, size: 20 })
          : await repostService.getUserReposts(user.id, { page: 0, size: 20 });

        // Fetch actual post data for each entry
        const postPromises = repostEntries.content.map((entry) =>
          postService.getPostById(entry.originalPostId).catch(() => null)
        );
        const results = await Promise.all(postPromises);
        setRepostedPosts(results.filter((p): p is PostResponse => p !== null));
      } catch (err) {
        console.warn('Error fetching reposts:', err);
      } finally {
        setIsLoadingReposts(false);
        setHasLoadedReposts(true);
      }
    };

    fetchReposts();
  }, [activeTab, hasLoadedReposts, isOwnProfile, user.id]);

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
        <div className="bg-white dark:bg-[#121212] border border-gray-100 dark:border-[#262626] rounded-3xl p-8 sm:p-12 shadow-sm text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center text-[#004AC6] dark:text-[#0095F6] mb-4 shadow-2xs">
            <Lock className="w-8 h-8 text-[#004AC6] dark:text-[#0095F6]" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-[#F5F5F5] mb-2">
            {t('profile.privateAccount')}
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-[#A8A8A8] max-w-md leading-relaxed mb-6">
            {t('profile.privateAccountDesc', { name: displayName })}
          </p>
          <button
            className="h-10 px-6 bg-[#004AC6] hover:bg-[#003A9F] dark:bg-[#0095F6] dark:hover:bg-[#1877F2] text-white text-xs sm:text-sm font-semibold rounded-xl transition shadow-xs flex items-center gap-2 cursor-pointer"
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
      <div className="bg-white dark:bg-[#121212] border border-gray-100 dark:border-[#262626] rounded-3xl p-8 sm:p-12 text-center shadow-sm flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center text-[#004AC6] dark:text-[#0095F6] mb-4 shadow-2xs">
          <Edit3 className="w-8 h-8 text-[#004AC6] dark:text-[#0095F6]" />
        </div>
        <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-[#F5F5F5] mb-2">{t('profile.noPosts')}</h3>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-[#A8A8A8] max-w-[420px] leading-relaxed mb-6">
          {t('profile.noPostsDesc', { name: displayName })}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {isOwnProfile && (
            <button
              className="bg-[#004AC6] hover:bg-[#002970] dark:bg-[#0095F6] dark:hover:bg-[#1877F2] text-white text-xs sm:text-sm font-semibold h-10 px-5 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus className="w-4 h-4" />
              <span>{t('profile.createNewPost')}</span>
            </button>
          )}
          <button
            className="bg-gray-100 hover:bg-gray-200/80 dark:bg-[#1A1A1A] dark:hover:bg-[#262626] text-gray-700 dark:text-[#F5F5F5] text-xs sm:text-sm font-semibold h-10 px-5 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            type="button"
          >
            <Zap className="w-4 h-4 text-gray-500 dark:text-[#A8A8A8]" />
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

  // ============================================================
  // Reposts Tab
  // ============================================================
  if (activeTab === 'Reposts') {
    // Loading
    if (isLoadingReposts) {
      return (
        <div className="space-y-4">
          <PostSkeleton />
          <PostSkeleton />
        </div>
      );
    }

    // Has reposts
    if (repostedPosts.length > 0) {
      return (
        <>
          {/* Section Header */}
          <div className="flex items-center gap-2 px-1 mb-2">
            <Repeat2 className="w-4 h-4 text-emerald-500" />
            <p className="text-xs text-gray-500 dark:text-[#A8A8A8]">
              {isOwnProfile
                ? language === 'vi'
                  ? `Bạn đã repost ${repostedPosts.length} bài viết`
                  : `You reposted ${repostedPosts.length} posts`
                : language === 'vi'
                ? `${displayName} đã repost ${repostedPosts.length} bài viết`
                : `${displayName} reposted ${repostedPosts.length} posts`}
            </p>
          </div>

          <div className="space-y-4">
            {repostedPosts.map((post) => (
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
              onClose={() => { setIsLightboxOpen(false); setLightboxPost(null); }}
              onPostUpdated={handlePostUpdated}
              onPostDeleted={handlePostDeleted}
            />
          )}
        </>
      );
    }

    // Empty reposts
    return (
      <div className="bg-white dark:bg-[#121212] border border-gray-100 dark:border-[#262626] rounded-3xl p-8 sm:p-12 text-center shadow-sm flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 flex items-center justify-center mb-4">
          <Repeat2 className="w-8 h-8 text-emerald-500 dark:text-emerald-400" />
        </div>
        <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-[#F5F5F5] mb-2">
          {isOwnProfile
            ? language === 'vi' ? 'Bạn chưa repost bài nào' : 'No reposts yet'
            : language === 'vi' ? `${displayName} chưa repost bài nào` : `${displayName} hasn't reposted yet`}
        </h3>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-[#A8A8A8] max-w-[360px] leading-relaxed">
          {isOwnProfile
            ? language === 'vi'
              ? 'Khi bạn repost một bài viết, nó sẽ xuất hiện tại đây để mọi người có thể xem.'
              : 'When you repost a post, it will appear here for others to see.'
            : language === 'vi'
            ? 'Các bài viết mà họ repost sẽ hiển thị tại đây.'
            : 'Posts they repost will appear here.'}
        </p>
      </div>
    );
  }

  // Other Tabs (Replies, Media, Likes) — generic placeholder
  return (
    <div className="bg-white dark:bg-[#121212] border border-gray-100 dark:border-[#262626] rounded-3xl p-8 text-center shadow-sm flex flex-col items-center justify-center">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-[#F5F5F5] mb-1">
        {language === 'vi' ? `Mục ${activeTab} trống` : `${activeTab} section is empty`}
      </h3>
      <p className="text-xs text-gray-500 dark:text-[#A8A8A8]">
        {language === 'vi' ? 'Chưa có nội dung nào trong phần này.' : 'No content available in this section yet.'}
      </p>
    </div>
  );
};

export default ProfileTabs;
