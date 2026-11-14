import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, Radio, RotateCw } from 'lucide-react';
import { useRealtimeSchedule } from '../hooks/useRealtimeSchedule';
import { useSchool } from '../context/SchoolContext';
import { useLanguage } from '../context/LanguageContext';
import { SCHOOLS } from '../config/stadiumConfig';
import { LanguageToggle } from './LanguageToggle';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const { sportsConfig, refreshFromSupabase } = useRealtimeSchedule();
  const { selectedSchool, setSelectedSchool } = useSchool();
  const { t } = useLanguage();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const activeSchoolObj = selectedSchool !== 'ALL' ? SCHOOLS[selectedSchool] : null;

  // Count live matches
  const liveMatchCount = Object.values(sportsConfig).filter(
    (s) => s.key !== 'badminton' && s.liveMatch.isLive
  ).length;

  const handleManualRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await refreshFromSupabase();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  return (
    <header
      style={
        activeSchoolObj
          ? { backgroundColor: activeSchoolObj.color, color: activeSchoolObj.textColor }
          : { backgroundColor: '#ffffff', color: '#111827' }
      }
      className="sticky top-0 z-40 border-b border-gray-200/90 px-3 sm:px-4 py-3 flex items-center justify-between gap-2 shadow-2xs transition-colors duration-200"
    >
      {/* Brand Logo Title */}
      <div
        onClick={() => navigate('/')}
        className="cursor-pointer flex items-center gap-2 select-none shrink-0"
      >
        <span
          className={`font-extrabold text-xl tracking-tight ${activeSchoolObj ? 'text-white' : 'text-postech'
            }`}
        >
          {t('header.brand')}
        </span>
      </div>

      {/* Right Controls: Live Badge, School Selector, Language Toggle, Refresh */}
      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
        {liveMatchCount > 0 && (
          <div
            className={`hidden sm:flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${activeSchoolObj
                ? 'bg-white/20 text-white border border-white/30'
                : 'text-rose-600 bg-rose-50 border border-rose-200'
              }`}
          >
            <Radio className="w-3 h-3" />
            <span>{t('header.liveMatches', { count: liveMatchCount })}</span>
          </div>
        )}

        <div className="relative min-w-0">
          <select
            value={selectedSchool}
            onChange={(e) => setSelectedSchool(e.target.value)}
            className={`appearance-none text-xs font-bold pl-2.5 sm:pl-3 pr-6 sm:pr-7 py-1 rounded-full border cursor-pointer focus:outline-none transition-all shadow-2xs max-w-[116px] sm:max-w-none truncate ${activeSchoolObj
                ? 'bg-white/20 border-white/40 text-white font-bold hover:bg-white/30'
                : 'bg-white border-gray-200 text-gray-800 hover:bg-gray-50'
              }`}
          >
            <option value="ALL" className="text-gray-900 font-bold bg-white">
              {t('header.allSchools')}
            </option>
            {Object.values(SCHOOLS).map((sch) => (
              <option key={sch.id} value={sch.id} className="text-gray-900 font-bold bg-white">
                {sch.shortName}
              </option>
            ))}
          </select>
          <Filter
            className={`w-3.5 h-3.5 absolute right-2 sm:right-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${activeSchoolObj ? 'text-white' : 'text-gray-400'
              }`}
          />
        </div>

        {/* KOR / ENG Language Switch Button */}
        <LanguageToggle variant={activeSchoolObj ? 'school' : 'light'} />

        <button
          type="button"
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          title={t('common.refreshTooltip')}
          aria-label={t('common.refresh')}
          className={`p-1.5 rounded-full border transition-all shadow-2xs cursor-pointer shrink-0 ${
            activeSchoolObj
              ? 'bg-white/20 border-white/40 text-white hover:bg-white/30'
              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </header>
  );
};
