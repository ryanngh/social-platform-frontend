import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import {
  X,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  Maximize2,
  MoreHorizontal,
  MessageCircle,
  Repeat2,
  Heart,
  Eye,
  Bookmark,
  Share2,
  ChevronDown,
  Globe,
  Users,
  Lock,
  MessageSquareText,
  Play,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { getMediaUrl, isVideoMedia } from '../../utils/media';
import { getProfileUrl } from '../../utils/user';
import { commentService } from '../../services/commentService';
import { postService } from '../../services/postService';
import type { PostResponse, CommentResponse, CommentMediaRequest, PostVisibility } from '../../types';
import { getContentWithoutHashtags, extractHashtags } from '../../utils/text';
import { handleCopyAndSharePost } from '../../utils/share';
import PostMoreMenu from './PostMoreMenu';
import CommentItem from './CommentItem';
import CommentInput from './CommentInput';
import UserAvatar from '../common/UserAvatar';
import FormattedText from '../common/FormattedText';
import LikersModal from './LikersModal';
import EditPostModal from './EditPostModal';
import DeletePostModal from './DeletePostModal';
import CustomVideoPlayer from '../media/CustomVideoPlayer';

// ============================================================
// Props
// ============================================================

interface PostMediaLightboxProps {
  post: PostResponse;
  initialMediaIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  onPostUpdated?: (post: PostResponse) => void;
  onPostDeleted?: (postId: string) => void;
}

// ============================================================
// Helper: format relative time
// ============================================================

function formatRelativeTime(dateStr: string, language: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return language === 'vi' ? 'Vừa xong' : 'Just now';
  if (minutes < 60) return language === 'vi' ? `${minutes} phút trước` : `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return language === 'vi' ? `${hours} giờ trước` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return language === 'vi' ? `${days} ngày trước` : `${days}d ago`;
}

// ============================================================
// Helper: format large numbers
// ============================================================

function formatCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return String(count);
}

// ============================================================
// Component
// ============================================================

export const PostMediaLightbox: React.FC<PostMediaLightboxProps> = ({
  post: initialPost,
  initialMediaIndex = 0,
  isOpen,
  onClose,
  onPostUpdated,
  onPostDeleted,
}) => {
  const { t, language } = useLanguage();
  const { user: currentUser } = useAuth();

  // Post state (để cập nhật khi edit hoặc đổi visibility mà không cần refresh)
  const [currentPost, setCurrentPost] = useState<PostResponse>(initialPost);
  const isAuthor = currentUser?.id === currentPost.author.id;

  // Post Edit state
  const [isEditingPost, setIsEditingPost] = useState(false);
  const [editedPostContent, setEditedPostContent] = useState(initialPost.content);
  const [isSavingPostEdit, setIsSavingPostEdit] = useState(false);

  // Media navigation
  const [currentIndex, setCurrentIndex] = useState(initialMediaIndex);
  const totalMedia = currentPost.media.length;
  const currentMedia = currentPost.media[currentIndex] || null;
  const mediaTheaterRef = useRef<HTMLElement>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isEditPostModalOpen, setIsEditPostModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const MIN_ZOOM = 0.5;
  const MAX_ZOOM = 3;
  const ZOOM_STEP = 0.25;

  // Post interactions (optimistic)
  const [isLiked, setIsLiked] = useState(initialPost.isLiked ?? initialPost.liked ?? false);
  const [likeCount, setLikeCount] = useState(currentPost.reactionCount);
  const [shareCount, setShareCount] = useState(initialPost.shareCount ?? 0);
  const [isLiking, setIsLiking] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Likers Modal state
  const [isLikersOpen, setIsLikersOpen] = useState(false);
  const [likersTarget, setLikersTarget] = useState<{ id: string; type: 'post' | 'comment'; totalLikes?: number }>({
    id: initialPost.id,
    type: 'post',
    totalLikes: initialPost.reactionCount,
  });

  const handleOpenLikers = (id: string, type: 'post' | 'comment', total?: number) => {
    setLikersTarget({ id, type, totalLikes: total ?? 0 });
    setIsLikersOpen(true);
  };

  // More menu
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  // Comment sort
  const [commentSort, setCommentSort] = useState<'POPULAR' | 'NEWEST' | 'OLDEST'>('POPULAR');
  const [isSortOpen, setIsSortOpen] = useState(false);

  // Comments
  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentCount, setCommentCount] = useState(currentPost.commentCount);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Replying state
  const [replyingTo, setReplyingTo] = useState<{ commentId: string; username: string; parentCommentId?: string } | null>(null);

  // ============================================================
  // Reset state when opening / post changes
  // ============================================================

  useEffect(() => {
    if (isOpen) {
      setCurrentPost(initialPost);
      setEditedPostContent(initialPost.content);
      setIsEditingPost(false);
      setReplyingTo(null);
      setCurrentIndex(initialMediaIndex);
      setZoom(1);
      setRotation(0);
      setIsLiked(initialPost.isLiked ?? initialPost.liked ?? false);
      setLikeCount(initialPost.reactionCount);
      setIsBookmarked(false);
      setComments([]);
      setCommentCount(initialPost.commentCount);
      setShareCount(initialPost.shareCount ?? 0);
      loadComments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialPost.id]);

  useEffect(() => {
    const syncFullscreenState = () => {
      setIsFullscreen(document.fullscreenElement === mediaTheaterRef.current);
    };

    document.addEventListener('fullscreenchange', syncFullscreenState);
    return () => document.removeEventListener('fullscreenchange', syncFullscreenState);
  }, []);

  // ============================================================
  // Load comments
  // ============================================================

  const loadComments = useCallback(async () => {
    setIsLoadingComments(true);
    try {
      const data = await commentService.getComments(currentPost.id, {
        sortBy: commentSort,
        size: 50,
      });
      setComments(data.content);
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setIsLoadingComments(false);
    }
  }, [currentPost.id, commentSort]);

  useEffect(() => {
    if (isOpen) {
      loadComments();
    }
  }, [commentSort, isOpen, loadComments]);

  // ============================================================
  // Media Navigation
  // ============================================================

  const resetMediaTransform = () => {
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
    setIsPanning(false);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsPanning(false);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  const handleMouseDownPan = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    e.preventDefault();
    setIsPanning(true);
    panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMovePan = (e: React.MouseEvent) => {
    if (!isPanning || zoom <= 1) return;
    setPan({
      x: e.clientX - panStartRef.current.x,
      y: e.clientY - panStartRef.current.y,
    });
  };

  const handleMouseUpPan = () => {
    setIsPanning(false);
  };

  const selectMedia = (index: number) => {
    resetMediaTransform();
    setCurrentIndex(index);
  };

  const goToPrev = () => {
    resetMediaTransform();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : totalMedia - 1));
  };

  const goToNext = () => {
    resetMediaTransform();
    setCurrentIndex((prev) => (prev < totalMedia - 1 ? prev + 1 : 0));
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goToPrev();
      if (e.key === 'ArrowRight') goToNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, totalMedia]);

  // Lock body scroll when lightbox is active
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // ============================================================
  // Interactions
  // ============================================================

  const toggleLike = async () => {
    if (isLiking) return;
    const prevLiked = isLiked;
    const prevCount = likeCount;
    const nextLiked = !prevLiked;
    const nextCount = nextLiked ? prevCount + 1 : Math.max(0, prevCount - 1);

    setIsLiked(nextLiked);
    setLikeCount(nextCount);
    setIsLiking(true);

    try {
      if (nextLiked) {
        const res = await postService.likePost(currentPost.id);
        setLikeCount(res.likeCount);
        setIsLiked(res.liked);
        toast(t('postDetail.likedToast'), { icon: '❤️' });
      } else {
        const res = await postService.unlikePost(currentPost.id);
        setLikeCount(res.likeCount);
        setIsLiked(res.liked);
        toast(t('postDetail.unlikedToast'), { icon: '🤍' });
      }
      const updated = {
        ...currentPost,
        isLiked: nextLiked,
        reactionCount: nextCount,
      };
      setCurrentPost(updated);
      onPostUpdated?.(updated);
    } catch (err) {
      console.error('Failed to toggle post like:', err);
      setIsLiked(prevLiked);
      setLikeCount(prevCount);
      toast.error(t('postDetail.likeActionFailed'));
    } finally {
      setIsLiking(false);
    }
  };

  const toggleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    toast(isBookmarked ? t('feed.unsavedToast') : t('postDetail.savedToast'), {
      icon: isBookmarked ? '🗑️' : '🔖',
    });
  };

  const handleRepost = () => {
    toast.success(t('postDetail.repostedToast'));
  };

  const handleShare = async () => {
    await handleCopyAndSharePost(currentPost.id, {
      onShareCountUpdated: (newCount) => {
        setShareCount(newCount);
        const updated = { ...currentPost, shareCount: newCount };
        setCurrentPost(updated);
        onPostUpdated?.(updated);
      },
      successMessage: t('postDetail.copiedToast'),
      errorMessage: t('postDetail.copyLinkFailed'),
    });
  };

  // --- Post Author Actions ---
  const handleSavePostEdit = async () => {
    if (!editedPostContent.trim() || isSavingPostEdit) return;
    setIsSavingPostEdit(true);
    try {
      const hashtags = extractHashtags(editedPostContent);
      const updated = await postService.updatePost(currentPost.id, {
        content: editedPostContent.trim(),
        hashtags,
      });
      const updatedPostObj = {
        ...currentPost,
        content: updated.content,
        hashtags: updated.hashtags ?? hashtags,
        updatedAt: new Date().toISOString(),
      };
      setCurrentPost(updatedPostObj);
      setIsEditingPost(false);
      toast.success(t('postDetail.updatePostSuccess'));
      onPostUpdated?.(updatedPostObj);
    } catch (err) {
      console.error('Failed to update post:', err);
      toast.error('Không thể cập nhật bài viết');
    } finally {
      setIsSavingPostEdit(false);
    }
  };

  const handleChangeVisibility = async (newVis: PostVisibility) => {
    try {
      await postService.updatePost(currentPost.id, { visibility: newVis });
      const updatedPostObj = { ...currentPost, visibility: newVis };
      setCurrentPost(updatedPostObj);
      toast.success(t('postDetail.visibilityUpdated'));
      onPostUpdated?.(updatedPostObj);
    } catch (err) {
      console.error('Failed to update visibility:', err);
      toast.error('Không thể thay đổi quyền riêng tư');
    }
  };

  const handleConfirmDeletePost = async () => {
    setIsDeleting(true);
    try {
      await postService.deletePost(currentPost.id);
      toast.success(t('postDetail.deletePostSuccess'));
      setIsDeleteModalOpen(false);
      onPostDeleted?.(currentPost.id);
      onClose();
    } catch (err) {
      console.error('Failed to delete post:', err);
      toast.error(language === 'vi' ? 'Không thể xóa bài viết' : 'Failed to delete post');
    } finally {
      setIsDeleting(false);
    }
  };

  // --- Comment Actions ---
  const handleSubmitComment = async (content: string, media?: CommentMediaRequest[]) => {
    setIsSubmittingComment(true);
    try {
      const payloadContent = content.trim() || undefined;
      if (replyingTo) {
        // Gửi reply cho comment được chọn (chung cây với parentComment)
        await commentService.createReply(replyingTo.commentId, {
          content: payloadContent,
          media: media || [],
        });
        const parentId = replyingTo.parentCommentId || replyingTo.commentId;
        setComments((prev) =>
          prev.map((c) =>
            c.id === parentId ? { ...c, replyCount: c.replyCount + 1 } : c
          )
        );
        const newCount = commentCount + 1;
        setCommentCount(newCount);
        const updatedPost = { ...currentPost, commentCount: newCount };
        setCurrentPost(updatedPost);
        onPostUpdated?.(updatedPost);
        setReplyingTo(null);
        toast.success(t('postDetail.replyPosted'));
      } else {
        // Gửi comment gốc
        const newComment = await commentService.createComment(currentPost.id, {
          content: payloadContent,
          media: media || [],
        });
        setComments((prev) => [newComment, ...prev]);
        const newCount = commentCount + 1;
        setCommentCount(newCount);
        const updatedPost = { ...currentPost, commentCount: newCount };
        setCurrentPost(updatedPost);
        onPostUpdated?.(updatedPost);
        toast.success(t('postDetail.commentPosted'));
      }
    } catch (err) {
      console.error('Failed to post comment/reply:', err);
      toast.error(language === 'vi' ? 'Không thể gửi bình luận' : 'Failed to post comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handlePinChange = (_commentId: string, _isPinned: boolean) => {
    // Tải lại comments để hiển thị đúng comment được ghim lên đầu
    loadComments();
  };

  const handleCommentDeleted = (commentId: string, replyCount = 0) => {
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    const totalDeducted = 1 + replyCount;
    const newCount = Math.max(0, commentCount - totalDeducted);
    setCommentCount(newCount);
    const updatedPost = { ...currentPost, commentCount: newCount };
    setCurrentPost(updatedPost);
    onPostUpdated?.(updatedPost);
  };

  const handleDownload = async () => {
    if (!currentMedia) return;

    const url = getMediaUrl(currentMedia.mediaUrl);
    const sourceFileName = currentMedia.mediaUrl.split('?')[0].split('/').pop();
    const extension = sourceFileName?.match(/\.[a-z0-9]+$/i)?.[0]
      || (isVideoMedia(currentMedia.mediaUrl, currentMedia.mediaType) ? '.mp4' : '.jpg');

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Download failed with status ${response.status}`);

      const objectUrl = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `rysocial-${currentPost.id}-${currentIndex + 1}${extension}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error('Failed to download media:', error);
      toast.error(language === 'vi' ? 'Không thể tải xuống tệp này.' : 'Unable to download this file.');
    }
  };

  const handleToggleFullscreen = async () => {
    const theater = mediaTheaterRef.current;
    if (!theater) return;

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await theater.requestFullscreen();
      }
    } catch (error) {
      console.error('Failed to change fullscreen mode:', error);
      toast.error(language === 'vi' ? 'Không thể bật chế độ toàn màn hình.' : 'Unable to enter fullscreen mode.');
    }
  };

  // ============================================================
  // Visibility icon
  // ============================================================

  const VisibilityIcon = () => {
    switch (currentPost.visibility) {
      case 'PUBLIC':
        return <Globe className="w-3 h-3" />;
      case 'FRIENDS':
        return <Users className="w-3 h-3" />;
      case 'CLOSE_FRIENDS':
        return <Sparkles className="w-3 h-3 text-emerald-500" />;
      case 'PRIVATE':
        return <Lock className="w-3 h-3" />;
      default:
        return <Globe className="w-3 h-3" />;
    }
  };

  const visibilityLabel = () => {
    switch (currentPost.visibility) {
      case 'PUBLIC':
        return t('postDetail.publicVisibility');
      case 'FRIENDS':
        return t('postDetail.friendsVisibility');
      case 'CLOSE_FRIENDS':
        return t('postDetail.closeFriendsVisibility');
      case 'PRIVATE':
        return t('postDetail.privateVisibility');
      default:
        return '';
    }
  };

  // ============================================================
  // Author info
  // ============================================================

  const authorName = currentPost.author.fullName || `${currentPost.author.firstName} ${currentPost.author.lastName}`.trim() || currentPost.author.username;

  // ============================================================
  // Don't render if closed
  // ============================================================

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[99999] w-screen h-screen flex items-center justify-center select-none">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/90 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Top close button (mobile/overlay fallback) */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-5 z-[60] text-white/80 hover:text-white bg-black/40 hover:bg-black/70 p-2.5 rounded-full transition-all flex items-center justify-center backdrop-blur-md md:hidden shadow-lg active:scale-95"
        title={t('postDetail.closeLightbox')}
      >
        <X className="w-5 h-5" />
      </button>

      {/* ==========================================
          MAIN MODAL CONTAINER
         ========================================== */}
      <div className="relative z-[51] w-full max-w-[1560px] h-[94vh] max-h-[980px] bg-white dark:bg-[#121212] rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row border border-slate-200/50 dark:border-[#262626] mx-3 md:mx-6 lg:mx-8">

        {/* ========================================
            LEFT COLUMN: Media Theater (64-68%)
           ======================================== */}
        <section
          ref={mediaTheaterRef}
          className={`relative w-full md:w-[64%] lg:w-[68%] bg-[#0B0E14] dark:bg-[#000000] flex flex-col justify-between select-none overflow-hidden group ${
            isFullscreen ? 'md:w-full lg:w-full' : ''
          }`}
        >

          {/* Media Top Bar */}
          <div className="absolute top-0 inset-x-0 p-4 z-20 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none">
            {/* Back + Counter */}
            <div className="flex items-center gap-3 text-white pointer-events-auto">
              <button
                type="button"
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white/90 hover:text-white transition-all backdrop-blur-md border border-white/10 flex items-center justify-center shadow-lg active:scale-95 cursor-pointer"
                title={t('postDetail.backButton')}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              {totalMedia > 1 && (
                <span className="px-3 py-1 rounded-full bg-[#004AC6] text-white text-xs font-semibold shadow-md backdrop-blur-xs">
                  {t('postDetail.photoOf', { current: currentIndex + 1, total: totalMedia })}
                </span>
              )}
            </div>

            {/* Utility Tools Pill */}
            <div className="flex items-center gap-1 bg-black/40 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-white/15 text-white/90 shadow-lg pointer-events-auto">
              <button
                type="button"
                onClick={() => setZoom((value) => Math.min(MAX_ZOOM, value + ZOOM_STEP))}
                disabled={zoom >= MAX_ZOOM}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40 transition-colors cursor-pointer"
                title={t('postDetail.zoomIn')}
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  const next = Math.max(MIN_ZOOM, zoom - ZOOM_STEP);
                  setZoom(next);
                  if (next <= 1) setPan({ x: 0, y: 0 });
                }}
                disabled={zoom <= MIN_ZOOM}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40 transition-colors cursor-pointer"
                title={t('postDetail.zoomOut')}
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setRotation((value) => (value + 90) % 360)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/15 transition-colors cursor-pointer"
                title={t('postDetail.rotate')}
              >
                <RotateCw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleDownload}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/15 transition-colors cursor-pointer"
                title={t('postDetail.download')}
              >
                <Download className="w-4 h-4" />
              </button>
              <div className="h-4 w-px bg-white/20 mx-1" />
              <button
                type="button"
                onClick={handleToggleFullscreen}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/15 transition-colors cursor-pointer"
                title={t('postDetail.fullscreen')}
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Main Image Stage */}
          <div className="flex-1 flex items-center justify-center relative w-full h-full overflow-hidden p-6 md:p-10 select-none">
            {/* Left Arrow */}
            {totalMedia > 1 && currentIndex > 0 && (
              <button
                type="button"
                onClick={goToPrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md border border-white/10 shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer"
                title={t('postDetail.previousPhoto')}
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* Image or Video Display */}
            {currentMedia && (
              <div className="relative max-h-full max-w-full flex items-center justify-center">
                {isVideoMedia(currentMedia.mediaUrl, currentMedia.mediaType) ? (
                  <div
                    onMouseDown={handleMouseDownPan}
                    onMouseMove={handleMouseMovePan}
                    onMouseUp={handleMouseUpPan}
                    className={`max-h-[72vh] w-auto max-w-full rounded-2xl shadow-2xl overflow-hidden ${
                      isFullscreen ? 'max-h-[calc(100vh-8rem)]' : ''
                    }`}
                    style={{
                      transform: `translate3d(${pan.x}px, ${pan.y}px, 0px) scale(${zoom}) rotate(${rotation}deg)`,
                      cursor: zoom > 1 ? (isPanning ? 'grabbing' : 'grab') : 'default',
                      transition: isPanning ? 'none' : 'transform 200ms ease-out',
                    }}
                  >
                    <CustomVideoPlayer
                      src={getMediaUrl(currentMedia.mediaUrl)}
                      autoPlay
                      title={authorName}
                      subtitle={currentPost.content ? currentPost.content.slice(0, 60) : undefined}
                      className="max-h-[72vh] w-auto max-w-full aspect-video rounded-2xl"
                    />
                  </div>
                ) : (
                  <img
                    src={getMediaUrl(currentMedia.mediaUrl)}
                    alt={`${authorName} - ${currentIndex + 1}`}
                    onMouseDown={handleMouseDownPan}
                    onMouseMove={handleMouseMovePan}
                    onMouseUp={handleMouseUpPan}
                    className={`max-h-[72vh] w-auto object-contain rounded-2xl shadow-2xl select-none ${
                      isFullscreen ? 'max-h-[calc(100vh-8rem)]' : ''
                    }`}
                    style={{
                      transform: `translate3d(${pan.x}px, ${pan.y}px, 0px) scale(${zoom}) rotate(${rotation}deg)`,
                      cursor: zoom > 1 ? (isPanning ? 'grabbing' : 'grab') : 'default',
                      transition: isPanning ? 'none' : 'transform 200ms ease-out',
                    }}
                    draggable={false}
                  />
                )}
              </div>
            )}

            {/* Right Arrow */}
            {totalMedia > 1 && currentIndex < totalMedia - 1 && (
              <button
                type="button"
                onClick={goToNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md border border-white/10 shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer"
                title={t('postDetail.nextPhoto')}
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Bottom Thumbnail Strip */}
          {totalMedia > 1 && (
            <div className="relative z-20 bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-3 pb-4 px-6">
              <div className="flex items-center justify-center gap-3 overflow-x-auto py-1">
                {currentPost.media.map((media, idx) => {
                  const isVid = isVideoMedia(media.mediaUrl, media.mediaType);
                  return (
                    <button
                      key={media.id || idx}
                      type="button"
                      onClick={() => selectMedia(idx)}
                      className={`relative rounded-xl overflow-hidden transition-all flex-shrink-0 w-14 h-14 bg-black/50 ${
                        idx === currentIndex
                          ? 'ring-2 ring-[#004AC6] ring-offset-2 ring-offset-black scale-105'
                          : 'opacity-60 hover:opacity-100 hover:scale-105'
                      }`}
                    >
                      {isVid ? (
                        <div className="relative w-full h-full flex items-center justify-center bg-black/60">
                          {media.thumbnailUrl ? (
                            <img
                              src={getMediaUrl(media.thumbnailUrl)}
                              alt={`Thumbnail ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <video
                              src={getMediaUrl(media.mediaUrl)}
                              className="w-full h-full object-cover pointer-events-none"
                              muted
                              preload="metadata"
                            />
                          )}
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                            <Play className="w-4 h-4 text-white fill-white shadow-sm" />
                          </div>
                        </div>
                      ) : (
                        <img
                          src={getMediaUrl(media.thumbnailUrl || media.mediaUrl)}
                          alt={`Thumbnail ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* ========================================
            RIGHT COLUMN: Post Details (32-36%)
           ======================================== */}
        <section className="w-full md:w-[36%] lg:w-[32%] bg-white dark:bg-[#121212] flex flex-col h-full border-l border-[#E2E2EC]/50 dark:border-[#262626]">

          {/* Post Header */}
          <header className="px-5 py-4 border-b border-[#E2E2EC]/70 dark:border-[#262626] flex items-center justify-between flex-shrink-0 bg-white dark:bg-[#121212]">
            <div className="flex items-center gap-3">
              {/* Author Avatar */}
              <Link
                to={getProfileUrl(currentPost.author)}
                onClick={onClose}
                className="hover:opacity-90 transition cursor-pointer"
              >
                <UserAvatar
                  userId={currentPost.author.id}
                  src={currentPost.author.avatarUrl}
                  alt={authorName}
                  size="md"
                />
              </Link>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <Link
                    to={getProfileUrl(currentPost.author)}
                    onClick={onClose}
                    className="text-[15px] font-bold text-[#1A1C1E] dark:text-[#F5F5F5] hover:underline hover:text-[#004AC6] dark:hover:text-[#0095F6] transition-colors cursor-pointer"
                  >
                    {authorName}
                  </Link>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#535F70] dark:text-[#A8A8A8]">
                  <Link
                    to={getProfileUrl(currentPost.author)}
                    onClick={onClose}
                    className="hover:underline hover:text-gray-600 dark:hover:text-[#E5E5E5] transition-colors cursor-pointer"
                  >
                    @{currentPost.author.username}
                  </Link>
                  <span>·</span>
                  <span>{formatRelativeTime(currentPost.createdAt, language)}</span>
                  <span>·</span>
                  <span title={visibilityLabel()}>
                    <VisibilityIcon />
                  </span>
                </div>
              </div>
            </div>

            {/* More Menu + Close */}
            <div className="flex items-center gap-1 relative">
              <button
                type="button"
                onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                className="p-2 rounded-full text-[#535F70] dark:text-[#A8A8A8] hover:text-[#1A1C1E] dark:hover:text-[#F5F5F5] hover:bg-[#F4F4FB] dark:hover:bg-[#262626] transition-colors cursor-pointer"
                title={t('postDetail.postOptions')}
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>
              <PostMoreMenu
                postId={currentPost.id}
                authorUsername={currentPost.author.username}
                isAuthor={isAuthor}
                currentVisibility={currentPost.visibility}
                isOpen={isMoreMenuOpen}
                onClose={() => setIsMoreMenuOpen(false)}
                onEdit={() => setIsEditPostModalOpen(true)}
                onChangeVisibility={handleChangeVisibility}
                onDelete={() => setIsDeleteModalOpen(true)}
                onCopyLink={handleShare}
              />
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full text-[#535F70] dark:text-[#A8A8A8] hover:text-[#1A1C1E] dark:hover:text-[#F5F5F5] hover:bg-[#F4F4FB] dark:hover:bg-[#262626] transition-colors cursor-pointer hidden md:flex items-center justify-center"
                title={t('postDetail.closeDialog')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </header>

          {/* Scrollable Middle Body */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#E2E2EC]/40 dark:divide-[#262626] bg-white dark:bg-[#121212]" style={{ scrollbarWidth: 'thin', scrollbarColor: '#c3c6d6 transparent' }}>

            {/* Post Content & Tags */}
            <div className="p-5 space-y-3">
              {isEditingPost ? (
                <div className="space-y-2">
                  <textarea
                    value={editedPostContent}
                    onChange={(e) => setEditedPostContent(e.target.value)}
                    className="w-full text-[15px] text-[#1A1C1E] dark:text-[#F5F5F5] p-3 bg-[#F4F4FB] dark:bg-[#1A1A1A] rounded-xl border border-[#004AC6] dark:border-blue-500 focus:outline-none focus:ring-1 focus:ring-[#004AC6] dark:focus:ring-blue-500 resize-none leading-relaxed"
                    rows={3}
                    autoFocus
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingPost(false)}
                      className="px-3 py-1.5 text-xs text-[#535F70] dark:text-[#A8A8A8] hover:bg-gray-100 dark:hover:bg-[#262626] rounded-lg transition-colors cursor-pointer"
                    >
                      {t('postDetail.cancel')}
                    </button>
                    <button
                      type="button"
                      onClick={handleSavePostEdit}
                      disabled={!editedPostContent.trim() || isSavingPostEdit}
                      className="px-4 py-1.5 text-xs bg-[#004AC6] hover:bg-[#003A9F] dark:bg-[#0095F6] dark:hover:bg-[#1877F2] text-white font-semibold rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {t('postDetail.save')}
                    </button>
                  </div>
                </div>
              ) : (
                (() => {
                  const cleanContent = getContentWithoutHashtags(currentPost.content);
                  return cleanContent ? (
                    <p className="text-[15px] text-[#1A1C1E] dark:text-[#F5F5F5] leading-relaxed select-text">
                      <FormattedText text={cleanContent} />
                    </p>
                  ) : null;
                })()
              )}

              {/* Hashtags */}
              {currentPost.hashtags && currentPost.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {currentPost.hashtags.map((tag) => (
                    <span
                      key={tag}
                      className="text-sm text-[#004AC6] dark:text-[#0095F6] hover:underline cursor-pointer font-semibold"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Meta info row: Last edited / Posted via & View translation */}
              <div className="text-[12px] text-[#535F70] dark:text-[#8E8E8E] pt-2 flex items-center justify-between">
                {currentPost.updatedAt !== currentPost.createdAt ? (
                  <span>{t('postDetail.editedLastAt', { time: new Date(currentPost.updatedAt).toLocaleTimeString(language === 'vi' ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit' }) })} · {t('postDetail.postedVia')}</span>
                ) : (
                  <span>{t('postDetail.postedVia')}</span>
                )}
                <span className="hover:underline text-[#004AC6] dark:text-[#0095F6] font-medium cursor-pointer">
                  {t('postDetail.viewTranslation')}
                </span>
              </div>
            </div>

            {/* Action Buttons — matching FeedPostCard style */}
            <div className="px-4 py-2.5 flex items-center justify-between border-t border-[#E2E2EC]/50 dark:border-[#262626] text-xs text-[#535F70] dark:text-[#A8A8A8] font-medium bg-white dark:bg-[#121212]">
              <div className="flex items-center gap-5">
                <button
                  type="button"
                  onClick={() => toast('💬')}
                  className="flex items-center gap-1.5 hover:text-[#004AC6] dark:hover:text-[#0095F6] transition-colors group p-1 cursor-pointer"
                  title={t('postDetail.commentButton')}
                >
                  <MessageCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span>{commentCount}</span>
                </button>
                <button
                  type="button"
                  onClick={handleRepost}
                  className="flex items-center gap-1.5 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors group p-1 cursor-pointer"
                  title={t('postDetail.repostButton')}
                >
                  <Repeat2 className="w-4 h-4 group-hover:rotate-180 transition-transform" />
                  <span>12</span>
                </button>
                <div className="flex items-center gap-1 group">
                  <button
                    type="button"
                    onClick={toggleLike}
                    className={`flex items-center p-1 rounded-full transition-colors cursor-pointer ${
                      isLiked
                        ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                        : 'hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                    }`}
                    title={isLiked ? t('postDetail.unlikeButton') : t('postDetail.likeButton')}
                  >
                    <Heart className={`w-4 h-4 transition-transform group-hover:scale-125 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                  </button>
                  {likeCount > 0 ? (
                    <button
                      type="button"
                      onClick={() => handleOpenLikers(currentPost.id, 'post', likeCount)}
                      className={`hover:underline cursor-pointer font-medium ${
                        isLiked ? 'text-rose-600 dark:text-rose-400' : 'hover:text-rose-600 dark:hover:text-rose-400'
                      }`}
                      title={t('postDetail.likersTitle')}
                    >
                      {formatCount(likeCount)}
                    </button>
                  ) : (
                    <span>0</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-[#535F70] dark:text-[#A8A8A8]" title={t('postDetail.views')}>
                  <Eye className="w-4 h-4" />
                  <span>12.5K</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleBookmark}
                  className="hover:text-[#004AC6] dark:hover:text-[#0095F6] transition-colors p-1 cursor-pointer"
                  title={t('postDetail.bookmarkButton')}
                >
                  <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-[#004AC6] text-[#004AC6] dark:fill-[#0095F6] dark:text-[#0095F6]' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  className="flex items-center gap-1.5 hover:text-[#004AC6] dark:hover:text-[#0095F6] transition-colors p-1 cursor-pointer group"
                  title={t('postDetail.shareButton')}
                >
                  <Share2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span>{formatCount(shareCount)}</span>
                </button>
              </div>
            </div>

            {/* Comment Sort Bar */}
            <div className="px-5 py-2.5 bg-[#F9F9FB] dark:bg-[#181818] flex items-center justify-end border-y border-[#E2E2EC]/40 dark:border-[#262626]">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsSortOpen(!isSortOpen)}
                  className="flex items-center gap-1 text-[#535F70] dark:text-[#A8A8A8] text-xs font-semibold hover:text-[#004AC6] dark:hover:text-[#0095F6] transition-colors cursor-pointer"
                >
                  <span>
                    {commentSort === 'POPULAR'
                      ? t('postDetail.mostRelevant')
                      : commentSort === 'NEWEST'
                      ? t('postDetail.newest')
                      : t('postDetail.oldest')}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                {isSortOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-44 bg-white dark:bg-[#262626] rounded-xl shadow-xl border border-[#E2E2EC] dark:border-[#363636] z-50 py-1 text-xs">
                    <button
                      type="button"
                      onClick={() => { setCommentSort('POPULAR'); setIsSortOpen(false); }}
                      className={`w-full text-left px-3.5 py-2 hover:bg-[#F4F4FB] dark:hover:bg-[#323232] transition-colors cursor-pointer ${commentSort === 'POPULAR' ? 'text-[#004AC6] dark:text-[#0095F6] font-semibold' : 'text-[#1A1C1E] dark:text-[#F5F5F5]'}`}
                    >
                      {t('postDetail.mostRelevant')}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setCommentSort('NEWEST'); setIsSortOpen(false); }}
                      className={`w-full text-left px-3.5 py-2 hover:bg-[#F4F4FB] dark:hover:bg-[#323232] transition-colors cursor-pointer ${commentSort === 'NEWEST' ? 'text-[#004AC6] dark:text-[#0095F6] font-semibold' : 'text-[#1A1C1E] dark:text-[#F5F5F5]'}`}
                    >
                      {t('postDetail.newest')}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setCommentSort('OLDEST'); setIsSortOpen(false); }}
                      className={`w-full text-left px-3.5 py-2 hover:bg-[#F4F4FB] dark:hover:bg-[#323232] transition-colors cursor-pointer ${commentSort === 'OLDEST' ? 'text-[#004AC6] dark:text-[#0095F6] font-semibold' : 'text-[#1A1C1E] dark:text-[#F5F5F5]'}`}
                    >
                      {t('postDetail.oldest')}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Comment Stream */}
            <div className="p-5 space-y-4 bg-white dark:bg-[#121212]">
              {isLoadingComments ? (
                <div className="flex flex-col items-center justify-center py-8 text-[#535F70] dark:text-[#A8A8A8]">
                  <div className="w-6 h-6 border-2 border-[#004AC6] dark:border-[#0095F6] border-t-transparent rounded-full animate-spin mb-2" />
                  <span className="text-xs">{t('postDetail.loadingComments')}</span>
                </div>
              ) : comments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <MessageSquareText className="w-10 h-10 text-[#E2E2EC] dark:text-[#363636] mb-3" />
                  <h4 className="text-sm font-semibold text-[#1A1C1E] dark:text-[#F5F5F5] mb-1">
                    {t('postDetail.noComments')}
                  </h4>
                  <p className="text-xs text-[#535F70] dark:text-[#A8A8A8]">
                    {t('postDetail.noCommentsDesc')}
                  </p>
                </div>
              ) : (
                comments.map((comment) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    currentUserId={currentUser?.id}
                    postAuthorId={currentPost.author.id}
                    onReply={(targetComment, replyToUser) => {
                      setReplyingTo({
                        commentId: replyToUser?.replyId || targetComment.id,
                        parentCommentId: targetComment.id,
                        username: replyToUser ? replyToUser.username : targetComment.author.username,
                      });
                    }}
                    onLike={() => {}}
                    onPinChange={handlePinChange}
                    onCommentDeleted={handleCommentDeleted}
                    onReplyDeleted={(_parentId, _replyId) => {
                      const newCount = Math.max(0, commentCount - 1);
                      setCommentCount(newCount);
                      const updatedPost = { ...currentPost, commentCount: newCount };
                      setCurrentPost(updatedPost);
                      onPostUpdated?.(updatedPost);
                    }}
                    onOpenLikers={handleOpenLikers}
                  />
                ))
              )}
            </div>
          </div>

          {/* Sticky Comment Input */}
          <CommentInput
            authorName={currentPost.author.firstName || currentPost.author.username}
            onSubmit={handleSubmitComment}
            isSubmitting={isSubmittingComment}
            replyingTo={
              replyingTo
                ? {
                    username: replyingTo.username,
                    onCancel: () => setReplyingTo(null),
                  }
                : null
            }
          />
        </section>
      </div>

      {/* Likers Modal */}
      <LikersModal
        isOpen={isLikersOpen}
        onClose={() => setIsLikersOpen(false)}
        targetId={likersTarget.id}
        type={likersTarget.type}
        totalLikes={likersTarget.totalLikes}
      />

      {/* Edit Post Modal with Drag and Drop Media */}
      <EditPostModal
        isOpen={isEditPostModalOpen}
        onClose={() => setIsEditPostModalOpen(false)}
        post={currentPost}
        onPostUpdated={(updated) => {
          setCurrentPost(updated);
          setIsEditPostModalOpen(false);
          onPostUpdated?.(updated);
          if (currentIndex >= updated.media.length) {
            setCurrentIndex(Math.max(0, updated.media.length - 1));
          }
        }}
      />

      {/* Delete Post Modal */}
      <DeletePostModal
        isOpen={isDeleteModalOpen}
        onClose={() => !isDeleting && setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDeletePost}
        isLoading={isDeleting}
        post={currentPost}
      />
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};

export default PostMediaLightbox;
