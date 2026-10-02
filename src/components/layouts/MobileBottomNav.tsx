import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Home, Compass, Plus, Bell, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { getProfileUrl } from '../../utils/user';
import clsx from 'clsx';

const MobileBottomNav: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { unreadCount } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();

  // Hide on any messages view so keyboard and chat input bar are flush with screen bottom
  const isMessages = location.pathname.startsWith('/messages');
  if (isMessages) return null;

  const navItems = [
    { key: 'mobileNav.home', name: t('mobileNav.home'), icon: Home, path: '/feed' },
    { key: 'mobileNav.explore', name: t('mobileNav.explore'), icon: Compass, path: '/explore' },
    { key: 'mobileNav.create', name: t('mobileNav.create'), icon: Plus, path: '/feed', isAction: true },
    {
      key: 'mobileNav.notifications',
      name: t('mobileNav.notifications'),
      icon: Bell,
      path: '/notifications',
      badge: unreadCount > 0 ? (unreadCount > 99 ? '99+' : String(unreadCount)) : undefined,
    },
    { key: 'mobileNav.profile', name: t('mobileNav.profile'), icon: User, path: getProfileUrl(user) },
  ];

  const handleActionClick = (e: React.MouseEvent, item: typeof navItems[0]) => {
    if (item.isAction) {
      if (location.pathname !== '/feed') {
        navigate('/feed');
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('open-create-post'));
        }, 100);
      } else {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('open-create-post'));
      }
    } else if (item.path === '/feed') {
      window.dispatchEvent(new CustomEvent('reset-feed-to-for-you'));
    }
  };

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 h-[calc(3.5rem+env(safe-area-inset-bottom,0px))] pb-[env(safe-area-inset-bottom,0px)] bg-white/95 dark:bg-[#121212]/95 backdrop-blur-md border-t border-gray-200/80 dark:border-[#262626] z-50 px-2 flex items-center justify-around transition-colors duration-200 shadow-2xs"
      aria-label="Mobile Navigation"
    >
      {navItems.map((item) => {
        const Icon = item.icon;

        return (
          <NavLink
            key={item.key}
            to={item.path}
            onClick={(e) => handleActionClick(e, item)}
            className={({ isActive }) =>
              clsx(
                'flex flex-col items-center justify-center w-full h-14 min-h-[44px] gap-0.5 relative transition-all active:scale-95 cursor-pointer select-none',
                isActive && !item.isAction
                  ? 'text-[#004AC6] dark:text-[#0095F6]'
                  : 'text-gray-500 dark:text-[#A8A8A8] hover:text-gray-900 dark:hover:text-[#F5F5F5]'
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative">
                  {item.isAction ? (
                    <div className="w-8 h-8 rounded-xl bg-[#004AC6] dark:bg-[#0095F6] text-white flex items-center justify-center shadow-xs">
                      <Icon className="w-5 h-5 stroke-[2.5]" />
                    </div>
                  ) : (
                    <Icon className={clsx('w-5 h-5 transition-transform', isActive && 'stroke-[2.5] scale-105')} />
                  )}
                  {item.badge && (
                    <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center border-2 border-white dark:border-[#121212]">
                      {item.badge}
                    </span>
                  )}
                </div>
                {!item.isAction && (
                  <span className={clsx('text-[10px] tracking-tight leading-tight', isActive ? 'font-bold' : 'font-medium')}>
                    {item.name}
                  </span>
                )}
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
};

export default MobileBottomNav;
