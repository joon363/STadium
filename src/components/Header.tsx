import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, Radio } from 'lucide-react';
import { useRealtimeSchedule } from '../hooks/useRealtimeSchedule';
import { useSchool } from '../context/SchoolContext';
import { SCHOOLS } from '../config/stadiumConfig';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const { sportsConfig } = useRealtimeSchedule();
  const { selectedSchool, setSelectedSchool } = useSchool();

  const activeSchoolObj = selectedSchool !== 'ALL' ? SCHOOLS[selectedSchool] : null;

  // Count live matches
  const liveMatchCount = Object.values(sportsConfig).filter((s) => s.liveMatch.isLive).length;

  return (
    <header
      style={
        activeSchoolObj
          ? { backgroundColor: activeSchoolObj.color, color: activeSchoolObj.textColor }
          : { backgroundColor: '#ffffff', color: '#111827' }
      }
      className="sticky top-0 z-40 border-b border-gray-200/90 px-4 py-2 flex items-center justify-between shadow-2xs transition-colors duration-200"
    >
      {/* Brand Logo Title */}
      <div
        onClick={() => navigate('/')}
        className="cursor-pointer flex items-center gap-2 select-none"
      >
        <span
          className={`font-black text-xl tracking-tight ${
            activeSchoolObj ? 'text-white' : 'text-postech'
          }`}
        >
          STadium
        </span>
      </div>

      {/* Right School Selector Pill */}
      <div className="flex items-center gap-2">
        {liveMatchCount > 0 && (
          <div
            className={`hidden sm:flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
              activeSchoolObj
                ? 'bg-white/20 text-white border border-white/30'
                : 'text-rose-600 bg-rose-50 border border-rose-200'
            }`}
          >
            <Radio className="w-3 h-3" />
            <span>{liveMatchCount}경기 진행중</span>
          </div>
        )}

        <div className="relative">
          <select
            value={selectedSchool}
            onChange={(e) => setSelectedSchool(e.target.value)}
            className={`appearance-none text-xs font-bold pl-3 pr-7 py-1 rounded-full border cursor-pointer focus:outline-none transition-all shadow-2xs ${
              activeSchoolObj
                ? 'bg-white/20 border-white/40 text-white font-bold hover:bg-white/30'
                : 'bg-white border-gray-200 text-gray-800 hover:bg-gray-50'
            }`}
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
            className={`w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${
              activeSchoolObj ? 'text-white' : 'text-gray-400'
            }`}
          />
        </div>
      </div>
    </header>
  );
};
