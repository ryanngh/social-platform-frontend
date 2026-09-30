import React from 'react';
import { Trash2, AlertTriangle, Image as ImageIcon } from 'lucide-react';
import type { PostResponse } from '../../types';
import { ConfirmModal } from '../common/ConfirmModal';
import { useLanguage } from '../../contexts/LanguageContext';
import { getAvatarUrl, DEFAULT_AVATAR_FALLBACK } from '../../utils/media';

interface DeletePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
  post?: PostResponse | null;
}

export const DeletePostModal: React.FC<DeletePostModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  post,
}) => {
  const { t } = useLanguage();

  const authorName = post
    ? [post.author.firstName, post.author.lastName].filter(Boolean).join(' ') ||
      post.author.username ||
      'User'
    : '';

  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      isLoading={isLoading}
      variant="danger"
      title={t('postDetail.deletePostTitle', { defaultValue: 'Xóa bài viết?' })}
      description={t('postDetail.deletePostDesc', {
        defaultValue:
          'Hành động này không thể hoàn tác. Bài viết và tất cả lượt thích, bình luận liên quan sẽ bị xóa vĩnh viễn.',
      })}
      confirmText={t('postDetail.deletePostConfirmBtn', { defaultValue: 'Xóa bài viết' })}
      cancelText={t('postDetail.cancel', { defaultValue: 'Hủy' })}
      loadingText={t('postDetail.deletingPost', { defaultValue: 'Đang xóa...' })}
      icon={
        <div className="relative inline-flex items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/40 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-xs">
            <Trash2 className="w-6 h-6 stroke-[1.8]" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-rose-100 dark:bg-rose-900/90 border-2 border-white dark:border-[#121212] flex items-center justify-center text-rose-600 dark:text-rose-300 shadow-xs">
            <AlertTriangle className="w-3.5 h-3.5 stroke-[2.2]" />
          </div>
        </div>
      }
    >
      {post && (
        <div className="my-3 p-3 rounded-2xl bg-gray-50/80 dark:bg-[#181818] border border-gray-100 dark:border-[#262626] text-left flex items-start gap-2.5">
          <img
            src={getAvatarUrl(post.author.avatarUrl)}
            alt={authorName}
            className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-[#363636] flex-shrink-0 mt-0.5"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = DEFAULT_AVATAR_FALLBACK;
            }}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 leading-tight">
              <span className="text-xs font-semibold text-gray-900 dark:text-[#F5F5F5] truncate">
                {authorName}
              </span>
              <span className="text-[11px] text-gray-400 dark:text-[#8E8E8E] truncate">
                @{post.author.username}
              </span>
            </div>

            {post.content ? (
              <p className="text-xs text-gray-600 dark:text-[#D4D4D4] line-clamp-2 mt-1 break-words leading-relaxed">
                {post.content}
              </p>
            ) : (
              <p className="text-xs text-gray-400 dark:text-[#737373] italic mt-1">
                ({t('postDetail.noContent', { defaultValue: 'Bài viết không có văn bản' })})
              </p>
            )}

            {post.media && post.media.length > 0 && (
              <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-medium text-gray-500 dark:text-[#A8A8A8]">
                <ImageIcon className="w-3.5 h-3.5 text-gray-400" />
                <span>
                  {post.media.length}{' '}
                  {post.media.length > 1
                    ? t('postDetail.mediaItems', { defaultValue: 'tệp đính kèm' })
                    : t('postDetail.mediaItem', { defaultValue: 'tệp đính kèm' })}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </ConfirmModal>
  );
};

export default DeletePostModal;
