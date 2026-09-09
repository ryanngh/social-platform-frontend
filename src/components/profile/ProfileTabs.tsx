import { Edit3, Plus, Zap, Lock, UserPlus } from 'lucide-react';
import type { User } from '../../types';

interface ProfileTabsProps {
  activeTab: string;
  user: User;
  isOwnProfile: boolean;
  isPrivate?: boolean;
}

export const ProfileTabs = ({ activeTab, user, isOwnProfile, isPrivate = false }: ProfileTabsProps) => {
  const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username || 'User';

  if (activeTab === 'Posts') {
    // 1. Private Account State
    if (isPrivate && !isOwnProfile) {
      return (
        <div className="bg-white border border-[#E2E2EC] rounded-xl p-8 sm:p-12 shadow-card text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-[#EDEDF8] border border-[#E2E2EC] flex items-center justify-center text-[#1A1C1E] mb-4 shadow-sm">
            <Lock className="w-8 h-8 text-[#535F70]" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-[#1A1C1E] mb-2">
            Đây là tài khoản riêng tư
          </h3>
          <p className="text-xs sm:text-sm text-[#535F70] max-w-md leading-relaxed mb-6">
            Hãy theo dõi {displayName} để xem ảnh, bài viết và các hoạt động chia sẻ trên trang cá nhân.
          </p>
          <button
            className="px-6 py-2.5 bg-[#004AC6] hover:bg-[#003A9F] text-white text-xs sm:text-sm font-semibold rounded-full transition shadow flex items-center gap-2 cursor-pointer"
            type="button"
          >
            <UserPlus className="w-4 h-4" />
            <span>Gửi yêu cầu theo dõi</span>
          </button>
        </div>
      );
    }

    // 2. Empty Posts State (matches rysocial_profile_empty_posts_state)
    return (
      <div className="bg-white border border-[#E2E2EC] rounded-xl p-8 sm:p-12 text-center shadow-card flex flex-col items-center justify-center">
        <div className="w-20 h-20 rounded-full bg-[#EFF4FF] border border-[#d6e0f1] flex items-center justify-center text-[#004AC6] mb-4 shadow-sm">
          <Edit3 className="w-10 h-10 text-[#004AC6]" />
        </div>
        <h3 className="text-lg font-bold text-[#1A1C1E] mb-2">Chưa có bài viết nào</h3>
        <p className="text-xs sm:text-sm text-[#535F70] max-w-[420px] leading-relaxed mb-6">
          {displayName} chưa đăng bài viết nào trên trang cá nhân. Hãy theo dõi hoặc quay lại sau để cập nhật những chia sẻ mới nhất!
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {isOwnProfile && (
            <button
              className="bg-[#004AC6] hover:bg-[#002970] text-white text-xs font-semibold px-5 py-2.5 rounded-full transition shadow-sm flex items-center gap-1.5 cursor-pointer"
              type="button"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo bài viết mới</span>
            </button>
          )}
          <button
            className="bg-[#EDEDF8] hover:bg-slate-200 text-[#1A1C1E] text-xs font-semibold px-5 py-2.5 rounded-full transition flex items-center gap-1.5 cursor-pointer"
            type="button"
          >
            <Zap className="w-4 h-4 text-[#535F70]" />
            <span>Khám phá các bài viết thịnh hành</span>
          </button>
        </div>
      </div>
    );
  }

  // Other Tabs (Replies, Reposts, Media, Likes)
  return (
    <div className="bg-white border border-[#E2E2EC] rounded-xl p-8 text-center shadow-card flex flex-col items-center justify-center">
      <h3 className="text-sm font-semibold text-[#1A1C1E] mb-1">Mục {activeTab} trống</h3>
      <p className="text-xs text-[#535F70]">Chưa có nội dung nào trong phần này.</p>
    </div>
  );
};

export default ProfileTabs;
