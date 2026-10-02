import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Heart,
  MessageCircle,
  Repeat2,
  Eye,
  Bookmark,
  Share2,
  MoreHorizontal,
  Globe,
  Users,
  Sparkles,
  Lock,
  Play,
  Image as ImageIcon,
  ChevronDown,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { PostResponse, PostVisibility, CommentResponse, CommentMediaRequest } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { postService } from '../../services/postService';
import { repostService } from '../../services/repostService';
import { commentService } from '../../services/commentService';
import { getMediaUrl, isVideoMedia } from '../../utils/media';
import { getProfileUrl } from '../../utils/user';
import { getContentWithoutHashtags, extractHashtags } from '../../utils/text';
import { handleCopyAndSharePost } from '../../utils/share';
import PostMoreMenu from './PostMoreMenu';
import EditPostModal from './EditPostModal';
import DeletePostModal from './DeletePostModal';
import CommentItem from './CommentItem';
import { CommentInput } from './CommentInput';
import LikersModal from './LikersModal';
import RepostersModal from './RepostersModal';
import CreateRepostModal from './CreateRepostModal';
import UserAvatar from '../common/UserAvatar';
import FormattedText from '../common/FormattedText';
import PostMediaLightbox from './PostMediaLightbox';
import RepostBubble from './RepostBubble';
import { usePostViewTracker } from '../../hooks/usePostViewTracker';

