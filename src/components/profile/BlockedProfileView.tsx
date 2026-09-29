import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, UserCheck, Loader2 } from 'lucide-react';
import type { User } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';

export type BlockedViewType = 'BLOCKED_BY_ME' | 'BLOCKED_BY_THEM';

interface BlockedProfileViewProps {
  type: BlockedViewType;
  user: User;
  onUnblockClick?: () => void;
  isUnblocking?: boolean;
}

export const BlockedProfileView = ({
  type,
  user,
  onUnblockClick,
  isUnblocking = false,
}: BlockedProfileViewProps) => {
  const { t } = useLanguage();

  if (type === 'BLOCKED_BY_ME') {
    return (
      <div className="bg-white border border-[#E2E2EC] rounded-3xl p-8 sm:p-14 flex flex-col items-center justify-center text-center shadow-card animate-in fade-in duration-200 select-none">
        {/* Red Shield Icon with glowing ring */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 mb-5 shadow-xs">
          <ShieldAlert className="w-8 h-8 sm:w-10 sm:h-10" />
        </div>

        {/* Red pill badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-200/80 mb-3.5">
          <span className="w-2 h-2 rounded-full bg-rose-500"></span>
          <span>{t('profile.blockedBadge', { defaultValue: 'Đã chặn' })}</span>
        </div>

        {/* Headline */}
        <h2 className="text-xl sm:text-2xl font-bold text-[#1A1C1E] mb-2 tracking-tight">
          {t('profile.youBlockedUser', {
            username: user.username,
            defaultValue: `Bạn đã chặn @${user.username}`,
          })}
        </h2>

        {/* Description */}
        <p className="text-xs sm:text-sm text-[#535F70] max-w-md mb-7 leading-relaxed">
          {t('profile.youBlockedUserDesc', {
            defaultValue:
              'Bạn sẽ không nhìn thấy bài viết, tin nhắn hoặc hoạt động từ người này. Họ cũng không thể tìm thấy trang cá nhân của bạn.',
          })}
        </p>

        {/* Action Button: Bỏ chặn */}
        <button
          type="button"
          onClick={onUnblockClick}
          disabled={isUnblocking}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#004AC6] hover:bg-[#003da3] text-white font-semibold text-xs sm:text-sm shadow-sm transition-all duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed hover:shadow-blue-200 hover:shadow-md"
        >
          {isUnblocking ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{t('profile.loadingMore', { defaultValue: 'Đang xử lý...' })}</span>
            </>
          ) : (
            <>
              <UserCheck className="w-4 h-4" />
              <span>{t('profile.unblock', { defaultValue: 'Bỏ chặn' })}</span>
            </>
          )}
        </button>
      </div>
    );
  }

  // BLOCKED_BY_THEM (Instagram style)
  return (
    <div className="bg-white border border-[#E2E2EC] rounded-3xl p-8 sm:p-14 flex flex-col items-center justify-center text-center shadow-card animate-in fade-in duration-200 select-none">
      <h2 className="text-xl sm:text-2xl font-bold text-[#1A1C1E] mb-3 tracking-tight">
        {t('profile.pageUnavailableTitle', { defaultValue: "Rất tiếc, trang này hiện không khả dụng." })}
      </h2>

      <p className="text-sm text-[#535F70] max-w-md mb-8 leading-relaxed">
        {t('profile.pageUnavailableDesc', { defaultValue: "Liên kết bạn theo dõi có thể bị hỏng hoặc trang này có thể đã bị gỡ." })}{' '}
        <Link
          to="/feed"
          className="text-[#004AC6] hover:underline font-semibold cursor-pointer"
        >
          {t('profile.goBackToApp', { defaultValue: "Quay lại RySocial." })}
        </Link>
      </p>

      {/* Action Button: Quay lại bảng tin */}
      <Link
        to="/feed"
        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#004AC6] hover:bg-[#003da3] text-white font-semibold text-xs sm:text-sm shadow-sm transition-all duration-150 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{t('profile.returnToFeed', { defaultValue: 'Quay lại Bảng tin' })}</span>
      </Link>
    </div>
  );
};

export default BlockedProfileView;
