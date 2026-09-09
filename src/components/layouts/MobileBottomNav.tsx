import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Compass, PlusCircle, Bell, User } from 'lucide-react';
import clsx from 'clsx';

const MobileBottomNav: React.FC = () => {
  const navItems = [
    { name: 'Trang chủ', icon: Home, path: '/feed' },
    { name: 'Khám phá', icon: Compass, path: '/explore' },
    { name: 'Tạo bài', icon: PlusCircle, path: '/feed' },
    { name: 'Thông báo', icon: Bell, path: '/notifications', badge: '3' },
    { name: 'Cá nhân', icon: User, path: '/profile' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 z-50 px-2 flex items-center justify-around pb-safe">
      {navItems.map((item) => {
        const Icon = item.icon;

        return (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              clsx(
                'flex flex-col items-center justify-center w-full h-full gap-0.5 relative',
                isActive ? 'text-[#004AC6]' : 'text-gray-500 hover:text-gray-800'
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative">
                  <Icon className={clsx('w-5 h-5', isActive && 'stroke-[2.5]')} />
                  {item.badge && (
                    <span className="absolute -top-1 -right-2 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
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
