import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Heart, 
  ChevronUp, 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  Pin, 
  PinOff,
  Loader2,
  Play,
  Maximize2,
  CornerDownRight
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { getAvatarUrl, getMediaUrl, isVideoMedia } from '../../utils/media';
import { getProfileUrl } from '../../utils/user';
import { commentService } from '../../services/commentService';
import type { CommentResponse, ReplyResponse } from '../../types';
import CommentMediaLightbox from './CommentMediaLightbox';
import ConfirmModal from '../common/ConfirmModal';
import toast from 'react-hot-toast';

interface CommentItemProps {
  comment: CommentResponse;
  currentUserId?: string;
  postAuthorId: string;
  onReply: (comment: CommentResponse, replyToUser?: { id: string; username: string; replyId?: string }) => void;
  onLike?: (commentId: string) => void;
  onPinChange?: (commentId: string, isPinned: boolean) => void;
  onCommentDeleted?: (commentId: string, replyCount?: number) => void;
  onOpenLikers?: (targetId: string, type: 'post' | 'comment', totalLikes?: number) => void;
  autoLoadTopReply?: boolean;
  onReplyDeleted?: (parentCommentId: string, replyId: string) => void;
}

export const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  currentUserId,
  postAuthorId,
  onReply,
  onLike,
  onPinChange,
  onCommentDeleted,
  onOpenLikers,
  autoLoadTopReply = false,
  onReplyDeleted,
}) => {
  const { t, language } = useLanguage();
  const [isLiked, setIsLiked] = useState(comment.isLiked ?? comment.liked ?? false);
  const [likeCount, setLikeCount] = useState(comment.likeCount);
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState<ReplyResponse[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [lightboxMedia, setLightboxMedia] = useState<{ url: string; type: 'IMAGE' | 'VIDEO'; authorName?: string } | null>(null);

  // Sync like state when comment prop updates
  React.useEffect(() => {
    setIsLiked(comment.isLiked ?? comment.liked ?? false);
    setLikeCount(comment.likeCount);
  }, [comment.isLiked, comment.liked, comment.likeCount]);

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState<string>(comment.content || '');
  const [currentContent, setCurrentContent] = useState(comment.content);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isEdited, setIsEdited] = useState(!!comment.editedAt);

  // Deleted state
  const [isDeleted, setIsDeleted] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Pinned state
  const [isPinned, setIsPinned] = useState(comment.isPinned);

  // 3-dot dropdown menu
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showMoreMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMoreMenu]);

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setEditContent(currentContent || '');
      setIsEditing(false);
    }
  };

  // Tự động tải 1 reply con khi được chỉ định
  React.useEffect(() => {
    if (autoLoadTopReply && comment.replyCount > 0 && replies.length === 0 && !loadingReplies) {
      setShowReplies(true);
      setLoadingReplies(true);
      commentService
        .getReplies(comment.id, { page: 0, size: 1 })
        .then((data) => {
          setReplies(data.content);
        })
        .catch((err) => console.error('Failed to load top reply:', err))
        .finally(() => setLoadingReplies(false));
    }
  }, [autoLoadTopReply, comment.id, comment.replyCount]);

  const isPostAuthor = currentUserId === postAuthorId;
  const isCommentAuthor = currentUserId === comment.author.id;
  const isAuthorBadge = comment.author.id === postAuthorId;
  const isYouBadge = currentUserId === comment.author.id;

  // Quyền hạn
  const canEdit = !isDeleted && (comment.permissions?.canEdit ?? isCommentAuthor);
  const canDelete = !isDeleted && (comment.permissions?.canDelete ?? (isCommentAuthor || isPostAuthor));
  const canPin = !isDeleted && !comment.parentCommentId && (comment.permissions?.canPin ?? isPostAuthor);

  const handleLike = async () => {
    const prevLiked = isLiked;
    const prevCount = likeCount;
    const nextLiked = !prevLiked;
    const nextCount = nextLiked ? prevCount + 1 : Math.max(0, prevCount - 1);

    setIsLiked(nextLiked);
    setLikeCount(nextCount);

    try {
      if (nextLiked) {
        const res = await commentService.likeComment(comment.id);
        setLikeCount(res.likeCount);
        setIsLiked(res.liked);
        toast(t('postDetail.commentLikedToast'), { icon: '❤️' });
      } else {
        const res = await commentService.unlikeComment(comment.id);
        setLikeCount(res.likeCount);
        setIsLiked(res.liked);
        toast(t('postDetail.commentUnlikedToast'), { icon: '🤍' });
      }
      onLike?.(comment.id);
    } catch (err) {
      console.error('Failed to toggle comment like:', err);
      setIsLiked(prevLiked);
      setLikeCount(prevCount);
      toast.error(t('postDetail.likeActionFailed'));
    }
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim() || isSavingEdit) return;
    setIsSavingEdit(true);
    try {
      await commentService.editComment(comment.id, {
        content: editContent.trim(),
      });
      setCurrentContent(editContent.trim());
      setIsEdited(true);
      setIsEditing(false);
      toast.success(t('postDetail.updatePostSuccess'));
    } catch (err) {
      console.error('Failed to edit comment:', err);
      toast.error('Không thể cập nhật bình luận');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await commentService.deleteComment(comment.id);
      toast.success(t('postDetail.commentDeleted'));
      setIsDeleted(true);
      setIsDeleteModalOpen(false);
      onCommentDeleted?.(comment.id, comment.replyCount);
    } catch (err) {
      console.error('Failed to delete comment:', err);
      toast.error(language === 'vi' ? 'Không thể xóa bình luận' : 'Failed to delete comment');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTogglePin = async () => {
    try {
      if (isPinned) {
        await commentService.unpinComment(comment.id);
        setIsPinned(false);
        toast.success(t('postDetail.unpinnedToast'));
        onPinChange?.(comment.id, false);
      } else {
        await commentService.pinComment(comment.id);
        setIsPinned(true);
        toast.success(t('postDetail.pinnedToast'));
        onPinChange?.(comment.id, true);
      }
      setShowMoreMenu(false);
    } catch (err) {
      console.error('Failed to pin/unpin comment:', err);
      toast.error('Thao tác ghim bình luận thất bại');
    }
  };

  const handleLoadAllReplies = async () => {
    setLoadingReplies(true);
    try {
      const data = await commentService.getReplies(comment.id, { page: 0, size: 50 });
      setReplies(data.content);
      setShowReplies(true);
    } catch (err) {
      console.error('Failed to load all replies:', err);
      toast.error('Không thể tải câu trả lời');
    } finally {
      setLoadingReplies(false);
    }
  };

  const toggleReplies = async () => {
    // Nếu đang mở nhưng chưa tải hết (ví dụ mới có reply đầu) -> bấm sẽ tải tất cả các reply còn lại!
    if (showReplies && replies.length < comment.replyCount) {
      await handleLoadAllReplies();
      return;
    }
    if (showReplies) {
      setShowReplies(false);
      return;
    }
    setShowReplies(true);
    if (replies.length < comment.replyCount) {
      await handleLoadAllReplies();
    }
  };

  const handleReplyItemDeleted = (replyId: string) => {
    setReplies((prev) => prev.filter((r) => r.id !== replyId));
    comment.replyCount = Math.max(0, comment.replyCount - 1);
    onReplyDeleted?.(comment.id, replyId);
  };

  const formatTime = (dateStr: string): string => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return '< 1m';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  if (isDeleted) return null;

  return (
    <div className="flex gap-3 items-start group/comment relative">
      {/* Thread spine line connecting parent to replies if open */}
      {showReplies && replies.length > 0 && (
        <div 
          className="absolute left-[15px] top-9 bottom-3 w-[1.5px] bg-slate-200 dark:bg-[#262626] pointer-events-none" 
          aria-hidden="true"
        />
      )}

      {/* Avatar */}
      <Link
        to={getProfileUrl(comment.author)}
        className="flex-shrink-0 relative z-10 hover:opacity-95 transition-transform active:scale-95 cursor-pointer"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={getAvatarUrl(isDeleted ? null : comment.author.avatarUrl)}
          alt={isDeleted ? 'deleted' : comment.author.fullName || comment.author.username}
          className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200/80 dark:ring-[#262626] hover:ring-blue-400/60 transition-all shadow-2xs mt-0.5"
        />
      </Link>

      <div className="flex-1 min-w-0">
        {/* Comment Bubble */}
        <div className={`relative ${isEditing ? 'w-full' : 'w-fit max-w-full'} rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3 transition-colors ${
          isDeleted 
            ? 'bg-slate-100/70 border border-slate-200 text-slate-400 dark:bg-[#1A1A1A]/40 dark:border-[#262626] italic' 
            : isPinned 
              ? 'bg-gradient-to-br from-blue-50/95 via-indigo-50/50 to-blue-50/30 border border-blue-200/80 shadow-2xs dark:from-[#1A1A1A] dark:via-indigo-950/20 dark:to-blue-950/10 dark:border-blue-800/60' 
              : 'bg-[#F0F2F5] hover:bg-[#EAEBED] border border-slate-200/40 dark:bg-[#262626] dark:hover:bg-[#243347] dark:border-[#262626] shadow-[0_1px_2px_rgba(0,0,0,0.02)]'
        }`}>
          {/* Pinned Eyebrow Badge (at top of bubble) */}
          {isPinned && !isDeleted && (
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-700 dark:text-[#0095F6] mb-1 select-none">
              <Pin className="w-3 h-3 fill-blue-600 dark:fill-blue-400 text-blue-600 dark:text-[#0095F6] -rotate-45" />
              <span>{t('postDetail.pinned')}</span>
            </div>
          )}

          {/* Header Row */}
          {!isDeleted && (
            <div className="flex items-start justify-between gap-3 mb-1">
              <div className="flex items-center gap-1.5 flex-wrap leading-tight">
                <Link
                  to={getProfileUrl(comment.author)}
                  className="text-[13px] font-bold text-slate-900 dark:text-[#F5F5F5] hover:text-blue-600 dark:hover:text-[#0095F6] transition-colors cursor-pointer leading-tight"
                  onClick={(e) => e.stopPropagation()}
                >
                  {comment.author.fullName || comment.author.username}
                </Link>

                {isAuthorBadge && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-medium leading-none tracking-wide shadow-2xs">
                    {t('postDetail.author')}
                  </span>
                )}

                {isYouBadge && !isAuthorBadge && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-[#0095F6]/15 dark:text-[#3897F0] text-[10px] font-medium leading-none border border-blue-200/60 dark:border-blue-800/60">
                    {t('postDetail.you')}
                  </span>
                )}

                <Link
                  to={getProfileUrl(comment.author)}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-[#F5F5F5] transition-colors cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                >
                  @{comment.author.username}
                </Link>
              </div>

              {/* 3-dot More Menu for Comment */}
              {(canEdit || canDelete || canPin) && (
                <div className="relative flex-shrink-0" ref={moreMenuRef}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMoreMenu((prev) => !prev);
                    }}
                    className="opacity-70 sm:opacity-0 sm:group-hover/comment:opacity-100 focus:opacity-100 p-1 -mr-1 -mt-1 text-slate-400 hover:text-slate-700 dark:hover:text-[#F5F5F5] hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-all cursor-pointer"
                    title="Tùy chọn bình luận"
                    aria-label="Comment options"
                    aria-expanded={showMoreMenu}
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>

                  {showMoreMenu && (
                    <div 
                      className="absolute right-0 top-full mt-1.5 w-44 bg-white/95 dark:bg-[#262626]/95 backdrop-blur-md rounded-xl shadow-lg border border-slate-200/80 dark:border-[#363636] z-30 py-1 text-xs animate-in fade-in zoom-in-95 duration-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {canPin && (
                        <button
                          type="button"
                          onClick={handleTogglePin}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-[#E5E5E5] hover:bg-slate-100/80 dark:hover:bg-[#262626] text-left transition-colors cursor-pointer"
                        >
                          {isPinned ? (
                            <>
                              <PinOff className="w-3.5 h-3.5 text-slate-500 dark:text-[#A8A8A8]" />
                              <span>{t('postDetail.unpinComment')}</span>
                            </>
                          ) : (
                            <>
                              <Pin className="w-3.5 h-3.5 text-slate-500 dark:text-[#A8A8A8]" />
                              <span>{t('postDetail.pinComment')}</span>
                            </>
                          )}
                        </button>
                      )}

                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditing(true);
                            setShowMoreMenu(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-[#E5E5E5] hover:bg-slate-100/80 dark:hover:bg-[#262626] text-left transition-colors cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5 text-slate-500 dark:text-[#A8A8A8]" />
                          <span>{t('postDetail.editComment')}</span>
                        </button>
                      )}

                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowMoreMenu(false);
                            setIsDeleteModalOpen(true);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-left transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
                          <span>{t('postDetail.deleteComment')}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Comment Content / Inline Edit Box */}
          {isEditing ? (
            <div className="mt-1.5 space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={handleEditKeyDown}
                className="w-full text-[13px] text-slate-900 dark:text-[#F5F5F5] p-2.5 bg-white dark:bg-[#121212] rounded-xl border border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none shadow-2xs"
                rows={2}
                autoFocus
                placeholder={t('postDetail.writeComment', { name: '' })}
              />
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400 hidden sm:inline">
                  Esc để hủy • Enter để lưu
                </span>
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setEditContent(currentContent || '');
                      setIsEditing(false);
                    }}
                    disabled={isSavingEdit}
                    className="px-2.5 py-1 text-xs text-slate-600 dark:text-[#A8A8A8] hover:text-slate-900 dark:hover:text-[#F5F5F5] hover:bg-slate-200/60 dark:hover:bg-[#262626] rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {t('postDetail.cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    disabled={!editContent.trim() || isSavingEdit}
                    className="px-3 py-1 text-xs bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    {isSavingEdit && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{isSavingEdit ? (t('postDetail.saving') || 'Saving...') : t('postDetail.save')}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            currentContent ? (
              <p className={`text-[13px] leading-relaxed break-words whitespace-pre-wrap select-text ${
                isDeleted ? 'text-slate-400 italic' : 'text-slate-900 dark:text-[#F5F5F5]'
              }`}>
                {currentContent}
              </p>
            ) : null
          )}

          {/* Attached Media Items */}
          {!isDeleted && comment.media && comment.media.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-2">
              {comment.media.map((item, idx) => {
                const isVid = isVideoMedia(item.mediaUrl, item.mediaType);
                return (
                  <div
                    key={item.id || idx}
                    className="relative rounded-xl overflow-hidden max-h-56 max-w-xs border border-slate-200/80 dark:border-[#363636] cursor-pointer group/media hover:shadow-md transition-all duration-200 bg-slate-900/5 dark:bg-[#121212]/40"
                    onClick={() =>
                      setLightboxMedia({
                        url: item.mediaUrl,
                        type: isVid ? 'VIDEO' : 'IMAGE',
                        authorName: comment.author.username,
                      })
                    }
                  >
                    {isVid ? (
                      <div className="relative">
                        <video
                          src={getMediaUrl(item.mediaUrl)}
                          playsInline
                          className="max-h-56 w-auto object-contain bg-black"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover/media:bg-black/40 transition-colors">
                          <div className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-xs flex items-center justify-center text-white shadow-md group-hover/media:scale-110 transition-transform">
                            <Play className="w-4 h-4 fill-white ml-0.5" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="relative">
                        <img
                          src={getMediaUrl(item.mediaUrl)}
                          alt={`media-${idx}`}
                          className="max-h-56 w-auto object-cover group-hover/media:scale-[1.02] transition-transform duration-200"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover/media:bg-black/15 transition-colors flex items-center justify-center">
                          <Maximize2 className="w-5 h-5 text-white opacity-0 group-hover/media:opacity-90 drop-shadow transition-opacity" />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Floating Reaction Pill (Facebook / Threads signature interaction) */}
          {!isDeleted && likeCount > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenLikers?.(comment.id, 'comment', likeCount);
              }}
              className="absolute -bottom-2.5 right-2.5 bg-white hover:bg-slate-50 border border-slate-200/90 dark:bg-[#262626] dark:hover:bg-[#262626] dark:border-[#363636] shadow-2xs rounded-full px-1.5 py-0.5 flex items-center gap-1 transition-transform hover:scale-105 active:scale-95 cursor-pointer z-10"
              title={t('postDetail.viewLikers')}
              aria-label={t('postDetail.viewLikers')}
            >
              <div className="w-3.5 h-3.5 rounded-full bg-rose-500 flex items-center justify-center text-white flex-shrink-0 shadow-2xs">
                <Heart className="w-2 h-2 fill-white text-white" />
              </div>
              <span className="text-[11px] font-semibold text-slate-700 dark:text-[#D4D4D4] pr-0.5">{likeCount}</span>
            </button>
          )}
        </div>

        {/* Action Bar (Timestamp, Like, Reply) */}
        {!isDeleted && (
          <div className="flex items-center gap-3 mt-1.5 ml-2 text-xs text-slate-500 dark:text-[#A8A8A8]">
            {/* Timestamp */}
            <span className="text-[11.5px] text-slate-400 dark:text-[#A8A8A8] font-normal">
              {formatTime(comment.createdAt)}
              {isEdited && (
                <span className="ml-1 text-[10.5px] italic text-slate-400 dark:text-[#A8A8A8]">({t('postDetail.edited')})</span>
              )}
            </span>

            <span className="text-slate-300 dark:text-[#525252] text-[10px] select-none">•</span>

            {/* Like action */}
            <button
              type="button"
              onClick={handleLike}
              className={`font-semibold text-xs transition-colors flex items-center gap-1 py-0.5 px-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-[#262626] cursor-pointer ${
                isLiked ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-500 dark:text-[#A8A8A8] hover:text-slate-800 dark:hover:text-[#F5F5F5]'
              }`}
              title={isLiked ? t('postDetail.unlikedToast') : t('postDetail.likeButton')}
            >
              <Heart
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  isLiked ? 'fill-rose-500 text-rose-500 scale-110' : ''
                }`}
              />
              <span>{t('postDetail.likeButton')}</span>
            </button>

            <span className="text-slate-300 dark:text-[#525252] text-[10px] select-none">•</span>

            {/* Reply action */}
            <button
              type="button"
              onClick={() => onReply(comment)}
              className="text-slate-500 dark:text-[#A8A8A8] hover:text-blue-600 dark:hover:text-[#0095F6] font-semibold text-xs py-0.5 px-1.5 rounded-md hover:bg-blue-50/70 dark:hover:bg-blue-900/30 transition-colors cursor-pointer"
            >
              {t('postDetail.reply')}
            </button>
          </div>
        )}

        {/* Reply Toggle */}
        {(comment.replyCount > 0 || replies.length > 0) && (
          <button
            type="button"
            onClick={toggleReplies}
            className="mt-2 ml-1 flex items-center gap-1.5 text-xs text-blue-600 dark:text-[#0095F6] font-semibold py-1 px-2 rounded-lg hover:bg-blue-50/70 dark:hover:bg-blue-900/30 transition-colors cursor-pointer group/toggle w-fit"
          >
            {showReplies && replies.length >= comment.replyCount ? (
              <>
                <ChevronUp className="w-3.5 h-3.5 text-blue-600 dark:text-[#0095F6] transition-transform group-toggle:-translate-y-0.5" />
                <span>{t('postDetail.hideReplies')}</span>
              </>
            ) : (
              <>
                <CornerDownRight className="w-3.5 h-3.5 text-blue-600 dark:text-[#0095F6] transition-transform group-toggle:translate-x-0.5" />
                <span>{t('postDetail.showReplies', { count: comment.replyCount })}</span>
              </>
            )}
          </button>
        )}

        {/* Nested Replies Stream */}
        {showReplies && (
          <div className="mt-2.5 relative">
            {loadingReplies && replies.length === 0 ? (
              <div className="text-xs text-[#535F70] dark:text-[#A8A8A8] py-2 pl-7 flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#004AC6] dark:text-[#0095F6]" />
                <span>{t('postDetail.loadingComments')}</span>
              </div>
            ) : (
              <>
                {replies.map((reply, index) => {
                  const hasMoreToLoad = replies.length < comment.replyCount;
                  const isLast = index === replies.length - 1 && !hasMoreToLoad;
                  const isFirst = index === 0;

                  return (
                    <div key={reply.id} className="relative pl-7 pb-3">
                      {/* SVG Thread Connector Line */}
                      <svg className="absolute left-0 top-0 w-8 h-full overflow-visible pointer-events-none text-slate-300 dark:text-[#525252]">
                        {/* Đường dọc: đi thẳng không ngắt quãng */}
                        <line
                          x1="12"
                          y1={isFirst ? -8 : 0}
                          x2="12"
                          y2={isLast ? 2 : '100%'}
                          stroke="currentColor"
                          strokeWidth="1.5"
                        />
                        {/* Nhánh uốn cong mềm mại móc vào avatar */}
                        <path
                          d="M 12 2 Q 12 14 24 14 L 28 14"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        />
                      </svg>

                      <ReplyItem
                        reply={reply}
                        currentUserId={currentUserId}
                        postAuthorId={postAuthorId}
                        onOpenLikers={onOpenLikers}
                        onReplyToChild={(childReply) => {
                          onReply(comment, {
                            id: childReply.author.id,
                            username: childReply.author.username,
                            replyId: childReply.id,
                          });
                        }}
                        onReplyDeleted={handleReplyItemDeleted}
                        onOpenMedia={setLightboxMedia}
                      />
                    </div>
                  );
                })}

                {/* Nút Xem thêm câu trả lời nếu chưa tải hết */}
                {replies.length < comment.replyCount && (
                  <div className="relative pl-7 pb-1">
                    <svg className="absolute left-0 top-0 w-8 h-full overflow-visible pointer-events-none text-slate-300 dark:text-[#525252]">
                      <line
                        x1="12"
                        y1={0}
                        x2="12"
                        y2={2}
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                      <path
                        d="M 12 2 Q 12 14 24 14 L 28 14"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                    </svg>
                    <button
                      type="button"
                      onClick={handleLoadAllReplies}
                      disabled={loadingReplies}
                      className="text-xs font-semibold text-[#004AC6] dark:text-[#0095F6] hover:underline flex items-center gap-1.5 py-1 px-1.5 rounded-lg hover:bg-blue-50/50 dark:hover:bg-blue-900/30 transition cursor-pointer disabled:opacity-50"
                    >
                      {loadingReplies ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>{t('postDetail.loadingComments')}</span>
                        </>
                      ) : (
                        <span>
                          {t('postDetail.viewMoreReplies', { count: comment.replyCount - replies.length })}
                        </span>
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Comment Media Lightbox */}
      <CommentMediaLightbox
        isOpen={!!lightboxMedia}
        onClose={() => setLightboxMedia(null)}
        media={lightboxMedia}
        authorName={lightboxMedia?.authorName}
      />

      {/* Delete Comment Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => !isDeleting && setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        variant="danger"
        title={t('postDetail.deleteCommentTitle', { defaultValue: 'Xóa bình luận?' })}
        description={t('postDetail.deleteCommentDesc', {
          defaultValue: 'Bạn có chắc chắn muốn xóa bình luận này không? Hành động này không thể hoàn tác.',
        })}
        confirmText={t('postDetail.deleteCommentConfirmBtn', { defaultValue: 'Xóa bình luận' })}
        cancelText={t('postDetail.cancel', { defaultValue: 'Hủy' })}
        loadingText={t('postDetail.deletingComment', { defaultValue: 'Đang xóa...' })}
      />
    </div>
  );
};

// === Reply sub-component ===
interface ReplyItemProps {
  reply: ReplyResponse;
  currentUserId?: string;
  postAuthorId: string;
  onOpenLikers?: (targetId: string, type: 'post' | 'comment', totalLikes?: number) => void;
  onReplyToChild?: (reply: ReplyResponse) => void;
  onReplyDeleted?: (replyId: string) => void;
  onOpenMedia?: (media: { url: string; type: 'IMAGE' | 'VIDEO'; authorName?: string }) => void;
}

const ReplyItem: React.FC<ReplyItemProps> = ({ 
  reply, 
  currentUserId, 
  postAuthorId, 
  onOpenLikers, 
  onReplyToChild,
  onReplyDeleted,
  onOpenMedia
}) => {
  const { t, language } = useLanguage();
  const [isLiked, setIsLiked] = useState(reply.isLiked ?? reply.liked ?? false);
  const [likeCount, setLikeCount] = useState(reply.likeCount);

  // Edit & Delete state
  const [isDeleted, setIsDeleted] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState<string>(reply.content || '');
  const [currentContent, setCurrentContent] = useState(reply.content);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isEdited, setIsEdited] = useState(!!reply.editedAt);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showMoreMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMoreMenu]);

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setEditContent(currentContent || '');
      setIsEditing(false);
    }
  };

  React.useEffect(() => {
    setIsLiked(reply.isLiked ?? reply.liked ?? false);
    setLikeCount(reply.likeCount);
  }, [reply.isLiked, reply.liked, reply.likeCount]);

  const isAuthor = reply.author.id === postAuthorId;
  const isCurrentUser = currentUserId === reply.author.id;
  const canEdit = !isDeleted && isCurrentUser;
  const canDelete = !isDeleted && (isCurrentUser || currentUserId === postAuthorId);

  const handleLike = async () => {
    const prevLiked = isLiked;
    const prevCount = likeCount;
    const nextLiked = !prevLiked;
    const nextCount = nextLiked ? prevCount + 1 : Math.max(0, prevCount - 1);

    setIsLiked(nextLiked);
    setLikeCount(nextCount);

    try {
      if (nextLiked) {
        const res = await commentService.likeComment(reply.id);
        setLikeCount(res.likeCount);
        setIsLiked(res.liked);
        toast(t('postDetail.commentLikedToast'), { icon: '❤️' });
      } else {
        const res = await commentService.unlikeComment(reply.id);
        setLikeCount(res.likeCount);
        setIsLiked(res.liked);
        toast(t('postDetail.commentUnlikedToast'), { icon: '🤍' });
      }
    } catch (err) {
      console.error('Failed to toggle reply like:', err);
      setIsLiked(prevLiked);
      setLikeCount(prevCount);
      toast.error(t('postDetail.likeActionFailed'));
    }
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim() || isSavingEdit) return;
    setIsSavingEdit(true);
    try {
      await commentService.editComment(reply.id, {
        content: editContent.trim(),
      });
      setCurrentContent(editContent.trim());
      setIsEdited(true);
      setIsEditing(false);
      toast.success(t('postDetail.updatePostSuccess'));
    } catch (err) {
      console.error('Failed to edit reply:', err);
      toast.error(language === 'vi' ? 'Không thể cập nhật câu trả lời' : 'Failed to edit reply');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await commentService.deleteComment(reply.id);
      toast.success(t('postDetail.commentDeleted'));
      setIsDeleted(true);
      setIsDeleteModalOpen(false);
      onReplyDeleted?.(reply.id);
    } catch (err) {
      console.error('Failed to delete reply:', err);
      toast.error(language === 'vi' ? 'Không thể xóa câu trả lời' : 'Failed to delete reply');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatTime = (dateStr: string): string => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return '< 1m';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  if (isDeleted) return null;

  return (
    <div className="flex gap-2.5 items-start group/reply relative">
      <Link
        to={getProfileUrl(reply.author)}
        className="flex-shrink-0 hover:opacity-95 transition-transform active:scale-95 cursor-pointer relative z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={getAvatarUrl(reply.author.avatarUrl)}
          alt={reply.author.fullName || reply.author.username}
          className="w-6.5 h-6.5 rounded-full object-cover ring-1 ring-slate-200/80 dark:ring-[#262626] shadow-2xs mt-0.5"
        />
      </Link>
      <div className="flex-1 min-w-0">
        <div className={`relative ${isEditing ? 'w-full' : 'w-fit max-w-full'} bg-[#F0F2F5] hover:bg-[#EAEBED] border border-slate-200/40 dark:bg-[#262626] dark:hover:bg-[#243347] dark:border-[#262626] rounded-2xl px-3 py-2 transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.02)]`}>
          <div className="flex items-start justify-between gap-2 mb-0.5">
            <div className="flex items-center gap-1.5 flex-wrap leading-tight">
              <Link
                to={getProfileUrl(reply.author)}
                className="text-xs font-bold text-slate-900 dark:text-[#F5F5F5] hover:text-blue-600 dark:hover:text-[#0095F6] transition-colors cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              >
                {reply.author.fullName || reply.author.username}
              </Link>
              {isAuthor && (
                <span className="inline-flex items-center px-1.5 py-0.2 rounded-full bg-blue-600 text-white text-[9.5px] font-medium leading-none tracking-wide shadow-2xs">
                  {t('postDetail.author')}
                </span>
              )}
              {isCurrentUser && !isAuthor && (
                <span className="inline-flex items-center px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-700 dark:bg-[#0095F6]/15 dark:text-[#3897F0] text-[9.5px] font-medium leading-none border border-blue-200/60 dark:border-blue-800/60">
                  {t('postDetail.you')}
                </span>
              )}
            </div>

            {/* Nút 3 chấm tùy chọn cho Reply */}
            {(canEdit || canDelete) && (
              <div className="relative flex-shrink-0" ref={moreMenuRef}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMoreMenu((prev) => !prev);
                  }}
                  className="opacity-70 sm:opacity-0 sm:group-hover/reply:opacity-100 focus:opacity-100 p-0.5 -mr-1 -mt-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-[#F5F5F5] hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-all cursor-pointer"
                  title="Tùy chọn"
                  aria-label="Reply options"
                  aria-expanded={showMoreMenu}
                >
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </button>

                {showMoreMenu && (
                  <div 
                    className="absolute right-0 top-full mt-1 w-36 bg-white/95 dark:bg-[#262626]/95 backdrop-blur-md rounded-xl shadow-lg border border-slate-200/80 dark:border-[#363636] py-1 z-30 text-xs animate-in fade-in zoom-in-95 duration-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditing(true);
                          setShowMoreMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-slate-700 dark:text-[#E5E5E5] hover:bg-slate-100/80 dark:hover:bg-[#262626] hover:text-slate-900 dark:hover:text-[#F5F5F5] text-left transition-colors cursor-pointer"
                      >
                        <Pencil className="w-3 h-3 text-slate-500 dark:text-[#A8A8A8]" />
                        <span>{t('postDetail.editComment')}</span>
                      </button>
                    )}

                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowMoreMenu(false);
                          setIsDeleteModalOpen(true);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-left transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3 text-rose-500 dark:text-rose-400" />
                        <span>{t('postDetail.deleteComment')}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Nội dung hoặc Khung chỉnh sửa Inline */}
          {isEditing ? (
            <div className="mt-1 space-y-1.5">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={handleEditKeyDown}
                className="w-full bg-white dark:bg-[#121212] border border-blue-500 text-xs text-slate-900 dark:text-[#F5F5F5] rounded-lg p-2 focus:ring-2 focus:ring-blue-500/20 outline-none resize-none shadow-2xs"
                rows={2}
                autoFocus
              />
              <div className="flex items-center justify-between text-xs">
                <span className="text-[10px] text-slate-400 hidden sm:inline">
                  Esc để hủy • Enter để lưu
                </span>
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setEditContent(currentContent || '');
                      setIsEditing(false);
                    }}
                    disabled={isSavingEdit}
                    className="px-2 py-0.5 text-xs text-slate-500 dark:text-[#A8A8A8] hover:text-slate-800 dark:hover:text-[#F5F5F5] cursor-pointer disabled:opacity-50"
                  >
                    {t('postDetail.cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    disabled={isSavingEdit || !editContent.trim()}
                    className="px-2.5 py-0.5 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1 shadow-2xs"
                  >
                    {isSavingEdit && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{isSavingEdit ? (t('postDetail.saving') || 'Saving...') : t('postDetail.save')}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            (reply.replyToUser || currentContent) ? (
              <p className="text-xs text-slate-900 dark:text-[#F5F5F5] leading-relaxed break-words whitespace-pre-wrap select-text">
                {reply.replyToUser && (
                  <span className="text-blue-600 dark:text-[#0095F6] font-semibold mr-1">@{reply.replyToUser.username}</span>
                )}
                {currentContent}
              </p>
            ) : null
          )}

          {/* Media in reply */}
          {reply.media && reply.media.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {reply.media.map((item, idx) => {
                const isVid = isVideoMedia(item.mediaUrl, item.mediaType);
                return (
                  <div
                    key={item.id || idx}
                    className="relative rounded-lg overflow-hidden max-h-40 max-w-[200px] border border-slate-200/80 dark:border-[#363636] cursor-pointer group/media hover:shadow-md transition-all bg-slate-900/5 dark:bg-[#121212]/40"
                    onClick={() =>
                      onOpenMedia?.({
                        url: item.mediaUrl,
                        type: isVid ? 'VIDEO' : 'IMAGE',
                        authorName: reply.author.username,
                      })
                    }
                  >
                    {isVid ? (
                      <div className="relative">
                        <video
                          src={getMediaUrl(item.mediaUrl)}
                          playsInline
                          className="max-h-40 w-auto object-contain bg-black"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover/media:bg-black/40 transition-colors">
                          <div className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-xs flex items-center justify-center text-white shadow-md group-hover/media:scale-110 transition-transform">
                            <Play className="w-4 h-4 fill-white ml-0.5" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="relative">
                        <img
                          src={getMediaUrl(item.mediaUrl)}
                          alt={`reply-media-${idx}`}
                          className="max-h-40 w-auto object-cover group-hover/media:scale-[1.02] transition-transform duration-200"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover/media:bg-black/15 transition-colors flex items-center justify-center">
                          <Maximize2 className="w-4 h-4 text-white opacity-0 group-hover/media:opacity-90 drop-shadow transition-opacity" />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Floating Reaction Pill for Reply */}
          {!isDeleted && likeCount > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenLikers?.(reply.id, 'comment', likeCount);
              }}
              className="absolute -bottom-2 right-2 bg-white hover:bg-slate-50 border border-slate-200/90 dark:bg-[#262626] dark:hover:bg-[#262626] dark:border-[#363636] shadow-2xs rounded-full px-1.5 py-0.5 flex items-center gap-1 transition-transform hover:scale-105 active:scale-95 cursor-pointer z-10"
              title={t('postDetail.viewLikers')}
              aria-label={t('postDetail.viewLikers')}
            >
              <div className="w-3 h-3 rounded-full bg-rose-500 flex items-center justify-center text-white flex-shrink-0 shadow-2xs">
                <Heart className="w-1.5 h-1.5 fill-white text-white" />
              </div>
              <span className="text-[10px] font-semibold text-slate-700 dark:text-[#D4D4D4] pr-0.5">{likeCount}</span>
            </button>
          )}
        </div>

        {/* Action Bar for Reply */}
        <div className="flex items-center gap-2 mt-1 ml-1.5 text-[11px] text-slate-500 dark:text-[#A8A8A8]">
          <span className="text-slate-400 dark:text-[#A8A8A8] font-normal">
            {formatTime(reply.createdAt)}
            {isEdited && (
              <span className="ml-1 text-[10px] italic text-slate-400 dark:text-[#A8A8A8]">({t('postDetail.edited')})</span>
            )}
          </span>

          <span className="text-slate-300 dark:text-[#525252] text-[10px] select-none">•</span>

          <button
            type="button"
            onClick={handleLike}
            className={`font-semibold transition-colors flex items-center gap-1 py-0.5 px-1 rounded-md hover:bg-slate-100 dark:hover:bg-[#262626] cursor-pointer ${
              isLiked ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-500 dark:text-[#A8A8A8] hover:text-slate-800 dark:hover:text-[#F5F5F5]'
            }`}
            title={isLiked ? t('postDetail.unlikedToast') : t('postDetail.likeButton')}
          >
            <Heart className={`w-3 h-3 transition-transform duration-200 ${
              isLiked ? 'fill-rose-500 text-rose-500 scale-110' : ''
            }`} />
            <span>{t('postDetail.likeButton')}</span>
          </button>

          <span className="text-slate-300 dark:text-[#525252] text-[10px] select-none">•</span>

          <button
            type="button"
            onClick={() => onReplyToChild?.(reply)}
            className="hover:text-blue-600 dark:hover:text-[#0095F6] font-semibold py-0.5 px-1 rounded-md hover:bg-blue-50/70 dark:hover:bg-blue-900/30 transition-colors cursor-pointer text-slate-500 dark:text-[#A8A8A8]"
          >
            {t('postDetail.reply')}
          </button>
        </div>
      </div>

      {/* Delete Reply Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => !isDeleting && setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        variant="danger"
        title={t('postDetail.deleteCommentTitle', { defaultValue: 'Xóa bình luận?' })}
        description={t('postDetail.deleteCommentDesc', {
          defaultValue: 'Bạn có chắc chắn muốn xóa bình luận này không? Hành động này không thể hoàn tác.',
        })}
        confirmText={t('postDetail.deleteCommentConfirmBtn', { defaultValue: 'Xóa bình luận' })}
        cancelText={t('postDetail.cancel', { defaultValue: 'Hủy' })}
        loadingText={t('postDetail.deletingComment', { defaultValue: 'Đang xóa...' })}
      />
    </div>
  );
};

export default CommentItem;
