import React from 'react';
import { useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';

interface MobileContainerProps {
  children: React.ReactNode;
}

const HIDE_NAV_ROUTES = ['/soccer', '/baseball', '/lol', '/badminton', '/basketball'];

export const MobileContainer: React.FC<MobileContainerProps> = ({ children }) => {
  const location = useLocation();
  const isMap = location.pathname === '/map';
  const shouldHideNav = HIDE_NAV_ROUTES.includes(location.pathname);

  return (
    <div className="h-[100dvh] w-full bg-slate-50 flex justify-center items-start selection:bg-rose-100 selection:text-postech overflow-hidden">
      {/* 
        Full-width Mobile Container (No fixed max-width constraint)
      */}
      <div className="w-full h-full bg-slate-50 flex flex-col relative overflow-hidden">
        {/* Main Content Area */}
        <div
          className={`flex-1 flex flex-col relative w-full ${
            isMap
              ? 'overflow-hidden pb-0'
              : `overflow-y-auto no-scrollbar ${shouldHideNav ? 'pb-4' : 'pb-20'}`
          }`}
        >
          {children}
        </div>

        {/* Global Fixed Bottom Navigation */}
        {!shouldHideNav && <BottomNav />}
      </div>
    </div>
  );
};
