import { useEffect } from 'react';
import { ShieldAlert, Loader2, X, UserMinus, EyeOff, Sparkles } from 'lucide-react';
import type { User } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { getAvatarUrl, DEFAULT_AVATAR_FALLBACK } from '../../utils/media';

interface BlockUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  user: User;
  isLoading?: boolean;
}

export const BlockUserModal = ({
  isOpen,
  onClose,
  onConfirm,
  user,
  isLoading = false,
}: BlockUserModalProps) => {
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
        className="bg-white dark:bg-[#121212] rounded-3xl shadow-2xl border border-gray-100 dark:border-[#262626] w-full max-w-md overflow-hidden flex flex-col p-6 animate-in zoom-in-95 duration-150 relative text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 text-gray-400 dark:text-[#A8A8A8] hover:text-gray-600 dark:hover:text-[#F5F5F5] p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-[#262626] transition cursor-pointer disabled:opacity-50"
          title={t('profile.cancel', { defaultValue: 'Hủy' })}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header with Danger Icon and User Avatar */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-shrink-0">
            <img
              src={getAvatarUrl(user.avatarUrl)}
              alt={displayName}
              className="w-12 h-12 rounded-full object-cover border border-gray-200 dark:border-[#363636] shadow-xs"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = DEFAULT_AVATAR_FALLBACK;
              }}
            />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-rose-50 dark:bg-rose-950/80 border border-white dark:border-[#121212] flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-xs">
              <ShieldAlert className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-gray-900 dark:text-[#F5F5F5] leading-snug">
              {t('profile.blockConfirmTitle', { username: user.username, defaultValue: `Chặn @${user.username}?` })}
            </h3>
            <p className="text-xs text-gray-400 dark:text-[#A8A8A8] truncate">{displayName}</p>
          </div>
        </div>

        {/* Warning Bullet Points */}
        <div className="bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 rounded-2xl p-3.5 mb-5 space-y-2.5 text-xs text-gray-700 dark:text-[#D4D4D4]">
          <div className="flex items-start gap-2.5">
            <EyeOff className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
            <span>Họ sẽ không thể tìm thấy trang cá nhân, bài viết hoặc nhắn tin cho bạn.</span>
          </div>
          <div className="flex items-start gap-2.5">
            <UserMinus className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
            <span>Hệ thống sẽ tự động hủy theo dõi cả hai chiều nếu đang theo dõi nhau.</span>
          </div>
          <div className="flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
            <span>Xóa sạch quan hệ bạn thân giữa cả hai bên để đảm bảo tính riêng tư.</span>
          </div>
        </div>

        <p className="text-[11px] text-gray-400 dark:text-[#737373] mb-6 italic text-center">
          Họ sẽ không được thông báo rằng bạn đã chặn họ.
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="py-2.5 px-4 bg-gray-100 dark:bg-[#1A1A1A] hover:bg-gray-200 dark:hover:bg-[#363636] text-gray-700 dark:text-[#E5E5E5] font-semibold text-xs rounded-2xl transition-colors cursor-pointer disabled:opacity-50"
          >
            {t('profile.cancel', { defaultValue: 'Hủy' })}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="py-2.5 px-5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-2xl shadow-sm transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed hover:shadow-rose-900/30 hover:shadow-md"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t('profile.loadingMore', { defaultValue: 'Đang xử lý...' })}</span>
              </>
            ) : (
              <span>{t('profile.blockConfirmBtn', { defaultValue: 'Chặn' })}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BlockUserModal;
