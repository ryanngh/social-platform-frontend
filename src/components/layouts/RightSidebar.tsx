import React from 'react';
import {
  SuggestedUsersCard,
  TrendingTopicsCard,
  SidebarFooter,
  SuggestedUserItem,
  TrendingTopicItem,
} from '../sidebar';
import type {
  SuggestedUsersCardProps,
  TrendingTopicsCardProps,
  SidebarFooterProps,
  SuggestedUserItemProps,
  TrendingTopicItemProps,
} from '../sidebar';

export {
  SuggestedUsersCard,
  TrendingTopicsCard,
  SidebarFooter,
  SuggestedUserItem,
  TrendingTopicItem,
};

export type {
  SuggestedUsersCardProps,
  TrendingTopicsCardProps,
  SidebarFooterProps,
  SuggestedUserItemProps,
  TrendingTopicItemProps,
};

export interface RightSidebarProps {
  className?: string;
  suggestedLimit?: number;
  trendingLimit?: number;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  className,
  suggestedLimit = 5,
  trendingLimit = 5,
}) => {
  return (
    <div className={className || 'flex flex-col gap-4'}>
      {/* 1. Friend Suggestions Card (Who to Follow) */}
      <SuggestedUsersCard limit={suggestedLimit} />

      {/* 2. Trending Hashtags Card */}
      <TrendingTopicsCard limit={trendingLimit} />

      {/* 3. Footer Info */}
      <SidebarFooter />
    </div>
  );
};

export default RightSidebar;
