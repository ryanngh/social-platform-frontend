import { useState, useEffect, useRef } from 'react';
import {
  Edit3,
  Plus,
  Zap,
  Lock,
  Globe,
  Users,
  UserPlus,
  MoreHorizontal,
  MessageCircle,
  Repeat2,
  Heart,
  Eye,
  Bookmark,
  Share2,
  Image as ImageIcon,
  Play,
  Sparkles,
  Send,
  Loader2,
  ChevronDown,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { User, PostResponse, PostVisibility, CommentResponse } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { postService } from '../../services/postService';
import { commentService } from '../../services/commentService';
import { getAvatarUrl, getMediaUrl, isVideoMedia, DEFAULT_AVATAR_FALLBACK } from '../../utils/media';
import { getContentWithoutHashtags, extractHashtags } from '../../utils/text';
import PostMediaLightbox from '../post/PostMediaLightbox';
import PostMoreMenu from '../post/PostMoreMenu';
import CommentItem from '../post/CommentItem';
import LikersModal from '../post/LikersModal';
import PostComposer from '../feed/PostComposer';
import CreatePostModal from '../feed/CreatePostModal';

interface ProfileTabsProps {
  activeTab: string;
  user: User;
  isOwnProfile: boolean;
  isPrivate?: boolean;
}

// ============================================================
// Helper: format relative time
// ============================================================
function formatRelativeTime(dateStr: string, lang: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return lang === 'vi' ? 'Vừa xong' : 'Just now';
  if (minutes < 60) return lang === 'vi' ? `${minutes} phút` : `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return lang === 'vi' ? `${hours} giờ` : `${hours}h`;
  const days = Math.floor(hours / 24);
  return lang === 'vi' ? `${days} ngày` : `${days}d`;
}

function formatCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return String(count);
}

// ============================================================
// PostCard sub-component for profile feed
// ============================================================

interface ProfilePostCardProps {
  post: PostResponse;
  onOpenLightbox: (post: PostResponse, mediaIndex: number) => void;
  language: string;
  isAuthor: boolean;
  onPostUpdated: (post: PostResponse) => void;
  onPostDeleted: (postId: string) => void;
}

const ProfilePostCard: React.FC<ProfilePostCardProps> = ({
  post,
  onOpenLightbox,
  language,
  isAuthor,
  onPostUpdated,
  onPostDeleted,
}) => {
  const { t } = useLanguage();
  const { user: currentUser } = useAuth();
  const [isLiked, setIsLiked] = useState(post.isLiked ?? post.liked ?? false);
  const [likeCount, setLikeCount] = useState(post.reactionCount);
  const [isLiking, setIsLiking] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [isSaving, setIsSaving] = useState(false);

  // Inline comments state
  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [commentCount, setCommentCount] = useState(post.commentCount ?? 0);
  const [commentSort, setCommentSort] = useState<'POPULAR' | 'NEWEST' | 'OLDEST'>('POPULAR');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [commentsPage, setCommentsPage] = useState(0);
  const [isSingleCommentMode, setIsSingleCommentMode] = useState(true);
  const [hasMoreComments, setHasMoreComments] = useState((post.commentCount ?? 0) > 1);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [showInlineComments, setShowInlineComments] = useState((post.commentCount ?? 0) > 0);
  const [quickCommentText, setQuickCommentText] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{
    commentId: string;
    parentCommentId: string;
    username: string;
  } | null>(null);
  const quickInputRef = useRef<HTMLInputElement>(null);

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
    setQuickCommentText(`@${targetUsername} `);
    setShowInlineComments(true);
    setTimeout(() => quickInputRef.current?.focus(), 50);
  };

  // Sync state when post props change
  useEffect(() => {
    setLikeCount(post.reactionCount ?? 0);
    setIsLiked(post.isLiked ?? post.liked ?? false);
    if (post.commentCount !== undefined) {
      setCommentCount(post.commentCount);
      if (post.commentCount > 0) {
        setShowInlineComments(true);
      }
    }
  }, [post.reactionCount, post.isLiked, post.liked, post.commentCount]);

  // Likers Modal state
  const [isLikersOpen, setIsLikersOpen] = useState(false);
  const [likersTarget, setLikersTarget] = useState<{ id: string; type: 'post' | 'comment'; totalLikes?: number }>({
    id: post.id,
    type: 'post',
    totalLikes: post.reactionCount,
  });

  const handleOpenLikers = (id: string, type: 'post' | 'comment', total?: number) => {
    setLikersTarget({ id, type, totalLikes: total ?? 0 });
    setIsLikersOpen(true);
  };

  // Tự động tải 1 comment cha có tương tác cao nhất (POPULAR) ban đầu
  useEffect(() => {
    if (comments.length === 0) {
      setIsLoadingComments(true);
      commentService
        .getComments(post.id, { sortBy: 'POPULAR', page: 0, size: 1 })
        .then((res) => {
          if (res.content && res.content.length > 0) {
            setComments(res.content);
            setHasMoreComments(!res.last);
            setShowInlineComments(true);
          }
          setCommentsPage(0);
          setIsSingleCommentMode(true);
        })
        .catch((err) => console.error('Failed to load initial popular comment:', err))
        .finally(() => setIsLoadingComments(false));
    }
  }, [post.id]);

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
      // Nếu đang ở chế độ chỉ có 1 comment ban đầu (size 1), ta tải lại page 0 với size 5
      // để không bị nhảy qua các comment ở vị trí 1, 2, 3, 4 do nhảy offset.
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

  const handlePostQuickComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCommentText.trim() || isPostingComment) return;

    setIsPostingComment(true);
    try {
      if (replyingTo) {
        await commentService.createReply(replyingTo.commentId, {
          content: quickCommentText.trim(),
        });
        setComments((prev) =>
          prev.map((c) =>
            c.id === replyingTo.parentCommentId ? { ...c, replyCount: c.replyCount + 1 } : c
          )
        );
        const newCount = commentCount + 1;
        setCommentCount(newCount);
        setQuickCommentText('');
        setReplyingTo(null);
        toast.success(t('postDetail.replyPosted'));
        onPostUpdated({
          ...post,
          commentCount: newCount,
        });
      } else {
        const created = await commentService.createComment(post.id, {
          content: quickCommentText.trim(),
        });
        setComments((prev) => [created, ...prev]);
        const newCount = commentCount + 1;
        setCommentCount(newCount);
        setQuickCommentText('');
        toast.success(t('postDetail.commentPosted'));
        onPostUpdated({
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
        toast(t('postDetail.likedToast'), { icon: '❤️' });
      } else {
        const res = await postService.unlikePost(post.id);
        setLikeCount(res.likeCount);
        setIsLiked(res.liked);
        toast(t('postDetail.unlikedToast'), { icon: '🤍' });
      }
      onPostUpdated({
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
    toast(isBookmarked ? t('feed.unsavedToast') : t('postDetail.savedToast'), {
      icon: isBookmarked ? '🗑️' : '🔖',
    });
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim() || isSaving) return;
    setIsSaving(true);
    try {
      const updated = await postService.updatePost(post.id, {
        content: editContent.trim(),
      });
      const updatedPostObj = {
        ...post,
        content: updated.content,
        updatedAt: new Date().toISOString(),
      };
      onPostUpdated(updatedPostObj);
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
      onPostUpdated(updatedPostObj);
      toast.success(t('postDetail.visibilityUpdated'));
    } catch (err) {
      console.error('Failed to update visibility:', err);
      toast.error(language === 'vi' ? 'Không thể đổi quyền riêng tư' : 'Failed to update visibility');
    }
  };

  const handleDeletePost = async () => {
    try {
      await postService.deletePost(post.id);
      onPostDeleted(post.id);
      toast.success(t('postDetail.deletePostSuccess'));
    } catch (err) {
      console.error('Failed to delete post:', err);
      toast.error(language === 'vi' ? 'Không thể xóa bài viết' : 'Failed to delete post');
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
    <article className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
      {/* Author Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <img
            alt={authorName}
            className="w-10 h-10 rounded-full object-cover"
            src={getAvatarUrl(post.author.avatarUrl)}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = DEFAULT_AVATAR_FALLBACK;
            }}
          />
          <div>
            <div className="flex items-center gap-1.5 leading-tight">
              <h4 className="font-bold text-gray-900 text-sm">{authorName}</h4>
            </div>
            <p className="text-xs text-gray-400 flex items-center gap-1.5">
              <span>@{post.author.username}</span>
              <span>·</span>
              <span>{formatRelativeTime(post.createdAt, language)}</span>
              <span>·</span>
              <span className="flex items-center">{getVisibilityIcon()}</span>
            </p>
          </div>
        </div>
        <div className="relative">
          <button
            className="text-gray-400 hover:text-gray-600 transition p-1.5 rounded-full hover:bg-gray-100 cursor-pointer"
            title={t('postDetail.postOptions')}
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
          <PostMoreMenu
            authorUsername={post.author.username}
            isAuthor={isAuthor}
            currentVisibility={post.visibility}
            isOpen={isMenuOpen}
            onClose={() => setIsMenuOpen(false)}
            onEdit={() => {
              setIsEditing(true);
              setEditContent(post.content);
            }}
            onChangeVisibility={handleChangeVisibility}
            onDelete={handleDeletePost}
          />
        </div>
      </div>

      {/* Post Content or Inline Edit */}
      {isEditing ? (
        <div className="mb-3 space-y-2">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full text-sm text-gray-800 p-3 border border-[#004AC6] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#004AC6]/20 resize-none bg-slate-50/50"
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
              className="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition cursor-pointer"
            >
              {t('postDetail.cancel')}
            </button>
            <button
              type="button"
              onClick={handleSaveEdit}
              disabled={!editContent.trim() || isSaving}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-[#004AC6] hover:bg-[#003A9F] rounded-lg transition disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? '...' : t('postDetail.save')}
            </button>
          </div>
        </div>
      ) : cleanContent ? (
        <p className="text-sm text-gray-800 mb-3 whitespace-pre-line">{cleanContent}</p>
      ) : null}

      {/* Media Attachment */}
      {post.media.length > 0 && (
        <div
          className="relative rounded-2xl overflow-hidden mb-3 border border-gray-100 cursor-pointer group"
          onClick={() => onOpenLightbox(post, 0)}
        >
          {post.media.length > 1 && (
            <span className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white text-[11px] font-medium px-2.5 py-0.5 rounded-full z-10">
              1/{post.media.length}
            </span>
          )}
          {isVideoMedia(post.media[0].mediaUrl, post.media[0].mediaType) ? (
            <div className="relative w-full h-80 bg-black flex items-center justify-center">
              <video
                src={getMediaUrl(post.media[0].mediaUrl)}
                className="w-full h-80 object-cover"
                muted
                preload="metadata"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-black/40 transition-colors">
                <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-xs flex items-center justify-center text-white group-hover:scale-110 transition-transform shadow-lg">
                  <Play className="w-6 h-6 fill-white ml-0.5" />
                </div>
              </div>
            </div>
          ) : (
            <img
              alt={`${authorName} post`}
              className="w-full h-80 object-cover group-hover:scale-[1.02] transition-transform duration-300"
              src={getMediaUrl(post.media[0].mediaUrl)}
            />
          )}
          {/* Hover overlay for images */}
          {!isVideoMedia(post.media[0].mediaUrl, post.media[0].mediaType) && (
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-white opacity-0 group-hover:opacity-60 transition-opacity" />
            </div>
          )}
        </div>
      )}

      {/* Hashtags */}
      {post.hashtags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {post.hashtags.map((tag) => (
            <span key={tag} className="text-xs font-semibold text-[#004AC6] hover:underline cursor-pointer">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Post Actions — matching FeedPostCard style exactly */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
        <div className="flex items-center gap-1 group/like">
          <button
            className={`p-1 -m-1 rounded-full transition-transform active:scale-90 hover:scale-110 cursor-pointer ${
              isLiked ? 'text-rose-600 font-semibold' : 'hover:text-rose-600'
            }`}
            title={isLiked ? t('postDetail.unlikedToast') : t('postDetail.likeButton')}
            type="button"
            onClick={toggleLike}
          >
            <Heart className={`w-4 h-4 transition-all ${isLiked ? 'fill-rose-500 text-rose-500 scale-105' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => handleOpenLikers(post.id, 'post', likeCount)}
            className="hover:underline hover:text-rose-600 font-semibold text-xs transition-colors px-1 py-0.5 rounded cursor-pointer"
            title={t('postDetail.viewLikers')}
          >
            {formatCount(likeCount)}
          </button>
        </div>

        <button
          className="flex items-center gap-1.5 hover:text-blue-600 transition-colors group p-1 -m-1 cursor-pointer"
          title={t('postDetail.commentButton')}
          type="button"
          onClick={() => setShowInlineComments((prev) => !prev)}
        >
          <MessageCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span>{formatCount(commentCount)}</span>
        </button>

        <button
          className="flex items-center gap-1.5 hover:text-emerald-600 transition-colors group p-1 -m-1 cursor-pointer"
          title={t('postDetail.repostButton')}
          type="button"
          onClick={() => toast.success(t('postDetail.repostedToast'))}
        >
          <Repeat2 className="w-4 h-4 group-hover:rotate-180 transition-transform" />
          <span>0</span>
        </button>

        <div className="flex items-center gap-1.5 text-slate-400" title={t('postDetail.views')}>
          <Eye className="w-4 h-4" />
          <span>0</span>
        </div>

        <button
          className="hover:text-blue-600 transition-colors p-1 -m-1 cursor-pointer"
          title={t('postDetail.bookmarkButton')}
          type="button"
          onClick={toggleBookmark}
        >
          <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-[#004AC6] text-[#004AC6]' : ''}`} />
        </button>

        <button
          className="hover:text-blue-600 transition-colors p-1 -m-1 cursor-pointer"
          title={t('postDetail.shareButton')}
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(window.location.href).catch(() => {});
            toast.success(t('postDetail.copiedToast'));
          }}
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      {/* Inline Comments Stream (Feed/Profile) */}
      {showInlineComments && (
        <div className="mt-3 pt-3 border-t border-slate-100 space-y-3 animate-fadeIn">
          {/* Header Bar with Sort Selector */}
          <div className="flex items-center justify-end px-1 pb-1 text-xs text-slate-500">
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="flex items-center gap-1 font-medium text-slate-600 hover:text-[#004AC6] transition-colors py-1 px-2 rounded-lg hover:bg-slate-100 cursor-pointer"
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
                <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-xl shadow-lg border border-slate-200 z-30 py-1 animate-fadeIn">
                  <button
                    type="button"
                    onClick={() => handleSortChange('POPULAR')}
                    className={`w-full text-left px-3 py-1.5 text-xs transition-colors hover:bg-slate-50 cursor-pointer ${
                      commentSort === 'POPULAR' ? 'text-[#004AC6] font-semibold bg-blue-50/50' : 'text-gray-700'
                    }`}
                  >
                    {t('postDetail.mostRelevant')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSortChange('NEWEST')}
                    className={`w-full text-left px-3 py-1.5 text-xs transition-colors hover:bg-slate-50 cursor-pointer ${
                      commentSort === 'NEWEST' ? 'text-[#004AC6] font-semibold bg-blue-50/50' : 'text-gray-700'
                    }`}
                  >
                    {t('postDetail.newest')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSortChange('OLDEST')}
                    className={`w-full text-left px-3 py-1.5 text-xs transition-colors hover:bg-slate-50 cursor-pointer ${
                      commentSort === 'OLDEST' ? 'text-[#004AC6] font-semibold bg-blue-50/50' : 'text-gray-700'
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
                    onPostUpdated({ ...post, commentCount: next });
                  }}
                  onReplyDeleted={(_parentId, _replyId) => {
                    const next = Math.max(0, commentCount - 1);
                    setCommentCount(next);
                    onPostUpdated({ ...post, commentCount: next });
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

          {/* Replying Banner */}
          {replyingTo && (
            <div className="flex items-center justify-between bg-[#F4F4FB] px-3 py-1.5 rounded-lg text-xs text-[#004AC6] font-medium border border-[#E2E2EC]">
              <span>{t('postDetail.replyTo', { name: replyingTo.username })}</span>
              <button
                type="button"
                onClick={() => {
                  setReplyingTo(null);
                  setQuickCommentText('');
                }}
                className="p-1 hover:text-red-500 rounded transition-colors cursor-pointer"
                title={t('postDetail.cancelReply')}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Quick Comment Input */}
          <form onSubmit={handlePostQuickComment} className="flex items-center gap-2 pt-1">
            <img
              src={getAvatarUrl(currentUser?.avatarUrl)}
              alt="me"
              className="w-7 h-7 rounded-full object-cover border border-gray-200 flex-shrink-0"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = DEFAULT_AVATAR_FALLBACK;
              }}
            />
            <div className="flex-1 relative flex items-center">
              <input
                ref={quickInputRef}
                type="text"
                value={quickCommentText}
                onChange={(e) => setQuickCommentText(e.target.value)}
                placeholder={t('postDetail.writeQuickComment')}
                className="w-full bg-[#F4F4FB] text-xs text-gray-800 rounded-full py-2 pl-3.5 pr-9 border border-transparent focus:border-[#004AC6] focus:bg-white outline-none transition"
              />
              <button
                type="submit"
                disabled={!quickCommentText.trim() || isPostingComment}
                className="absolute right-1.5 w-6 h-6 rounded-full bg-[#004AC6] text-white flex items-center justify-center hover:bg-[#003A9F] transition disabled:opacity-30 disabled:hover:bg-[#004AC6] cursor-pointer"
                title={t('postDetail.sendComment')}
              >
                {isPostingComment ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Send className="w-3 h-3 ml-0.5" />
                )}
              </button>
            </div>
          </form>
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
    </article>
  );
};

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
              <ProfilePostCard
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
