export const ProfileSkeleton = () => {
  return (
    <div className="space-y-4">
      {/* Post Skeleton 1 */}
      <article
        aria-label="Loading post skeleton"
        className="bg-white border border-[#E2E2EC] rounded-xl p-5 shadow-card animate-pulse"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-slate-200"></div>
            <div className="space-y-1.5">
              <div className="h-3.5 w-28 bg-slate-200 rounded"></div>
              <div className="h-2.5 w-16 bg-slate-200 rounded"></div>
            </div>
          </div>
          <div className="w-4 h-4 bg-slate-200 rounded-full"></div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="h-3.5 bg-slate-200 rounded w-11/12"></div>
          <div className="h-3.5 bg-slate-200 rounded w-full"></div>
          <div className="h-3.5 bg-slate-200 rounded w-3/4"></div>
        </div>

        {/* Media Placeholder */}
        <div className="w-full h-48 sm:h-64 bg-slate-100 rounded-xl mb-4 border border-slate-200/60 flex items-center justify-center">
          <div className="w-10 h-10 bg-slate-200 rounded-lg"></div>
        </div>

        {/* Action Buttons Skeleton */}
        <div className="flex items-center justify-between pt-3 border-t border-[#E2E2EC]">
          <div className="h-3.5 w-14 bg-slate-200 rounded-full"></div>
          <div className="h-3.5 w-14 bg-slate-200 rounded-full"></div>
          <div className="h-3.5 w-14 bg-slate-200 rounded-full"></div>
          <div className="h-3.5 w-14 bg-slate-200 rounded-full"></div>
        </div>
      </article>

      {/* Post Skeleton 2 */}
      <article
        aria-label="Loading post skeleton"
        className="bg-white border border-[#E2E2EC] rounded-xl p-5 shadow-card animate-pulse"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-slate-200"></div>
            <div className="space-y-1.5">
              <div className="h-3.5 w-28 bg-slate-200 rounded"></div>
              <div className="h-2.5 w-16 bg-slate-200 rounded"></div>
            </div>
          </div>
          <div className="w-4 h-4 bg-slate-200 rounded-full"></div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="h-3.5 bg-slate-200 rounded w-full"></div>
          <div className="h-3.5 bg-slate-200 rounded w-2/3"></div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-[#E2E2EC]">
          <div className="h-3.5 w-14 bg-slate-200 rounded-full"></div>
          <div className="h-3.5 w-14 bg-slate-200 rounded-full"></div>
          <div className="h-3.5 w-14 bg-slate-200 rounded-full"></div>
        </div>
      </article>
    </div>
  );
};

export default ProfileSkeleton;
