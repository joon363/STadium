import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Music, MapPin, Menu, LucideIcon } from 'lucide-react';

interface BottomNavProps {
  onOpenMenu?: () => void;
}

interface NavItem {
  label: string;
  icon: LucideIcon;
  path: string;
  matchPrefix?: string[];
}

export const BottomNav: React.FC<BottomNavProps> = ({ onOpenMenu }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const currentPath = location.pathname;

  const navItems: NavItem[] = [
    { label: '홈', icon: Home, path: '/' },
    { label: '무대공연', icon: Music, path: '/stages' },
    { label: '캠퍼스맵', icon: MapPin, path: '/map' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex justify-center pointer-events-none">
      <div className="w-full max-w-[430px] bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-lg flex items-center justify-around py-1.5 px-2 pointer-events-auto">
        {navItems.map((item) => {
          const isActive = item.matchPrefix
            ? item.matchPrefix.some((p: string) => currentPath === p)
            : currentPath === item.path;

          const Icon = item.icon;

          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-150 touch-target ${
                isActive
                  ? 'text-postech font-black scale-105'
                  : 'text-gray-500 hover:text-gray-900 font-medium'
              }`}
            >
              <div className={`p-1 rounded-lg ${isActive ? 'bg-rose-50 text-postech' : ''}`}>
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className="text-[11px] leading-tight mt-0.5">{item.label}</span>
            </button>
          );
        })}

        {/* Menu / Guide Tab */}
        <button
          onClick={() => {
            if (onOpenMenu) onOpenMenu();
            else navigate('/contact');
          }}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-150 touch-target ${
            ['/contact', '/booths', '/foodtrucks', '/sponsors', '/admin'].includes(currentPath)
              ? 'text-postech font-black scale-105'
              : 'text-gray-500 hover:text-gray-900 font-medium'
          }`}
        >
          <div className="p-1 rounded-lg">
            <Menu className="w-5 h-5" strokeWidth={2} />
          </div>
          <span className="text-[11px] leading-tight mt-0.5">전체메뉴</span>
        </button>
      </div>
    </nav>
  );
};
