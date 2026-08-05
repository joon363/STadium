import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SCHOOLS } from '../config/stadiumConfig';
import { useRealtimeSchedule } from '../hooks/useRealtimeSchedule';
import { useSchool } from '../context/SchoolContext';
import { SportsGridCard } from '../components/SportsGridCard';
import { LeaderboardSection } from '../components/LeaderboardSection';
import { MapPin, PhoneCall, Music, Radio, ChevronRight, Trophy, Filter, Store, Truck, Building2 } from 'lucide-react';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { sportsConfig, stageConfig, overallStandings, now } = useRealtimeSchedule();
  const { selectedSchool } = useSchool();

  const stageSchool = SCHOOLS[stageConfig.school] || SCHOOLS.POSTECH;
  const activeSchoolObj = selectedSchool !== 'ALL' ? SCHOOLS[selectedSchool] : null;

  // Check if all sports matches are finished
  const areAllMatchesFinished = Object.values(sportsConfig).every((sport) =>
    sport.schedule.every(
      (m) => !m.isLive && now.getTime() > m.endTimeObj.getTime()
    )
  );

  // Dynamically determine active/upcoming Gymnasium match for 4th cell
  const badmintonMatch = sportsConfig.badminton.liveMatch;
  const basketballMatch = sportsConfig.basketball.liveMatch;

  const gymMatch = badmintonMatch.isLive
    ? badmintonMatch
    : basketballMatch.isLive
      ? basketballMatch
      : badmintonMatch.startTimeObj.getTime() <= basketballMatch.startTimeObj.getTime()
        ? badmintonMatch
        : basketballMatch;

  const gymPath = `/${gymMatch.sportKey}`;

  return (
    <div className="flex flex-col gap-2 p-3">
      {/* School Filter Active Banner */}
      {activeSchoolObj && (
        <div
          style={{ backgroundColor: activeSchoolObj.bgLight, borderColor: activeSchoolObj.color }}
          className="border rounded-xl p-3 flex items-center justify-between shadow-2xs animate-in fade-in duration-200"
        >
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4" style={{ color: activeSchoolObj.color }} />
            <span className="text-xs font-bold text-gray-900">
              <strong style={{ color: activeSchoolObj.color }}>{activeSchoolObj.shortName}</strong> 경기 및 일정 필터링 적용 중
            </span>
          </div>
          <span
            style={{ backgroundColor: activeSchoolObj.color, color: activeSchoolObj.textColor }}
            className="text-[10px] font-black px-2 py-0.5 rounded-md"
          >
            {activeSchoolObj.shortName}
          </span>
        </div>
      )}

      {/* 1. Sports Matches Section */}
      <section className="space-y-2">
        {areAllMatchesFinished && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center flex items-center justify-center gap-2 shadow-2xs">
            <Trophy className="w-4 h-4 text-amber-600 shrink-0" />
            <h3 className="font-extrabold text-xs text-amber-900">2026 STadium 모든 스포츠 경기가 종료되었습니다.</h3>
          </div>
        )}

        {/* 2x2 Sports Grid Cards (Every card displays individual finished status when ended) */}
        <div className="grid grid-cols-2 gap-2">
          <SportsGridCard
            match={sportsConfig.soccer.liveMatch}
            path={sportsConfig.soccer.path}
          />
          <SportsGridCard
            match={sportsConfig.baseball.liveMatch}
            path={sportsConfig.baseball.path}
          />
          <SportsGridCard
            match={sportsConfig.lol.liveMatch}
            path={sportsConfig.lol.path}
          />
          {/* 4th Cell: Dynamically shows Badminton or Basketball */}
          <SportsGridCard
            match={gymMatch}
            path={gymPath}
          />
        </div>
      </section>

      {/* 2. Live Performance Banner (Horizontally Long) -> Clicks to /stages */}
      <section
        onClick={() => navigate('/stages')}
        className="bg-slate-800 text-white rounded-xl px-2.5 py-2.5 border border-slate-800 shadow-sm relative overflow-hidden cursor-pointer hover:border-slate-700 transition-colors"
      >
        {/* Current Performance Detail */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* School Badge */}
            <div
              style={{ backgroundColor: stageSchool.color }}
              className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-sm shrink-0 border border-white/20"
            >
              {stageSchool.logoText}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-black text-sm text-white truncate">
                  {stageConfig.clubName}
                </span>
                <span className="text-[9px] font-semibold bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded shrink-0">
                  {stageConfig.genre}
                </span>
              </div>

              <p className="text-[11px] text-slate-300 font-medium truncate mt-0.5 flex items-center gap-1">
                <Music className="w-3 h-3 text-rose-400 shrink-0" />
                <span className="truncate">{stageConfig.songTitle}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {stageConfig.isLive ? (
              <span className="text-[10px] font-bold bg-postech text-white px-2 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1">
                <Radio className="w-3 h-3 text-white animate-pulse" />
                LIVE
              </span>
            ) : (
              <span className="text-[10px] font-semibold bg-slate-700 text-slate-300 px-2 py-0.5 rounded-md">
                대기
              </span>
            )}
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>
        </div>
      </section>

      {/* 3. Overall Leaderboard Section (Active Standings Below Stage Live) */}
      <LeaderboardSection standings={overallStandings} />

      {/* 4. Info Banners (Campus Map, Booths, Food Trucks, Contact, Sponsors) */}
      <section className="grid grid-cols-2 gap-2">
        {/* Booth Guide Banner */}
        <button
          onClick={() => navigate('/booths')}
          className="bg-white border border-gray-200 hover:border-gray-300 rounded-xl p-3 flex flex-col justify-between items-start shadow-2xs transition-colors group touch-target"
        >
          <div className="flex items-center justify-between w-full">
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <Store className="w-3.5 h-3.5" />
            </div>

            <div className="">
              <h4 className="font-bold text-xs text-gray-900">부스 안내</h4>
              <p className="text-[10px] text-gray-500 font-medium">체험 & 동아리 부스</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>
        </button>

        {/* Food Truck Banner */}
        <button
          onClick={() => navigate('/foodtrucks')}
          className="bg-white border border-gray-200 hover:border-gray-300 rounded-xl p-3 flex flex-col justify-between items-start shadow-2xs transition-colors group touch-target"
        >
          <div className="flex items-center justify-between w-full">
            <div className="w-7 h-7 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100">
              <Truck className="w-3.5 h-3.5" />
            </div>

            <div className="">
              <h4 className="font-bold text-xs text-gray-900">푸드트럭</h4>
              <p className="text-[10px] text-gray-500 font-medium">먹거리 & 위치</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>
        </button>

        {/* Campus Map Banner */}
        <button
          onClick={() => navigate('/map')}
          className="bg-white border border-gray-200 hover:border-gray-300 rounded-xl p-3 flex flex-col justify-between items-start shadow-2xs transition-colors group touch-target"
        >
          <div className="flex items-center justify-between w-full">
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-postech flex items-center justify-center border border-rose-100">
              <MapPin className="w-3.5 h-3.5" />
            </div>

            <div className="">
              <h4 className="font-bold text-xs text-gray-900">캠퍼스맵</h4>
              <p className="text-[10px] text-gray-500 font-medium">위치 & 길찾기</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>
        </button>

        {/* Contact Banner */}
        <button
          onClick={() => navigate('/contact')}
          className="bg-white border border-gray-200 hover:border-gray-300 rounded-xl p-3 flex flex-col justify-between items-start shadow-2xs transition-colors group touch-target"
        >
          <div className="flex items-center justify-between w-full">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <PhoneCall className="w-3.5 h-3.5" />
            </div>

            <div className="">
              <h4 className="font-bold text-xs text-gray-900">문의</h4>
              <p className="text-[10px] text-gray-500 font-medium">담당자 연락처</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>
        </button>

        {/* Sponsors Banner */}
        <button
          onClick={() => navigate('/sponsors')}
          className="col-span-2 rounded-xl p-3 gap-2 flex items-center justify-between shadow-xs transition-transform active:scale-[0.99] touch-target bg-white border border-gray-200 hover:border-gray-300 "
        >
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-extrabold text-xs">2026 STadium 후원 기업</h4>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>
      </section>
    </div>
  );
};
