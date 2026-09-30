import React from 'react';
import { Link } from 'react-router-dom';
import { Users, TrendingUp, Calendar } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { getProfileUrl } from '../../utils/user';

interface SuggestionItem {
  id: number;
  name: string;
  username: string;
  avatar: string;
}

interface TrendItem {
  rank: number;
  category: string;
  hashtag: string;
  count: string;
}

interface EventItem {
  id: number;
  title: string;
  type: string;
  time: string;
  location: string;
  image: string;
}

const RightSidebar: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();

  const suggestions: SuggestionItem[] = [];
  const trends: TrendItem[] = [];
  const events: EventItem[] = [];

  return (
    <div className="flex flex-col gap-4">
      {/* 1. Friend Suggestions Card */}
      <section className="bg-white dark:bg-[#121212] rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-[#262626] transition-colors duration-200">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-bold text-gray-900 dark:text-[#F5F5F5] text-sm">{t('rightSidebar.suggestions')}</h4>
          {suggestions.length > 0 && (
            <button className="text-xs font-semibold text-[#004AC6] dark:text-[#0095F6] hover:underline cursor-pointer">
              {t('rightSidebar.seeAll')}
            </button>
          )}
        </div>
        {suggestions.length > 0 ? (
          <div className="flex flex-col gap-4">
            {suggestions.map((user) => (
              <div key={user.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Link to={getProfileUrl(user)} className="flex-shrink-0 hover:opacity-90 transition cursor-pointer">
                    <img
                      alt={user.name}
                      className="w-10 h-10 rounded-full object-cover border border-gray-100 dark:border-[#363636]"
                      src={user.avatar}
                    />
                  </Link>
                  <div className="leading-tight">
                    <Link
                      to={getProfileUrl(user)}
                      className="text-xs font-bold text-gray-900 dark:text-[#F5F5F5] hover:underline hover:text-[#004AC6] dark:hover:text-[#0095F6] transition-colors cursor-pointer block"
                    >
                      {user.name}
                    </Link>
                    <Link
                      to={getProfileUrl(user)}
                      className="text-[11px] text-gray-400 dark:text-[#A8A8A8] hover:underline hover:text-[#004AC6] dark:hover:text-[#0095F6] transition-colors cursor-pointer block"
                    >
                      @{user.username}
                    </Link>
                  </div>
                </div>
                <button className="text-xs font-semibold px-4 py-1.5 rounded-full bg-[#EFF6FF] dark:bg-blue-950/60 text-[#003A9F] dark:text-[#0095F6] hover:bg-blue-100 dark:hover:bg-blue-900/60 transition cursor-pointer">
                  {t('rightSidebar.follow')}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-gray-400 dark:text-[#737373]">
            <Users className="w-7 h-7 mx-auto mb-2 text-gray-300 dark:text-[#525252] stroke-[1.5]" />
            <p className="text-xs text-gray-400 dark:text-[#737373] italic">{t('rightSidebar.noSuggestions')}</p>
          </div>
        )}
      </section>

      {/* 2. Trending Hashtags Card */}
      <section className="bg-white dark:bg-[#121212] rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-[#262626] transition-colors duration-200">
        <h4 className="font-bold text-gray-900 dark:text-[#F5F5F5] text-sm mb-3">{t('rightSidebar.trending')}</h4>
        {trends.length > 0 ? (
          <div className="flex flex-col gap-3.5">
            {trends.map((trend) => (
              <div key={trend.rank} className="flex items-start gap-3">
                <span className="text-sm font-bold text-[#004AC6] dark:text-[#0095F6]">{trend.rank}</span>
                <div className="leading-snug">
                  <p className="text-[11px] text-gray-400 dark:text-[#A8A8A8]">{trend.category}</p>
                  <p className="text-xs font-bold text-gray-900 dark:text-[#F5F5F5] hover:text-[#004AC6] dark:hover:text-[#0095F6] cursor-pointer transition">
                    {trend.hashtag}
                  </p>
                  <p className="text-[11px] text-gray-400 dark:text-[#A8A8A8]">{trend.count}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-gray-400 dark:text-[#737373]">
            <TrendingUp className="w-7 h-7 mx-auto mb-2 text-gray-300 dark:text-[#525252] stroke-[1.5]" />
            <p className="text-xs text-gray-400 dark:text-[#737373] italic">{t('rightSidebar.noTrending')}</p>
          </div>
        )}
      </section>

      {/* 3. Upcoming Events Card */}
      <section className="bg-white dark:bg-[#121212] rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-[#262626] transition-colors duration-200">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-bold text-gray-900 dark:text-[#F5F5F5] text-sm">{t('rightSidebar.upcomingEvents')}</h4>
          {events.length > 0 && (
            <button className="text-xs font-semibold text-[#004AC6] dark:text-[#0095F6] hover:underline cursor-pointer">
              {t('rightSidebar.seeAll')}
            </button>
          )}
        </div>
        {events.length > 0 ? (
          <div className="flex flex-col gap-4">
            {events.map((event) => (
              <div key={event.id} className="flex items-start gap-3 cursor-pointer group">
                <img
                  alt={event.title}
                  className="w-11 h-11 rounded-xl object-cover flex-shrink-0"
                  src={event.image}
                />
                <div className="leading-tight">
                  <h5 className="text-xs font-bold text-gray-900 dark:text-[#F5F5F5] group-hover:text-[#004AC6] dark:group-hover:text-[#0095F6] transition">
                    {event.title}
                  </h5>
                  <p className="text-[11px] text-gray-400 dark:text-[#A8A8A8] mt-0.5">{event.type}</p>
                  <p className="text-[11px] text-gray-500 dark:text-[#A8A8A8] mt-0.5">{event.time}</p>
                  <p className="text-[11px] text-gray-400 dark:text-[#A8A8A8]">{event.location}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-gray-400 dark:text-[#737373]">
            <Calendar className="w-7 h-7 mx-auto mb-2 text-gray-300 dark:text-[#525252] stroke-[1.5]" />
            <p className="text-xs text-gray-400 dark:text-[#737373] italic">{t('rightSidebar.noUpcomingEvents')}</p>
          </div>
        )}
      </section>

      {/* 4. Footer Info */}
      <footer className="px-2 text-xs text-gray-400 dark:text-[#737373] leading-relaxed">
        <div className="flex flex-wrap gap-x-2 gap-y-1 mb-1">
          <Link to="/terms" className="hover:underline hover:text-gray-600 dark:hover:text-[#F5F5F5]">
            {language === 'vi' ? 'Điều khoản' : 'Terms'}
          </Link>
          <span>·</span>
          <Link to="/privacy" className="hover:underline hover:text-gray-600 dark:hover:text-[#F5F5F5]">
            {language === 'vi' ? 'Quyền riêng tư' : 'Privacy'}
          </Link>
          <span>·</span>
          <Link to="/help" className="hover:underline hover:text-gray-600 dark:hover:text-[#F5F5F5]">
            {language === 'vi' ? 'Trợ giúp' : 'Help'}
          </Link>
          <span>·</span>
          <button
            onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
            className="hover:underline text-[#004AC6] dark:text-[#0095F6] font-medium cursor-pointer"
          >
            {language === 'vi' ? 'English' : 'Tiếng Việt'}
          </button>
        </div>
        <p>© 2026 Mo3Studio.</p>
      </footer>
    </div>
  );
};

export default RightSidebar;
