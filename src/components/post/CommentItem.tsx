import React, { useState } from 'react';
import { 
  Heart, 
  ChevronDown, 
  ChevronUp, 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  Pin, 
  PinOff,
  Loader2
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { getAvatarUrl, getMediaUrl, isVideoMedia } from '../../utils/media';
import { commentService } from '../../services/commentService';
import type { CommentResponse, ReplyResponse } from '../../types';
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
  const { t } = useLanguage();
  const [isLiked, setIsLiked] = useState(comment.isLiked ?? comment.liked ?? false);
  const [likeCount, setLikeCount] = useState(comment.likeCount);
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState<ReplyResponse[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);

  // Sync like state when comment prop updates
  React.useEffect(() => {
    setIsLiked(comment.isLiked ?? comment.liked ?? false);
    setLikeCount(comment.likeCount);
  }, [comment.isLiked, comment.liked, comment.likeCount]);

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [currentContent, setCurrentContent] = useState(comment.content);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isEdited, setIsEdited] = useState(!!comment.editedAt);

  // Deleted state
  const [isDeleted, setIsDeleted] = useState(false);

  // Pinned state
  const [isPinned, setIsPinned] = useState(comment.isPinned);

  // 3-dot dropdown menu
  const [showMoreMenu, setShowMoreMenu] = useState(false);

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

  const handleDelete = async () => {
    if (!window.confirm(t('postDetail.deleteCommentConfirm'))) return;
    try {
      await commentService.deleteComment(comment.id);
      toast.success(t('postDetail.commentDeleted'));
      setIsDeleted(true);
      onCommentDeleted?.(comment.id, comment.replyCount);
    } catch (err) {
      console.error('Failed to delete comment:', err);
      toast.error('Không thể xóa bình luận');
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
      {/* Avatar */}
      <img
        src={getAvatarUrl(isDeleted ? null : comment.author.avatarUrl)}
        alt={isDeleted ? 'deleted' : comment.author.fullName || comment.author.username}
        className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-0.5"
      />

      <div className="flex-1 min-w-0">
        {/* Comment Bubble */}
        <div className={`rounded-2xl rounded-tl-none p-3.5 border transition-all ${
          isDeleted 
            ? 'bg-gray-100/70 border-gray-200 text-gray-400 italic' 
            : isPinned 
              ? 'bg-[#EEF4FF] border-[#004AC6]/30 shadow-xs' 
              : 'bg-[#F4F4FB] border-[#E2E2EC]/50'
        }`}>
          {/* Header Row */}
          {!isDeleted && (
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm font-semibold text-[#1A1C1E]">
                  {comment.author.fullName || comment.author.username}
                </span>
                {isAuthorBadge && (
                  <span className="px-1.5 py-0.5 rounded bg-[#004AC6] text-white text-[10px] font-semibold">
                    {t('postDetail.author')}
                  </span>
                )}
                {isYouBadge && !isAuthorBadge && (
                  <span className="px-1.5 py-0.5 rounded bg-[#DBEAFE] text-[#004AC6] text-[10px] font-semibold">
                    {t('postDetail.you')}
                  </span>
                )}
                <span className="text-xs text-[#535F70]">
                  @{comment.author.username}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[#535F70]">
                  {formatTime(comment.createdAt)}
                  {isEdited && (
                    <span className="ml-1 italic">({t('postDetail.edited')})</span>
                  )}
                </span>

                {/* 3-dot More Menu for Comment */}
                {(canEdit || canDelete || canPin) && (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowMoreMenu(!showMoreMenu)}
                      className="opacity-0 group-hover/comment:opacity-100 p-1 text-[#535F70] hover:text-[#1A1C1E] hover:bg-black/5 rounded-md transition-opacity cursor-pointer"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>

                    {showMoreMenu && (
                      <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-lg border border-[#E2E2EC] z-30 py-1 text-xs">
                        {canPin && (
                          <button
                            type="button"
                            onClick={handleTogglePin}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-[#1A1C1E] hover:bg-[#F4F4FB] text-left"
                          >
                            {isPinned ? (
                              <>
                                <PinOff className="w-3.5 h-3.5 text-[#535F70]" />
                                <span>{t('postDetail.unpinComment')}</span>
                              </>
                            ) : (
                              <>
                                <Pin className="w-3.5 h-3.5 text-[#535F70]" />
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
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-[#1A1C1E] hover:bg-[#F4F4FB] text-left"
                          >
                            <Pencil className="w-3.5 h-3.5 text-[#535F70]" />
                            <span>{t('postDetail.editComment')}</span>
                          </button>
                        )}

                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => {
                              setShowMoreMenu(false);
                              handleDelete();
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-red-600 hover:bg-red-50 text-left"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>{t('postDetail.deleteComment')}</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Comment Content / Inline Edit Box */}
          {isEditing ? (
            <div className="mt-1 space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full text-[13px] text-[#1A1C1E] p-2 bg-white rounded-lg border border-[#004AC6] focus:outline-none focus:ring-1 focus:ring-[#004AC6] resize-none"
                rows={2}
                autoFocus
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-2.5 py-1 text-xs text-[#535F70] hover:bg-gray-200 rounded-md transition-colors"
                >
                  {t('postDetail.cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={!editContent.trim() || isSavingEdit}
                  className="px-3 py-1 text-xs bg-[#004AC6] text-white font-semibold rounded-md hover:bg-[#003A9F] transition-colors disabled:opacity-50"
                >
                  {t('postDetail.save')}
                </button>
              </div>
            </div>
          ) : (
            <p className={`text-[13px] leading-snug ${isDeleted ? 'text-gray-400 italic' : 'text-[#1A1C1E]'}`}>
              {currentContent}
            </p>
          )}

          {/* Attached Media Items */}
          {!isDeleted && comment.media && comment.media.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-2">
              {comment.media.map((item, idx) => {
                const isVid = isVideoMedia(item.mediaUrl, item.mediaType);
                return (
                  <div key={item.id || idx} className="rounded-xl overflow-hidden max-h-56 max-w-xs border border-[#E2E2EC]">
                    {isVid ? (
                      <video
                        src={getMediaUrl(item.mediaUrl)}
                        controls
                        playsInline
                        className="max-h-56 w-auto object-contain bg-black"
                      />
                    ) : (
                      <img
                        src={getMediaUrl(item.mediaUrl)}
                        alt={`media-${idx}`}
                        className="max-h-56 w-auto object-cover"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Pinned Indicator */}
          {isPinned && !isDeleted && (
            <div className="mt-1.5 text-[11px] text-[#004AC6] font-semibold flex items-center gap-1">
              📌 {t('postDetail.pinned')}
            </div>
          )}
        </div>

        {/* Action Bar (Like, Reply) */}
        {!isDeleted && (
          <div className="flex items-center gap-4 mt-1.5 ml-2 text-xs text-[#535F70]">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleLike}
                className={`p-1 -m-1 rounded-full transition-transform active:scale-90 hover:scale-110 cursor-pointer ${
                  isLiked ? 'text-rose-500' : 'hover:text-rose-500'
                }`}
                title={isLiked ? t('postDetail.unlikedToast') : t('postDetail.likeButton')}
              >
                <Heart className={`w-3.5 h-3.5 transition-all ${isLiked ? 'fill-rose-500 text-rose-500 scale-105' : ''}`} />
              </button>
              <button
                type="button"
                onClick={() => onOpenLikers?.(comment.id, 'comment', likeCount)}
                className="hover:underline hover:text-rose-500 font-semibold text-[12px] cursor-pointer transition-colors px-0.5"
                title={t('postDetail.viewLikers')}
              >
                {likeCount}
              </button>
            </div>
            <button
              type="button"
              onClick={() => onReply(comment)}
              className="hover:text-[#004AC6] font-semibold text-[12px] cursor-pointer"
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
            className="mt-2 ml-2 flex items-center gap-1 text-[12px] text-[#004AC6] font-semibold hover:underline cursor-pointer"
          >
            {showReplies && replies.length >= comment.replyCount ? (
              <><ChevronUp className="w-3.5 h-3.5" /> {t('postDetail.hideReplies')}</>
            ) : (
              <><ChevronDown className="w-3.5 h-3.5" /> {t('postDetail.showReplies', { count: comment.replyCount })}</>
            )}
          </button>
        )}

        {/* Nested Replies Stream */}
        {showReplies && (
          <div className="mt-2.5 relative">
            {loadingReplies && replies.length === 0 ? (
              <div className="text-xs text-[#535F70] py-2 pl-7 flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#004AC6]" />
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
                      {/* SVG Thread Connector Line (Đường nối liền mạch tuyệt đối 100%, không bao giờ đứt đoạn, mỏng 1.5px màu slate-300) */}
                      <svg className="absolute left-0 top-0 w-8 h-full overflow-visible pointer-events-none">
                        {/* Đường dọc: đi thẳng không ngắt quãng (nếu là comment cuối cùng thì dừng ở tâm uốn y=2, nếu không thì kéo dài 100% xuống comment sau) */}
                        <line
                          x1="12"
                          y1={isFirst ? -8 : 0}
                          x2="12"
                          y2={isLast ? 2 : '100%'}
                          stroke="#CBD5E1"
                          strokeWidth="1.5"
                        />
                        {/* Nhánh uốn cong mềm mại móc vào avatar (từ x=12, y=2 lượn sang ngang x=28, y=14) */}
                        <path
                          d="M 12 2 Q 12 14 24 14 L 28 14"
                          fill="none"
                          stroke="#CBD5E1"
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
                      />
                    </div>
                  );
                })}

                {/* Nút Xem thêm câu trả lời nếu chưa tải hết */}
                {replies.length < comment.replyCount && (
                  <div className="relative pl-7 pb-1">
                    <svg className="absolute left-0 top-0 w-8 h-full overflow-visible pointer-events-none">
                      <line
                        x1="12"
                        y1={0}
                        x2="12"
                        y2={2}
                        stroke="#CBD5E1"
                        strokeWidth="1.5"
                      />
                      <path
                        d="M 12 2 Q 12 14 24 14 L 28 14"
                        fill="none"
                        stroke="#CBD5E1"
                        strokeWidth="1.5"
                      />
                    </svg>
                    <button
                      type="button"
                      onClick={handleLoadAllReplies}
                      disabled={loadingReplies}
                      className="text-xs font-semibold text-[#004AC6] hover:underline flex items-center gap-1.5 py-1 px-1.5 rounded-lg hover:bg-blue-50/50 transition cursor-pointer disabled:opacity-50"
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
}

const ReplyItem: React.FC<ReplyItemProps> = ({ 
  reply, 
  currentUserId, 
  postAuthorId, 
  onOpenLikers, 
  onReplyToChild,
  onReplyDeleted 
}) => {
  const { t, language } = useLanguage();
  const [isLiked, setIsLiked] = useState(reply.isLiked ?? reply.liked ?? false);
  const [likeCount, setLikeCount] = useState(reply.likeCount);

  // Edit & Delete state
  const [isDeleted, setIsDeleted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(reply.content);
  const [currentContent, setCurrentContent] = useState(reply.content);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isEdited, setIsEdited] = useState(!!reply.editedAt);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

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

  const handleDelete = async () => {
    if (!window.confirm(t('postDetail.deleteCommentConfirm'))) return;
    try {
      await commentService.deleteComment(reply.id);
      toast.success(t('postDetail.commentDeleted'));
      setIsDeleted(true);
      onReplyDeleted?.(reply.id);
    } catch (err) {
      console.error('Failed to delete reply:', err);
      toast.error(language === 'vi' ? 'Không thể xóa câu trả lời' : 'Failed to delete reply');
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
    <div className="flex gap-2.5 items-start">
      <img
        src={getAvatarUrl(reply.author.avatarUrl)}
        alt={reply.author.fullName || reply.author.username}
        className="w-6 h-6 rounded-full object-cover mt-0.5"
      />
      <div className="flex-1">
        <div className="bg-[#EDEDF8] rounded-xl p-2.5 relative group/reply">
          <div className="flex items-center justify-between mb-0.5">
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-[#1A1C1E]">
                {reply.author.fullName || reply.author.username}
              </span>
              {isAuthor && (
                <span className="px-1.5 py-0.5 rounded bg-[#004AC6] text-white text-[10px] font-semibold">
                  {t('postDetail.author')}
                </span>
              )}
              {isCurrentUser && !isAuthor && (
                <span className="px-1.5 py-0.5 rounded bg-[#DBEAFE] text-[#004AC6] text-[10px] font-semibold">
                  {t('postDetail.you')}
                </span>
              )}
            </div>

            {/* Nút 3 chấm tùy chọn cho Reply */}
            {(canEdit || canDelete) && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                  className="p-1 text-[#535F70] hover:text-[#1A1C1E] hover:bg-black/5 rounded-full transition-colors cursor-pointer"
                  title="Tùy chọn"
                >
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </button>

                {showMoreMenu && (
                  <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-lg border border-[#E2E2EC] py-1 z-30 text-xs">
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditing(true);
                          setShowMoreMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-[#1A1C1E] hover:bg-[#F4F4FB] text-left cursor-pointer"
                      >
                        <Pencil className="w-3 h-3 text-[#535F70]" />
                        <span>{t('postDetail.editComment')}</span>
                      </button>
                    )}

                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowMoreMenu(false);
                          handleDelete();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-red-600 hover:bg-red-50 text-left cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
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
            <div className="mt-1 space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full bg-white border border-[#004AC6] text-xs text-[#1A1C1E] rounded-lg p-2 focus:ring-1 focus:ring-[#004AC6] outline-none"
                rows={2}
              />
              <div className="flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setEditContent(currentContent);
                    setIsEditing(false);
                  }}
                  className="px-2 py-1 text-[#535F70] hover:text-[#1A1C1E] cursor-pointer"
                >
                  {t('postDetail.cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={isSavingEdit || !editContent.trim()}
                  className="px-3 py-1 bg-[#004AC6] text-white rounded font-medium hover:bg-[#003A9F] cursor-pointer disabled:opacity-50"
                >
                  {isSavingEdit ? t('postDetail.saving') : t('postDetail.save')}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-[#1A1C1E]">
              {reply.replyToUser && (
                <span className="text-[#004AC6] font-medium">@{reply.replyToUser.username} </span>
              )}
              {currentContent}
              {isEdited && (
                <span className="text-[10px] text-[#535F70] ml-1">({t('postDetail.edited')})</span>
              )}
            </p>
          )}

          {/* Media in reply */}
          {reply.media && reply.media.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {reply.media.map((item, idx) => {
                const isVid = isVideoMedia(item.mediaUrl, item.mediaType);
                return (
                  <div key={item.id || idx} className="rounded-lg overflow-hidden max-h-40 max-w-[200px] border border-[#E2E2EC]">
                    {isVid ? (
                      <video
                        src={getMediaUrl(item.mediaUrl)}
                        controls
                        playsInline
                        className="max-h-40 w-auto object-contain bg-black"
                      />
                    ) : (
                      <img
                        src={getMediaUrl(item.mediaUrl)}
                        alt={`reply-media-${idx}`}
                        className="max-h-40 w-auto object-cover"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 mt-1 ml-1 text-[11px] text-[#535F70]">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleLike}
              className={`p-0.5 rounded-full transition-transform active:scale-90 hover:scale-110 cursor-pointer ${
                isLiked ? 'text-rose-500' : 'hover:text-rose-500'
              }`}
              title={isLiked ? t('postDetail.unlikedToast') : t('postDetail.likeButton')}
            >
              <Heart className={`w-3 h-3 transition-all ${isLiked ? 'fill-rose-500 text-rose-500 scale-105' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => onOpenLikers?.(reply.id, 'comment', likeCount)}
              className="hover:underline hover:text-rose-500 font-semibold cursor-pointer transition-colors px-0.5"
              title={t('postDetail.viewLikers')}
            >
              {likeCount}
            </button>
          </div>
          <button
            type="button"
            onClick={() => onReplyToChild?.(reply)}
            className="hover:text-[#004AC6] font-semibold cursor-pointer transition-colors"
          >
            {t('postDetail.reply')}
          </button>
          <span>{formatTime(reply.createdAt)}</span>
        </div>
      </div>
    </div>
  );
};

export default CommentItem;
