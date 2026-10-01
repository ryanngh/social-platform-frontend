import React from 'react';

export const ExploreSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 gap-3.5">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="rounded-3xl overflow-hidden bg-gray-200/80 dark:bg-[#1A1A1A] border border-gray-100 dark:border-[#262626] aspect-square animate-pulse relative p-4 flex flex-col justify-between"
        >
          {/* Badge placeholder */}
          <div className="flex justify-end">
            <div className="w-14 h-5 rounded-full bg-gray-300 dark:bg-[#2A2A2A]" />
          </div>

          {/* Bottom author and caption placeholder */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-[#2A2A2A]" />
              <div className="w-24 h-3 rounded bg-gray-300 dark:bg-[#2A2A2A]" />
            </div>
            <div className="w-3/4 h-3 rounded bg-gray-300 dark:bg-[#2A2A2A]" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default ExploreSkeleton;