export function formatRelativeTime(dateStr: string, lang: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return lang === 'vi' ? 'Vừa xong' : 'Just now';
  if (minutes < 60) return lang === 'vi' ? `${minutes} phút` : `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return lang === 'vi' ? `${hours} giờ` : `${hours}h`;
  const days = Math.floor(hours / 24);
  return lang === 'vi' ? `${days} ngày` : `${days}d`;
}

export function formatCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return String(count);
}

/**
 * Tính toán aspect ratio (width / height) an toàn cho PostCard media:
 * - Giới hạn tối đa (quá ngang/panorama): 16:9 (~1.778)
 * - Giới hạn tối thiểu (quá dọc/story): 4:5 (0.8)
 * - Các tỷ lệ thông thường trong khoảng [4:5, 16:9] (16:9, 1:1, 4:5, 4:3, 3:2,...)
 *   được hiển thị theo tỷ lệ gốc tự nhiên, không crop và không méo hình.
 */
export function calculateClampedAspectRatio(
  width?: number | null,
  height?: number | null,
  fallbackRatio = 1
): number {
  if (!width || !height || width <= 0 || height <= 0) {
    return fallbackRatio;
  }
  const rawRatio = width / height;
  const MIN_RATIO = 0.8; // 4:5 (ảnh dọc tối đa)
  const MAX_RATIO = 16 / 9; // 16:9 (~1.778 ảnh ngang tối đa)
  return Math.max(MIN_RATIO, Math.min(MAX_RATIO, rawRatio));
}

export interface PostCardProps {
  post: PostResponse;
  onOpenLightbox?: (post: PostResponse, mediaIndex: number) => void;
  language?: string;
  isAuthor?: boolean;
  onPostUpdated?: (post: PostResponse) => void;
  onPostDeleted?: (postId: string) => void;
  defaultShowComments?: boolean;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onOpenLightbox,
  language: propLang,
  isAuthor: propIsAuthor,
  onPostUpdated,
  onPostDeleted,
  defaultShowComments,
}) => {
  const { t, language: contextLang } = useLanguage();
  const language = propLang || contextLang;
  const { user: currentUser } = useAuth();
  const isAuthor = propIsAuthor !== undefined ? propIsAuthor : currentUser?.id === post.author.id;
  const postCardRef = usePostViewTracker<HTMLElement>(post.id);

  const [isLiked, setIsLiked] = useState(post.isLiked ?? post.liked ?? false);
  const [likeCount, setLikeCount] = useState(post.reactionCount);
  const [shareCount, setShareCount] = useState(post.shareCount ?? 0);
  const [repostCount, setRepostCount] = useState(post.repostCount ?? 0);
  const [isReposted, setIsReposted] = useState(post.isReposted ?? false);
  const [isLiking, setIsLiking] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Internal lightbox fallback if onOpenLightbox is not provided
  const [internalLightboxIndex, setInternalLightboxIndex] = useState<number | null>(null);

  // Active media carousel index for posts with multiple media
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  // Cache kích thước thực tế khi media tải xong (fallback cho các bài viết cũ chưa có width/height)
  const [detectedDimensions, setDetectedDimensions] = useState<
    Record<number, { width: number; height: number }>
  >({});

  const handleImageLoad = (idx: number, e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    if (naturalWidth && naturalHeight) {
      setDetectedDimensions((prev) => {
        if (prev[idx]?.width === naturalWidth && prev[idx]?.height === naturalHeight) {
          return prev;
        }
        return { ...prev, [idx]: { width: naturalWidth, height: naturalHeight } };
      });
    }
  };

  const handleVideoLoadedMetadata = (idx: number, e: React.SyntheticEvent<HTMLVideoElement>) => {
    const { videoWidth, videoHeight } = e.currentTarget;
    if (videoWidth && videoHeight) {
      setDetectedDimensions((prev) => {
        if (prev[idx]?.width === videoWidth && prev[idx]?.height === videoHeight) {
          return prev;
        }
        return { ...prev, [idx]: { width: videoWidth, height: videoHeight } };
      });
    }
  };

  // Eagerly detect natural dimensions for all media items to avoid ratio jump
  useEffect(() => {
    if (!post.media || post.media.length === 0) return;

    post.media.forEach((item, idx) => {
      if (item.width && item.height) {
        setDetectedDimensions((prev) => {
          if (prev[idx]?.width === item.width && prev[idx]?.height === item.height) return prev;
          return { ...prev, [idx]: { width: item.width!, height: item.height! } };
        });
        return;
      }

      if (!isVideoMedia(item.mediaUrl, item.mediaType)) {
        const fullUrl = getMediaUrl(item.mediaUrl);
        const img = new Image();
        img.src = fullUrl;
        if (img.complete && img.naturalWidth && img.naturalHeight) {
          setDetectedDimensions((prev) => {
            if (prev[idx]?.width === img.naturalWidth && prev[idx]?.height === img.naturalHeight) return prev;
            return { ...prev, [idx]: { width: img.naturalWidth, height: img.naturalHeight } };
          });
        } else {
          img.onload = () => {
            if (img.naturalWidth && img.naturalHeight) {
              setDetectedDimensions((prev) => {
                if (prev[idx]?.width === img.naturalWidth && prev[idx]?.height === img.naturalHeight) return prev;
                return { ...prev, [idx]: { width: img.naturalWidth, height: img.naturalHeight } };
              });
            }
          };
        }
      }
    });
  }, [post.media]);

  // Inline comments state
  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [commentCount, setCommentCount] = useState(post.commentCount ?? 0);
  const [commentSort, setCommentSort] = useState<'POPULAR' | 'NEWEST' | 'OLDEST'>('POPULAR');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [commentsPage, setCommentsPage] = useState(0);
  const [isSingleCommentMode, setIsSingleCommentMode] = useState(!defaultShowComments);
  const [hasMoreComments, setHasMoreComments] = useState((post.commentCount ?? 0) > 1);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [showInlineComments, setShowInlineComments] = useState(
    defaultShowComments || (post.commentCount ?? 0) > 0
  );
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{
    commentId: string;
    parentCommentId: string;
    username: string;
  } | null>(null);

  const handleStartReply = (
    parentComment: CommentResponse,
    replyToUser?: { id: string; username: string; replyId?: string }
  ) => {
    const targetUsername = replyToUser ? replyToUser.username : parentComment.author.username;
    const targetCommentId = replyToUser?.replyId || parentComment.id;
    setReplyingTo({
      commentId: targetCommentId,
      parentCommentId: parentComment.id,
      username: targetUsername,
    });
    setShowInlineComments(true);
  };

  // Sync state when post props change
  useEffect(() => {
    setLikeCount(post.reactionCount ?? 0);
    setIsLiked(post.isLiked ?? post.liked ?? false);
    if (post.commentCount !== undefined) {
      setCommentCount(post.commentCount);
      if (defaultShowComments || post.commentCount > 0) {
        setShowInlineComments(true);
      }
    }
    if (post.shareCount !== undefined) {
      setShareCount(post.shareCount);
    }
    if (post.repostCount !== undefined) {
      setRepostCount(post.repostCount);
    }
    if (post.isReposted !== undefined) {
      setIsReposted(post.isReposted);
    }
    if (post.myRepostCaption !== undefined) {
      setUserCaption(post.myRepostCaption);
    } else if (post.isReposted && currentUser) {
      // Fallback: fetch caption của chính mình nếu backend chưa trả về myRepostCaption
      repostService
        .getReposters(post.id, { page: 0, size: 20 })
        .then((res) => {
          const myEntry = res.content.find((r) => r.user.id === currentUser.id);
          if (myEntry && myEntry.caption) {
            setUserCaption(myEntry.caption);
          }
        })
        .catch(() => {});
    }
    setActiveMediaIndex(0);
    setDetectedDimensions({});
  }, [post.id, post.reactionCount, post.isLiked, post.liked, post.commentCount, post.shareCount, post.repostCount, post.isReposted, post.myRepostCaption, post.repostedByFollowing, currentUser, defaultShowComments]);

  // Likers Modal state
  const [isLikersOpen, setIsLikersOpen] = useState(false);
  const [likersTarget, setLikersTarget] = useState<{ id: string; type: 'post' | 'comment'; totalLikes?: number }>({
    id: post.id,
    type: 'post',
    totalLikes: post.reactionCount,
  });

  // Reposters Modal state
  const [isRepostersOpen, setIsRepostersOpen] = useState(false);

  // Create / Edit Repost Modal state (write caption)
  const [isCreateRepostOpen, setIsCreateRepostOpen] = useState(false);
  const [userCaption, setUserCaption] = useState<string | null>(post.myRepostCaption ?? null);

  const handleRepostSuccess = (newReposted: boolean, newCount: number, caption?: string | null) => {
    setIsReposted(newReposted);
    setRepostCount(newCount);
    if (caption !== undefined) {
      setUserCaption(caption);
    }
    onPostUpdated?.({
      ...post,
      isReposted: newReposted,
      repostCount: newCount,
    });
  };

  const handleOpenLikers = (id: string, type: 'post' | 'comment', total?: number) => {
    setLikersTarget({ id, type, totalLikes: total ?? 0 });
    setIsLikersOpen(true);
  };

  // Tải comment ban đầu
  useEffect(() => {
    if (comments.length === 0) {
      setIsLoadingComments(true);
      const initialSize = defaultShowComments ? 5 : 1;
      commentService
        .getComments(post.id, { sortBy: 'POPULAR', page: 0, size: initialSize })
        .then((res) => {
          if (res.content && res.content.length > 0) {
            setComments(res.content);
            setHasMoreComments(!res.last);
            setShowInlineComments(true);
          }
          setCommentsPage(0);
          setIsSingleCommentMode(!defaultShowComments);
        })
        .catch((err) => console.error('Failed to load initial comments:', err))
        .finally(() => setIsLoadingComments(false));
    }
  }, [post.id, defaultShowComments]);

  const handleSortChange = async (newSort: 'POPULAR' | 'NEWEST' | 'OLDEST') => {
    if (newSort === commentSort) {
      setIsSortOpen(false);
      return;
    }
    setCommentSort(newSort);
    setIsSortOpen(false);
    setIsLoadingComments(true);
    try {
      const res = await commentService.getComments(post.id, {
        sortBy: newSort,
        page: 0,
        size: 5,
      });
      setComments(res.content || []);
      setCommentsPage(0);
      setIsSingleCommentMode(false);
      setHasMoreComments(!res.last);
      setShowInlineComments(true);
    } catch (err) {
      console.error('Failed to change comment sort:', err);
      toast.error(language === 'vi' ? 'Không thể đổi thứ tự bình luận' : 'Failed to change comment sort');
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleLoadMoreComments = async () => {
    setIsLoadingComments(true);
    try {
      const pageToFetch = isSingleCommentMode ? 0 : commentsPage + 1;
      const sizeToFetch = 5;

      const res = await commentService.getComments(post.id, {
        sortBy: commentSort,
        page: pageToFetch,
        size: sizeToFetch,
      });

      setComments((prev) => {
        const existing = new Set(prev.map((c) => c.id));
        const newOnes = res.content.filter((c) => !existing.has(c.id));
        return [...prev, ...newOnes];
      });

      if (isSingleCommentMode) {
        setIsSingleCommentMode(false);
        setCommentsPage(0);
      } else {
        setCommentsPage(pageToFetch);
      }
      setHasMoreComments(!res.last);
    } catch (err) {
      console.error('Failed to load more comments:', err);
      toast.error(language === 'vi' ? 'Không thể tải thêm bình luận' : 'Failed to load more comments');
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleCommentSubmit = async (trimmed: string, uploadedMedia?: CommentMediaRequest[]) => {
    setIsPostingComment(true);
    try {
      const mediaList = uploadedMedia && uploadedMedia.length > 0 ? uploadedMedia : undefined;
      const payloadContent = trimmed.trim() || undefined;
      if (replyingTo) {
        await commentService.createReply(replyingTo.commentId, {
          content: payloadContent,
          media: mediaList,
        });
        setComments((prev) =>
          prev.map((c) =>
            c.id === replyingTo.parentCommentId ? { ...c, replyCount: c.replyCount + 1 } : c
          )
        );
        const newCount = commentCount + 1;
        setCommentCount(newCount);
        setReplyingTo(null);
        toast.success(t('postDetail.replyPosted'));
        onPostUpdated?.({
          ...post,
          commentCount: newCount,
        });
      } else {
        const created = await commentService.createComment(post.id, {
          content: payloadContent,
          media: mediaList,
        });
        setComments((prev) => [created, ...prev]);
        const newCount = commentCount + 1;
        setCommentCount(newCount);
        toast.success(t('postDetail.commentPosted'));
        onPostUpdated?.({
          ...post,
          commentCount: newCount,
        });
      }
    } catch (err) {
      console.error('Failed to post comment/reply:', err);
      toast.error(language === 'vi' ? 'Không thể gửi bình luận' : 'Failed to post comment');
    } finally {
      setIsPostingComment(false);
    }
  };

  const authorName = post.author.fullName || `${post.author.firstName} ${post.author.lastName}`.trim() || post.author.username;
  const cleanContent = getContentWithoutHashtags(post.content);

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
        const res = await postService.likePost(post.id);
        setLikeCount(res.likeCount);
        setIsLiked(res.liked);
      } else {
        const res = await postService.unlikePost(post.id);
        setLikeCount(res.likeCount);
        setIsLiked(res.liked);
      }
      onPostUpdated?.({
        ...post,
        isLiked: nextLiked,
        reactionCount: nextCount,
      });
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
  };

  const handleShare = async () => {
    await handleCopyAndSharePost(post.id, {
      onShareCountUpdated: (newCount) => {
        setShareCount(newCount);
        onPostUpdated?.({
          ...post,
          shareCount: newCount,
        });
      },
      successMessage: t('postDetail.copiedToast'),
      errorMessage: t('postDetail.copyLinkFailed'),
    });
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim() || isSaving) return;
    setIsSaving(true);
    try {
      const hashtags = extractHashtags(editContent);
      const updated = await postService.updatePost(post.id, {
        content: editContent.trim(),
        hashtags,
      });
      const updatedPostObj = {
        ...post,
        content: updated.content,
        hashtags: updated.hashtags ?? hashtags,
        updatedAt: new Date().toISOString(),
      };
      onPostUpdated?.(updatedPostObj);
      setIsEditing(false);
      toast.success(t('postDetail.updatePostSuccess'));
    } catch (err) {
      console.error('Failed to update post:', err);
      toast.error(language === 'vi' ? 'Không thể cập nhật bài viết' : 'Failed to update post');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangeVisibility = async (newVis: PostVisibility) => {
    try {
      await postService.updatePost(post.id, { visibility: newVis });
      const updatedPostObj = { ...post, visibility: newVis };
      onPostUpdated?.(updatedPostObj);
      toast.success(t('postDetail.visibilityUpdated'));
    } catch (err) {
      console.error('Failed to update visibility:', err);
      toast.error(language === 'vi' ? 'Không thể đổi quyền riêng tư' : 'Failed to update visibility');
    }
  };

  const handleConfirmDeletePost = async () => {
    setIsDeleting(true);
    try {
      await postService.deletePost(post.id);
      setIsDeleteModalOpen(false);
      onPostDeleted?.(post.id);
      toast.success(t('postDetail.deletePostSuccess'));
    } catch (err) {
      console.error('Failed to delete post:', err);
      toast.error(language === 'vi' ? 'Không thể xóa bài viết' : 'Failed to delete post');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMediaClick = (idx: number) => {
    if (onOpenLightbox) {
      onOpenLightbox(post, idx);
    } else {
      setInternalLightboxIndex(idx);
    }
  };

  const getVisibilityIcon = () => {
    switch (post.visibility) {
      case 'PUBLIC':
        return (
          <span title={t('postDetail.publicVisibility')} className="inline-flex items-center">
            <Globe className="w-3 h-3 text-gray-400" />
          </span>
        );
      case 'FRIENDS':
        return (
          <span title={t('postDetail.friendsVisibility')} className="inline-flex items-center">
            <Users className="w-3 h-3 text-gray-400" />
          </span>
        );
      case 'CLOSE_FRIENDS':
        return (
          <span title={t('postDetail.closeFriendsVisibility')} className="inline-flex items-center">
            <Sparkles className="w-3 h-3 text-emerald-500" />
          </span>
        );
      case 'PRIVATE':
        return (
          <span title={t('postDetail.privateVisibility')} className="inline-flex items-center">
            <Lock className="w-3 h-3 text-gray-400" />
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <article
      ref={postCardRef}
      className="bg-white dark:bg-[#121212] rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-2xs border border-gray-100 dark:border-[#262626] transition-colors duration-200"
    >
      {/* Author Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <Link
            to={getProfileUrl(post.author)}
            className="hover:opacity-90 transition flex-shrink-0 cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          >
            <UserAvatar
              userId={post.author.id}
              src={post.author.avatarUrl}
              alt={authorName}
              size="md"
            />
          </Link>
          <div>
            <div className="flex items-center gap-1.5 leading-tight">
              <Link
                to={getProfileUrl(post.author)}
                className="font-bold text-gray-900 dark:text-[#F5F5F5] text-sm hover:underline hover:text-[#004AC6] dark:hover:text-[#0095F6] transition-colors cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              >
                {authorName}
              </Link>
            </div>
            <p className="text-xs text-gray-400 dark:text-[#A8A8A8] flex items-center gap-1.5">
              <Link
                to={getProfileUrl(post.author)}
                className="hover:underline hover:text-gray-600 dark:hover:text-[#F5F5F5] transition-colors cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              >
                @{post.author.username}
              </Link>
              <span>·</span>
              <span>{formatRelativeTime(post.createdAt, language)}</span>
              <span>·</span>
              <span className="flex items-center">{getVisibilityIcon()}</span>
            </p>
          </div>
        </div>
        <div className="relative">
          <button
            className="text-gray-400 dark:text-[#A8A8A8] hover:text-gray-600 dark:hover:text-[#F5F5F5] transition p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-[#262626] cursor-pointer"
            title={t('postDetail.postOptions')}
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
          <PostMoreMenu
            postId={post.id}
            authorUsername={post.author.username}
            isAuthor={isAuthor}
            currentVisibility={post.visibility}
            isOpen={isMenuOpen}
            onClose={() => setIsMenuOpen(false)}
            onEdit={() => setIsEditModalOpen(true)}
            onChangeVisibility={handleChangeVisibility}
            onDelete={() => setIsDeleteModalOpen(true)}
            onCopyLink={handleShare}
          />
        </div>
      </div>

      {/* Post Content or Inline Edit */}
      {isEditing ? (
        <div className="mb-3 space-y-2">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full text-sm text-gray-800 dark:text-[#F5F5F5] p-3 border border-[#004AC6] dark:border-[#0095F6] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#004AC6]/20 dark:focus:ring-[#0095F6]/20 resize-none bg-slate-50/50 dark:bg-[#1A1A1A]"
            rows={3}
            disabled={isSaving}
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setEditContent(post.content);
              }}
              disabled={isSaving}
              className="px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-[#D4D4D4] hover:bg-gray-100 dark:hover:bg-[#262626] rounded-lg transition cursor-pointer"
            >
              {t('postDetail.cancel')}
            </button>
            <button
              type="button"
              onClick={handleSaveEdit}
              disabled={!editContent.trim() || isSaving}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-[#004AC6] hover:bg-[#003A9F] dark:bg-[#0095F6] dark:hover:bg-[#1877F2] rounded-lg transition disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? '...' : t('postDetail.save')}
            </button>
          </div>
        </div>
      ) : cleanContent ? (
        <p className="text-[15px] sm:text-base leading-relaxed text-gray-800 dark:text-[#E5E5E5] mb-3.5 whitespace-pre-line select-text">
          <FormattedText text={cleanContent} />
        </p>
      ) : null}

      {/* Media Attachment (Self-adapting aspect ratio) */}
      {post.media && post.media.length > 0 && (() => {
        const currentItem = post.media[activeMediaIndex] || post.media[0];
        const isVid = isVideoMedia(currentItem.mediaUrl, currentItem.mediaType);
        const detected = detectedDimensions[activeMediaIndex] || detectedDimensions[0];
        const effectiveWidth = currentItem.width || detected?.width;
        const effectiveHeight = currentItem.height || detected?.height;
        const fallbackRatio = isVid ? 16 / 9 : 1;
        const clampedRatio = calculateClampedAspectRatio(effectiveWidth, effectiveHeight, fallbackRatio);
        // IG-style: width luon fill 100% card, height = width/ratio, clamp [200px, 560px]. Khong shrink width.

        return (
          <div
            className="relative rounded-2xl overflow-hidden mb-3.5 border border-gray-100 dark:border-[#262626] cursor-pointer group bg-black/5 dark:bg-zinc-900 w-full mx-auto flex items-center justify-center select-none transition-[aspect-ratio] duration-200"
            style={{
              aspectRatio: `${clampedRatio}`,
              minHeight: '200px',
              maxHeight: '560px',
            }}
            onClick={() => handleMediaClick(activeMediaIndex)}
          >
            {/* Media Counter Badge */}
            {post.media.length > 1 && (
              <span className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-0.5 rounded-full z-10 pointer-events-none tabular-nums shadow-xs">
                {activeMediaIndex + 1}/{post.media.length}
              </span>
            )}

            {/* Previous Arrow Button */}
            {post.media.length > 1 && activeMediaIndex > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMediaIndex((prev) => Math.max(0, prev - 1));
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center backdrop-blur-md shadow-lg border border-white/20 transition-all hover:scale-110 active:scale-95 cursor-pointer opacity-90 group-hover:opacity-100"
                title={language === 'vi' ? 'Phương tiện trước' : 'Previous media'}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            {/* Next Arrow Button */}
            {post.media.length > 1 && activeMediaIndex < post.media.length - 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMediaIndex((prev) => Math.min(post.media.length - 1, prev + 1));
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center backdrop-blur-md shadow-lg border border-white/20 transition-all hover:scale-110 active:scale-95 cursor-pointer opacity-90 group-hover:opacity-100"
                title={language === 'vi' ? 'Phương tiện tiếp theo' : 'Next media'}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}

            {/* Current Media (Image or Video) */}
            {isVid ? (
              <div className="relative w-full h-full bg-black flex items-center justify-center">
                <video
                  key={currentItem.mediaUrl}
                  src={getMediaUrl(currentItem.mediaUrl)}
                  className="w-full h-full object-cover"
                  muted
                  preload="metadata"
                  onLoadedMetadata={(e) => handleVideoLoadedMetadata(activeMediaIndex, e)}
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-black/40 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-xs flex items-center justify-center text-white group-hover:scale-110 transition-transform shadow-lg">
                    <Play className="w-6 h-6 fill-white ml-0.5" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                <img
                  key={currentItem.mediaUrl}
                  alt={`${authorName} post`}
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                  src={getMediaUrl(currentItem.mediaUrl)}
                  onLoad={(e) => handleImageLoad(activeMediaIndex, e)}
                  ref={(imgEl) => {
                    if (imgEl && imgEl.complete && imgEl.naturalWidth && imgEl.naturalHeight) {
                      if (!detectedDimensions[activeMediaIndex]) {
                        handleImageLoad(activeMediaIndex, { currentTarget: imgEl } as any);
                      }
                    }
                  }}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-white opacity-0 group-hover:opacity-60 transition-opacity" />
                </div>
              </div>
            )}

            {/* Carousel Dots Indicator */}
            {post.media.length > 1 && (
              <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-1.5 z-10 pointer-events-none">
                {post.media.map((_, dotIdx) => (
                  <div
                    key={dotIdx}
                    className={`rounded-full transition-all duration-200 ${
                      dotIdx === activeMediaIndex
                        ? 'w-4 h-1.5 bg-white shadow-sm'
                        : 'w-1.5 h-1.5 bg-white/50 backdrop-blur-xs'
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Floating Repost Social Activity Bubble on Media */}
            {Boolean(
              (post.repostedByFollowing && post.repostedByFollowing.length > 0) ||
                isReposted ||
                repostCount > 0
            ) && (
              <RepostBubble
                repostedByFollowing={post.repostedByFollowing || []}
                repostCount={repostCount}
                isRepostedByMe={isReposted}
                myCaption={userCaption}
                currentUser={currentUser}
                language={language}
                onOpenReposters={() => setIsRepostersOpen(true)}
                onOpenWriteCaption={() => setIsCreateRepostOpen(true)}
              />
            )}
          </div>
        );
      })()}

      {/* Hashtags */}
      {post.hashtags && post.hashtags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3.5">
          {post.hashtags.map((tag) => (
            <span key={tag} className="text-xs font-semibold text-[#004AC6] dark:text-[#0095F6] hover:underline cursor-pointer">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Post Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-[#262626] text-xs font-semibold text-slate-500 dark:text-[#A8A8A8]">
        <div className="flex items-center gap-1 group/like">
          <button
            className={`p-1.5 -m-1 rounded-full transition-transform active:scale-90 hover:scale-110 cursor-pointer ${
              isLiked ? 'text-rose-600 dark:text-rose-400' : 'hover:text-rose-600 dark:hover:text-rose-400'
            }`}
            title={isLiked ? t('postDetail.unlikedToast') : t('postDetail.likeButton')}
            type="button"
            onClick={toggleLike}
          >
            <Heart className={`w-4.5 h-4.5 transition-all ${isLiked ? 'fill-rose-500 text-rose-500 scale-105' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => handleOpenLikers(post.id, 'post', likeCount)}
            className="hover:underline hover:text-rose-600 dark:hover:text-rose-400 font-semibold text-xs tabular-nums transition-colors px-1 py-0.5 rounded cursor-pointer"
            title={t('postDetail.viewLikers')}
          >
            {formatCount(likeCount)}
          </button>
        </div>

        <button
          className="flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-[#0095F6] transition-colors group p-1.5 -m-1 cursor-pointer tabular-nums"
          title={t('postDetail.commentButton')}
          type="button"
          onClick={() => setShowInlineComments((prev) => !prev)}
        >
          <MessageCircle className="w-4.5 h-4.5 group-hover:scale-110 transition-transform" />
          <span>{formatCount(commentCount)}</span>
        </button>

        <button
          className={`flex items-center gap-1.5 transition-colors group p-1.5 -m-1 cursor-pointer tabular-nums disabled:opacity-50 ${
            isReposted
              ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
              : 'hover:text-emerald-600 dark:hover:text-emerald-400'
          }`}
          title={
            isReposted
              ? language === 'vi' ? 'Xem / Chỉnh sửa repost' : 'View / Edit repost'
              : t('postDetail.repostButton')
          }
          type="button"
          onClick={() => setIsCreateRepostOpen(true)}
        >
          <Repeat2
            className={`w-4.5 h-4.5 transition-transform duration-200 ${
              isReposted ? 'scale-105 text-emerald-500' : 'group-hover:rotate-180'
            }`}
          />
          <span>{formatCount(repostCount)}</span>
        </button>

        <div
          className="flex items-center gap-1.5 text-slate-400 dark:text-[#737373] select-none hover:text-slate-600 dark:hover:text-[#D4D4D4] transition-colors tabular-nums"
          title={`${formatCount(post.viewCount ?? 0)} ${t('postDetail.views')}`}
          aria-label={`${formatCount(post.viewCount ?? 0)} ${t('postDetail.views')}`}
        >
          <Eye className="w-4.5 h-4.5" />
          <span>{formatCount(post.viewCount ?? 0)}</span>
        </div>

        <button
          className="hover:text-blue-600 dark:hover:text-[#0095F6] transition-colors p-1.5 -m-1 cursor-pointer"
          title={t('postDetail.bookmarkButton')}
          type="button"
          onClick={toggleBookmark}
        >
          <Bookmark className={`w-4.5 h-4.5 ${isBookmarked ? 'fill-[#004AC6] text-[#004AC6] dark:fill-blue-400 dark:text-[#0095F6]' : ''}`} />
        </button>

        <button
          className="flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-[#0095F6] transition-colors p-1.5 -m-1 cursor-pointer group tabular-nums"
          title={t('postDetail.shareButton')}
          type="button"
          onClick={handleShare}
        >
          <Share2 className="w-4.5 h-4.5 group-hover:scale-110 transition-transform" />
          <span>{formatCount(shareCount)}</span>
        </button>
      </div>

      {/* Inline Comments Stream */}
      {showInlineComments && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-[#262626] space-y-3 animate-fadeIn">
          {/* Header Bar with Sort Selector */}
          <div className="flex items-center justify-end px-1 pb-1 text-xs text-slate-500 dark:text-[#A8A8A8]">
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="flex items-center gap-1 font-medium text-slate-600 dark:text-[#D4D4D4] hover:text-[#004AC6] dark:hover:text-[#0095F6] transition-colors py-1 px-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#262626] cursor-pointer"
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
                <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-[#262626] rounded-xl shadow-lg border border-slate-200 dark:border-[#363636] z-30 py-1 animate-fadeIn">
                  <button
                    type="button"
                    onClick={() => handleSortChange('POPULAR')}
                    className={`w-full text-left px-3 py-1.5 text-xs transition-colors hover:bg-slate-50 dark:hover:bg-[#262626]/80 cursor-pointer ${
                      commentSort === 'POPULAR' ? 'text-[#004AC6] dark:text-[#0095F6] font-semibold bg-blue-50/50 dark:bg-[#0095F6]/15' : 'text-gray-700 dark:text-[#D4D4D4]'
                    }`}
                  >
                    {t('postDetail.mostRelevant')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSortChange('NEWEST')}
                    className={`w-full text-left px-3 py-1.5 text-xs transition-colors hover:bg-slate-50 dark:hover:bg-[#262626]/80 cursor-pointer ${
                      commentSort === 'NEWEST' ? 'text-[#004AC6] dark:text-[#0095F6] font-semibold bg-blue-50/50 dark:bg-[#0095F6]/15' : 'text-gray-700 dark:text-[#D4D4D4]'
                    }`}
                  >
                    {t('postDetail.newest')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSortChange('OLDEST')}
                    className={`w-full text-left px-3 py-1.5 text-xs transition-colors hover:bg-slate-50 dark:hover:bg-[#262626]/80 cursor-pointer ${
                      commentSort === 'OLDEST' ? 'text-[#004AC6] dark:text-[#0095F6] font-semibold bg-blue-50/50 dark:bg-[#0095F6]/15' : 'text-gray-700 dark:text-[#D4D4D4]'
                    }`}
                  >
                    {t('postDetail.oldest')}
                  </button>
                </div>
              )}
            </div>
          </div>
          {comments.length > 0 && (
            <div className="space-y-3">
              {comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  currentUserId={currentUser?.id}
                  postAuthorId={post.author.id}
                  onReply={(parentComment, replyToUser) => handleStartReply(parentComment, replyToUser)}
                  onOpenLikers={handleOpenLikers}
                  autoLoadTopReply={true}
                  onCommentDeleted={(deletedId, replyCount = 0) => {
                    setComments((prev) => prev.filter((c) => c.id !== deletedId));
                    const totalDeducted = 1 + replyCount;
                    const next = Math.max(0, commentCount - totalDeducted);
                    setCommentCount(next);
                    onPostUpdated?.({ ...post, commentCount: next });
                  }}
                  onReplyDeleted={(_parentId, _replyId) => {
                    const next = Math.max(0, commentCount - 1);
                    setCommentCount(next);
                    onPostUpdated?.({ ...post, commentCount: next });
                  }}
                />
              ))}
            </div>
          )}

          {/* Button Load More Comments */}
          {hasMoreComments && (
            <div className="pt-1">
              <button
                type="button"
                onClick={handleLoadMoreComments}
                disabled={isLoadingComments}
                className="text-xs font-semibold text-[#004AC6] hover:underline flex items-center gap-1.5 py-1 px-1.5 rounded-lg hover:bg-blue-50/50 transition cursor-pointer disabled:opacity-50"
              >
                {isLoadingComments ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{t('postDetail.loadingComments')}</span>
                  </>
                ) : (
                  <span>
                    {t('postDetail.viewMoreComments', {
                      count: Math.max(1, commentCount - comments.length),
                    })}
                  </span>
                )}
              </button>
            </div>
          )}

          {/* Quick Comment Input */}
          <CommentInput
            authorName={post.author.username}
            onSubmit={handleCommentSubmit}
            isSubmitting={isPostingComment}
            placeholder={t('postDetail.writeQuickComment')}
            replyingTo={
              replyingTo
                ? {
                    username: replyingTo.username,
                    onCancel: () => setReplyingTo(null),
                  }
                : null
            }
          />
        </div>
      )}

      {/* Likers Modal for Post & Comment */}
      <LikersModal
        isOpen={isLikersOpen}
        onClose={() => setIsLikersOpen(false)}
        targetId={likersTarget.id}
        type={likersTarget.type}
        totalLikes={likersTarget.totalLikes}
      />

      {/* Reposters Modal for Post */}
      <RepostersModal
        isOpen={isRepostersOpen}
        onClose={() => setIsRepostersOpen(false)}
        postId={post.id}
        totalReposts={repostCount}
      />

      {/* Create / Edit Repost Modal (Write caption) */}
      <CreateRepostModal
        isOpen={isCreateRepostOpen}
        onClose={() => setIsCreateRepostOpen(false)}
        post={post}
        isAlreadyReposted={isReposted}
        initialCaption={userCaption || ''}
        onRepostSuccess={handleRepostSuccess}
      />

      {/* Edit Post Modal with Drag and Drop Media */}
      <EditPostModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        post={post}
        onPostUpdated={(updated) => {
          onPostUpdated?.(updated);
          setIsEditModalOpen(false);
        }}
      />

      {/* Internal Lightbox Modal */}
      {internalLightboxIndex !== null && (
        <PostMediaLightbox
          post={post}
          initialMediaIndex={internalLightboxIndex}
          isOpen={true}
          onClose={() => setInternalLightboxIndex(null)}
          onPostUpdated={onPostUpdated}
          onPostDeleted={onPostDeleted}
        />
      )}

      {/* Delete Post Confirmation Modal */}
      <DeletePostModal
        isOpen={isDeleteModalOpen}
        onClose={() => !isDeleting && setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDeletePost}
        isLoading={isDeleting}
        post={post}
      />
    </article>
  );
};

export default PostCard;
