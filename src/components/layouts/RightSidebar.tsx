import React from 'react';
import { Link } from 'react-router-dom';

const RightSidebar: React.FC = () => {
  const suggestions = [
    {
      id: 1,
      name: 'David Chen',
      username: 'dchen_vn',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    },
    {
      id: 2,
      name: 'Sarah Jenkins',
      username: 'sarahcodes',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    },
    {
      id: 3,
      name: 'Tech Digest',
      username: 'techdigest',
      avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
    },
  ];

  const trends = [
    {
      rank: 1,
      category: 'Thiết kế · Thịnh hành',
      hashtag: '#UIDesign',
      count: '15.2K bài viết',
    },
    {
      rank: 2,
      category: 'Công nghệ · Thịnh hành',
      hashtag: '#DesignSystem',
      count: '8,432 bài viết',
    },
    {
      rank: 3,
      category: 'Lập trình · Thịnh hành',
      hashtag: '#WebDev',
      count: '24.1K bài viết',
    },
  ];

  const events = [
    {
      id: 1,
      title: 'Design Systems Meetup',
      type: 'Hội thảo · Offline',
      time: '18 Tháng 6, 2024 - 9:00 AM',
      location: 'San Francisco, CA',
      image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=150&auto=format&fit=crop&q=80',
    },
    {
      id: 2,
      title: 'UI/UX Workshop',
      type: 'Workshop · Online',
      time: '20 Tháng 6, 2024 - 2:00 PM',
      location: 'Online',
      image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=150&auto=format&fit=crop&q=80',
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* 1. Friend Suggestions Card */}
      <section className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-bold text-gray-900 text-sm">Gợi ý cho bạn</h4>
          <button className="text-xs font-semibold text-[#004AC6] hover:underline">
            Xem tất cả
          </button>
        </div>
        <div className="flex flex-col gap-4">
          {suggestions.map((user) => (
            <div key={user.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  alt={user.name}
                  className="w-10 h-10 rounded-full object-cover border border-gray-100"
                  src={user.avatar}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80";
                  }}
                />
                <div className="leading-tight">
                  <p className="text-xs font-bold text-gray-900">{user.name}</p>
                  <p className="text-[11px] text-gray-400">@{user.username}</p>
                </div>
              </div>
              <button className="text-xs font-semibold px-4 py-1.5 rounded-full bg-[#EFF6FF] text-[#003A9F] hover:bg-blue-100 transition">
                Theo dõi
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Trending Hashtags Card */}
      <section className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
        <h4 className="font-bold text-gray-900 text-sm mb-4">Thịnh hành hôm nay</h4>
        <div className="flex flex-col gap-3.5">
          {trends.map((trend) => (
            <div key={trend.rank} className="flex items-start gap-3">
              <span className="text-sm font-bold text-[#004AC6]">{trend.rank}</span>
              <div className="leading-snug">
                <p className="text-[11px] text-gray-400">{trend.category}</p>
                <p className="text-xs font-bold text-gray-900 hover:text-[#004AC6] cursor-pointer transition">
                  {trend.hashtag}
                </p>
                <p className="text-[11px] text-gray-400">{trend.count}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Upcoming Events Card */}
      <section className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-bold text-gray-900 text-sm">Sự kiện sắp diễn ra</h4>
          <button className="text-xs font-semibold text-[#004AC6] hover:underline">
            Xem tất cả
          </button>
        </div>
        <div className="flex flex-col gap-4">
          {events.map((event) => (
            <div key={event.id} className="flex items-start gap-3 cursor-pointer group">
              <img
                alt={event.title}
                className="w-11 h-11 rounded-xl object-cover flex-shrink-0"
                src={event.image}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=150&auto=format&fit=crop&q=80";
                }}
              />
              <div className="leading-tight">
                <h5 className="text-xs font-bold text-gray-900 group-hover:text-[#004AC6] transition">
                  {event.title}
                </h5>
                <p className="text-[11px] text-gray-400 mt-0.5">{event.type}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">{event.time}</p>
                <p className="text-[11px] text-gray-400">{event.location}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Footer Info */}
      <footer className="px-2 text-[11px] text-gray-400 leading-relaxed">
        <div className="flex flex-wrap gap-x-2 gap-y-1 mb-1">
          <Link to="/terms" className="hover:underline">Điều khoản</Link>
          <span>·</span>
          <Link to="/privacy" className="hover:underline">Quyền riêng tư</Link>
          <span>·</span>
          <Link to="/help" className="hover:underline">Trợ giúp</Link>
          <span>·</span>
          <button className="hover:underline">Ngôn ngữ</button>
        </div>
        <p>© 2024 RySocial Inc.</p>
      </footer>
    </div>
  );
};

export default RightSidebar;
