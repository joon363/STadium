import React from 'react';
import { MatchItem, SCHOOLS } from '../config/stadiumConfig';
import { MapPin, Clock, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SportsGridCardProps {
  match: MatchItem;
  path: string;
  layout?: 'grid' | 'horizontal';
}

export const SportsGridCard: React.FC<SportsGridCardProps> = ({
  match,
  path,
  layout = 'horizontal',
}) => {
  const navigate = useNavigate();

  const isUpcoming =
    !match.isLive &&
    (match.countdownText !== undefined ||
      match.statusText.includes('예정') ||
      match.startTimeObj.getTime() > Date.now());
  const isFinished = !match.isLive && !isUpcoming;

  const team1School = SCHOOLS[match.team1] || {
    color: '#64748b',
    bgLight: '#f1f5f9',
    logoText: match.team1.slice(0, 1),
    logoUrl: '/postech.png',
  };
  const team2School = SCHOOLS[match.team2] || {
    color: '#64748b',
    bgLight: '#f1f5f9',
    logoText: match.team2.slice(0, 1),
    logoUrl: '/kaist.png',
  };

  const isTeam1Winning = match.score1 > match.score2;
  const isTeam2Winning = match.score2 > match.score1;

  if (layout === 'horizontal') {
    return (
      <div
        onClick={() => navigate(path)}
        className="bg-white border border-gray-200/90 hover:border-gray-300 rounded-xl px-3 py-2.5 flex flex-col gap-1.5 shadow-2xs hover:shadow-xs transition-colors cursor-pointer active:scale-[0.99] select-none"
      >
        {/* Top Header: Sport Name, Round, Status Tag */}
        <div className="flex items-center justify-between text-xs text-gray-500 border-b border-gray-100 pb-1">
          <div className="flex items-center gap-1.5 font-bold text-gray-800">
            <span className="text-sm">{match.icon}</span>
            <span className="font-bold text-xs text-gray-900">{match.sportName}</span>
            <span className="text-gray-300">·</span>
            <span className="text-[11px] font-medium text-gray-500">{match.round}</span>
          </div>

          <div className="flex items-center gap-1.5">
            {match.isLive ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200 px-2 py-0.2 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                LIVE
              </span>
            ) : isFinished ? (
              <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-0.2 rounded-full">
                종료
              </span>
            ) : (
              <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.2 rounded-full">
                {match.countdownText ? `시작까지 ${match.countdownText}` : '예정'}
              </span>
            )}
          </div>
        </div>

        {/* Score & Teams Row: Clean Stand-Alone School Logos */}
        <div className="flex items-center justify-between py-1">
          {/* Team 1 Logo */}
          <div className="flex items-center justify-start flex-1 min-w-0">
            <img
              src={team1School.logoUrl}
              alt={match.team1}
              className="h-6 w-auto max-w-[85px] object-contain shrink-0"
            />
          </div>

          {/* Center Score & Match Status */}
          <div className="flex flex-col items-center justify-center px-2 min-w-[76px]">
            <div className="flex items-center gap-1.5 text-base font-bold tracking-tight leading-none">
              <span style={isTeam1Winning ? { color: team1School.color } : { color: '#0f172a' }}>
                {match.score1}
              </span>
              <span className="text-gray-300 font-light">-</span>
              <span style={isTeam2Winning ? { color: team2School.color } : { color: '#0f172a' }}>
                {match.score2}
              </span>
            </div>
            <div className="text-[10px] font-bold text-gray-500 mt-0.5 leading-none">
              {match.statusText}
            </div>
          </div>

          {/* Team 2 Logo */}
          <div className="flex items-center justify-end flex-1 min-w-0">
            <img
              src={team2School.logoUrl}
              alt={match.team2}
              className="h-6 w-auto max-w-[85px] object-contain shrink-0"
            />
          </div>
        </div>

        {/* Footer: Venue and Time */}
        <div className="flex items-center justify-between text-[10px] font-medium text-gray-500 pt-1 border-t border-gray-50">
          <div className="flex items-center gap-1 truncate max-w-[85%]">
            <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
            <span className="truncate">{match.venue}</span>
            <span className="text-gray-300">·</span>
            <Clock className="w-3 h-3 text-gray-400 shrink-0" />
            <span>{match.timeRangeText}</span>
          </div>
          <div className="flex items-center text-gray-400 shrink-0">
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    );
  }

  // Grid layout (Stand-alone School Logos)
  return (
    <div
      onClick={() => navigate(path)}
      className="bg-white border border-gray-200/90 hover:border-gray-300 rounded-xl p-2.5 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-colors cursor-pointer active:scale-[0.99] select-none min-h-[110px]"
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 font-bold text-gray-900 text-xs">
          <span>{match.icon}</span>
          <span className="truncate font-bold">{match.sportName}</span>
        </div>

        {match.isLive ? (
          <span className="text-[9px] font-bold bg-rose-50 text-rose-600 border border-rose-200 px-1.5 py-0.2 rounded-full">
            LIVE
          </span>
        ) : isFinished ? (
          <span className="text-[9px] font-bold bg-gray-100 text-gray-500 px-1.5 py-0.2 rounded">
            종료
          </span>
        ) : (
          <span className="text-[9px] font-bold bg-blue-50 text-blue-600 px-1.5 py-0.2 rounded">
            예정
          </span>
        )}
      </div>

      {/* Teams & Score Row */}
      <div className="my-1.5">
        <div className="flex items-center justify-between text-center">
          {/* Team 1 Logo */}
          <div className="flex items-center justify-center flex-1 min-w-0 h-9">
            <img
              src={team1School.logoUrl}
              alt={match.team1}
              loading="eager"
              decoding="async"
              className="h-7 w-auto max-w-[65px] object-contain shrink-0"
            />
          </div>

          {/* Score */}
          <div className="px-1 text-sm font-bold flex items-center gap-1">
            <span style={isTeam1Winning ? { color: team1School.color } : { color: '#111827' }}>
              {match.score1}
            </span>
            <span className="text-gray-300 font-normal">:</span>
            <span style={isTeam2Winning ? { color: team2School.color } : { color: '#111827' }}>
              {match.score2}
            </span>
          </div>

          {/* Team 2 Logo */}
          <div className="flex items-center justify-center flex-1 min-w-0 h-9">
            <img
              src={team2School.logoUrl}
              alt={match.team2}
              loading="eager"
              decoding="async"
              className="h-7 w-auto max-w-[65px] object-contain shrink-0"
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-[9px] text-gray-500 border-t border-gray-100 pt-1">
        <span className="truncate font-bold text-gray-700">{match.statusText}</span>
        <span className="truncate text-gray-400">{match.venue}</span>
      </div>
    </div>
  );
};
