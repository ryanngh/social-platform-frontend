import React from 'react';
import {Link, useLocation} from 'react-router-dom';
import {
    Home,
    Compass,
    Flame,
    Bell,
    MessageSquare,
    Bookmark,
    Plus,
    Palette,
    Layers,
    Cloud,
    Store
} from 'lucide-react';
import {useAuth} from '../../contexts/AuthContext';
import {useLanguage} from '../../contexts/LanguageContext';
import {useNotifications} from '../../contexts/NotificationContext';
import {useChat} from '../../contexts/ChatContext';
import {getAvatarUrl, DEFAULT_AVATAR_FALLBACK} from '../../utils/media';
import {getProfileUrl} from '../../utils/user';
import clsx from 'clsx';

const LeftSidebar: React.FC = () => {
    const {user} = useAuth();
    const {t} = useLanguage();
    const {unreadCount} = useNotifications();
    const {unreadTotal} = useChat();
    const location = useLocation();

    const navItems = [
        {key: 'leftNav.home', name: t('leftNav.home'), icon: Home, path: '/feed'},
        {key: 'leftNav.explore', name: t('leftNav.explore'), icon: Compass, path: '/explore'},
        {key: 'leftNav.trending', name: t('leftNav.trending'), icon: Flame, path: '/trending'},
        {
            key: 'leftNav.notifications',
            name: t('leftNav.notifications'),
            icon: Bell,
            path: '/notifications',
            badge: unreadCount > 0 ? (unreadCount > 99 ? '99+' : String(unreadCount)) : undefined,
        },
        {
            key: 'leftNav.messages',
            name: t('leftNav.messages'),
            icon: MessageSquare,
            path: '/messages',
            badge: unreadTotal > 0 ? (unreadTotal > 99 ? '99+' : String(unreadTotal)) : undefined,
        },
        {key: 'leftNav.storage', name: t('leftNav.storage'), icon: Cloud, path: '/drive'},
        {key: 'leftNav.marketplace', name: t('leftNav.marketplace'), icon: Store, path: '/marketplace'},
        {key: 'leftNav.saved', name: t('leftNav.saved'), icon: Bookmark, path: '/saved'},
    ];


    const shortcuts: { name: string; icon: typeof Palette; bg: string }[] = [];

    const displayName = user?.firstName
        ? `${user.firstName} ${user.lastName || ''}`.trim()
        : user?.username || t('topNav.userFallback');
    const username = user?.username || 'user';

    return (
        <div className="flex flex-col gap-4">
            {/* 1. Navigation Menu Card */}
            <nav className="bg-white dark:bg-[#121212] rounded-3xl p-2.5 shadow-sm border border-gray-100 dark:border-[#262626] flex flex-col gap-1 text-sm transition-colors duration-200">
                {navItems.map((item) => {
                    const isActive = location.pathname.startsWith(item.path);
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.name}
                            to={item.path}
                            onClick={() => {
                                if (item.path === '/feed') {
                                    window.dispatchEvent(new CustomEvent('reset-feed-to-for-you'));
                                }
                            }}
                            className={clsx(
                                'flex items-center justify-between px-3.5 py-2.5 rounded-2xl transition-all',
                                isActive
                                    ? 'bg-[#EFF6FF] dark:bg-blue-950/60 text-[#003A9F] dark:text-[#0095F6] font-bold'
                                    : 'text-gray-700 dark:text-[#D4D4D4] hover:bg-gray-50 dark:hover:bg-[#1A1A1A] font-medium'
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <Icon className={clsx('w-5 h-5 shrink-0', isActive ? 'text-[#003A9F] dark:text-[#0095F6]' : 'text-gray-500 dark:text-[#A8A8A8]')}/>
                                <span>{item.name}</span>
                            </div>
                            {item.badge && (
                                <span
                                    className="min-w-[20px] h-5 px-1.5 flex items-center justify-center text-[10px] font-bold text-white bg-rose-500 rounded-full tabular-nums shadow-xs">
                  {item.badge}
                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* 2. Mini Profile Card */}
            <section
                className="bg-white dark:bg-[#121212] rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-[#262626] text-center flex flex-col items-center transition-colors duration-200">
                <Link to={getProfileUrl(user)} className="cursor-pointer hover:opacity-90 transition mb-2">
                    <img
                        alt={displayName}
                        className="w-14 h-14 rounded-full object-cover border-2 border-white dark:border-[#363636] shadow-sm"
                        src={getAvatarUrl(user?.avatarUrl)}
                        onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = DEFAULT_AVATAR_FALLBACK;
                        }}
                    />
                </Link>
                <Link to={getProfileUrl(user)} className="cursor-pointer">
                    <h3 className="font-bold text-gray-900 dark:text-[#F5F5F5] text-base leading-tight hover:underline hover:text-[#004AC6] dark:hover:text-[#0095F6] transition-colors">
                        {displayName}
                    </h3>
                </Link>
                <Link to={getProfileUrl(user)} className="text-xs text-gray-400 dark:text-[#A8A8A8] mb-4 hover:underline hover:text-[#004AC6] dark:hover:text-[#0095F6] transition-colors cursor-pointer">
                    @{username}
                </Link>

                {/* Stats Container */}
                <div className="grid grid-cols-2 w-full py-3 border-y border-gray-100 dark:border-[#262626] text-center">
                    <div className="px-1 border-r border-gray-100 dark:border-[#262626]">
                        <p className="font-bold text-gray-900 dark:text-[#F5F5F5] text-base tabular-nums">
                            {user?.followingCount ?? 0}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-[#A8A8A8] font-medium mt-0.5">{t('leftNav.following')}</p>
                    </div>
                    <div className="px-1">
                        <p className="font-bold text-gray-900 dark:text-[#F5F5F5] text-base tabular-nums">
                            {user?.followerCount ?? user?.followersCount ?? 0}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-[#A8A8A8] font-medium mt-0.5">{t('leftNav.followers')}</p>
                    </div>
                </div>

                <Link
                    to={getProfileUrl(user)}
                    className="w-full mt-4 py-2.5 rounded-2xl bg-[#EFF6FF] dark:bg-blue-950/60 text-[#003A9F] dark:text-[#0095F6] text-xs font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/60 transition block text-center"
                >
                    {t('leftNav.viewProfile')}
                </Link>
            </section>

            {/* 3. Shortcuts Card */}
            <section className="bg-white dark:bg-[#121212] rounded-3xl p-4 shadow-sm border border-gray-100 dark:border-[#262626] transition-colors duration-200">
                <div className="flex items-center justify-between px-2 mb-3">
                    <h4 className="font-semibold text-gray-900 dark:text-[#F5F5F5] text-sm">{t('leftNav.shortcuts')}</h4>
                    <button className="text-gray-400 dark:text-[#737373] hover:text-gray-600 dark:hover:text-[#F5F5F5] transition" title={t('leftNav.addShortcut')}>
                        <Plus className="w-4 h-4"/>
                    </button>
                </div>
                {shortcuts.length > 0 ? (
                    <div className="flex flex-col gap-2">
                        {shortcuts.map((shortcut, i) => {
                            const Icon = shortcut.icon;
                            return (
                                <div
                                    key={i}
                                    className="flex items-center gap-3 p-2 rounded-2xl hover:bg-gray-50 dark:hover:bg-[#1A1A1A] transition cursor-pointer"
                                >
                                    <div
                                        className={clsx('w-7 h-7 rounded-xl flex items-center justify-center shrink-0', shortcut.bg)}>
                                        <Icon className="w-4 h-4"/>
                                    </div>
                                    <span className="text-xs font-medium text-gray-700 dark:text-[#D4D4D4] truncate">
                    {shortcut.name}
                  </span>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="py-5 text-center text-gray-400 dark:text-[#737373]">
                        <Layers className="w-6 h-6 mx-auto mb-1.5 text-gray-300 dark:text-[#525252] stroke-[1.5]"/>
                        <p className="text-xs text-gray-400 dark:text-[#737373] italic">{t('leftNav.noShortcuts')}</p>
                    </div>
                )}
            </section>
        </div>
    );
};

export default LeftSidebar;
