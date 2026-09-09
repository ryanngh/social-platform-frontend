import React from 'react';
import { Newspaper, UserPlus, Hash } from 'lucide-react';
import toast from 'react-hot-toast';

const FeedEmptyState: React.FC = () => {
  const suggestedFollows = [
    {
      name: 'Maya Patel',
      handle: '@mayadesigns',
      avatar: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=150&auto=format&fit=crop&q=80',
    },
    {
      name: 'David Chen',
      handle: '@dchen_vn',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    },
    {
      name: 'Sarah Jenkins',
      handle: '@sarahcodes',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    },
  ];

  const handleFollow = (name: string) => {
    toast.success(`Đã theo dõi ${name}`);
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 text-center flex flex-col items-center">
      {/* Circular Badge with Newspaper Icon */}
      <div className="w-16 h-16 rounded-full bg-[#EFF6FF] flex items-center justify-center text-[#004AC6] mb-4 shadow-sm">
        <Newspaper className="w-8 h-8 stroke-[1.75]" />
      </div>

      {/* Headline & Subtitle */}
      <h3 className="text-lg font-bold text-gray-900 mb-2">
        Bảng tin của bạn chưa có bài viết mới
      </h3>
      <p className="text-xs text-gray-500 max-w-[440px] leading-relaxed mb-6">
        Hãy theo dõi thêm bạn bè, người sáng tạo nội dung hoặc tham gia các nhóm cùng sở thích để cập nhật những chia sẻ mới nhất!
      </p>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
        <button
          onClick={() => toast('Đang tìm kiếm người dùng nổi bật...', { icon: '🔍' })}
          className="px-5 py-2 rounded-full bg-[#004AC6] hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
        >
          <UserPlus className="w-4 h-4" />
          <span>Khám phá người dùng nổi bật</span>
        </button>
        <button
          onClick={() => toast('Đang mở danh sách chủ đề thịnh hành...', { icon: '🔥' })}
          className="px-5 py-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition flex items-center gap-1.5"
        >
          <Hash className="w-4 h-4 text-gray-500" />
          <span>Tìm kiếm chủ đề thịnh hành</span>
        </button>
      </div>

      {/* Quick Suggestions Subsection */}
      <div className="w-full pt-6 border-t border-gray-100 text-left">
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-xs font-bold text-gray-800">
            Gợi ý tài khoản nên theo dõi ngay
          </span>
          <button
            onClick={() => toast('Xem thêm danh sách gợi ý', { icon: '👥' })}
            className="text-xs font-semibold text-[#004AC6] hover:underline"
          >
            Xem thêm
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {suggestedFollows.map((user, idx) => (
            <div
              key={idx}
              className="border border-gray-100 rounded-2xl p-3 flex flex-col items-center text-center bg-gray-50/50 hover:bg-gray-50 transition"
            >
              <img
                alt={user.name}
                className="w-11 h-11 rounded-full object-cover mb-2 border border-white shadow-sm"
                src={user.avatar}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80";
                }}
              />
              <p className="text-xs font-bold text-gray-900 truncate w-full">{user.name}</p>
              <p className="text-[11px] text-gray-400 mb-3 truncate w-full">{user.handle}</p>
              <button
                onClick={() => handleFollow(user.name)}
                className="w-full py-1.5 rounded-xl bg-[#EFF6FF] hover:bg-blue-100 text-[#003A9F] text-xs font-semibold transition"
              >
                Theo dõi
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeedEmptyState;
