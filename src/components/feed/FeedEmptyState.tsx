import React from 'react';
import { Newspaper, UserPlus, Hash } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import toast from 'react-hot-toast';

interface SuggestedUser {
  name: string;
  handle: string;
  initials: string;
  bgGradient: string;
}

const FeedEmptyState: React.FC = () => {
  const { t, language } = useLanguage();

  const suggestedFollows: SuggestedUser[] = [
    {
      name: 'Maya Patel',
      handle: '@mayadesigns',
      initials: 'MP',
      bgGradient: 'from-pink-500 to-rose-600',
    },
    {
      name: 'David Chen',
      handle: '@dchen_vn',
      initials: 'DC',
      bgGradient: 'from-blue-600 to-indigo-600',
    },
    {
      name: 'Sarah Jenkins',
      handle: '@sarahcodes',
      initials: 'SJ',
      bgGradient: 'from-emerald-500 to-teal-600',
    },
  ];

  const handleFollow = (name: string) => {
    toast.success(language === 'vi' ? `Đã theo dõi ${name}` : `Followed ${name}`);
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 text-center flex flex-col items-center">
      {/* Circular Badge with Newspaper Icon */}
      <div className="w-16 h-16 rounded-full bg-[#EFF6FF] flex items-center justify-center text-[#004AC6] mb-4 shadow-sm">
        <Newspaper className="w-8 h-8 stroke-[1.75]" />
      </div>

      {/* Headline & Subtitle */}
      <h3 className="text-lg font-bold text-gray-900 mb-2">
        {t('feed.emptyFeed')}
      </h3>
      <p className="text-xs text-gray-500 max-w-[440px] leading-relaxed mb-6">
        {t('feed.emptyFeedDesc')}
      </p>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
        <button
          onClick={() => toast(language === 'vi' ? 'Đang tìm kiếm người dùng nổi bật...' : 'Searching featured creators...', { icon: '🔍' })}
          className="px-5 py-2 rounded-full bg-[#004AC6] hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>{language === 'vi' ? 'Khám phá người dùng nổi bật' : 'Discover featured creators'}</span>
        </button>
        <button
          onClick={() => toast(language === 'vi' ? 'Đang mở danh sách chủ đề thịnh hành...' : 'Opening trending topics...', { icon: '🔥' })}
          className="px-5 py-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
        >
          <Hash className="w-4 h-4 text-gray-500" />
          <span>{language === 'vi' ? 'Tìm kiếm chủ đề thịnh hành' : 'Explore trending topics'}</span>
        </button>
      </div>

      {/* Quick Suggestions Subsection */}
      <div className="w-full pt-6 border-t border-gray-100 text-left">
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-xs font-bold text-gray-800">
            {language === 'vi' ? 'Gợi ý tài khoản nên theo dõi ngay' : 'Suggested accounts to follow'}
          </span>
          <button
            onClick={() => toast(language === 'vi' ? 'Xem thêm danh sách gợi ý' : 'View more suggestions', { icon: '👥' })}
            className="text-xs font-semibold text-[#004AC6] hover:underline cursor-pointer"
          >
            {t('rightSidebar.seeAll')}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {suggestedFollows.map((user, idx) => (
            <div
              key={idx}
              className="border border-gray-100 rounded-2xl p-3 flex flex-col items-center text-center bg-gray-50/50 hover:bg-gray-50 transition"
            >
              <div
                className={`w-11 h-11 rounded-full bg-gradient-to-tr ${user.bgGradient} text-white font-bold text-xs flex items-center justify-center mb-2 border-2 border-white shadow-xs select-none`}
              >
                {user.initials}
              </div>
              <p className="text-xs font-bold text-gray-900 truncate w-full">{user.name}</p>
              <p className="text-[11px] text-gray-400 mb-3 truncate w-full">{user.handle}</p>
              <button
                onClick={() => handleFollow(user.name)}
                className="w-full py-1.5 rounded-xl bg-[#EFF6FF] hover:bg-blue-100 text-[#003A9F] text-xs font-semibold transition cursor-pointer"
              >
                {t('rightSidebar.follow')}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeedEmptyState;
