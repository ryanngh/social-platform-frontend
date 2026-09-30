import React from 'react';
import { Bookmark } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface BookmarkItem {
  id: string | number;
  title: string;
  subtitle: string;
}

export const ProfileBookmarksCard: React.FC<{ bookmarks?: BookmarkItem[] }> = ({ bookmarks = [] }) => {
  const { t } = useLanguage();

  return (
    <section aria-labelledby="bookmarks-heading" className="bg-white dark:bg-[#121212] border border-gray-100 dark:border-[#262626] rounded-3xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3.5">
        <Bookmark className="w-4 h-4 text-[#004AC6] dark:text-[#0095F6] fill-[#004AC6] dark:fill-blue-400" />
        <h2 id="bookmarks-heading" className="text-xs font-bold text-gray-400 dark:text-[#737373] uppercase tracking-wider">
          {t('profile.savedItems')}
        </h2>
      </div>

      {bookmarks.length > 0 ? (
        <div className="space-y-2.5">
          {bookmarks.map((b) => (
            <div key={b.id} className="flex items-start gap-2.5 group cursor-pointer p-1.5 -mx-1.5 rounded-xl hover:bg-gray-50 dark:hover:bg-[#1A1A1A] transition">
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center shrink-0 mt-0.5 text-[#004AC6] dark:text-[#0095F6] group-hover:bg-blue-100 dark:group-hover:bg-blue-900/60 transition">
                <Bookmark className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-800 dark:text-[#E5E5E5] leading-snug group-hover:text-[#004AC6] dark:group-hover:text-[#0095F6] transition truncate">
                  {b.title}
                </p>
                <p className="text-[11px] text-gray-400 dark:text-[#A8A8A8] truncate">{b.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-400 dark:text-[#737373] italic py-1">{t('profile.noBookmarks')}</p>
      )}
    </section>
  );
};

export default ProfileBookmarksCard;
