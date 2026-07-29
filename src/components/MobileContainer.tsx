import React from 'react';
import { useLocation } from 'react-router-dom';

interface MobileContainerProps {
  children: React.ReactNode;
}

export const MobileContainer: React.FC<MobileContainerProps> = ({ children }) => {
  const location = useLocation();
  const isMap = location.pathname === '/map';

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-start">
      {/* 
        Clean Mobile Shell Constraint:
        - Width capped at 480px max on wide screens, 100% on mobile devices.
        - No desktop rect outline or heavy shadows as requested.
      */}
      <div className="w-full max-w-[480px] min-h-screen bg-white flex flex-col relative">
        {/* Children Content */}
        <div className={`flex-1 flex flex-col relative w-full overflow-y-auto no-scrollbar ${isMap ? 'pb-0' : 'pb-6'}`}>
          {children}
        </div>
      </div>
    </div>
  );
};
