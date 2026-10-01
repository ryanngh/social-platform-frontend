import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  X,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Send,
  CheckCircle,
  UserPlus,
  UserCheck,
  ExternalLink,
  Loader2,
  Volume2,
  Volume1,
  VolumeX,
  Play,
  Pause,
} from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import type { ExplorePost, CommentResponse } from '../../types';
import { getMediaUrl, isVideoMedia } from '../../utils/media';
import { getProfileUrl } from '../../utils/user';
import { UserAvatar } from '../common/UserAvatar';
import { FormattedText } from '../common/FormattedText';
import { postService } from '../../services/postService';
import { userService } from '../../services/userService';
import { commentService } from '../../services/commentService';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';

interface ExploreDetailModalProps {
  post: ExplorePost;
  onClose: () => void;
  onPostUpdate?: (updatedPost: Partial<ExplorePost>) => void;
}

export const ExploreDetailModal: React.FC<ExploreDetailModalProps> = ({
  post,
  onClose,
  onPostUpdate,
}) => {
  const { user: currentUser } = useAuth();
  const { t } = useLanguage();

  const [isLiked, setIsLiked] = useState(Boolean(post.isLiked));
  const [likesCount, setLikesCount] = useState(post.metrics.likesCount);
  const [isSaved, setIsSaved] = useState(Boolean(post.isSaved));
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  // Comments state
  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [commentsCount, setCommentsCount] = useState(post.metrics.commentsCount);
  const [isLoadingComments, setIsLoadingComments] = useState(true);
  const [newCommentText, setNewCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Video & Volume state
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState<number>(() => {
    const saved = localStorage.getItem('reelVolume');
    return saved !== null ? parseFloat(saved) : 0.8;
  });
  const [isVideoMuted, setIsVideoMuted] = useState<boolean>(() => {
    const savedMuted = localStorage.getItem('reelMuted');
    return savedMuted !== null ? savedMuted === 'true' : false;
  });

  const commentsEndRef = useRef<HTMLDivElement>(null);
  const isVideo = isVideoMedia(post.media?.url, post.media?.mediaType);
  const mediaUrl = getMediaUrl(post.media?.url);
  const isOwnPost = currentUser?.id === post.author.id;

  // Sync volume and muted state to video element
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isVideoMuted;
    }
  }, [volume, isVideoMuted]);

  // Handle ESC key press & scroll locking
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  // Fetch comments for this post
  useEffect(() => {
    let isMounted = true;
    setIsLoadingComments(true);

    commentService
      .getComments(post.id, { page: 0, size: 20, sortBy: 'NEWEST' })
      .then((res) => {
        if (isMounted && res?.content) {
          setComments(res.content);
        }
      })
      .catch((err) => {
        console.warn('Could not load comments for explore post:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingComments(false);
      });

    return () => {
      isMounted = false;
    };
  }, [post.id]);

  // Handle volume slider change
  const handleVolumeChange = (newVal: number) => {
    setVolume(newVal);
    localStorage.setItem('reelVolume', newVal.toString());
    if (videoRef.current) {
      videoRef.current.volume = newVal;
      if (newVal === 0) {
        setIsVideoMuted(true);
        localStorage.setItem('reelMuted', 'true');
        videoRef.current.muted = true;
      } else if (isVideoMuted) {
        setIsVideoMuted(false);
        localStorage.setItem('reelMuted', 'false');
        videoRef.current.muted = false;
      }
    }
  };

  // Handle mute toggle button
  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextMuted = !isVideoMuted;
    setIsVideoMuted(nextMuted);
    localStorage.setItem('reelMuted', nextMuted.toString());
    if (videoRef.current) {
      videoRef.current.muted = nextMuted;
      if (!nextMuted && volume === 0) {
        setVolume(0.8);
        localStorage.setItem('reelVolume', '0.8');
        videoRef.current.volume = 0.8;
      }
    }
  };

  // Toggle video play / pause
  const handleTogglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  // Video time update
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration || 0);
    }
  };

  // Seek video
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  // Toggle Like
  const handleToggleLike = async () => {
    const nextState = !isLiked;
    setIsLiked(nextState);
    const updatedLikesCount = nextState ? likesCount + 1 : Math.max(0, likesCount - 1);
    setLikesCount(updatedLikesCount);

    if (nextState) {
      toast.success('Đã thích bài viết', { icon: '❤️' });
    }

    onPostUpdate?.({
      isLiked: nextState,
      metrics: { ...post.metrics, likesCount: updatedLikesCount },
    });

    try {
      if (nextState) {
        await postService.likePost(post.id);
      } else {
        await postService.unlikePost(post.id);
      }
    } catch (err) {
      // Revert on error
      setIsLiked(!nextState);
      setLikesCount(likesCount);
      onPostUpdate?.({
        isLiked: !nextState,
        metrics: { ...post.metrics, likesCount: likesCount },
      });
      toast.error('Không thể cập nhật lượt thích');
      console.error('Like toggle failed:', err);
    }
  };

  // Toggle Save
  const handleToggleSave = () => {
    const next = !isSaved;
    setIsSaved(next);
    toast.success(next ? 'Đã lưu bài viết vào mục Đã lưu' : 'Đã bỏ lưu bài viết', {
      icon: next ? '🔖' : '🗑️',
    });
    onPostUpdate?.({ isSaved: next });
  };

  // Share post
  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/posts/${post.id}`;
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Đã sao chép liên kết bài viết!');
    }
    try {
      await postService.sharePost(post.id);
    } catch (err) {
      console.warn('Share recording error:', err);
    }
  };

  // Toggle Follow
  const handleToggleFollow = async () => {
    if (isOwnPost || isFollowLoading) return;
    setIsFollowLoading(true);
    const next = !isFollowing;

    try {
      if (next) {
        await userService.followUser(post.author.id);
        setIsFollowing(true);
        toast.success(`Đã theo dõi @${post.author.username}`);
      } else {
        await userService.unfollowUser(post.author.id);
        setIsFollowing(false);
        toast.success(`Đã hủy theo dõi @${post.author.username}`);
      }
    } catch (err) {
      toast.error('Không thể cập nhật theo dõi');
      console.error('Follow toggle error:', err);
    } finally {
      setIsFollowLoading(false);
    }
  };

  // Submit comment
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = newCommentText.trim();
    if (!content || isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      const created = await commentService.createComment(post.id, { content });
      setComments((prev) => [created, ...prev]);
      const updatedCount = commentsCount + 1;
      setCommentsCount(updatedCount);
      setNewCommentText('');
      toast.success('Đã gửi bình luận');
      onPostUpdate?.({
        metrics: { ...post.metrics, commentsCount: updatedCount },
      });
    } catch (err) {
      toast.error('Gửi bình luận thất bại. Vui lòng thử lại.');
      console.error('Create comment error:', err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Format date helper
  const formattedDate = new Date(post.createdAt).toLocaleDateString('vi-VN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#121212] rounded-3xl max-w-5xl w-full max-h-[92vh] sm:max-h-[88vh] overflow-hidden shadow-2xl flex flex-col md:flex-row border border-gray-200 dark:border-[#262626]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ================= LEFT: MEDIA VIEW & REEL CONTROLS ================= */}
        <div className="md:w-3/5 bg-black flex items-center justify-center relative min-h-[280px] sm:min-h-[380px] md:min-h-[560px] overflow-hidden select-none">
          {isVideo ? (
            <div
              className="relative w-full h-full flex items-center justify-center cursor-pointer group"
              onClick={handleTogglePlay}
            >
              <video
                ref={videoRef}
                src={mediaUrl}
                autoPlay
                loop
                playsInline
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleTimeUpdate}
                className="max-h-[560px] w-full object-contain"
              />

              {/* Center Play indicator when paused */}
              {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
                  <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white shadow-xl">
                    <Play className="w-8 h-8 fill-white ml-1" />
                  </div>
                </div>
              )}

              {/* Floating Bottom Bar: Seek Bar + Volume Control */}
              <div
                className="absolute bottom-0 inset-x-0 p-3.5 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col gap-2 z-10"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Video Seek Scrubber */}
                {duration > 0 && (
                  <input
                    type="range"
                    min={0}
                    max={duration}
                    step={0.1}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-[#0095F6] hover:h-1.5 transition-all"
                    title="Tua video"
                  />
                )}

                {/* Bottom Controls Row: Play/Pause + Volume Slider */}
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleTogglePlay}
                    className="p-1.5 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md transition cursor-pointer"
                    title={isPlaying ? 'Tạm dừng' : 'Phát'}
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                  </button>

                  {/* Interactive Volume Slider */}
                  <div className="flex items-center bg-black/60 hover:bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-full text-white transition-all shadow-lg border border-white/10 group/vol">
                    <button
                      type="button"
                      onClick={handleToggleMute}
                      className="cursor-pointer transition hover:scale-110"
                      title={isVideoMuted || volume === 0 ? 'Bật âm thanh' : 'Tắt âm thanh'}
                    >
                      {isVideoMuted || volume === 0 ? (
                        <VolumeX className="w-4 h-4 text-rose-400" />
                      ) : volume < 0.5 ? (
                        <Volume1 className="w-4 h-4 text-white" />
                      ) : (
                        <Volume2 className="w-4 h-4 text-white" />
                      )}
                    </button>

                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={isVideoMuted ? 0 : volume}
                      onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                      className="w-16 sm:w-20 h-1.5 bg-white/30 rounded-lg appearance-none cursor-pointer accent-[#0095F6] ml-2.5 transition-all"
                      title={`Âm lượng: ${Math.round((isVideoMuted ? 0 : volume) * 100)}%`}
                    />
                    <span className="text-[10px] font-bold tabular-nums ml-2 w-7 text-right text-white/90">
                      {Math.round((isVideoMuted ? 0 : volume) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <img
              src={mediaUrl}
              alt={post.caption || 'Explore post'}
              className="max-h-[560px] w-full object-contain"
            />
          )}
        </div>

        {/* ================= RIGHT: INFO & COMMENTS ================= */}
        <div className="md:w-2/5 flex flex-col justify-between p-4 sm:p-5 max-h-[560px] bg-white dark:bg-[#121212] border-t md:border-t-0 md:border-l border-gray-100 dark:border-[#262626]">
          {/* Top Section */}
          <div className="flex flex-col flex-1 min-h-0">
            {/* Header: Author Info & Close */}
            <div className="flex items-center justify-between pb-3.5 border-b border-gray-100 dark:border-[#262626]">
              <div className="flex items-center gap-3 min-w-0">
                <Link
                  to={getProfileUrl(post.author.username || post.author.id)}
                  onClick={onClose}
                  className="shrink-0"
                >
                  <UserAvatar
                    src={post.author.avatarUrl}
                    alt={post.author.fullName || post.author.username}
                    userId={post.author.id}
                    size="sm"
                  />
                </Link>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Link
                      to={getProfileUrl(post.author.username || post.author.id)}
                      onClick={onClose}
                      className="font-bold text-sm text-gray-900 dark:text-[#F5F5F5] hover:underline truncate"
                    >
                      {post.author.fullName || post.author.username}
                    </Link>
                    {post.author.isVerified && (
                      <CheckCircle className="w-3.5 h-3.5 text-sky-500 fill-sky-500 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-[#8E8E8E] truncate">
                    @{post.author.username} · {formattedDate}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!isOwnPost && (
                  <button
                    onClick={handleToggleFollow}
                    disabled={isFollowLoading}
                    className={clsx(
                      'px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer whitespace-nowrap',
                      isFollowing
                        ? 'bg-gray-100 dark:bg-[#262626] text-gray-700 dark:text-[#D4D4D4] hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40'
                        : 'bg-[#004AC6] dark:bg-[#0095F6] text-white hover:opacity-90 shadow-xs'
                    )}
                  >
                    {isFollowLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : isFollowing ? (
                      <>
                        <UserCheck className="w-3.5 h-3.5 shrink-0" />
                        <span>Đang theo dõi</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5 shrink-0" />
                        <span>Theo dõi</span>
                      </>
                    )}
                  </button>
                )}

                <button
                  onClick={onClose}
                  className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-[#202020] transition cursor-pointer"
                  title="Đóng (Esc)"
                  aria-label="Đóng"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Caption & Scrollable Comments Area */}
            <div className="flex-1 overflow-y-auto py-3 space-y-3 custom-scrollbar pr-1">
              {/* Caption Section */}
              {post.caption && (
                <div className="p-3 bg-gray-50 dark:bg-[#181818] rounded-2xl border border-gray-100 dark:border-[#262626] text-xs sm:text-sm text-gray-800 dark:text-[#E0E0E0] leading-relaxed">
                  <FormattedText text={post.caption} />
                </div>
              )}

              {/* Comments Title */}
              <div className="flex items-center justify-between text-xs font-bold text-gray-500 dark:text-[#8E8E8E] px-1 pt-1">
                <span>BÌNH LUẬN ({commentsCount})</span>
                <Link
                  to={`/posts/${post.id}`}
                  onClick={onClose}
                  className="text-[#004AC6] dark:text-[#0095F6] hover:underline flex items-center gap-1 font-semibold"
                >
                  <span>Mở trang bài viết</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>

              {/* Comments Stream */}
              {isLoadingComments ? (
                <div className="flex items-center justify-center py-8 text-gray-400">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  <span className="text-xs">Đang tải bình luận...</span>
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-8 text-gray-400 dark:text-[#737373] text-xs">
                  <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p>Chưa có bình luận nào.</p>
                  <p className="text-[11px] mt-0.5">Hãy là người đầu tiên chia sẻ suy nghĩ!</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="flex items-start gap-2.5 text-xs group"
                    >
                      <UserAvatar
                        src={comment.author.avatarUrl}
                        alt={comment.author.fullName || comment.author.username}
                        userId={comment.author.id}
                        size="xs"
                        showPresence={false}
                        className="mt-0.5"
                      />
                      <div className="flex-1 bg-gray-50 dark:bg-[#1A1A1A] p-2.5 rounded-2xl border border-gray-100/80 dark:border-[#262626]">
                        <div className="flex items-center justify-between mb-1">
                          <Link
                            to={getProfileUrl(comment.author.username || comment.author.id)}
                            onClick={onClose}
                            className="font-bold text-gray-900 dark:text-[#F5F5F5] hover:underline"
                          >
                            {comment.author.fullName || comment.author.username}
                          </Link>
                          <span className="text-[10px] text-gray-400">
                            {new Date(comment.createdAt).toLocaleDateString('vi-VN', {
                              month: 'numeric',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                        <p className="text-gray-700 dark:text-[#D4D4D4] leading-snug">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={commentsEndRef} />
                </div>
              )}
            </div>
          </div>

          {/* ================= FOOTER: ACTIONS & INPUT ================= */}
          <div className="pt-3 border-t border-gray-100 dark:border-[#262626] mt-2 space-y-3">
            {/* Actions Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleToggleLike}
                  className="flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-[#D4D4D4] hover:text-rose-500 transition cursor-pointer"
                >
                  <Heart
                    className={clsx(
                      'w-5 h-5 transition-transform duration-150 active:scale-125',
                      isLiked
                        ? 'fill-rose-500 text-rose-500'
                        : 'text-gray-500 dark:text-[#8E8E8E]'
                    )}
                  />
                  <span>{likesCount}</span>
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  className="p-1.5 text-gray-500 dark:text-[#8E8E8E] hover:text-[#004AC6] dark:hover:text-[#0095F6] transition cursor-pointer"
                  title="Chia sẻ bài viết"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleToggleSave}
                className="p-1.5 text-gray-500 dark:text-[#8E8E8E] hover:text-[#004AC6] dark:hover:text-[#0095F6] transition cursor-pointer"
                title="Lưu bài viết"
              >
                <Bookmark
                  className={clsx(
                    'w-5 h-5',
                    isSaved &&
                      'fill-[#004AC6] text-[#004AC6] dark:fill-[#0095F6] dark:text-[#0095F6]'
                  )}
                />
              </button>
            </div>

            {/* Comment Form */}
            <form onSubmit={handleSubmitComment} className="flex items-center gap-2">
              <input
                type="text"
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder={t('explore.writeComment') || 'Viết bình luận...'}
                className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-[#1C1C1C] border border-transparent dark:border-[#2C2C2C] rounded-full text-xs sm:text-sm text-gray-900 dark:text-[#F5F5F5] placeholder-gray-400 dark:placeholder-[#737373] outline-none focus:border-[#004AC6] dark:focus:border-[#0095F6] focus:bg-white dark:focus:bg-[#141414] transition"
              />
              <button
                type="submit"
                disabled={!newCommentText.trim() || isSubmittingComment}
                className="p-2.5 bg-[#004AC6] dark:bg-[#0095F6] text-white rounded-full disabled:opacity-40 hover:opacity-90 transition cursor-pointer shrink-0"
              >
                {isSubmittingComment ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExploreDetailModal;
