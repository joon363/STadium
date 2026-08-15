import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SCHOOLS } from '../config/stadiumConfig';
import { useRealtimeSchedule } from '../hooks/useRealtimeSchedule';
import { useSchool } from '../context/SchoolContext';
import { SportsGridCard } from '../components/SportsGridCard';
import { LeaderboardSection } from '../components/LeaderboardSection';
import {
  MapPin,
  PhoneCall,
  Music,
  Radio,
  ChevronRight,
  Filter,
  Store,
  Truck,
  Building2,
  Grid2X2,
  List
} from 'lucide-react';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { sportsConfig, stageConfig, overallStandings } = useRealtimeSchedule();
  const { selectedSchool, setSelectedSchool } = useSchool();

  const [viewLayout, setViewLayout] = useState<'horizontal' | 'grid'>('horizontal');

  const stageSchool = SCHOOLS[stageConfig.school] || SCHOOLS.POSTECH;
  const activeSchoolObj = selectedSchool !== 'ALL' ? SCHOOLS[selectedSchool] : null;

  // Gymnasium match logic for 4th spot
  const badmintonMatch = sportsConfig.badminton.liveMatch;
  const basketballMatch = sportsConfig.basketball.liveMatch;
  const gymMatch = badmintonMatch.isLive
    ? badmintonMatch
    : basketballMatch.isLive
      ? basketballMatch
      : badmintonMatch.startTimeObj.getTime() <= basketballMatch.startTimeObj.getTime()
        ? badmintonMatch
        : basketballMatch;

  // All 4 primary sports matches
  const matchItems = [
    { key: 'soccer', match: sportsConfig.soccer.liveMatch, path: sportsConfig.soccer.path },
    { key: 'baseball', match: sportsConfig.baseball.liveMatch, path: sportsConfig.baseball.path },
    { key: 'lol', match: sportsConfig.lol.liveMatch, path: sportsConfig.lol.path },
    { key: gymMatch.sportKey, match: gymMatch, path: `/${gymMatch.sportKey}` },
  ];

  const liveMatchesCount = matchItems.filter(m => m.match.isLive).length;

  return (
    <div className="flex flex-col gap-2.5 p-3 text-gray-900">
      {/* School Filter Active Bar (If selected in top header) */}
      {activeSchoolObj && (
        <div
          style={{ backgroundColor: activeSchoolObj.bgLight, borderColor: activeSchoolObj.color }}
          className="border rounded-xl p-2.5 flex items-center justify-between shadow-2xs"
        >
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4" style={{ color: activeSchoolObj.color }} />
            <span className="text-xs font-bold text-gray-900">
              <strong style={{ color: activeSchoolObj.color }}>{activeSchoolObj.shortName}</strong> 경기 필터링 적용 중
            </span>
          </div>
          <button
            onClick={() => setSelectedSchool('ALL')}
            className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/80 border text-gray-600 hover:text-gray-900"
          >
            전체보기
          </button>
        </div>
      )}

      {/* 1. Live Matches Section */}
      <section className="space-y-1.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-rose-600"></span>
            <h2 className="font-bold text-sm text-gray-900 tracking-tight">실시간 경기 현황</h2>
            {liveMatchesCount > 0 && (
              <span className="text-[10px] font-extrabold bg-rose-50 text-rose-600 border border-rose-200 px-2 py-0.2 rounded-full">
                {liveMatchesCount}경기 진행중
              </span>
            )}
          </div>

          {/* Toggle View Layout (Horizontal List vs 2x2 Grid) */}
          <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg border border-gray-200/80">
            <button
              onClick={() => setViewLayout('horizontal')}
              className={`p-1 rounded-md text-xs transition-colors ${viewLayout === 'horizontal' ? 'bg-white text-gray-900 shadow-2xs font-bold' : 'text-gray-500'}`}
              title="리스트 보기"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewLayout('grid')}
              className={`p-1 rounded-md text-xs transition-colors ${viewLayout === 'grid' ? 'bg-white text-gray-900 shadow-2xs font-bold' : 'text-gray-500'}`}
              title="그리드 보기"
            >
              <Grid2X2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Matches (Shortened List or Grid) */}
        {viewLayout === 'horizontal' ? (
          <div className="flex flex-col gap-1.5">
            {matchItems.map((item) => (
              <SportsGridCard
                key={item.key}
                match={item.match}
                path={item.path}
                layout="horizontal"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-1.5">
            {matchItems.map((item) => (
              <SportsGridCard
                key={item.key}
                match={item.match}
                path={item.path}
                layout="grid"
              />
            ))}
          </div>
        )}
      </section>

      {/* 2. Live Stage Performance Section */}
      <section className="space-y-1.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <Music className="w-4 h-4 text-postech" />
            <h2 className="font-black text-sm text-gray-900 tracking-tight">체육관 무대 공연</h2>
          </div>

          <div>
            {stageConfig.isLive ? (
              <span className="text-[10px] font-black bg-rose-50 text-rose-600 border border-rose-200 px-2 py-0.2 rounded-full uppercase">
                STAGE LIVE
              </span>
            ) : (
              <span className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.2 rounded-full">
                공연 대기중
              </span>
            )}
          </div>
        </div>

        {/* Card Box */}
        <div
          onClick={() => navigate('/stages')}
          className="bg-white text-gray-900 rounded-xl p-3 border border-gray-200/90 shadow-2xs relative overflow-hidden cursor-pointer hover:border-gray-300 transition-colors select-none active:scale-[0.99] flex items-center justify-between"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {/* School Emblem */}
            <div
              style={{ backgroundColor: stageSchool.color }}
              className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-sm shrink-0 shadow-2xs border border-white/20"
            >
              {stageSchool.logoText}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xs text-gray-900 truncate">
                  {stageConfig.clubName}
                </span>
                <span className="text-[9px] font-semibold bg-gray-100 text-gray-600 px-1.5 py-0.2 rounded border border-gray-200 shrink-0">
                  {stageConfig.genre}
                </span>
              </div>

              <p className="text-[11px] text-gray-600 font-medium truncate mt-0.5 flex items-center gap-1">
                <span className="text-postech font-bold">곡:</span>
                <span className="truncate">{stageConfig.songTitle}</span>
              </p>
            </div>
          </div>

          <ChevronRight className="w-4 h-4 text-gray-400 shrink-0 ml-2" />
        </div>
      </section>

      {/* 3. Overall Leaderboard Section */}
      <LeaderboardSection standings={overallStandings} />

      {/* 4. Quick Action Navigation Grid (Booths, Food Trucks, Campus Map, Contact, Sponsors) */}
      <section className="space-y-1.5 pt-0.5">
        <div className="px-1 font-bold text-xs text-gray-500 uppercase tracking-wider">
          행사 안내 & 부대시설
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {/* Campus Map */}
          <button
            onClick={() => navigate('/map')}
            className="bg-white border border-gray-200/90 hover:border-gray-300 rounded-xl p-2.5 flex items-center justify-between shadow-2xs transition-colors active:scale-[0.99] touch-target text-left"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-rose-50 text-postech flex items-center justify-center shrink-0 border border-rose-100">
                <MapPin className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <h4 className="font-extrabold text-xs text-gray-900 truncate">캠퍼스맵</h4>
                <p className="text-[10px] text-gray-500 truncate">위치 & 길찾기</p>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          </button>

          {/* Booth Guide */}
          <button
            onClick={() => navigate('/booths')}
            className="bg-white border border-gray-200/90 hover:border-gray-300 rounded-xl p-2.5 flex items-center justify-between shadow-2xs transition-colors active:scale-[0.99] touch-target text-left"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
                <Store className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <h4 className="font-extrabold text-xs text-gray-900 truncate">부스 안내</h4>
                <p className="text-[10px] text-gray-500 truncate">체험 & 동아리</p>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          </button>

          {/* Food Truck */}
          <button
            onClick={() => navigate('/foodtrucks')}
            className="bg-white border border-gray-200/90 hover:border-gray-300 rounded-xl p-2.5 flex items-center justify-between shadow-2xs transition-colors active:scale-[0.99] touch-target text-left"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 border border-orange-100">
                <Truck className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <h4 className="font-extrabold text-xs text-gray-900 truncate">푸드트럭</h4>
                <p className="text-[10px] text-gray-500 truncate">먹거리 & 위치</p>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          </button>

          {/* Contact */}
          <button
            onClick={() => navigate('/contact')}
            className="bg-white border border-gray-200/90 hover:border-gray-300 rounded-xl p-2.5 flex items-center justify-between shadow-2xs transition-colors active:scale-[0.99] touch-target text-left"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                <PhoneCall className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <h4 className="font-extrabold text-xs text-gray-900 truncate">문의</h4>
                <p className="text-[10px] text-gray-500 truncate">담당자 & 카톡</p>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          </button>

          {/* Sponsors */}
          <button
            onClick={() => navigate('/sponsors')}
            className="col-span-2 bg-slate-900 text-white rounded-xl p-2.5 flex items-center justify-between shadow-xs hover:bg-slate-800 transition-colors active:scale-[0.99] touch-target text-left border border-slate-800"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                <Building2 className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="font-extrabold text-xs text-white">2026 STadium 공식 후원사</h4>
                <p className="text-[10px] text-slate-400">포스텍 총학생회 및 후원 기업</p>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
          </button>
        </div>
      </section>
    </div>
  );
};
