import React from 'react';
import { MatchItem, SCHOOLS } from '../config/stadiumConfig';
import { MapPin, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SportsGridCardProps {
  match: MatchItem;
  path: string;
}

export const SportsGridCard: React.FC<SportsGridCardProps> = ({ match, path }) => {
  const navigate = useNavigate();

  // Check if match has not started yet (upcoming)
  const isUpcoming = !match.isLive && (match.countdownText !== undefined || match.statusText.includes('예정') || match.startTimeObj.getTime() > Date.now());
  const isFinished = !match.isLive && !isUpcoming;

  // When match is finished, display ONLY "모든 {종목명} 경기가 종료되었습니다." text in the card!
  if (isFinished) {
    return (
      <div
        onClick={() => navigate(path)}
        className="bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-xl p-3 flex items-center justify-center text-center shadow-2xs transition-colors cursor-pointer select-none min-h-[110px]"
      >
        <span className="font-extrabold text-xs text-gray-800 leading-snug">
          모든 {match.sportName} 경기가 <br /> 종료되었습니다.
        </span>
      </div>
    );
  }

  // Find winning team color config
  const winningSchool = match.winningTeam ? SCHOOLS[match.winningTeam] : null;

  const team1School = SCHOOLS[match.team1];
  const team2School = SCHOOLS[match.team2];

  const isTeam1Winning = match.score1 > match.score2;
  const isTeam2Winning = match.score2 > match.score1;

  const score1Style: React.CSSProperties = isTeam1Winning && team1School
    ? { color: team1School.color }
    : { color: '#111827' };

  const score2Style: React.CSSProperties = isTeam2Winning && team2School
    ? { color: team2School.color }
    : { color: '#111827' };

  // Background and border style: If upcoming, apply gray gradient!
  const bgStyle: React.CSSProperties = isUpcoming
    ? { background: 'linear-gradient(135deg, #f9fafb 0%, #e5e7eb 100%)', borderColor: '#d1d5db' }
    : match.isLive && winningSchool
      ? { backgroundColor: winningSchool.bgLight, borderColor: winningSchool.color }
      : winningSchool
        ? { backgroundColor: winningSchool.bgLight, borderColor: winningSchool.color }
        : { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' };

  const badgeStyle = winningSchool
    ? { backgroundColor: winningSchool.color, color: winningSchool.textColor }
    : { backgroundColor: '#374151', color: '#ffffff' };

  return (
    <div
      onClick={() => navigate(path)}
      style={bgStyle}
      className="border rounded-xl p-3 flex flex-col justify-between shadow-2xs hover:border-gray-400 transition-colors cursor-pointer relative overflow-hidden select-none"
    >
      {/* Top Bar: Icon, Name & Status badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-bold text-gray-900 text-sm">
          <span className="text-base">{match.icon}</span>
          <span className="truncate">{match.sportName}</span>
        </div>

        {match.isLive ? (
          <span
            style={badgeStyle}
            className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider animate-pulse"
          >
            LIVE
          </span>
        ) : (
          <span className="text-[10px] font-extrabold bg-gray-300 border border-gray-400 text-gray-800 px-2 py-0.5 rounded-md">
            시작전
          </span>
        )}
      </div>

      {/* Match Content */}
      <div className="my-1.5">
        {/* Teams & Score */}
        <div className="flex items-center justify-between text-center font-bold">
          {/* Team 1 */}
          <div className="flex flex-col items-center flex-1">
            <span className="text-xs text-gray-900 font-extrabold">{match.team1}</span>
          </div>

          {/* Score display */}
          <div className="px-2.5 py-0.5 rounded-md bg-white border border-gray-300 text-base font-black shadow-2xs flex items-center gap-1">
            <span style={score1Style}>{match.score1}</span>
            <span className="text-gray-400 font-bold">:</span>
            <span style={score2Style}>{match.score2}</span>
          </div>

          {/* Team 2 */}
          <div className="flex flex-col items-center flex-1">
            <span className="text-xs text-gray-900 font-extrabold">{match.team2}</span>
          </div>
        </div>

        {/* Subtitle notice if any */}
        {match.subtitle && (
          <div className="mt-1.5 text-[10px] font-medium text-gray-700 bg-white/90 border border-gray-200 rounded-md px-1.5 py-0.5 text-center truncate">
            {match.subtitle}
          </div>
        )}
      </div>

      {/* Bottom Info: Status & Venue */}
      <div className="flex items-center justify-between text-[11px] font-medium text-gray-600 border-gray-300/80 pt-1.5 mt-auto">
        <div className="flex items-center gap-1 text-gray-800 font-bold truncate max-w-[55%]">
          <Clock className="w-3 h-3 text-postech shrink-0" />
          <span className="truncate">{match.statusText}</span>
        </div>
        <div className="flex items-center gap-0.5 text-gray-700 font-semibold truncate max-w-[45%]">
          <MapPin className="w-3 h-3 text-postech shrink-0" />
          <span className="truncate">{match.venue}</span>
        </div>
      </div>
    </div>
  );
};
