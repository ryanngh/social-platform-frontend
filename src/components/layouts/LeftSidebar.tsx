import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Compass, 
  Bell, 
  MessageSquare, 
  Users, 
  UsersRound, 
  Calendar, 
  Bookmark, 
  Plus, 
  Palette, 
  Code, 
  Layers 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getAvatarUrl, DEFAULT_AVATAR_FALLBACK } from '../../utils/media';
import clsx from 'clsx';

const LeftSidebar: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  const navItems = [
    { name: 'Trang chủ', icon: Home, path: '/feed' },
    { name: 'Khám phá', icon: Compass, path: '/explore' },
    { name: 'Thông báo', icon: Bell, path: '/notifications', badge: '3' },
    { name: 'Tin nhắn', icon: MessageSquare, path: '/messages' },
    { name: 'Bạn bè', icon: Users, path: '/friends' },
    { name: 'Nhóm', icon: UsersRound, path: '/groups' },
    { name: 'Sự kiện', icon: Calendar, path: '/events' },
    { name: 'Đã lưu', icon: Bookmark, path: '/saved' },
  ];

  const shortcuts = [
    { name: 'Digital Artists', icon: Palette, bg: 'bg-blue-50 text-blue-600' },
    { name: 'UI/UX Front-end', icon: Code, bg: 'bg-indigo-50 text-indigo-600' },
    { name: 'Design Systems Co.', icon: Layers, bg: 'bg-purple-50 text-purple-600' },
  ];

  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : user?.username || 'Người dùng';
  const username = user?.username || 'user';

  return (
    <div className="flex flex-col gap-4">
      {/* 1. Navigation Menu Card */}
      <nav className="bg-white rounded-3xl p-3 shadow-sm border border-gray-100 flex flex-col gap-1 text-[15px]">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              to={item.path}
              className={clsx(
                'flex items-center justify-between px-4 py-2.5 rounded-2xl transition-all',
                isActive
                  ? 'bg-[#EFF6FF] text-[#003A9F] font-semibold'
                  : 'text-gray-700 hover:bg-gray-50'
              )}
            >
              <div className="flex items-center gap-3.5">
                <Icon className={clsx('w-5 h-5', isActive ? 'text-[#003A9F]' : 'text-gray-500')} />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="w-5 h-5 flex items-center justify-center text-xs font-bold text-white bg-rose-500 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* 2. Mini Profile Card */}
      <section className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 text-center flex flex-col items-center">
        <img
          alt={displayName}
          className="w-14 h-14 rounded-full object-cover mb-2 border-2 border-white shadow"
          src={getAvatarUrl(user?.avatarUrl)}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = DEFAULT_AVATAR_FALLBACK;
          }}
        />
        <h3 className="font-bold text-gray-900 text-base leading-tight">
          {displayName}
        </h3>
        <p className="text-xs text-gray-400 mb-4">@{username}</p>

        {/* Stats Container */}
        <div className="grid grid-cols-2 w-full py-3 border-y border-gray-100 text-center">
          <div className="px-1 border-r border-gray-100">
            <p className="font-bold text-gray-900 text-base">
              {user?.followingCount ?? 0}
            </p>
            <p className="text-[11px] text-gray-500 font-normal">Bạn theo dõi</p>
          </div>
          <div className="px-1">
            <p className="font-bold text-gray-900 text-base">
              {user?.followersCount ?? 0}
            </p>
            <p className="text-[11px] text-gray-500 font-normal">Lượt theo dõi</p>
          </div>
        </div>

        <Link
          to="/profile"
          className="w-full mt-4 py-2.5 rounded-2xl bg-[#EFF6FF] text-[#003A9F] text-xs font-semibold hover:bg-blue-100 transition block text-center"
        >
          Xem trang cá nhân
        </Link>
      </section>

      {/* 3. Shortcuts Card */}
      <section className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between px-2 mb-3">
          <h4 className="font-semibold text-gray-900 text-sm">Lối tắt</h4>
          <button className="text-gray-400 hover:text-gray-600 transition" title="Thêm lối tắt">
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {shortcuts.map((shortcut, i) => {
            const Icon = shortcut.icon;
            return (
              <div
                key={i}
                className="flex items-center gap-3 p-2 rounded-2xl hover:bg-gray-50 transition cursor-pointer"
              >
                <div className={clsx('w-7 h-7 rounded-xl flex items-center justify-center shrink-0', shortcut.bg)}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-xs font-medium text-gray-700 truncate">
                  {shortcut.name}
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default LeftSidebar;
