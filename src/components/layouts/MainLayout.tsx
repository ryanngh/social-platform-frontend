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

      <main className="max-w-[1340px] mx-auto pt-24 pb-16 px-4 flex justify-center gap-6">
        {/* Left Sidebar - hidden on mobile */}
        <aside className="hidden md:block w-[260px] flex-shrink-0">
          <div className="sticky top-24">
            <LeftSidebar />
          </div>
        </aside>

        {/* Center Content */}
        <div className="w-full max-w-[640px] flex-shrink-0">
          <Outlet />
        </div>

        {/* Right Sidebar - hidden on tablet & mobile */}
        <aside className="hidden lg:block w-[338px] flex-shrink-0">
          <div className="sticky top-24">
            <RightSidebar />
          </div>
        </aside>
      </main>

      <MobileBottomNav />
    </div>
  );
};

export default MainLayout;
