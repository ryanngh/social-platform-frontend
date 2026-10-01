import React, { useState, useEffect } from 'react';
import {
  Play,
  Layers,
  Heart,
  MessageCircle,
  Bookmark,
  CheckCircle,
} from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import type { ExplorePost } from '../../types';
import { getMediaUrl, isVideoMedia } from '../../utils/media';
import { postService } from '../../services/postService';

interface ExploreCardProps {
  post: ExplorePost;
  onSelect: (post: ExplorePost) => void;
  onToggleLike?: (postId: string, isLiked: boolean, likesCount: number) => void;
  onToggleSave?: (postId: string, isSaved: boolean) => void;
}

export const ExploreCard: React.FC<ExploreCardProps> = ({
  post,
  onSelect,
  onToggleLike,
  onToggleSave,
}) => {
  const [isLikedLocally, setIsLikedLocally] = useState(Boolean(post.isLiked));
  const [likesCountLocally, setLikesCountLocally] = useState(post.metrics.likesCount);
  const [isSavedLocally, setIsSavedLocally] = useState(Boolean(post.isSaved));
  const [isLiking, setIsLiking] = useState(false);

  // Sync state if post props change
  useEffect(() => {
    setIsLikedLocally(Boolean(post.isLiked));
    setLikesCountLocally(post.metrics.likesCount);
    setIsSavedLocally(Boolean(post.isSaved));
  }, [post.isLiked, post.metrics.likesCount, post.isSaved]);

  const mediaUrl = getMediaUrl(post.media?.url);
  const isVideo = isVideoMedia(post.media?.url, post.media?.mediaType);
  const hasMultiple = Boolean(post.media?.hasMultipleMedia && post.media.mediaCount > 1);

  // Handle Like Action with API Call & Optimistic Update
  const handleLikeClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (isLiking) return;

    const nextLiked = !isLikedLocally;
    const nextCount = nextLiked ? likesCountLocally + 1 : Math.max(0, likesCountLocally - 1);

    // Optimistic UI state
    setIsLikedLocally(nextLiked);
    setLikesCountLocally(nextCount);
    if (nextLiked) {
      toast.success('Đã thích bài viết', { icon: '❤️' });
    }

    onToggleLike?.(post.id, nextLiked, nextCount);

    setIsLiking(true);
    try {
      if (nextLiked) {
        await postService.likePost(post.id);
      } else {
        await postService.unlikePost(post.id);
      }
    } catch (err) {
      // Revert if API fails
      setIsLikedLocally(!nextLiked);
      setLikesCountLocally(likesCountLocally);
      onToggleLike?.(post.id, !nextLiked, likesCountLocally);
      toast.error('Không thể cập nhật lượt thích');
      console.error('Like error on explore post:', err);
    } finally {
      setIsLiking(false);
    }
  };

  // Handle Save Action
  const handleSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const next = !isSavedLocally;
    setIsSavedLocally(next);
    toast.success(next ? 'Đã lưu bài viết vào mục Đã lưu' : 'Đã bỏ lưu bài viết', {
      icon: next ? '🔖' : '🗑️',
    });
    onToggleSave?.(post.id, next);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(post)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(post);
        }
      }}
      className="group relative bg-gray-100 dark:bg-[#1A1A1A] rounded-3xl overflow-hidden cursor-pointer aspect-square shadow-sm hover:shadow-md transition duration-300 border border-gray-100/60 dark:border-[#262626] focus:outline-none focus:ring-2 focus:ring-[#004AC6] dark:focus:ring-[#0095F6] select-none"
    >
      {/* 1. Media Preview: Video with First-Frame Poster or Image */}
      {isVideo ? (
        <video
          src={`${mediaUrl}#t=0.001`}
          muted
          playsInline
          preload="metadata"
          loop
          className="w-full h-full object-cover group-hover:scale-105 transition duration-500 ease-out pointer-events-none"
        />
      ) : (
        <img
          src={mediaUrl}
          alt={post.caption || 'Explore media'}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-500 ease-out"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
          }}
        />
      )}

      {/* 2. Format Badges (Top Right) */}
      <div className="absolute top-3 right-3 flex items-center gap-1 z-10 pointer-events-none">
        {isVideo && (
          <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
            <Play className="w-2.5 h-2.5 fill-white" />
            <span>Reel</span>
          </span>
        )}
        {hasMultiple && (
          <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
            <Layers className="w-3 h-3" />
            <span>1/{post.media.mediaCount}</span>
          </span>
        )}
      </div>

      {/* 3. Gradient & Hover Overlay (Matching Mock Design) */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3.5 sm:p-4 text-white z-20">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSaveClick}
            className="p-2 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 text-white transition cursor-pointer"
            title="Lưu bài viết"
            aria-label="Lưu bài viết"
          >
            <Bookmark
              className={clsx('w-4 h-4', isSavedLocally && 'fill-white text-white')}
            />
          </button>
        </div>

        <div>
          {/* Author line */}
          <div className="flex items-center gap-2 mb-1.5">
            <img
              src={getMediaUrl(post.author.avatarUrl) || '/default-avatar.png'}
              alt={post.author.fullName || post.author.username}
              className="w-5 h-5 rounded-full object-cover border border-white/60"
            />
            <span className="text-xs font-semibold truncate drop-shadow-sm">
              {post.author.fullName || post.author.username}
            </span>
            {post.author.isVerified && (
              <CheckCircle className="w-3 h-3 text-sky-400 fill-sky-400 shrink-0" />
            )}
          </div>

          {/* Caption / Title */}
          {post.caption && (
            <p className="text-xs font-bold line-clamp-1 drop-shadow-sm mb-2">
              {post.caption}
            </p>
          )}

          {/* Stats Footer with Clickable Heart Button */}
          <div className="flex items-center gap-4 text-[11px] font-medium text-white/90">
            <button
              type="button"
              onClick={handleLikeClick}
              disabled={isLiking}
              className="flex items-center gap-1.5 p-1 -m-1 rounded-lg hover:text-rose-400 hover:bg-white/10 transition-all duration-150 cursor-pointer active:scale-110"
              title={isLikedLocally ? 'Bỏ thích' : 'Thích bài viết'}
              aria-label={`Thích (${likesCountLocally})`}
            >
              <Heart
                className={clsx(
                  'w-4 h-4 transition-transform duration-150',
                  isLikedLocally
                    ? 'fill-rose-500 text-rose-500 scale-110'
                    : 'fill-white/20 text-white hover:fill-white/40'
                )}
              />
              <span className="tabular-nums font-semibold">{likesCountLocally}</span>
            </button>

            <span className="flex items-center gap-1">
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="tabular-nums">{post.metrics.commentsCount}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExploreCard;
