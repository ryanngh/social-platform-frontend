import React, { useState } from 'react';
import PostComposer from '../components/feed/PostComposer';
import StoriesCarousel from '../components/feed/StoriesCarousel';
import FeedTabs from '../components/feed/FeedTabs';
import FeedEmptyState from '../components/feed/FeedEmptyState';
import FeedAllCaughtUpState from '../components/feed/FeedAllCaughtUpState';
import FeedNetworkErrorState from '../components/feed/FeedNetworkErrorState';
import FeedSkeleton from '../components/feed/FeedSkeleton';
import { ImageFeedPost, PollFeedPost } from '../components/feed/FeedPostCard';
import CreatePostModal from '../components/feed/CreatePostModal';
import { useSearchParams } from 'react-router-dom';

type FeedState = 'empty' | 'posts' | 'all-caught-up' | 'skeleton' | 'network-error';

const FeedPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const urlState = (searchParams.get('state') as FeedState) || 'empty';

  // Default is 'empty' as requested by the user since no Posts API exists yet
  const [feedState, setFeedState] = useState<FeedState>(urlState);
  const [activeTab, setActiveTab] = useState('for-you');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [customPosts, setCustomPosts] = useState<string[]>([]);

  const handleCreatePost = (content: string) => {
    setCustomPosts((prev) => [content, ...prev]);
    // Switch to posts view so the user immediately sees their created post
    setFeedState('posts');
  };

  return (
    <div className="flex flex-col gap-4">

      {/* Post Composer Box */}
      <PostComposer onOpenCreateModal={() => setIsCreateModalOpen(true)} />

      {/* Stories Carousel */}
      <StoriesCarousel />

      {/* Feed Category Filter Bar */}
      <FeedTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Custom User Created Posts */}
      {customPosts.length > 0 && (
        <div className="flex flex-col gap-4">
          {customPosts.map((text, idx) => (
            <article key={idx} className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 animate-fadeIn">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[#004AC6] text-white font-bold flex items-center justify-center">
                  Tôi
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">Bạn vừa đăng</h4>
                  <p className="text-xs text-gray-400">Vừa xong</p>
                </div>
              </div>
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{text}</p>
            </article>
          ))}
        </div>
      )}

      {/* Active State View */}
      {feedState === 'empty' && <FeedEmptyState />}

      {feedState === 'posts' && (
        <div className="flex flex-col gap-4">
          <ImageFeedPost />
          <PollFeedPost />
        </div>
      )}

      {feedState === 'all-caught-up' && (
        <div className="flex flex-col gap-4">
          <ImageFeedPost />
          <FeedAllCaughtUpState />
        </div>
      )}

      {feedState === 'skeleton' && <FeedSkeleton />}

      {feedState === 'network-error' && (
        <FeedNetworkErrorState onRetry={() => setFeedState('posts')} />
      )}

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmitPost={handleCreatePost}
      />
    </div>
  );
};

export default FeedPage;
