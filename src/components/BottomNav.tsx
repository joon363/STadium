import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Music, MapPin, Info, Building2, LucideIcon } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { TranslationKey } from '../locales/ko';

interface NavItem {
  labelKey: TranslationKey;
  icon: LucideIcon;
  path: string;
}

export const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const currentPath = location.pathname;

  const navItems: NavItem[] = [
    { labelKey: 'nav.home', icon: Home, path: '/' },
    { labelKey: 'nav.stages', icon: Music, path: '/stages' },
    { labelKey: 'nav.map', icon: MapPin, path: '/map' },
    { labelKey: 'nav.contact', icon: Info, path: '/contact' },
    { labelKey: 'nav.sponsors', icon: Building2, path: '/sponsors' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex justify-center pointer-events-none">
      <div className="w-full bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-lg flex items-center justify-around py-1 px-1 pointer-events-auto">
        {navItems.map((item) => {
          const isActive = currentPath === item.path;
          const Icon = item.icon;
          const label = t(item.labelKey);

          return (
            <button
              key={item.labelKey}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all duration-150 touch-target ${isActive
                  ? 'text-postech font-bold scale-105'
                  : 'text-gray-500 hover:text-gray-900 font-medium'
                }`}
            >
              <div className={`p-1 rounded-lg ${isActive ? 'bg-rose-50 text-postech' : ''}`}>
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className="text-[10px] leading-tight mt-0.5">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
