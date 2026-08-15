import React from 'react';
import { useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';

interface MobileContainerProps {
  children: React.ReactNode;
  onOpenMenu?: () => void;
}

export const MobileContainer: React.FC<MobileContainerProps> = ({ children, onOpenMenu }) => {
  const location = useLocation();
  const isMap = location.pathname === '/map';

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center items-start selection:bg-rose-100 selection:text-postech">
      {/* 
        Clean Mobile Shell Constraint:
        - Width capped at 430px max (iPhone 16 Pro Max / Galaxy S24 Ultra standard), 100% on mobile.
        - Clean subtle side border on desktop.
      */}
      <div className="w-full max-w-[430px] min-h-screen bg-slate-50 flex flex-col relative shadow-sm border-x border-gray-200/80">
        {/* Main Content Area */}
        <div className={`flex-1 flex flex-col relative w-full overflow-y-auto no-scrollbar ${isMap ? 'pb-16' : 'pb-24'}`}>
          {children}
        </div>

        {/* Global Fixed Bottom Navigation */}
        <BottomNav onOpenMenu={onOpenMenu} />
      </div>
    </div>
  );
};
