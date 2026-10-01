import React from 'react';
import {
  SuggestedUsersCard,
  TrendingTopicsCard,
  SidebarFooter,
} from '../sidebar';

export interface ProfileRightSidebarProps {
  suggestedLimit?: number;
  trendingLimit?: number;
  className?: string;
}

export const ProfileRightSidebar: React.FC<ProfileRightSidebarProps> = ({
  suggestedLimit = 5,
  trendingLimit = 5,
  className,
}) => {
  return (
    <aside
      className={
        className ||
        'hidden lg:block w-[338px] flex-shrink-0 sticky top-20 self-start max-h-[calc(100vh-6rem)] overflow-y-auto custom-scrollbar space-y-4'
      }
      data-purpose="right-sidebar"
    >
      {/* 1. Friend Suggestions Card (Who to Follow) */}
      <SuggestedUsersCard limit={suggestedLimit} />

      {/* 2. Trending Hashtags Card */}
      <TrendingTopicsCard limit={trendingLimit} />

      {/* 3. Footer Info */}
      <SidebarFooter />
    </aside>
  );
};

export default ProfileRightSidebar;
