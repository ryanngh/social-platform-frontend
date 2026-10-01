export interface TrendingHashtag {
  id: string;
  tag: string;
  postCount: number;
  formattedCount: string;
}

export interface MutualFollowerSummary {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}

export interface SuggestedUser {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  bio: string | null;
  mutualFollowersCount: number;
  mutualFollowers: MutualFollowerSummary[];
  reason: string;
  followerCount: number;
}
