import { Users, TrendingUp } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface SuggestionItem {
  id: number;
  name: string;
  handle: string;
  avatar: string;
}

interface TrendItem {
  category: string;
  tag: string;
  count: string;
}

export const ProfileRightSidebar = () => {
  const { t } = useLanguage();

  const suggestions: SuggestionItem[] = [];
  const trends: TrendItem[] = [];

  return (
    <aside
      className="hidden lg:block w-[338px] flex-shrink-0 sticky top-20 self-start max-h-[calc(100vh-6rem)] overflow-y-auto custom-scrollbar space-y-4"
      data-purpose="right-sidebar"
    >
      {/* Suggestions For You Card */}
      <section aria-labelledby="suggestions-heading" className="bg-white dark:bg-[#121212] border border-gray-100 dark:border-[#262626] rounded-3xl p-5 shadow-sm">
        <h2 id="suggestions-heading" className="text-sm font-bold text-gray-900 dark:text-[#F5F5F5] mb-3">
          {t('rightSidebar.suggestions')}
        </h2>
        {suggestions.length > 0 ? (
          <div className="space-y-4">
            {suggestions.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    alt={item.name}
                    className="w-9 h-9 rounded-full object-cover shrink-0"
                    src={item.avatar}
                  />
                  <div className="truncate">
                    <p className="text-xs font-bold text-gray-900 dark:text-[#F5F5F5] truncate">{item.name}</p>
                    <p className="text-[11px] text-gray-500 dark:text-[#A8A8A8] truncate">{item.handle}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-gray-400 dark:text-[#737373]">
            <Users className="w-7 h-7 mx-auto mb-2 text-gray-300 dark:text-[#525252] stroke-[1.5]" />
            <p className="text-xs text-gray-400 dark:text-[#737373] italic">{t('profile.noSuggestions')}</p>
          </div>
        )}
      </section>

      {/* Trending Hashtags Card */}
      <section aria-labelledby="trending-heading" className="bg-white dark:bg-[#121212] border border-gray-100 dark:border-[#262626] rounded-3xl p-5 shadow-sm">
        <h2 id="trending-heading" className="text-sm font-bold text-gray-900 dark:text-[#F5F5F5] mb-3">
          {t('rightSidebar.trending')}
        </h2>
        {trends.length > 0 ? (
          <div className="space-y-3.5">
            {trends.map((trend) => (
              <div key={trend.tag}>
                <p className="text-[11px] text-gray-400 dark:text-[#A8A8A8]">{trend.category}</p>
                <p className="text-xs font-bold text-gray-800 dark:text-[#E5E5E5] hover:underline cursor-pointer">
                  {trend.tag}
                </p>
                <p className="text-[11px] text-gray-400 dark:text-[#A8A8A8]">{trend.count}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-gray-400 dark:text-[#737373]">
            <TrendingUp className="w-7 h-7 mx-auto mb-2 text-gray-300 dark:text-[#525252] stroke-[1.5]" />
            <p className="text-xs text-gray-400 dark:text-[#737373] italic">{t('profile.noTrending')}</p>
          </div>
        )}
      </section>

      {/* Site Footer Meta Links */}
      <footer className="px-3 text-[11px] text-gray-400 dark:text-[#737373] space-y-1 leading-relaxed">
        <div className="flex flex-wrap gap-x-2 gap-y-1">
          <a className="hover:underline" href="#">Terms of Service</a>
          <a className="hover:underline" href="#">Privacy Policy</a>
          <a className="hover:underline" href="#">Cookie Policy</a>
          <a className="hover:underline" href="#">Accessibility</a>
        </div>
        <p>© 2026 RySocial from Mo3Studio.</p>
      </footer>
    </aside>
  );
};

export default ProfileRightSidebar;
