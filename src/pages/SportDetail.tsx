import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SCHOOLS, SportKey } from '../config/stadiumConfig';
import { useRealtimeSchedule } from '../hooks/useRealtimeSchedule';
import { ArrowLeft, Clock, MapPin, Radio, Award } from 'lucide-react';

export const SportDetail: React.FC = () => {
  const { sportKey } = useParams<{ sportKey: string }>();
  const navigate = useNavigate();
  const { sportsConfig, overallStandings } = useRealtimeSchedule();

  const [activeTab, setActiveTab] = useState<'timeline' | 'standings'>('timeline');

  const config = sportKey ? sportsConfig[sportKey] : null;

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return <span className="text-sm">🥇</span>;
      case 2:
        return <span className="text-sm">🥈</span>;
      case 3:
        return <span className="text-sm">🥉</span>;
      default:
        return <span className="text-xs font-bold text-gray-500 w-4 text-center">{rank}</span>;
    }
  };

  // Sport-specific standings calculation
  const sportStandings = useMemo(() => {
    if (!sportKey || !config) return [];
    return overallStandings
      .map((school) => {
        const sp = school.breakdown[sportKey as SportKey] || {
          rank: 6,
          points: 1,
          sportName: config.name,
        };
        return {
          schoolId: school.schoolId,
          schoolName: school.schoolName,
          shortName: school.shortName,
          logoText: school.logoText,
          color: school.color,
          bgLight: school.bgLight,
          rank: sp.rank,
          points: sp.points,
        };
      })
      .sort((a, b) => a.rank - b.rank);
  }, [overallStandings, sportKey, config]);

  if (!config) {
    return (
      <div className="p-8 text-center bg-white min-h-screen flex flex-col items-center justify-center">
        <p className="text-gray-600 font-bold mb-4">존재하지 않는 종목입니다.</p>
        <button
          onClick={() => navigate('/')}
          className="px-5 py-2.5 bg-postech text-white rounded-xl text-sm font-bold shadow-xs"
        >
          홈으로 돌아가기
        </button>
      </div>
    );
  }

  const liveMatch = config.liveMatch;
  const team1School = SCHOOLS[liveMatch.team1] || {
    color: '#64748b',
    bgLight: '#f1f5f9',
    logoText: liveMatch.team1.slice(0, 1),
    logoUrl: '/postech.png',
    shortName: liveMatch.team1,
  };
  const team2School = SCHOOLS[liveMatch.team2] || {
    color: '#64748b',
    bgLight: '#f1f5f9',
    logoText: liveMatch.team2.slice(0, 1),
    logoUrl: '/kaist.png',
    shortName: liveMatch.team2,
  };

  const isTeam1Winning = liveMatch.score1 > liveMatch.score2;
  const isTeam2Winning = liveMatch.score2 > liveMatch.score1;

  return (
    <div className="flex flex-col min-h-full bg-slate-50 text-gray-900 pb-10">
      {/* 1. Top Detail Header Bar */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-1 flex items-center justify-between shadow-2xs relative">
        <button
          onClick={() => navigate('/')}
          className="p-2 -ml-2 rounded-xl text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors touch-target z-10"
          aria-label="뒤로가기"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5 font-bold text-base text-gray-900 pointer-events-none">
          <span>{config.icon}</span>
          <span>{config.name} 경기</span>
        </div>

        {/* Right placeholder to keep layout balanced */}
        <div className="w-9" />
      </div>

      <div className="p-3 space-y-3">
        {/* 2. Match Scoreboard Hero Card (Retains Standalone Logos) */}
        <section className="bg-white border border-gray-200 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            {/* Team 1 Standalone Logo */}
            <div className="flex items-center justify-center flex-1 min-w-0 h-16">
              <img
                src={team1School.logoUrl}
                alt={liveMatch.team1}
                loading="eager"
                decoding="async"
                className="h-12 w-auto max-w-[110px] object-contain"
              />
            </div>

            {/* Score & Status Center */}
            <div className="flex flex-col items-center justify-center px-4">
              <div className="mb-1">
                {liveMatch.isLive ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200 px-2.5 py-0.5 rounded-full">
                    <Radio className="w-3 h-3" />
                    LIVE · {liveMatch.statusText}
                  </span>
                ) : (
                  <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full">
                    {liveMatch.statusText}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 text-3xl font-bold tracking-tight my-0.5">
                <span style={isTeam1Winning ? { color: team1School.color } : { color: '#0f172a' }}>
                  {liveMatch.score1}
                </span>
                <span className="text-gray-300 font-light">:</span>
                <span style={isTeam2Winning ? { color: team2School.color } : { color: '#0f172a' }}>
                  {liveMatch.score2}
                </span>
              </div>

              <div className="flex items-center gap-1 text-[11px] font-bold text-gray-500 mt-1">
                <MapPin className="w-3 h-3 text-gray-400" />
                <span>{liveMatch.venue}</span>
              </div>
            </div>

            {/* Team 2 Standalone Logo */}
            <div className="flex items-center justify-center flex-1 min-w-0 h-16">
              <img
                src={team2School.logoUrl}
                alt={liveMatch.team2}
                loading="eager"
                decoding="async"
                className="h-12 w-auto max-w-[110px] object-contain"
              />
            </div>
          </div>
        </section>

        {/* 3. Segmented Control Tabs */}
        <section className="bg-white border border-gray-200 rounded-xl p-1 shadow-2xs flex items-center">
          {[
            { key: 'timeline', label: '타임라인' },
            { key: 'standings', label: `${config.name} 순위` },
          ].map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all text-center select-none ${
                  isActive
                    ? 'bg-postech text-white shadow-xs font-bold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </section>

        {/* 4. Tab Content: Timeline (Reverted to School Color Badges + Text) */}
        {activeTab === 'timeline' && (
          <section className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-gray-600 px-1">
              <span>{config.name} 전체 경기 일정</span>
              <span>총 {config.schedule.length}경기</span>
            </div>

            <div className="space-y-2">
              {config.schedule.map((item) => {
                const t1 = SCHOOLS[item.team1] || {
                  color: '#64748b',
                  logoText: item.team1.slice(0, 1),
                  logoUrl: '/postech.png',
                };
                const t2 = SCHOOLS[item.team2] || {
                  color: '#64748b',
                  logoText: item.team2.slice(0, 1),
                  logoUrl: '/kaist.png',
                };
                const isT1Win = item.score1 > item.score2;
                const isT2Win = item.score2 > item.score1;

                return (
                  <div
                    key={item.id}
                    className={`bg-white border rounded-2xl p-3.5 shadow-2xs transition-all ${
                      item.isLive ? 'border-rose-400 ring-2 ring-rose-100' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs text-gray-500 border-b border-gray-100 pb-2 mb-2">
                      <span className="font-extrabold text-gray-800">{item.round}</span>
                      <div className="flex items-center gap-2">
                        {item.isLive ? (
                          <span className="text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200 px-2 py-0.5 rounded-full">
                            LIVE
                          </span>
                        ) : item.startTimeObj.getTime() > Date.now() ? (
                          <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                            예정
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                            종료
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-1.5">
                      {/* Team 1: Color Badge + Text */}
                      <div className="flex items-center gap-2 flex-1 justify-start min-w-0">
                        <div
                          style={{ backgroundColor: t1.color }}
                          className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-white text-[10px] shrink-0 border border-white/20"
                        >
                          {t1.logoText}
                        </div>
                        <span
                          className={`text-xs truncate ${isT1Win ? 'font-bold text-gray-900' : 'font-bold text-gray-700'}`}
                        >
                          {item.team1}
                        </span>
                      </div>

                      {/* Score */}
                      <div className="flex flex-col items-center px-3 min-w-[70px]">
                        <div className="text-base font-bold flex items-center gap-1.5">
                          <span style={isT1Win ? { color: t1.color } : { color: '#0f172a' }}>
                            {item.score1}
                          </span>
                          <span className="text-gray-300">-</span>
                          <span style={isT2Win ? { color: t2.color } : { color: '#0f172a' }}>
                            {item.score2}
                          </span>
                        </div>
                      </div>

                      {/* Team 2: Text + Color Badge */}
                      <div className="flex items-center gap-2 flex-1 justify-end min-w-0 text-right">
                        <span
                          className={`text-xs truncate ${isT2Win ? 'font-bold text-gray-900' : 'font-bold text-gray-700'}`}
                        >
                          {item.team2}
                        </span>
                        <div
                          style={{ backgroundColor: t2.color }}
                          className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-white text-[10px] shrink-0 border border-white/20"
                        >
                          {t2.logoText}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-gray-500 pt-2 mt-1 border-t border-gray-50 font-medium">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span>{item.timeRangeText}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        <span>{item.venue}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 5. Tab Content: Sport-Specific Standings (Text + Color Badges) */}
        {activeTab === 'standings' && (
          <section className="space-y-2 select-none">
            <div className="flex items-center justify-between text-xs font-bold text-gray-600 px-1">
              <span>{config.name} 종목별 순위표</span>
              <span>총 {sportStandings.length}개교</span>
            </div>

            <div className="space-y-1.5">
              {sportStandings.map((item) => {
                const percent = Math.min(100, Math.round((item.points / 6) * 100));
                return (
                  <div
                    key={item.schoolId}
                    style={{
                      background: `linear-gradient(to right, ${item.bgLight} ${percent}%, #ffffff ${percent}%)`,
                      borderColor: item.color,
                    }}
                    className="border rounded-xl px-3 py-2 flex items-center justify-between shadow-2xs transition-all overflow-hidden"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-5 flex items-center justify-center shrink-0">
                        {getRankBadge(item.rank)}
                      </div>
                      <div
                        style={{ backgroundColor: item.color }}
                        className="w-6 h-6 rounded flex items-center justify-center font-bold text-white text-xs shrink-0 border border-white/20 shadow-2xs"
                      >
                        {item.logoText}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-gray-900">{item.shortName}</span>
                        <span className="text-[10px] text-gray-500 font-medium hidden sm:inline">
                          {item.schoolName}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 bg-white/90 border border-gray-200 px-2.5 py-0.5 rounded-lg shadow-2xs font-bold text-xs">
                      <Award className="w-3 h-3 text-amber-500" />
                      <span style={{ color: item.color }}>{item.rank}위</span>
                      <span className="text-gray-300">·</span>
                      <span className="text-gray-700">{item.points}pt</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
