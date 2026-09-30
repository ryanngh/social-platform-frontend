import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import TopNavBar from './TopNavBar';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';
import MobileBottomNav from './MobileBottomNav';

const MainLayout: React.FC = () => {
  const location = useLocation();

  const isWidePage =
    location.pathname.startsWith('/messages') ||
    location.pathname.startsWith('/drive') ||
    location.pathname.startsWith('/storage') ||
    location.pathname.startsWith('/marketplace');

  return (
    <div className="min-h-screen bg-[#FAFAFB] dark:bg-[#000000] text-[#1F2937] dark:text-[#F5F5F5] font-sans antialiased transition-colors duration-200">
      <TopNavBar />

      <main className="max-w-[1380px] mx-auto pt-20 pb-16 px-2 sm:px-4 flex justify-center gap-4 lg:gap-6 items-start">
        {/* Left Sidebar - hidden on mobile, sticky when scrolling */}
        <aside
          className="hidden md:block w-[260px] flex-shrink-0 sticky top-20 self-start max-h-[calc(100vh-6rem)] overflow-y-auto custom-scrollbar"
          data-purpose="left-sidebar"
        >
          <LeftSidebar />
        </aside>

        {/* Center / Main Content */}
        <div
          className={
            isWidePage
              ? 'w-full flex-1 max-w-[1040px] min-w-0'
              : 'w-full max-w-[640px] flex-shrink-0 min-w-0'
          }
        >
          <Outlet />
        </div>

        {/* Right Sidebar - hidden on wide pages or on tablet & mobile */}
        {!isWidePage && (
          <aside
            className="hidden lg:block w-[338px] flex-shrink-0 sticky top-20 self-start max-h-[calc(100vh-6rem)] overflow-y-auto custom-scrollbar"
            data-purpose="right-sidebar"
          >
            <RightSidebar />
          </aside>
        )}
      </main>

      <MobileBottomNav />
    </div>
  );
};

export default MainLayout;

