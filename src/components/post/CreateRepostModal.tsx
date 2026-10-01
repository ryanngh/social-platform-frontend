import React, { useState, useEffect } from 'react';
import { X, Repeat2, Loader2, Trash2, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import type { PostResponse } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { getAvatarUrl, DEFAULT_AVATAR_FALLBACK } from '../../utils/media';
import { repostService } from '../../services/repostService';

interface CreateRepostModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: PostResponse;
  isAlreadyReposted?: boolean;
  initialCaption?: string;
  onRepostSuccess: (newReposted: boolean, newCount: number, caption?: string | null) => void;
}

export const CreateRepostModal: React.FC<CreateRepostModalProps> = ({
  isOpen,
  onClose,
  post,
  isAlreadyReposted = false,
  initialCaption = '',
  onRepostSuccess,
}) => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [caption, setCaption] = useState(initialCaption);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isVi = language === 'vi';

  useEffect(() => {
    if (isOpen) {
      setCaption(initialCaption || '');
    }
  }, [isOpen, initialCaption]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentUserName =
    user?.firstName || user?.username || (isVi ? 'Bạn' : 'You');

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    const trimmedCaption = caption.trim();

    try {
      if (isAlreadyReposted) {
        // Cập nhật caption repost qua endpoint PATCH /posts/{postId}/reposts
        await repostService.updateCaption(post.id, trimmedCaption || null);
        onRepostSuccess(true, post.repostCount ?? 1, trimmedCaption || null);
        toast.success(
          isVi ? 'Đã cập nhật suy nghĩ của bạn!' : 'Updated your thought!',
          { icon: '🔁' }
        );
      } else {
        const res = await repostService.repost(post.id, trimmedCaption || undefined);
        onRepostSuccess(res.reposted, res.repostCount, trimmedCaption || null);
        toast.success(
          isVi ? 'Đã repost bài viết!' : 'Reposted successfully!',
          { icon: '🔁' }
        );
      }
      onClose();
    } catch (err: any) {
      console.error('Failed to submit repost:', err);
      const status = err?.response?.status;
      if (status === 409) {
        toast.error(isVi ? 'Bạn đã repost bài này rồi' : 'Already reposted');
      } else if (status === 404) {
        toast.error(isVi ? 'Không tìm thấy lượt repost của bạn' : 'Repost not found');
      } else if (status === 400) {
        toast.error(isVi ? 'Caption không hợp lệ (tối đa 1000 ký tự)' : 'Caption exceeds maximum length');
      } else {
        toast.error(isVi ? 'Không thể thực hiện repost' : 'Failed to repost');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnrepost = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await repostService.unrepost(post.id);
      onRepostSuccess(res.reposted, res.repostCount, null);
      onClose();
    } catch (err) {
      console.error('Failed to unrepost:', err);
      toast.error(isVi ? 'Không thể hủy repost' : 'Failed to remove repost');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#121212] w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl border-t sm:border border-gray-100 dark:border-[#262626] overflow-hidden flex flex-col transition-all max-h-[92dvh] sm:max-h-none pb-safe sm:pb-0 animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 sm:py-4 border-b border-gray-100 dark:border-[#262626]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Repeat2 className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-[#F5F5F5] text-base">
              {isAlreadyReposted
                ? (isVi ? 'Suy nghĩ về bài viết' : 'Your repost thought')
                : (isVi ? 'Đăng lại bài viết' : 'Repost post')}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-[#F5F5F5] rounded-full hover:bg-gray-100 dark:hover:bg-[#262626] transition-colors cursor-pointer"
            title={isVi ? 'Đóng' : 'Close'}
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* User Identity info */}
          <div className="flex items-center gap-3">
            <img
              src={getAvatarUrl(user?.avatarUrl)}
              alt={currentUserName}
              className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-[#333]"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = DEFAULT_AVATAR_FALLBACK;
              }}
            />
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {currentUserName}
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                <Repeat2 className="w-3 h-3" />
                <span>
                  {isAlreadyReposted
                    ? (isVi ? 'Đang chỉnh sửa caption repost' : 'Editing repost caption')
                    : (isVi ? 'Sẽ xuất hiện trên trang cá nhân của bạn' : 'Will appear on your profile')}
                </span>
              </p>
            </div>
          </div>

          {/* Caption textarea */}
          <div>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder={
                isVi
                  ? 'Thêm suy nghĩ của bạn... (không bắt buộc)'
                  : 'Add a thought... (optional)'
              }
              rows={3}
              maxLength={280}
              className="w-full text-sm text-gray-800 dark:text-[#F5F5F5] p-3.5 border border-gray-200 dark:border-[#333] rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/25 dark:focus:ring-emerald-400/25 focus:border-emerald-500 resize-none bg-slate-50/50 dark:bg-[#151515] transition-colors placeholder-gray-400 dark:placeholder-gray-500"
              autoFocus
            />
            <div className="flex justify-end mt-1 text-[11px] text-gray-400">
              <span>{caption.length}/280</span>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-[#2A2A2A]">
            {isAlreadyReposted ? (
              <button
                type="button"
                onClick={handleUnrepost}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isVi ? 'Hủy đăng lại' : 'Remove repost'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#262626] rounded-xl transition cursor-pointer"
              >
                {isVi ? 'Hủy' : 'Cancel'}
              </button>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 rounded-xl transition shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{isVi ? 'Đang xử lý...' : 'Posting...'}</span>
                </>
              ) : isAlreadyReposted ? (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>{isVi ? 'Cập nhật suy nghĩ' : 'Save thought'}</span>
                </>
              ) : (
                <>
                  <Repeat2 className="w-3.5 h-3.5" />
                  <span>
                    {caption.trim()
                      ? (isVi ? 'Đăng lại với suy nghĩ' : 'Repost with thought')
                      : (isVi ? 'Đăng lại ngay' : 'Repost now')}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRepostModal;
