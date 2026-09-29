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
    <aside className="hidden lg:block lg:col-span-3 space-y-4 sticky top-20 self-start max-h-[calc(100vh-6rem)] overflow-y-auto custom-scrollbar" data-purpose="right-sidebar">
      {/* Suggestions For You Card */}
      <section aria-labelledby="suggestions-heading" className="bg-white border border-[#E2E2EC] rounded-xl p-5 shadow-card">
        <h2 id="suggestions-heading" className="text-sm font-bold text-[#1A1C1E] mb-3">
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
                    <p className="text-xs font-bold text-[#1A1C1E] truncate">{item.name}</p>
                    <p className="text-[11px] text-[#535F70] truncate">{item.handle}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-gray-400">
            <Users className="w-7 h-7 mx-auto mb-2 text-gray-300 stroke-[1.5]" />
            <p className="text-xs text-gray-400 italic">{t('profile.noSuggestions')}</p>
          </div>
        )}
      </section>

      {/* Trending Hashtags Card */}
      <section aria-labelledby="trending-heading" className="bg-white border border-[#E2E2EC] rounded-xl p-5 shadow-card">
        <h2 id="trending-heading" className="text-sm font-bold text-[#1A1C1E] mb-3">
          {t('rightSidebar.trending')}
        </h2>
        {trends.length > 0 ? (
          <div className="space-y-3.5">
            {trends.map((trend) => (
              <div key={trend.tag}>
                <p className="text-[11px] text-[#535F70]">{trend.category}</p>
                <p className="text-xs font-bold text-[#1A1C1E] hover:underline cursor-pointer">
                  {trend.tag}
                </p>
                <p className="text-[11px] text-[#535F70]">{trend.count}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-gray-400">
            <TrendingUp className="w-7 h-7 mx-auto mb-2 text-gray-300 stroke-[1.5]" />
            <p className="text-xs text-gray-400 italic">{t('profile.noTrending')}</p>
          </div>
        )}
      </section>

      {/* Site Footer Meta Links */}
      <footer className="px-2 text-[11px] text-[#535F70] space-y-1.5 leading-relaxed">
        <div className="flex flex-wrap gap-x-2 gap-y-1">
          <a className="hover:underline" href="#">Terms of Service</a>
          <a className="hover:underline" href="#">Privacy Policy</a>
          <a className="hover:underline" href="#">Cookie Policy</a>
          <a className="hover:underline" href="#">Accessibility</a>
        </div>
        <p>© 2026 Mo3Studio.</p>
      </footer>
    </aside>
  );
};

export default ProfileRightSidebar;
