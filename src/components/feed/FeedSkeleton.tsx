import React from 'react';

const FeedSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      {/* Post 1: Image Feed Post Skeleton */}
      <article className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-200"></div>
            <div className="flex flex-col gap-1.5">
              <div className="h-3.5 w-24 bg-gray-200 rounded"></div>
              <div className="h-2.5 w-16 bg-gray-200 rounded"></div>
            </div>
          </div>
          <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
        </div>
        <div className="flex flex-col gap-2 mb-3">
          <div className="h-3.5 w-3/4 bg-gray-200 rounded"></div>
          <div className="h-3.5 w-1/2 bg-gray-200 rounded"></div>
        </div>
        <div className="w-full h-80 rounded-2xl bg-gray-200 mb-3"></div>
        <div className="h-3 w-24 bg-gray-200 rounded mb-4"></div>
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-6">
            <div className="h-4 w-10 bg-gray-200 rounded"></div>
            <div className="h-4 w-10 bg-gray-200 rounded"></div>
            <div className="h-4 w-12 bg-gray-200 rounded"></div>
            <div className="h-4 w-12 bg-gray-200 rounded"></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-gray-200 rounded"></div>
            <div className="w-4 h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </article>

      {/* Post 2: Poll Post Skeleton */}
      <article className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-200"></div>
            <div className="flex flex-col gap-1.5">
              <div className="h-3.5 w-24 bg-gray-200 rounded"></div>
              <div className="h-2.5 w-16 bg-gray-200 rounded"></div>
            </div>
          </div>
          <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
        </div>
        <div className="h-4 w-56 bg-gray-200 rounded mb-4"></div>
        <div className="flex flex-col gap-2.5 mb-3">
          <div className="h-11 rounded-2xl bg-gray-200 w-full"></div>
          <div className="h-11 rounded-2xl bg-gray-200 w-full"></div>
          <div className="h-11 rounded-2xl bg-gray-200 w-full"></div>
        </div>
        <div className="h-3 w-36 bg-gray-200 rounded mb-4"></div>
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-6">
            <div className="h-4 w-10 bg-gray-200 rounded"></div>
            <div className="h-4 w-10 bg-gray-200 rounded"></div>
            <div className="h-4 w-12 bg-gray-200 rounded"></div>
            <div className="h-4 w-12 bg-gray-200 rounded"></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-gray-200 rounded"></div>
            <div className="w-4 h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </article>
    </div>
  );
};

export default FeedSkeleton;
