import { useState } from 'react';

export const ProfileRightSidebar = () => {
  const [followingMap, setFollowingMap] = useState<Record<number, boolean>>({});

  const toggleFollow = (id: number) => {
    setFollowingMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const suggestions = [
    {
      id: 1,
      name: 'David Chen',
      handle: '@dchen_ux',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    },
    {
      id: 2,
      name: 'Sarah Jenkins',
      handle: '@sarahcodes',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    },
    {
      id: 3,
      name: 'Tech Digest',
      handle: '@techdigest',
      avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
    },
  ];

  const trends = [
    { category: 'Design · Trending', tag: '#UIDesign', count: '15.2k posts' },
    { category: 'Technology · Trending', tag: '#DesignSystem', count: '8,432 posts' },
    { category: 'Development · Trending', tag: '#WebDev', count: '24.1k posts' },
    { category: 'UX · Trending', tag: '#Accessibility', count: '5,210 posts' },
    { category: 'Tools · Trending', tag: '#FigmaTips', count: '11.8k posts' },
  ];

  return (
    <aside className="hidden lg:block lg:col-span-3 space-y-4" data-purpose="right-sidebar">
      {/* Suggestions For You Card */}
      <section aria-labelledby="suggestions-heading" className="bg-white border border-[#E2E2EC] rounded-xl p-5 shadow-card">
        <h2 id="suggestions-heading" className="text-sm font-bold text-[#1A1C1E] mb-4">
          Suggestions for you
        </h2>
        <div className="space-y-4">
          {suggestions.map((item) => {
            const isFollowing = !!followingMap[item.id];
            return (
              <div key={item.id} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    alt={item.name}
                    className="w-9 h-9 rounded-full object-cover shrink-0"
                    src={item.avatar}
                  />
                  <div className="truncate">
                    <p className="text-xs font-bold text-[#1A1C1E] truncate">{item.name}</p>
                    <p className="text-[11px] text-[#535F70] truncate">{item.handle}</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleFollow(item.id)}
                  className={`px-3.5 py-1 text-xs font-semibold rounded-full transition shrink-0 cursor-pointer ${
                    isFollowing
                      ? 'bg-[#EFF4FF] text-[#004AC6]'
                      : 'bg-[#EDEDF8] hover:bg-slate-200 text-[#1A1C1E]'
                  }`}
                  type="button"
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              </div>
            );
          })}
        </div>
        <a className="block text-xs font-semibold text-[#004AC6] hover:underline mt-4" href="#">
          Show more
        </a>
      </section>

      {/* Trending Hashtags Card */}
      <section aria-labelledby="trending-heading" className="bg-white border border-[#E2E2EC] rounded-xl p-5 shadow-card">
        <h2 id="trending-heading" className="text-sm font-bold text-[#1A1C1E] mb-4">
          Trending Hashtags
        </h2>
        <div className="space-y-3.5">
          {trends.map((trend) => (
            <div key={trend.tag}>
              <p className="text-[11px] text-[#535F70]">{trend.category}</p>
              <p className="text-xs font-bold text-[#1A1C1E] hover:underline cursor-pointer">
                {trend.tag}
              </p>
              <p className="text-[11px] text-[#535F70]">{trend.count}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Site Footer Meta Links */}
      <footer className="px-2 text-[11px] text-[#535F70] space-y-1.5 leading-relaxed">
        <div className="flex flex-wrap gap-x-2 gap-y-1">
          <a className="hover:underline" href="#">Terms of Service</a>
          <a className="hover:underline" href="#">Privacy Policy</a>
          <a className="hover:underline" href="#">Cookie Policy</a>
          <a className="hover:underline" href="#">Accessibility</a>
        </div>
        <p>© 2024 RySocial Inc.</p>
      </footer>
    </aside>
  );
};

export default ProfileRightSidebar;
