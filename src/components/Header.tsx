import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Home, MapPin, PhoneCall, Trophy, Music, ChevronRight, Filter } from 'lucide-react';
import { useRealtimeSchedule } from '../hooks/useRealtimeSchedule';
import { useSchool } from '../context/SchoolContext';
import { SCHOOLS } from '../config/stadiumConfig';

export const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { sportsConfig, stageConfig } = useRealtimeSchedule();
  const { selectedSchool, setSelectedSchool } = useSchool();

  const activeSchoolObj = selectedSchool !== 'ALL' ? SCHOOLS[selectedSchool] : null;

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  // Header background style
  const headerStyle: React.CSSProperties = activeSchoolObj
    ? { backgroundColor: activeSchoolObj.color, color: activeSchoolObj.textColor }
    : { backgroundColor: '#ffffff', color: '#111827' };

  return (
    <>
      {/* Top Navigation Bar */}
      <header
        style={headerStyle}
        className="sticky top-0 z-40 border-b border-gray-200/40 px-4 flex items-center justify-between shadow-2xs transition-colors duration-200"
      >
        <div className="flex items-center gap-3">
          {/* Hamburger Menu Button */}
          <button
            onClick={() => setIsMenuOpen(true)}
            className={`touch-target p-2 -ml-2 rounded-lg transition-colors ${activeSchoolObj ? 'hover:bg-white/10 active:bg-white/20 text-white' : 'text-gray-800 hover:bg-gray-100'
              }`}
            aria-label="메뉴 열기"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Title / Brand */}
          <div
            onClick={() => handleNavigate('/')}
            className="cursor-pointer flex items-center gap-2 select-none"
          >
            <span className={`font-black text-xl tracking-tight ${activeSchoolObj ? 'text-white' : 'text-postech'}`}>
              STadium
            </span>
          </div>
        </div>

        {/* Top Right School Selector Dropdown */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={selectedSchool}
              onChange={(e) => setSelectedSchool(e.target.value)}
              className={`appearance-none text-xs font-black px-3 py-1.5 pr-7 rounded-lg border cursor-pointer focus:outline-none transition-colors ${activeSchoolObj
                ? 'bg-white/20 border-white/40 text-white hover:bg-white/30'
                : 'bg-gray-100 border-gray-300 text-gray-900 hover:bg-gray-200'
                }`}
            >
              <option value="ALL" className="text-gray-900 font-bold bg-white">
                학교 선택: 모두
              </option>
              {Object.values(SCHOOLS).map((sch) => (
                <option key={sch.id} value={sch.id} className="text-gray-900 font-bold bg-white">
                  {sch.shortName}
                </option>
              ))}
            </select>
            <Filter
              className={`w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none ${activeSchoolObj ? 'text-white' : 'text-gray-600'
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
            className="fixed inset-0 bg-black/60 transition-opacity"
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Drawer Content Container */}
          <div className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-150 text-gray-900">
            {/* Drawer Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div>
                <h2 className="font-extrabold text-lg text-gray-900">2026 STadium</h2>
                <p className="text-xs text-gray-500 font-medium">POSTECH 교류전 당일 안내</p>
              </div>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="touch-target p-2 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Home Link */}
              <div>
                <button
                  onClick={() => handleNavigate('/')}
                  className={`w-full flex items-center justify-between p-3 rounded-lg font-bold text-sm transition-colors ${location.pathname === '/'
                    ? 'bg-rose-50 text-postech border border-rose-200'
                    : 'text-gray-800 hover:bg-gray-50'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <Home className="w-4 h-4" />
                    <span>홈</span>
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-50" />
                </button>
              </div>

              {/* Sports Category */}
              <div>
                <div className="flex items-center gap-2 px-3 mb-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <Trophy className="w-3.5 h-3.5 text-amber-600" />
                  <span>운동경기</span>
                </div>
                <div className="space-y-1">
                  {Object.values(sportsConfig).map((sport) => {
                    const isActive = location.pathname === sport.path;
                    return (
                      <button
                        key={sport.key}
                        onClick={() => handleNavigate(sport.path)}
                        className={`w-full flex items-center justify-between p-2.5 rounded-lg font-semibold text-sm transition-colors ${isActive
                          ? 'bg-gray-900 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-base">{sport.icon}</span>
                          <span>{sport.name}</span>
                        </div>
                        {sport.liveMatch.isLive && (
                          <span className="text-[10px] font-bold bg-postech text-white px-2 py-0.5 rounded-md">
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
                <div className="flex items-center gap-2 px-3 mb-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <Music className="w-3.5 h-3.5 text-rose-500" />
                  <span>무대 공연</span>
                </div>
                <div className="space-y-1">
                  <button
                    onClick={() => handleNavigate('/stages')}
                    className={`w-full flex items-center justify-between p-2.5 rounded-lg font-semibold text-sm transition-colors ${location.pathname === '/stages'
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-base">🎤</span>
                      <span>체육관 무대 공연</span>
                    </div>
                    {stageConfig.isLive && (
                      <span className="text-[10px] font-bold bg-postech text-white px-2 py-0.5 rounded-md">
                        LIVE
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* General Category */}
              <div>
                <div className="px-3 mb-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  안내 및 지원
                </div>
                <div className="space-y-1">
                  <button
                    onClick={() => handleNavigate('/map')}
                    className={`w-full flex items-center justify-between p-3 rounded-lg font-semibold text-sm transition-colors ${location.pathname === '/map'
                      ? 'bg-rose-50 text-postech border border-rose-200'
                      : 'text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-postech" />
                      <span>캠퍼스맵</span>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-50" />
                  </button>

                  <button
                    onClick={() => handleNavigate('/contact')}
                    className={`w-full flex items-center justify-between p-3 rounded-lg font-semibold text-sm transition-colors ${location.pathname === '/contact'
                      ? 'bg-rose-50 text-postech border border-rose-200'
                      : 'text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <PhoneCall className="w-4 h-4 text-blue-600" />
                      <span>문의 (담당자 / 오픈채팅)</span>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-50" />
                  </button>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 text-center flex items-center justify-between">
              <p className="text-xs text-gray-500 font-medium">
                2026 STadium 준비위원회 (포준위)
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
