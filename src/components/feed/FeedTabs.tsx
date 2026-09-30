import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import clsx from 'clsx';

export type FeedTabId = 'for-you' | 'following';

interface FeedTabsProps {
  activeTab: FeedTabId;
  onTabChange: (tab: FeedTabId) => void;
}

const FeedTabs: React.FC<FeedTabsProps> = ({
  activeTab,
  onTabChange,
}) => {
  const { t } = useLanguage();

  const tabs: { id: FeedTabId; label: string }[] = [
    { id: 'for-you', label: t('feed.tabForYou') },
    { id: 'following', label: t('feed.tabFollowing') },
  ];

  return (
    <section 
      aria-label="Feed Tabs"
      className="sticky top-16 md:top-20 z-20 bg-white/90 dark:bg-[#121212]/90 backdrop-blur-md rounded-3xl p-1.5 shadow-xs border border-gray-100 dark:border-[#262626] transition-colors duration-200"
    >
      <div role="tablist" className="grid grid-cols-2 w-full max-w-md mx-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onTabChange(tab.id)}
              className={clsx(
                'relative py-2.5 text-center text-sm font-semibold transition-all cursor-pointer select-none flex items-center justify-center rounded-2xl',
                isActive
                  ? 'text-[#004AC6] dark:text-[#0095F6]'
                  : 'text-gray-500 dark:text-[#A8A8A8] hover:text-gray-900 dark:hover:text-[#F5F5F5] hover:bg-gray-50 dark:hover:bg-[#1A1A1A]'
              )}
            >
              <span>{tab.label}</span>
              {isActive && (
                <div className="absolute bottom-1 w-12 h-1 bg-[#004AC6] dark:bg-[#0095F6] rounded-full transition-all"></div>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default FeedTabs;
