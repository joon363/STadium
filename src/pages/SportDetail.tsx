import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SCHOOLS, SportKey } from '../config/stadiumConfig';
import { useRealtimeSchedule } from '../hooks/useRealtimeSchedule';
import { TournamentBracket } from '../components/TournamentBracket';
import { TournamentTreeData } from '../types/tournamentTree';
import { getSupabaseTournamentTree } from '../lib/supabase';
import { ArrowLeft, Clock, MapPin, Radio, ChevronRight, Calendar, Trophy } from 'lucide-react';

export const SportDetail: React.FC = () => {
  const { sportKey } = useParams<{ sportKey: string }>();
  const navigate = useNavigate();
  const { sportsConfig, youtubeLiveUrl, now } = useRealtimeSchedule();

  const [activeTab, setActiveTab] = useState<'timeline' | 'bracket'>('timeline');
  const [treeData, setTreeData] = useState<TournamentTreeData | null>(null);

  useEffect(() => {
    if (sportKey) {
      getSupabaseTournamentTree(sportKey).then((data) => {
        if (data) setTreeData(data);
      });
    }
  }, [sportKey]);

  const config = sportKey ? sportsConfig[sportKey] : null;
  const nowMs = now.getTime();

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
          <span>{config.name}</span>
        </div>

        {/* Right placeholder to keep layout balanced */}
        <div className="w-9" />
      </div>

      <div className="p-3 space-y-3">
        {/* 2. Match Scoreboard Hero Card */}
        <section className="bg-white border border-gray-200 rounded-2xl p-3.5 shadow-2xs">
          {/* Middle Scoreboard Area with Winner Slices */}
          <div className="relative overflow-hidden -mx-3.5 p-3.5">
            {/* Left-side Winner Graphic (If Team 1 is winning) */}
            {isTeam1Winning && (
              <>
                <div
                  className="absolute top-0 left-0 w-1.5 h-full pointer-events-none z-0"
                  style={{ backgroundColor: team1School.color }}
                />
                <svg
                  className="absolute top-0 left-0 h-full w-32 pointer-events-none z-0"
                  preserveAspectRatio="none"
                  viewBox="0 0 100 100"
                >
                  <polygon
                    points="0,0 48,0 60,100 0,100"
                    fill={team1School.color}
                    fillOpacity="0.22"
                  />
                  <polygon
                    points="48,0 72,0 84,100 60,100"
                    fill={team1School.color}
                    fillOpacity="0.10"
                  />
                  <polygon
                    points="72,0 86,0 98,100 84,100"
                    fill={team1School.color}
                    fillOpacity="0.03"
                  />
                </svg>
              </>
            )}

            {/* Right-side Winner Graphic (If Team 2 is winning) */}
            {isTeam2Winning && (
              <>
                <div
                  className="absolute top-0 right-0 w-1.5 h-full pointer-events-none z-0"
                  style={{ backgroundColor: team2School.color }}
                />
                <svg
                  className="absolute top-0 right-0 h-full w-32 pointer-events-none z-0"
                  preserveAspectRatio="none"
                  viewBox="0 0 100 100"
                >
                  <polygon
                    points="52,0 100,0 100,100 40,100"
                    fill={team2School.color}
                    fillOpacity="0.22"
                  />
                  <polygon
                    points="28,0 52,0 40,100 16,100"
                    fill={team2School.color}
                    fillOpacity="0.10"
                  />
                  <polygon
                    points="14,0 28,0 16,100 2,100"
                    fill={team2School.color}
                    fillOpacity="0.03"
                  />
                </svg>
              </>
            )}

            <div className="relative z-10 flex items-center justify-between">
              {/* Team 1 Standalone Logo */}
              <div className="flex items-center justify-center flex-1 min-w-0 h-14">
                <img
                  src={team1School.logoUrl}
                  alt={liveMatch.team1}
                  loading="eager"
                  decoding="async"
                  className="h-11 w-auto max-w-[100px] object-contain"
                />
              </div>

              {/* Score & Status Center */}
              <div className="flex flex-col items-center justify-center px-3">
                <div className="mb-0.5">
                  {liveMatch.isLive ? (
                    <a
                      href={youtubeLiveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] font-bold bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 px-2.5 py-0.5 rounded-full active:scale-95 transition-all shadow-2xs cursor-pointer"
                    >
                      <Radio className="w-3 h-3 text-rose-500 animate-pulse" />
                      <span>LIVE · {liveMatch.statusText}</span>
                      <ChevronRight className="w-3 h-3 text-rose-500" />
                    </a>
                  ) : (
                    <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full">
                      {liveMatch.statusText}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2.5 text-3xl font-bold tracking-tight my-0.5">
                  <span
                    style={isTeam1Winning ? { color: team1School.color } : { color: '#0f172a' }}
                  >
                    {liveMatch.score1}
                  </span>
                  <span className="text-gray-300 font-light">:</span>
                  <span
                    style={isTeam2Winning ? { color: team2School.color } : { color: '#0f172a' }}
                  >
                    {liveMatch.score2}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-[11px] font-bold text-gray-500">
                  <MapPin className="w-3 h-3 text-gray-400" />
                  <span>{liveMatch.venue}</span>
                </div>
              </div>

              {/* Team 2 Standalone Logo */}
              <div className="flex items-center justify-center flex-1 min-w-0 h-14">
                <img
                  src={team2School.logoUrl}
                  alt={liveMatch.team2}
                  loading="eager"
                  decoding="async"
                  className="h-11 w-auto max-w-[100px] object-contain"
                />
              </div>
            </div>
          </div>
        </section>

        {/* 3. Segmented Control Tabs */}
        <section className="bg-white border border-gray-200 rounded-xl p-1 shadow-2xs flex items-center">
          {[
            { key: 'timeline', label: '경기 타임라인', icon: <Calendar className="w-3.5 h-3.5" /> },
            { key: 'bracket', label: '토너먼트 현황', icon: <Trophy className="w-3.5 h-3.5" /> },
          ].map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 select-none ${
                  isActive
                    ? 'bg-postech text-white shadow-xs font-bold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </section>

        {/* 4. Tab Content: Timeline (Cultural Performance Style Connected Vertical Timeline) */}
        {activeTab === 'timeline' && (
          <section className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-gray-600 px-1">
              <span>{config.name} 전체 경기 타임라인</span>
              <span className="text-[11px] font-medium text-gray-400">
                총 {config.schedule.length}경기
              </span>
            </div>

            <div className="relative pl-7 space-y-3 pt-1">
              {/* Continuous Vertical Timeline Connecting Line */}
              <div className="absolute left-2.5 top-4 bottom-4 w-0.5 bg-gray-200 -translate-x-1/2 z-0" />

              {config.schedule.map((item, idx) => {
                const t1 = SCHOOLS[item.team1] || {
                  color: '#64748b',
                  shortName: item.team1,
                  logoText: item.team1.slice(0, 1),
                  logoUrl: '/postech.png',
                };
                const t2 = SCHOOLS[item.team2] || {
                  color: '#64748b',
                  shortName: item.team2,
                  logoText: item.team2.slice(0, 1),
                  logoUrl: '/kaist.png',
                };
                const isT1Win = item.score1 > item.score2;
                const isT2Win = item.score2 > item.score1;
                const isFinished = !item.isLive && item.startTimeObj.getTime() < nowMs;

                return (
                  <div key={item.id || idx} className="relative">
                    {/* Timeline Node Circle - Perfectly Centered on the line */}
                    <div className="absolute -left-[18px] top-4 -translate-x-1/2 -translate-y-1/2 z-10">
                      {item.isLive ? (
                        <div className="w-3.5 h-3.5 rounded-full bg-rose-600 ring-4 ring-rose-100 shadow-sm animate-pulse" />
                      ) : isFinished ? (
                        <div className="w-2.5 h-2.5 rounded-full bg-gray-300 border border-white" />
                      ) : (
                        <div className="w-2.5 h-2.5 rounded-full bg-slate-700 border border-white" />
                      )}
                    </div>

                    {/* Card Container */}
                    <div
                      className={`bg-white border rounded-2xl p-3 shadow-2xs transition-all ${
                        item.isLive
                          ? 'border-rose-400 ring-2 ring-rose-100 shadow-xs'
                          : isFinished
                            ? 'border-gray-200 bg-white'
                            : 'border-gray-200/90'
                      }`}
                    >
                      {/* Top Row: Clean round & status */}
                      <div className="flex items-center justify-between text-xs text-gray-500 border-b border-gray-100 pb-2 mb-1.5">
                        <span className="font-extrabold text-gray-800">{item.round}</span>
                        <div className="flex items-center gap-2">
                          {item.isLive ? (
                            <a
                              href={youtubeLiveUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-0.5 text-[10px] font-bold bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 px-2 py-0.5 rounded-full active:scale-95 transition-all cursor-pointer"
                            >
                              <Radio className="w-2.5 h-2.5 text-rose-500 animate-pulse" />
                              <span>LIVE</span>
                              <ChevronRight className="w-2.5 h-2.5 text-rose-500" />
                            </a>
                          ) : item.startTimeObj.getTime() > nowMs ? (
                            <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                              {item.countdownText || '예정'}
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                              종료
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Middle Score & Teams Row with Winner Slices */}
                      <div className="relative overflow-hidden -mx-3 py-1.5 px-3">
                        {/* Left-side Winner Graphic (If Team 1 won/winning) */}
                        {isT1Win && (
                          <>
                            <div
                              className="absolute top-0 left-0 w-1 h-full pointer-events-none z-0"
                              style={{ backgroundColor: t1.color }}
                            />
                            <svg
                              className="absolute top-0 left-0 h-full w-24 pointer-events-none z-0"
                              preserveAspectRatio="none"
                              viewBox="0 0 100 100"
                            >
                              <polygon
                                points="0,0 48,0 60,100 0,100"
                                fill={t1.color}
                                fillOpacity="0.22"
                              />
                              <polygon
                                points="48,0 72,0 84,100 60,100"
                                fill={t1.color}
                                fillOpacity="0.10"
                              />
                              <polygon
                                points="72,0 86,0 98,100 84,100"
                                fill={t1.color}
                                fillOpacity="0.03"
                              />
                            </svg>
                          </>
                        )}

                        {/* Right-side Winner Graphic (If Team 2 won/winning) */}
                        {isT2Win && (
                          <>
                            <div
                              className="absolute top-0 right-0 w-1 h-full pointer-events-none z-0"
                              style={{ backgroundColor: t2.color }}
                            />
                            <svg
                              className="absolute top-0 right-0 h-full w-24 pointer-events-none z-0"
                              preserveAspectRatio="none"
                              viewBox="0 0 100 100"
                            >
                              <polygon
                                points="52,0 100,0 100,100 40,100"
                                fill={t2.color}
                                fillOpacity="0.22"
                              />
                              <polygon
                                points="28,0 52,0 40,100 16,100"
                                fill={t2.color}
                                fillOpacity="0.10"
                              />
                              <polygon
                                points="14,0 28,0 16,100 2,100"
                                fill={t2.color}
                                fillOpacity="0.03"
                              />
                            </svg>
                          </>
                        )}

                        <div className="relative z-10 flex items-center justify-between">
                          {/* Team 1: Color Badge */}
                          <div className="flex items-center flex-1 justify-start min-w-0">
                            <div
                              style={{ backgroundColor: t1.color }}
                              className="h-6 rounded flex items-center justify-center px-2 font-bold text-white text-xs shrink-0 border border-white/20 shadow-2xs"
                            >
                              {item.team1}
                            </div>
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

                          {/* Team 2: Color Badge */}
                          <div className="flex items-center flex-1 justify-end min-w-0 text-right">
                            <div
                              style={{ backgroundColor: t2.color }}
                              className="h-6 rounded flex items-center justify-center px-2 font-bold text-white text-xs shrink-0 border border-white/20 shadow-2xs"
                            >
                              {item.team2}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Row: Clean venue & time */}
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
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 5. Tab Content: Dynamic Tournament Bracket */}
        {activeTab === 'bracket' && (
          <section className="space-y-2">
            <TournamentBracket
              matches={config.schedule}
              treeData={treeData || undefined}
              sportName={config.name}
              sportKey={(sportKey || 'soccer') as SportKey}
            />
          </section>
        )}
      </div>
    </div>
  );
};
