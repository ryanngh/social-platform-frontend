import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import clsx from 'clsx';

interface FeedTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const FeedTabs: React.FC<FeedTabsProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'for-you', label: 'Dành cho bạn' },
    { id: 'following', label: 'Đang theo dõi' },
    { id: 'friends', label: 'Bạn bè' },
    { id: 'groups', label: 'Nhóm' },
  ];

  return (
    <section className="bg-white rounded-3xl px-6 sm:px-8 py-3.5 shadow-sm border border-gray-100 flex items-center justify-between">
      <div className="flex items-center gap-6 sm:gap-10 text-[15px] overflow-x-auto custom-scrollbar">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={clsx(
                'relative pb-2 pt-1 transition whitespace-nowrap cursor-pointer',
                isActive
                  ? 'font-bold text-[#004AC6]'
                  : 'font-medium text-gray-600 hover:text-gray-900'
              )}
            >
              <span>{tab.label}</span>
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#004AC6] rounded-full"></div>
              )}
            </button>
          );
        })}
      </div>

      {/* Filter / Tuning Icon */}
      <button 
        className="text-gray-800 hover:text-gray-600 transition p-1 cursor-pointer shrink-0 ml-2" 
        title="Bộ lọc"
      >
        <SlidersHorizontal className="w-5 h-5 text-gray-800" />
      </button>
    </section>
  );
};

export default FeedTabs;
