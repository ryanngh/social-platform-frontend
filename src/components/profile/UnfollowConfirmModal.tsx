import { useEffect } from 'react';
import { UserMinus, Loader2, X } from 'lucide-react';
import type { User } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { getAvatarUrl, DEFAULT_AVATAR_FALLBACK } from '../../utils/media';

interface UnfollowConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  user: User;
  isLoading?: boolean;
}

export const UnfollowConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  user,
  isLoading = false,
}: UnfollowConfirmModalProps) => {
  const { t } = useLanguage();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(' ') ||
    user.username ||
    'User';

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200 select-none"
      onClick={() => {
        if (!isLoading) onClose();
      }}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-sm overflow-hidden flex flex-col p-6 text-center animate-in zoom-in-95 duration-150 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition cursor-pointer disabled:opacity-50"
          title={t('profile.cancel', { defaultValue: 'Hủy' })}
        >
          <X className="w-4 h-4" />
        </button>

        {/* User Avatar */}
        <div className="mx-auto mb-4 relative">
          <img
            src={getAvatarUrl(user.avatarUrl)}
            alt={displayName}
            className="w-20 h-20 rounded-full object-cover border-2 border-gray-100 shadow-sm"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = DEFAULT_AVATAR_FALLBACK;
            }}
          />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-rose-50 border border-white flex items-center justify-center text-rose-600 shadow-xs">
            <UserMinus className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Title & Description */}
        <h3 className="text-base font-bold text-gray-900 mb-1.5">
          {t('profile.unfollowConfirmTitle', { username: user.username, defaultValue: `Hủy theo dõi @${user.username}?` })}
        </h3>
        <p className="text-xs text-gray-500 leading-relaxed mb-6">
          {t('profile.unfollowConfirmDesc', {
            defaultValue: 'Họ sẽ không nhận được thông báo rằng bạn đã hủy theo dõi họ. Bạn sẽ không còn thấy bài viết của họ trên bảng tin.',
          })}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-2xl shadow-sm transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed hover:shadow-rose-200 hover:shadow-md"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t('profile.loadingMore', { defaultValue: 'Đang xử lý...' })}</span>
              </>
            ) : (
              <span>{t('profile.unfollowConfirmBtn', { defaultValue: 'Hủy theo dõi' })}</span>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-2xl transition-colors cursor-pointer disabled:opacity-50"
          >
            {t('profile.cancel', { defaultValue: 'Hủy' })}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnfollowConfirmModal;
