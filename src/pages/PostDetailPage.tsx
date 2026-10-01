import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle, RefreshCw } from 'lucide-react';
import type { PostResponse } from '../types';
import { postService } from '../services/postService';
import { PostCard } from '../components/post/PostCard';
import { useLanguage } from '../contexts/LanguageContext';

const PostSkeleton = () => (
  <div className="bg-white dark:bg-[#121212] rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-[#262626] animate-pulse">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-[#262626]" />
      <div className="space-y-2 flex-1">
        <div className="h-4 bg-gray-200 dark:bg-[#262626] rounded w-1/4" />
        <div className="h-3 bg-gray-200 dark:bg-[#262626] rounded w-1/6" />
      </div>
    </div>
    <div className="space-y-2 mb-4">
      <div className="h-4 bg-gray-200 dark:bg-[#262626] rounded w-full" />
      <div className="h-4 bg-gray-200 dark:bg-[#262626] rounded w-4/5" />
    </div>
    <div className="h-64 bg-gray-200 dark:bg-[#262626] rounded-2xl mb-4" />
    <div className="h-8 bg-gray-100 dark:bg-[#1A1A1A] rounded-xl" />
  </div>
);

const PostDetailPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();

  const [post, setPost] = useState<PostResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPost = async () => {
    if (!postId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await postService.getPostById(postId);
      setPost(data);
    } catch (err: any) {
      console.error('Failed to fetch post details:', err);
      if (err?.response?.status === 404) {
        setError(
          language === 'vi'
            ? 'Bài viết không tồn tại hoặc đã bị xóa.'
            : 'This post does not exist or has been deleted.'
        );
      } else if (err?.response?.status === 403) {
        setError(
          language === 'vi'
            ? 'Bạn không có quyền xem bài viết này.'
            : 'You do not have permission to view this post.'
        );
      } else {
        setError(
          language === 'vi'
            ? 'Không thể tải bài viết. Vui lòng thử lại sau.'
            : 'Failed to load post. Please try again later.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPost();
  }, [postId]);

  const handlePostDeleted = () => {
    navigate('/feed', { replace: true });
  };

  const handleBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/feed');
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Top Header with Back button */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center gap-2 px-3.5 py-2 min-h-[44px] text-sm font-semibold text-gray-700 dark:text-[#E5E5E5] bg-white dark:bg-[#121212] hover:bg-gray-100 dark:hover:bg-[#262626] rounded-2xl shadow-xs border border-gray-200/80 dark:border-[#262626] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-gray-600 dark:text-[#A8A8A8]" />
          <span>{language === 'vi' ? 'Quay lại' : 'Back'}</span>
        </button>
        <h2 className="text-base font-bold text-gray-900 dark:text-[#F5F5F5]">
          {language === 'vi' ? 'Chi tiết bài viết' : 'Post Detail'}
        </h2>
      </div>

      {/* Loading Skeleton */}
      {isLoading && <PostSkeleton />}

      {/* Error state */}
      {!isLoading && error && (
        <div className="bg-white dark:bg-[#121212] border border-[#E2E2EC] dark:border-[#262626] rounded-3xl p-8 sm:p-12 text-center shadow-xs flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/60 flex items-center justify-center text-red-500 dark:text-red-400 mb-4 shadow-xs">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-[#F5F5F5] mb-2">
            {language === 'vi' ? 'Không tìm thấy bài viết' : 'Post Not Found'}
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-[#A8A8A8] max-w-md leading-relaxed mb-6">
            {error}
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={fetchPost}
              className="px-5 py-2.5 bg-[#EDEDF8] hover:bg-slate-200 dark:bg-[#1A1A1A] dark:hover:bg-[#363636] text-[#1A1C1E] dark:text-[#F5F5F5] text-xs font-semibold rounded-full transition flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>{language === 'vi' ? 'Thử lại' : 'Retry'}</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/feed')}
              className="px-5 py-2.5 bg-[#004AC6] hover:bg-[#003A9F] dark:bg-[#0095F6] dark:hover:bg-[#1877F2] text-white text-xs font-semibold rounded-full transition shadow-xs cursor-pointer"
            >
              <span>{language === 'vi' ? 'Về Bảng tin' : 'Go to Feed'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Post Content */}
      {!isLoading && post && (
        <PostCard
          post={post}
          defaultShowComments={true}
          onPostUpdated={(updated) => setPost(updated)}
          onPostDeleted={handlePostDeleted}
        />
      )}
    </div>
  );
};

export default PostDetailPage;
