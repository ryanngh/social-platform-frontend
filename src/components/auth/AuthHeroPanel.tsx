import React from 'react';
import { Users, MessageCircle, Compass, Heart, Share2, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface AuthHeroPanelProps {
  mode: 'signin' | 'signup';
}

export const AuthHeroPanel: React.FC<AuthHeroPanelProps> = ({ mode }) => {
  const { language } = useLanguage();
  const isVi = language === 'vi';

  return (
    <div className="hidden lg:flex lg:w-5/12 bg-[#F8FAFC] dark:bg-[#0A0E17] p-8 lg:p-12 flex-col justify-between border-b lg:border-b-0 lg:border-r border-gray-100 dark:border-[#1F2937]/80 transition-colors">
      <div>
        {/* Brand Headline */}
        <div className="space-y-3 mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-[#F5F5F5] leading-tight tracking-tight">
            {mode === 'signup'
              ? (isVi ? 'Tham gia RySocial ngay hôm nay! 🚀' : 'Join RySocial today! 🚀')
              : (isVi ? 'Chào mừng bạn trở lại! 👋' : 'Welcome back to RySocial! 👋')}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-[#94A3B8] leading-relaxed">
            {mode === 'signup'
              ? (isVi
                  ? 'Tạo tài khoản miễn phí để kết nối bạn bè, chia sẻ khoảnh khắc và khám phá cộng đồng.'
                  : 'Create a free account to connect with friends, share moments, and explore communities.')
              : (isVi
                  ? 'Đăng nhập để cập nhật tin tức mới nhất từ bạn bè và các cộng đồng bạn quan tâm.'
                  : 'Sign in to catch up with friends and explore trending topics in your community.')}
          </p>
        </div>

        {/* Premium Vector Illustration Card */}
        <div className="w-full h-[220px] rounded-2xl bg-gradient-to-br from-[#EFF6FF] via-[#E0E7FF]/50 to-[#DBEAFE] dark:from-[#111827] dark:via-[#1E293B] dark:to-[#0F172A] border border-blue-100/80 dark:border-[#1E293B] p-6 mb-7 relative overflow-hidden flex items-center justify-center shadow-xs">
          {/* Ambient Glows */}
          <div className="absolute -top-10 -right-10 w-36 h-36 bg-blue-400/20 dark:bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-indigo-400/20 dark:bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Social Network Graphic Elements */}
          <div className="relative z-10 w-full max-w-[280px] flex flex-col items-center">
            {/* Main Interactive Floating Card */}
            <div className="w-full bg-white/90 dark:bg-[#1A2234]/90 backdrop-blur-md rounded-2xl border border-white/60 dark:border-white/10 p-3.5 shadow-md shadow-blue-500/5">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src="/logo.svg"
                    alt="RySocial"
                    className="w-10 h-10 rounded-full object-contain p-0.5 bg-white dark:bg-[#0F172A] border border-blue-100 dark:border-blue-900/40 shadow-xs"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-gray-900 dark:text-[#F5F5F5] truncate">RySocial Community</span>
                    <ShieldCheck className="w-3.5 h-3.5 text-[#004AC6] dark:text-[#38BDF8] shrink-0" />
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-[#94A3B8] truncate">
                    {isVi ? 'Đang kết nối hơn 100K+ thành viên' : 'Connecting 100K+ active members'}
                  </p>
                </div>
              </div>
            </div>

            {/* Floating Floating Chips */}
            <div className="w-full flex items-center justify-between mt-3 px-1">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 dark:bg-[#1A2234]/80 backdrop-blur-sm border border-white/60 dark:border-white/10 shadow-xs text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                <Heart className="w-3.5 h-3.5 fill-current" />
                <span>12.4k Likes</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 dark:bg-[#1A2234]/80 backdrop-blur-sm border border-white/60 dark:border-white/10 shadow-xs text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                <Share2 className="w-3.5 h-3.5" />
                <span>Real-time Feed</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Bullets */}
        <div className="space-y-4">
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-[#004AC6]/15 text-[#004AC6] dark:text-[#38BDF8] flex items-center justify-center shrink-0 border border-blue-100/60 dark:border-[#004AC6]/20">
              <Users className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900 dark:text-[#F5F5F5]">
                {isVi ? 'Kết nối bạn bè' : 'Connect with people'}
              </h2>
              <p className="text-xs text-gray-500 dark:text-[#94A3B8] mt-0.5">
                {isVi ? 'Mở rộng mạng lưới và làm quen với bạn bè mới.' : 'Build your network and make new friends.'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-[#004AC6]/15 text-[#004AC6] dark:text-[#38BDF8] flex items-center justify-center shrink-0 border border-blue-100/60 dark:border-[#004AC6]/20">
              <MessageCircle className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900 dark:text-[#F5F5F5]">
                {isVi ? 'Chia sẻ ý tưởng' : 'Share your ideas'}
              </h2>
              <p className="text-xs text-gray-500 dark:text-[#94A3B8] mt-0.5">
                {isVi ? 'Đăng bài viết, hình ảnh và trò chuyện tức thì.' : 'Post updates, photos and join conversations.'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-[#004AC6]/15 text-[#004AC6] dark:text-[#38BDF8] flex items-center justify-center shrink-0 border border-blue-100/60 dark:border-[#004AC6]/20">
              <Compass className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900 dark:text-[#F5F5F5]">
                {isVi ? 'Khám phá thế giới' : 'Discover more'}
              </h2>
              <p className="text-xs text-gray-500 dark:text-[#94A3B8] mt-0.5">
                {isVi ? 'Cập nhật các chủ đề nóng và cộng đồng phong phú.' : 'Explore trending topics and vibrant communities.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Navigation Anchor */}
      <footer className="pt-8 border-t border-gray-100 dark:border-[#1F2937]/80 mt-8">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400 dark:text-[#64748B]">
          <a href="#" className="hover:text-gray-700 dark:hover:text-[#CBD5E1] transition-colors">
            {isVi ? 'Giới thiệu' : 'About'}
          </a>
          <span>·</span>
          <a href="#" className="hover:text-gray-700 dark:hover:text-[#CBD5E1] transition-colors">
            {isVi ? 'Điều khoản' : 'Terms'}
          </a>
          <span>·</span>
          <a href="#" className="hover:text-gray-700 dark:hover:text-[#CBD5E1] transition-colors">
            {isVi ? 'Quyền riêng tư' : 'Privacy'}
          </a>
          <span>·</span>
          <a href="#" className="hover:text-gray-700 dark:hover:text-[#CBD5E1] transition-colors">
            {isVi ? 'Trợ giúp' : 'Help Center'}
          </a>
        </div>
        <p className="text-[11px] text-gray-400 dark:text-[#64748B] mt-2">© 2026 RySocial Inc.</p>
      </footer>
    </div>
  );
};

export default AuthHeroPanel;
