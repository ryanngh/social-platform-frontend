import React from 'react';
import type { ExplorePost } from '../../types';
import { ExploreCard } from './ExploreCard';

interface ExploreGridProps {
  posts: ExplorePost[];
  onSelect: (post: ExplorePost) => void;
  onToggleLike?: (postId: string, isLiked: boolean, likesCount: number) => void;
  onToggleSave?: (postId: string, isSaved: boolean) => void;
}

export const ExploreGrid: React.FC<ExploreGridProps> = ({
  posts,
  onSelect,
  onToggleLike,
  onToggleSave,
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 gap-3.5">
      {posts.map((post) => (
        <ExploreCard
          key={post.id}
          post={post}
          onSelect={onSelect}
          onToggleLike={onToggleLike}
          onToggleSave={onToggleSave}
        />
      ))}
    </div>
  );
};

export default ExploreGrid;
