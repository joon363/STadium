import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Home, MapPin, PhoneCall, Trophy, Music, ChevronRight, Filter, Store, Truck, Building2, Radio } from 'lucide-react';
import { useRealtimeSchedule } from '../hooks/useRealtimeSchedule';
import { useSchool } from '../context/SchoolContext';
import { SCHOOLS } from '../config/stadiumConfig';

interface HeaderProps {
  isMenuOpen?: boolean;
  setIsMenuOpen?: (open: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({ isMenuOpen: externalIsOpen, setIsMenuOpen: setExternalIsOpen }) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isMenuOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsMenuOpen = setExternalIsOpen || setInternalIsOpen;

  const navigate = useNavigate();
  const location = useLocation();
  const { sportsConfig, stageConfig } = useRealtimeSchedule();
  const { selectedSchool, setSelectedSchool } = useSchool();

  const activeSchoolObj = selectedSchool !== 'ALL' ? SCHOOLS[selectedSchool] : null;

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  // Count live matches
  const liveMatchCount = Object.values(sportsConfig).filter(s => s.liveMatch.isLive).length;

  return (
    <>
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-2.5 flex items-center justify-between shadow-2xs">
        {/* Brand & Live Badge */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsMenuOpen(true)}
            className="touch-target -ml-2 p-2 rounded-xl text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors"
            aria-label="전체 메뉴"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div
            onClick={() => handleNavigate('/')}
            className="cursor-pointer flex items-center gap-2 select-none"
          >
            <span className="font-black text-xl tracking-tight text-postech">
              STadium
            </span>
          </div>
        </div>

        {/* Right School Selector Pill */}
        <div className="flex items-center gap-2">
          {liveMatchCount > 0 && (
            <div className="hidden sm:flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
              <Radio className="w-3 h-3" />
              <span>{liveMatchCount}경기 진행중</span>
            </div>
          )}

          <div className="relative">
            <select
              value={selectedSchool}
              onChange={(e) => setSelectedSchool(e.target.value)}
              className={`appearance-none text-xs font-bold pl-3 pr-7 py-1.5 rounded-full border cursor-pointer focus:outline-none transition-all shadow-2xs ${activeSchoolObj
                ? 'border-transparent text-white font-extrabold'
                : 'bg-white border-gray-200 text-gray-800 hover:bg-gray-50'
                }`}
              style={activeSchoolObj ? { backgroundColor: activeSchoolObj.color } : {}}
            >
              <option value="ALL" className="text-gray-900 font-bold bg-white">
                전체 학교
              </option>
              {Object.values(SCHOOLS).map((sch) => (
                <option key={sch.id} value={sch.id} className="text-gray-900 font-bold bg-white">
                  {sch.shortName}
                </option>
              ))}
            </select>
            <Filter
              className={`w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${activeSchoolObj ? 'text-white' : 'text-gray-400'
                }`}
            />
          </div>
        </div>
      </header>

      {/* Hamburger Drawer Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Drawer Content Container */}
          <div className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200 text-gray-900">

            {/* Navigation List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {/* Home Link */}
              <div>
                <button
                  onClick={() => handleNavigate('/')}
                  className={`w-full flex items-center justify-between p-3 rounded-xl font-bold text-sm transition-colors ${location.pathname === '/'
                    ? 'bg-rose-50 text-postech border border-rose-200 font-extrabold'
                    : 'text-gray-800 hover:bg-gray-100'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <Home className="w-4 h-4 text-postech" />
                    <span>홈</span>
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-50" />
                </button>
              </div>

              {/* Sports Category */}
              <div>
                <div className="space-y-1">
                  {Object.values(sportsConfig).map((sport) => {
                    const isActive = location.pathname === sport.path;
                    return (
                      <button
                        key={sport.key}
                        onClick={() => handleNavigate(sport.path)}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl font-bold text-sm transition-colors ${isActive
                          ? 'bg-gray-900 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{sport.icon}</span>
                          <span>{sport.name}</span>
                        </div>
                        {sport.liveMatch.isLive && (
                          <span className="text-[10px] font-black bg-rose-600 text-white px-2 py-0.5 rounded-md">
                            LIVE
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Stage Performance Link */}
              <div>
                <div className="flex items-center gap-2 px-3 mb-2 text-xs font-extrabold text-gray-400 uppercase tracking-wider">
                  <Music className="w-3.5 h-3.5 text-purple-500" />
                  <span>무대 공연</span>
                </div>
                <div className="space-y-1">
                  <button
                    onClick={() => handleNavigate('/stages')}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl font-bold text-sm transition-colors ${location.pathname === '/stages'
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">🎤</span>
                      <span>무대 타임테이블</span>
                    </div>
                    {stageConfig.isLive && (
                      <span className="text-[10px] font-black bg-purple-600 text-white px-2 py-0.5 rounded-md">
                        LIVE
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* General Category */}
              <div>
                <div className="px-3 mb-2 text-xs font-extrabold text-gray-400 uppercase tracking-wider">
                  안내 및 부대시설
                </div>
                <div className="space-y-1">
                  <button
                    onClick={() => handleNavigate('/map')}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl font-bold text-sm transition-colors ${location.pathname === '/map'
                      ? 'bg-rose-50 text-postech border border-rose-200'
                      : 'text-gray-700 hover:bg-gray-100'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-postech" />
                      <span>캠퍼스맵 & 길찾기</span>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-50" />
                  </button>

                  <button
                    onClick={() => handleNavigate('/booths')}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl font-bold text-sm transition-colors ${location.pathname === '/booths'
                      ? 'bg-amber-50 text-amber-600 border border-amber-200'
                      : 'text-gray-700 hover:bg-gray-100'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <Store className="w-4 h-4 text-amber-500" />
                      <span>체험 & 동아리 부스</span>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-50" />
                  </button>

                  <button
                    onClick={() => handleNavigate('/foodtrucks')}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl font-bold text-sm transition-colors ${location.pathname === '/foodtrucks'
                      ? 'bg-orange-50 text-orange-600 border border-orange-200'
                      : 'text-gray-700 hover:bg-gray-100'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <Truck className="w-4 h-4 text-orange-500" />
                      <span>푸드트럭 안내</span>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-50" />
                  </button>

                  <button
                    onClick={() => handleNavigate('/contact')}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl font-bold text-sm transition-colors ${location.pathname === '/contact'
                      ? 'bg-blue-50 text-blue-600 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-100'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <PhoneCall className="w-4 h-4 text-blue-600" />
                      <span>문의 (담당자 / 오픈채팅)</span>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-50" />
                  </button>

                  <button
                    onClick={() => handleNavigate('/sponsors')}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl font-bold text-sm transition-colors ${location.pathname === '/sponsors'
                      ? 'bg-slate-900 text-amber-400 border border-slate-700'
                      : 'text-gray-700 hover:bg-gray-100'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <Building2 className="w-4 h-4 text-amber-500" />
                      <span>후원 기업 안내</span>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-50" />
                  </button>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-gray-100 bg-slate-50 text-center flex items-center justify-between">
              <p className="text-xs text-gray-500 font-medium">
                2026 STadium 준비위원회
              </p>
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  navigate('/admin');
                }}
                className="text-[11px] font-bold text-gray-400 hover:text-postech underline transition-colors"
              >
                관리자
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
