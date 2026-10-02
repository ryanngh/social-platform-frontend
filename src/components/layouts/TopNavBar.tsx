import React, { useRef, useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Bell, MessageSquare, Globe, User as UserIcon, LogOut, Sun, Moon, Laptop, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { useChat } from '../../contexts/ChatContext';
import { NotificationPopup } from '../notifications/NotificationPopup';
import MessagesDropdown from '../chat/MessagesDropdown';
import SearchTypeaheadDropdown from '../search/SearchTypeaheadDropdown';
import { getAvatarUrl, DEFAULT_AVATAR_FALLBACK } from '../../utils/media';
import { getProfileUrl } from '../../utils/user';
import clsx from 'clsx';

const TopNavBar: React.FC = () => {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  const { unreadCount } = useNotifications();
  const { unreadTotal } = useChat();
  const navigate = useNavigate();
  const location = useLocation();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);
  const [showMessagesPopup, setShowMessagesPopup] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const notifButtonRef = useRef<HTMLDivElement>(null);
  const messagesButtonRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sync searchQuery when on /search?q=...
  useEffect(() => {
    if (location.pathname === '/search') {
      const params = new URLSearchParams(location.search);
      const q = params.get('q');
      if (q !== null) {
        setSearchQuery(q);
      }
    }
  }, [location.pathname, location.search]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    setShowSearchDropdown(false);
    searchInputRef.current?.blur();
    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const handleClearSearch = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSearchQuery('');
    searchInputRef.current?.focus();
  };


  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : user?.username || t('topNav.userFallback');
  const username = user?.username || 'user';

  // Close menu & search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) {
        setShowUserMenu(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(target)) {
        setShowSearchDropdown(false);
      }
      if (messagesButtonRef.current && !messagesButtonRef.current.contains(target)) {
        setShowMessagesPopup(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);


  return (
    <header className="fixed top-0 left-0 right-0 h-[calc(3.5rem+env(safe-area-inset-top,0px))] sm:h-16 pt-[env(safe-area-inset-top,0px)] bg-white/95 dark:bg-[#121212]/95 backdrop-blur-md border-b border-gray-200/80 dark:border-[#262626] z-50 shadow-2xs transition-colors duration-200">
      <div className="h-14 sm:h-16 flex items-center justify-between px-3 sm:px-6">
        {/* Brand Logo & Search */}
        <div className="flex items-center gap-3 sm:gap-8">
          <Link
            to="/feed"
            onClick={() => window.dispatchEvent(new CustomEvent('reset-feed-to-for-you'))}
            className="text-xl sm:text-2xl font-black text-[#004AC6] dark:text-[#0095F6] tracking-tight hover:opacity-95 transition"
          >
            RySocial
          </Link>
          <div className="hidden md:block relative md:w-[320px] lg:w-[380px]" ref={searchContainerRef}>
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <button
              type="submit"
              className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400 dark:text-[#737373] hover:text-[#004AC6] dark:hover:text-[#0095F6] transition cursor-pointer"
              title={t('topNav.searchPlaceholder')}
            >
              <Search className="w-4 h-4" />
            </button>
            <input
              ref={searchInputRef}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchDropdown(true);
              }}
              onFocus={() => setShowSearchDropdown(true)}
              className="w-full pl-10 pr-9 py-2 text-sm bg-gray-100/90 dark:bg-[#1A1A1A] border border-transparent dark:border-[#363636] rounded-full focus:bg-white dark:focus:bg-[#000000] focus:border-[#004AC6] dark:focus:border-[#0095F6] focus:ring-1 focus:ring-[#004AC6] dark:focus:ring-[#0095F6] text-gray-900 dark:text-[#F5F5F5] placeholder-gray-400 dark:placeholder-[#737373] transition outline-none"
              placeholder={t('topNav.searchPlaceholder')}
              type="text"
              autoComplete="off"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-[#E5E5E5] transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

          {/* Typeahead & History Dropdown */}
          <SearchTypeaheadDropdown
            isOpen={showSearchDropdown}
            onClose={() => setShowSearchDropdown(false)}
            query={searchQuery}
            onSelectQuery={(selectedText) => {
              setSearchQuery(selectedText);
              setShowSearchDropdown(false);
            }}
            inputRef={searchInputRef}
          />
        </div>
      </div>

      {/* Top Right Nav Items & User Switcher */}
      <div className="flex items-center gap-1.5 sm:gap-3">
        {/* Mobile Search Button */}
        <Link
          to="/search"
          className="p-2 text-gray-600 dark:text-[#D4D4D4] hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#262626] rounded-full transition cursor-pointer md:hidden"
          title={t('topNav.searchPlaceholder')}
          aria-label={t('topNav.searchPlaceholder')}
        >
          <Search className="w-5 h-5" />
        </Link>

        {/* Quick Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 text-gray-600 dark:text-[#D4D4D4] hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#262626] rounded-full transition cursor-pointer"
          title={t('userMenu.toggleTheme')}
          aria-label={t('userMenu.toggleTheme')}
        >
          {resolvedTheme === 'dark' ? (
            <Sun className="w-5 h-5 text-amber-400 hover:text-amber-300 transition-colors" />
          ) : (
            <Moon className="w-5 h-5 text-gray-600 hover:text-gray-900 transition-colors" />
          )}
        </button>

        {/* Notification Icon & Dropdown Popup - Desktop only, on mobile it's in bottom bar */}
        <div className="relative hidden md:block" ref={notifButtonRef}>
          <button
            onClick={() => {
              setShowNotificationPopup(!showNotificationPopup);
              setShowMessagesPopup(false);
              setShowUserMenu(false);
            }}
            className={clsx(
              'p-2 text-gray-600 dark:text-[#D4D4D4] hover:text-gray-900 dark:hover:text-white rounded-full transition relative cursor-pointer',
              showNotificationPopup
                ? 'bg-blue-50 dark:bg-blue-950/60 text-[#004AC6] dark:text-[#0095F6]'
                : 'hover:bg-gray-100 dark:hover:bg-[#262626]'
            )}
            title={t('topNav.notifications')}
            aria-label={t('topNav.notifications')}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white rounded-full border-2 border-white dark:border-[#121212] text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          <NotificationPopup
            isOpen={showNotificationPopup}
            onClose={() => setShowNotificationPopup(false)}
          />
        </div>

        {/* Messages Dropdown & Icon */}
        <div className="relative" ref={messagesButtonRef}>
          <button
            onClick={() => {
              if (window.innerWidth < 768) {
                navigate('/messages');
              } else {
                setShowMessagesPopup(!showMessagesPopup);
                setShowNotificationPopup(false);
                setShowUserMenu(false);
              }
            }}
            className={clsx(
              'p-2 text-gray-600 dark:text-[#D4D4D4] hover:text-gray-900 dark:hover:text-white rounded-full transition cursor-pointer relative',
              showMessagesPopup
                ? 'bg-blue-50 dark:bg-blue-950/60 text-[#004AC6] dark:text-[#0095F6]'
                : 'hover:bg-gray-100 dark:hover:bg-[#262626]'
            )}
            title={t('topNav.messages')}
            aria-label={t('topNav.messages')}
          >
            <MessageSquare className="w-5 h-5" />
            {unreadTotal > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-[#004AC6] dark:bg-[#0095F6] text-white rounded-full border-2 border-white dark:border-[#121212] text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unreadTotal > 99 ? '99+' : unreadTotal}
              </span>
            )}
          </button>

          <MessagesDropdown
            isOpen={showMessagesPopup}
            onClose={() => setShowMessagesPopup(false)}
          />
        </div>

        {/* Separator - Desktop only */}
        <div className="hidden md:block h-6 w-px bg-gray-200 dark:bg-[#1A1A1A] mx-1"></div>

        {/* User Info & Switch */}
        <div className="relative" ref={menuRef}>
          <div
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotificationPopup(false);
              setShowMessagesPopup(false);
            }}
            className="flex items-center gap-2.5 cursor-pointer pl-1 py-1 hover:bg-gray-50 dark:hover:bg-[#1A1A1A] rounded-full sm:rounded-xl transition"
          >
            <img
              alt={displayName}
              className="w-9 h-9 rounded-full object-cover border border-gray-200 dark:border-[#363636] shadow-sm"
              src={getAvatarUrl(user?.avatarUrl)}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = DEFAULT_AVATAR_FALLBACK;
              }}
            />
            <div className="text-left leading-tight hidden md:block">
              <Link
                to={getProfileUrl(user)}
                onClick={(e) => e.stopPropagation()}
                className="text-sm font-semibold text-gray-900 dark:text-[#F5F5F5] truncate max-w-[120px] hover:underline hover:text-[#004AC6] dark:hover:text-[#0095F6] transition-colors block cursor-pointer"
              >
                {displayName}
              </Link>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowUserMenu(!showUserMenu);
                }}
                className="text-xs text-[#004AC6] dark:text-[#0095F6] font-medium hover:underline text-left cursor-pointer"
              >
                {t('topNav.switch')}
              </button>
            </div>
          </div>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#262626] rounded-2xl shadow-xl border border-gray-100 dark:border-[#363636] py-2 z-50 animate-fadeIn">
              <Link
                to={getProfileUrl(user)}
                onClick={() => setShowUserMenu(false)}
                className="block px-4 py-2 border-b border-gray-100 dark:border-[#262626] hover:bg-gray-50 dark:hover:bg-[#1A1A1A] transition cursor-pointer"
              >
                <p className="text-xs font-semibold text-gray-800 dark:text-[#F5F5F5] truncate hover:text-[#004AC6] dark:hover:text-[#0095F6] transition-colors">{displayName}</p>
                <p className="text-[11px] text-gray-400 dark:text-[#A8A8A8] truncate">@{username}</p>
              </Link>

              <Link
                to={getProfileUrl(user)}
                onClick={() => setShowUserMenu(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-xs text-gray-700 dark:text-[#D4D4D4] hover:bg-[#EFF6FF] dark:hover:bg-blue-950/50 hover:text-[#004AC6] dark:hover:text-[#0095F6] transition"
              >
                <UserIcon className="w-3.5 h-3.5 text-gray-500 dark:text-[#A8A8A8]" />
                <span>{t('userMenu.profile')}</span>
              </Link>

              {/* Theme Switcher Button Group */}
              <div className="px-4 py-2.5 border-t border-gray-100 dark:border-[#262626] flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-[#D4D4D4]">
                  {resolvedTheme === 'dark' ? (
                    <Moon className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  ) : (
                    <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  )}
                  <span className="font-medium">{t('userMenu.theme')}</span>
                </div>
                <div className="flex items-center bg-gray-100 dark:bg-[#1A1A1A] rounded-lg p-0.5 text-[11px] font-semibold">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setTheme('light');
                    }}
                    className={clsx(
                      'px-2 py-0.5 rounded-md transition cursor-pointer flex items-center gap-1',
                      theme === 'light'
                        ? 'bg-white dark:bg-[#262626] text-[#004AC6] dark:text-[#0095F6] shadow-xs font-bold'
                        : 'text-gray-500 dark:text-[#A8A8A8] hover:text-gray-900 dark:hover:text-[#F5F5F5]'
                    )}
                    title={t('userMenu.themeLight')}
                  >
                    <Sun className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setTheme('dark');
                    }}
                    className={clsx(
                      'px-2 py-0.5 rounded-md transition cursor-pointer flex items-center gap-1',
                      theme === 'dark'
                        ? 'bg-white dark:bg-[#262626] text-[#004AC6] dark:text-[#0095F6] shadow-xs font-bold'
                        : 'text-gray-500 dark:text-[#A8A8A8] hover:text-gray-900 dark:hover:text-[#F5F5F5]'
                    )}
                    title={t('userMenu.themeDark')}
                  >
                    <Moon className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setTheme('system');
                    }}
                    className={clsx(
                      'px-2 py-0.5 rounded-md transition cursor-pointer flex items-center gap-1',
                      theme === 'system'
                        ? 'bg-white dark:bg-[#262626] text-[#004AC6] dark:text-[#0095F6] shadow-xs font-bold'
                        : 'text-gray-500 dark:text-[#A8A8A8] hover:text-gray-900 dark:hover:text-[#F5F5F5]'
                    )}
                    title={t('userMenu.themeSystem')}
                  >
                    <Laptop className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Language Switcher Button Group */}
              <div className="px-4 py-2.5 border-t border-b border-gray-100 dark:border-[#262626] flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-[#D4D4D4]">
                  <Globe className="w-3.5 h-3.5 text-gray-500 dark:text-[#A8A8A8] shrink-0" />
                  <span className="font-medium">{t('userMenu.language')}</span>
                </div>
                <div className="flex items-center bg-gray-100 dark:bg-[#1A1A1A] rounded-lg p-0.5 text-[11px] font-semibold">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLanguage('vi');
                    }}
                    className={clsx(
                      'px-2 py-0.5 rounded-md transition cursor-pointer',
                      language === 'vi'
                        ? 'bg-white dark:bg-[#262626] text-[#004AC6] dark:text-[#0095F6] shadow-xs font-bold'
                        : 'text-gray-500 dark:text-[#A8A8A8] hover:text-gray-900 dark:hover:text-[#F5F5F5]'
                    )}
                    title={t('userMenu.vietnamese')}
                  >
                    VI
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLanguage('en');
                    }}
                    className={clsx(
                      'px-2 py-0.5 rounded-md transition cursor-pointer',
                      language === 'en'
                        ? 'bg-white dark:bg-[#262626] text-[#004AC6] dark:text-[#0095F6] shadow-xs font-bold'
                        : 'text-gray-500 dark:text-[#A8A8A8] hover:text-gray-900 dark:hover:text-[#F5F5F5]'
                    )}
                    title={t('userMenu.english')}
                  >
                    EN
                  </button>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowUserMenu(false);
                  logout();
                }}
                className="w-full flex items-center gap-2 text-left px-4 py-2.5 text-xs text-red-600 dark:text-rose-400 hover:bg-red-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t('userMenu.logout')}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  </header>
  );
};

export default TopNavBar;
