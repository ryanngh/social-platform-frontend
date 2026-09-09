import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Bell, Mail, MessageSquare } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

import { getAvatarUrl, DEFAULT_AVATAR_FALLBACK } from '../../utils/media';

const TopNavBar: React.FC = () => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = React.useState(false);

  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : user?.username || 'Người dùng';
  const username = user?.username || 'user';

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200/80 z-50 shadow-sm flex items-center justify-between px-4 sm:px-6">
      {/* Brand Logo & Search */}
      <div className="flex items-center gap-4 sm:gap-8">
        <Link to="/feed" className="text-2xl font-black text-[#004AC6] tracking-tight hover:opacity-95 transition">
          RySocial
        </Link>
        <div className="relative w-48 sm:w-64 md:w-[380px]">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            className="w-full pl-10 pr-4 py-2 text-sm bg-gray-100/90 border border-transparent rounded-full focus:bg-white focus:border-[#004AC6] focus:ring-1 focus:ring-[#004AC6] transition placeholder-gray-400 outline-none"
            placeholder="Tìm kiếm..."
            type="text"
          />
        </div>
      </div>

      {/* Top Right Nav Items & User Switcher */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Notification Icon */}
        <button
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition relative"
          title="Thông báo"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border border-white"></span>
        </button>

        {/* Messages Icon */}
        <button
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition hidden sm:flex"
          title="Hộp thư"
        >
          <Mail className="w-5 h-5" />
        </button>

        {/* Chat Bubble Icon */}
        <button
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition"
          title="Tin nhắn"
        >
          <MessageSquare className="w-5 h-5" />
        </button>

        {/* Separator */}
        <div className="h-6 w-px bg-gray-200 mx-1"></div>

        {/* User Info & Switch */}
        <div className="relative">
          <div
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 cursor-pointer pl-1 py-1 hover:bg-gray-50 rounded-full sm:rounded-xl transition"
          >
            <img
              alt={displayName}
              className="w-9 h-9 rounded-full object-cover border border-gray-200 shadow-sm"
              src={getAvatarUrl(user?.avatarUrl)}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = DEFAULT_AVATAR_FALLBACK;
              }}
            />
            <div className="text-left leading-tight hidden md:block">
              <p className="text-sm font-semibold text-gray-900 truncate max-w-[120px]">
                {displayName}
              </p>
              <button className="text-xs text-[#004AC6] font-medium hover:underline text-left">
                Switch
              </button>
            </div>
          </div>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-lg border border-gray-100 py-2 z-50 animate-fadeIn">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-800">{displayName}</p>
                <p className="text-[11px] text-gray-400">@{username}</p>
              </div>
              <Link
                to="/profile"
                onClick={() => setShowUserMenu(false)}
                className="block px-4 py-2 text-xs text-gray-700 hover:bg-[#EFF6FF] hover:text-[#004AC6]"
              >
                Trang cá nhân
              </Link>
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  logout();
                }}
                className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50"
              >
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopNavBar;
