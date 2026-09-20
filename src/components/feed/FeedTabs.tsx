import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import clsx from 'clsx';

interface FeedTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const FeedTabs: React.FC<FeedTabsProps> = ({ activeTab, onTabChange }) => {
  const { t } = useLanguage();

  const tabs = [
    { id: 'for-you', label: t('feed.tabForYou') },
    { id: 'following', label: t('feed.tabFollowing') },
  ];

  return (
    <section className="sticky top-20 z-20 bg-white/95 backdrop-blur-md rounded-3xl px-4 py-2 shadow-sm border border-gray-100 flex items-center justify-center">
      <div className="grid grid-cols-2 w-full max-w-md mx-auto text-[15px]">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={clsx(
                'relative py-2 text-center transition cursor-pointer flex flex-col items-center justify-center',
                isActive
                  ? 'font-bold text-[#004AC6]'
                  : 'font-medium text-gray-500 hover:text-gray-900'
              )}
            >
              <span>{tab.label}</span>
              {isActive && (
                <div className="absolute bottom-0 w-16 h-1 bg-[#004AC6] rounded-full"></div>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default FeedTabs;
