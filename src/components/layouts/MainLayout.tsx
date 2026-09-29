import React from 'react';
import { Outlet } from 'react-router-dom';
import TopNavBar from './TopNavBar';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';
import MobileBottomNav from './MobileBottomNav';

const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FAFAFB] text-[#1F2937] font-sans antialiased">
      <TopNavBar />

      <main className="max-w-[1340px] mx-auto pt-24 pb-16 px-4 flex justify-center gap-6 items-start">
        {/* Left Sidebar - hidden on mobile, sticky when scrolling */}
        <aside
          className="hidden md:block w-[260px] flex-shrink-0 sticky top-24 self-start max-h-[calc(100vh-7rem)] overflow-y-auto custom-scrollbar"
          data-purpose="left-sidebar"
        >
          <LeftSidebar />
        </aside>

        {/* Center Content */}
        <div className="w-full max-w-[640px] flex-shrink-0">
          <Outlet />
        </div>

        {/* Right Sidebar - hidden on tablet & mobile, sticky when scrolling */}
        <aside
          className="hidden lg:block w-[338px] flex-shrink-0 sticky top-24 self-start max-h-[calc(100vh-7rem)] overflow-y-auto custom-scrollbar"
          data-purpose="right-sidebar"
        >
          <RightSidebar />
        </aside>
      </main>

      <MobileBottomNav />
    </div>
  );
};

export default MainLayout;
