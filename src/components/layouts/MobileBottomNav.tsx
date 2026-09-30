import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Compass, PlusCircle, Bell, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { getProfileUrl } from '../../utils/user';
import clsx from 'clsx';

const MobileBottomNav: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { unreadCount } = useNotifications();

  const navItems = [
    { key: 'mobileNav.home', name: t('mobileNav.home'), icon: Home, path: '/feed' },
    { key: 'mobileNav.explore', name: t('mobileNav.explore'), icon: Compass, path: '/explore' },
    { key: 'mobileNav.create', name: t('mobileNav.create'), icon: PlusCircle, path: '/feed' },
    {
      key: 'mobileNav.notifications',
      name: t('mobileNav.notifications'),
      icon: Bell,
      path: '/notifications',
      badge: unreadCount > 0 ? (unreadCount > 99 ? '99+' : String(unreadCount)) : undefined,
    },
    { key: 'mobileNav.profile', name: t('mobileNav.profile'), icon: User, path: getProfileUrl(user) },
  ];


  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-[#121212] border-t border-gray-200 dark:border-[#262626] z-50 px-2 flex items-center justify-around pb-safe transition-colors duration-200">
      {navItems.map((item) => {
        const Icon = item.icon;

        return (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              clsx(
                'flex flex-col items-center justify-center w-full h-full gap-0.5 relative transition-colors',
                isActive ? 'text-[#004AC6] dark:text-[#0095F6]' : 'text-gray-500 dark:text-[#A8A8A8] hover:text-gray-800 dark:hover:text-[#F5F5F5]'
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative">
                  <Icon className={clsx('w-5 h-5', isActive && 'stroke-[2.5]')} />
                  {item.badge && (
                    <span className="absolute -top-1 -right-2 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center border border-white dark:border-[#121212]">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className={clsx('text-[10px]', isActive ? 'font-bold' : 'font-medium')}>
                  {item.name}
                </span>
              </>
            )}
          </NavLink>
        );
      })}
    </div>
  );
};

export default MobileBottomNav;
