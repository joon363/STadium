import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SCHOOLS } from '../config/stadiumConfig';
import { useRealtimeSchedule } from '../hooks/useRealtimeSchedule';
import { useSchool } from '../context/SchoolContext';
import { SportsGridCard } from '../components/SportsGridCard';
import { LeaderboardSection } from '../components/LeaderboardSection';
import { Music, ChevronRight, Filter, Radio, List, LayoutGrid, ArrowLeftRight } from 'lucide-react';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { sportsConfig, stageConfig, overallStandings, getYoutubeLiveUrl } = useRealtimeSchedule();
  const { selectedSchool, setSelectedSchool } = useSchool();

  // View Mode: 'grid' (2x2) | 'list' (stacked full-width)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Gym Sport Switch: 'basketball' | 'badminton'
  const [gymSport, setGymSport] = useState<'basketball' | 'badminton'>('basketball');

  const stageSchool = SCHOOLS[stageConfig.school] || SCHOOLS.POSTECH;
  const activeSchoolObj = selectedSchool !== 'ALL' ? SCHOOLS[selectedSchool] : null;

  // Badminton match resolution across men, women, mixed
  const isAnyBadmintonLive =
    sportsConfig.badminton_men?.liveMatch?.isLive ||
    sportsConfig.badminton_women?.liveMatch?.isLive ||
    sportsConfig.badminton_mixed?.liveMatch?.isLive;

  const badmintonMatch = isAnyBadmintonLive
    ? (sportsConfig.badminton_men?.liveMatch?.isLive
      ? sportsConfig.badminton_men.liveMatch
      : sportsConfig.badminton_women?.liveMatch?.isLive
        ? sportsConfig.badminton_women.liveMatch
        : sportsConfig.badminton_mixed?.liveMatch || sportsConfig.badminton?.liveMatch)
    : sportsConfig.badminton?.liveMatch || sportsConfig.badminton_men?.liveMatch;

  const basketballMatch = sportsConfig.basketball?.liveMatch;

  // Selected 4th match and route
  const fourthMatch = gymSport === 'basketball' ? basketballMatch : badmintonMatch;
  const fourthPath = gymSport === 'basketball' ? '/basketball' : '/badminton';
  const fourthKey = gymSport === 'basketball' ? 'basketball' : 'badminton';

  // All 4 primary sports matches
  const matchItems = [
    { key: 'soccer', match: sportsConfig.soccer?.liveMatch, path: sportsConfig.soccer?.path || '/soccer' },
    { key: 'baseball', match: sportsConfig.baseball?.liveMatch, path: sportsConfig.baseball?.path || '/baseball' },
    { key: 'lol', match: sportsConfig.lol?.liveMatch, path: sportsConfig.lol?.path || '/lol' },
    { key: fourthKey, match: fourthMatch, path: fourthPath },
  ];

  return (
    <div className="flex flex-col gap-5 p-3 text-gray-900">
      {/* School Filter Active Bar (If selected in top header) */}
      {activeSchoolObj && (
        <div
          style={{ backgroundColor: activeSchoolObj.bgLight, borderColor: activeSchoolObj.color }}
          className="border rounded-xl p-2.5 flex items-center justify-between shadow-2xs"
        >
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4" style={{ color: activeSchoolObj.color }} />
            <span className="text-xs font-bold text-gray-900">
              <strong style={{ color: activeSchoolObj.color }}>{activeSchoolObj.shortName}</strong>{' '}
              경기 필터링 적용 중
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

      {/* 1. Live Matches Section (Grid or List View) */}
      <section className="space-y-2">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-2 gap-2">
            {matchItems.map((item) => (
              <SportsGridCard key={item.key} match={item.match} path={item.path} layout="grid" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {matchItems.map((item) => (
              <SportsGridCard key={item.key} match={item.match} path={item.path} layout="horizontal" />
            ))}
          </div>
        )}

        {/* 2 Wide Horizontal Action Buttons: List/Grid Toggle + Basketball/Badminton Swap */}
        <div className="grid grid-cols-2 gap-2 pt-0.5">
          {/* Button 1: Grid <-> List Toggle */}
          <button
            onClick={() => setViewMode((prev) => (prev === 'grid' ? 'list' : 'grid'))}
            className="w-full py-2 px-3 bg-white hover:bg-gray-50 active:bg-gray-100 border border-gray-200/90 rounded-xl text-xs font-bold text-gray-700 flex items-center justify-center gap-1.5 shadow-2xs hover:shadow-xs transition-all select-none"
          >
            {viewMode === 'grid' ? (
              <>
                <List className="w-3.5 h-3.5 text-gray-500" />
                <span>리스트 보기</span>
              </>
            ) : (
              <>
                <LayoutGrid className="w-3.5 h-3.5 text-gray-500" />
                <span>그리드 보기</span>
              </>
            )}
          </button>

          {/* Button 2: Basketball <-> Badminton Sport Swap */}
          <button
            onClick={() => setGymSport((prev) => (prev === 'basketball' ? 'badminton' : 'basketball'))}
            className="w-full py-2 px-3 bg-white hover:bg-gray-50 active:bg-gray-100 border border-gray-200/90 rounded-xl text-xs font-bold text-gray-700 flex items-center justify-center gap-1.5 shadow-2xs hover:shadow-xs transition-all select-none"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-postech" />
            <span>{gymSport === 'basketball' ? '배드민턴으로 전환' : '농구로 전환'}</span>
          </button>
        </div>
      </section>

      {/* 2. Live Stage Performance Section */}
      <section className="space-y-1.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <Music className="w-4 h-4 text-postech" />
            <h2 className="font-extrabold text-sm text-gray-900 tracking-tight">문화공연</h2>
          </div>

          <div>
            {stageConfig.isLive ? (
              <a
                href={getYoutubeLiveUrl('stage')}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-[10px] font-extrabold bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 px-2 py-0.5 rounded-full uppercase flex items-center gap-1 active:scale-95 transition-all shadow-2xs cursor-pointer"
              >
                <Radio className="w-3 h-3 text-rose-500" />
                <span>STAGE LIVE</span>
                <ChevronRight className="w-3 h-3 text-rose-500" />
              </a>
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
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span style={{ color: stageSchool.color }} className="font-bold text-xs shrink-0">
                  {stageSchool.shortName}
                </span>
                <span className="font-extrabold text-xs text-gray-900 truncate">
                  {stageConfig.clubName}
                </span>
                <span className="text-[9px] font-bold bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.2 rounded shrink-0">
                  {stageConfig.category}
                </span>
                {stageConfig.genre && (
                  <span className="text-[9px] font-bold bg-gray-100 text-gray-600 px-1.5 py-0.2 rounded border border-gray-200 shrink-0">
                    {stageConfig.genre}
                  </span>
                )}
              </div>
            </div>
          </div>

          <ChevronRight className="w-4 h-4 text-gray-400 shrink-0 ml-2" />
        </div>
      </section>

      {/* 3. Overall Leaderboard Section */}
      <LeaderboardSection standings={overallStandings} />
    </div>
  );
};
