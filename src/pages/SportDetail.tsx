import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SCHOOLS, SportKey, MatchItem } from '../config/stadiumConfig';
import { useRealtimeSchedule } from '../hooks/useRealtimeSchedule';
import { TournamentBracket } from '../components/TournamentBracket';
import { TournamentTreeData } from '../types/tournamentTree';
import { getSupabaseTournamentTree, subscribeToRealtimeTables } from '../lib/supabase';
import { ArrowLeft, Clock, MapPin, Radio, ChevronRight, Calendar, Trophy } from 'lucide-react';

export const SportDetail: React.FC = () => {
  const { sportKey } = useParams<{ sportKey: string }>();
  const navigate = useNavigate();
  const { sportsConfig, getYoutubeLiveUrl, now } = useRealtimeSchedule();

  const [activeTab, setActiveTab] = useState<'timeline' | 'bracket'>('timeline');
  const [treeData, setTreeData] = useState<TournamentTreeData | null>(null);

  // Dedicated trees for 3 badminton divisions
  const [badmintonTrees, setBadmintonTrees] = useState<{
    men: TournamentTreeData | null;
    women: TournamentTreeData | null;
    mixed: TournamentTreeData | null;
  }>({ men: null, women: null, mixed: null });

  const isBadminton = sportKey === 'badminton';

  useEffect(() => {
    if (!sportKey) return;

    let isMounted = true;
    const fetchTree = () => {
      if (isBadminton) {
        Promise.all([
          getSupabaseTournamentTree('badminton_men', true),
          getSupabaseTournamentTree('badminton_women', true),
          getSupabaseTournamentTree('badminton_mixed', true),
        ]).then(([men, women, mixed]) => {
          if (isMounted) {
            setBadmintonTrees({ men, women, mixed });
          }
        });
      } else {
        getSupabaseTournamentTree(sportKey, true).then((data) => {
          if (isMounted) {
            setTreeData(data);
          }
        });
      }
    };

    fetchTree();

    // 1. WebSocket Subscription for instant zero-latency tournament tree updates
    const unsubscribe = subscribeToRealtimeTables(['tournament_trees', 'admin_settings'], () => {
      fetchTree();
    });

    // 2. Fallback Long Polling (60s) & Tab Focus
    const interval = setInterval(fetchTree, 60000);
    const handleFocus = () => fetchTree();
    window.addEventListener('focus', handleFocus);

    return () => {
      isMounted = false;
      unsubscribe();
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [sportKey, isBadminton]);

  const config = sportKey ? sportsConfig[sportKey] : null;
  const nowMs = now.getTime();

  // Badminton sub-sports
  const menConfig = sportsConfig['badminton_men'];
  const womenConfig = sportsConfig['badminton_women'];
  const mixedConfig = sportsConfig['badminton_mixed'];

  // Badminton timeline slots grouped dynamically by matching time slot
  const badmintonTimelineSlots = useMemo(() => {
    if (!isBadminton) return [];

    const menSchedule = (menConfig?.schedule || []).map((m) => ({
      division: '남자 복식',
      tag: '남복',
      tagColor: 'bg-blue-600 text-white border-blue-600',
      match: m,
    }));
    const womenSchedule = (womenConfig?.schedule || []).map((m) => ({
      division: '여자 복식',
      tag: '여복',
      tagColor: 'bg-rose-600 text-white border-rose-600',
      match: m,
    }));
    const mixedSchedule = (mixedConfig?.schedule || []).map((m) => ({
      division: '혼성 복식',
      tag: '혼복',
      tagColor: 'bg-purple-600 text-white border-purple-600',
      match: m,
    }));

    const allMatches = [...menSchedule, ...womenSchedule, ...mixedSchedule];
    if (allMatches.length === 0) return [];

    // Group matches by timeRangeText (e.g. '10:00 - 11:30')
    const groupMap = new Map<
      string,
      {
        timeKey: string;
        timeRangeText: string;
        startTimeMs: number;
        venue: string;
        matches: Array<{
          division: string;
          tag: string;
          tagColor: string;
          match: MatchItem;
        }>;
      }
    >();

    allMatches.forEach((item) => {
      const timeKey = item.match.timeRangeText || `${item.match.startTimeObj.getTime()}`;
      if (!groupMap.has(timeKey)) {
        groupMap.set(timeKey, {
          timeKey,
          timeRangeText: item.match.timeRangeText || '',
          startTimeMs: item.match.startTimeObj.getTime(),
          venue: item.match.venue || '체육관',
          matches: [],
        });
      }
      groupMap.get(timeKey)!.matches.push(item);
    });

    // Sort time groups chronologically
    const sortedGroups = Array.from(groupMap.values()).sort(
      (a, b) => a.startTimeMs - b.startTimeMs
    );

    return sortedGroups.map((group) => {
      const isLive = group.matches.some((m) => m.match.isLive);
      const isFinished = group.matches.every(
        (m) => !m.match.isLive && m.match.startTimeObj.getTime() < nowMs
      );

      const uniqueRounds = Array.from(new Set(group.matches.map((m) => m.match.round)));
      const roundLabel =
        uniqueRounds.length === 1
          ? uniqueRounds[0]
          : uniqueRounds.length > 1
            ? uniqueRounds.join(', ')
            : '배드민턴 매치';

      return {
        timeRangeText: group.timeRangeText,
        roundLabel,
        venue: group.venue,
        isLive,
        isFinished,
        matches: group.matches,
      };
    });
  }, [isBadminton, menConfig, womenConfig, mixedConfig, nowMs]);

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

  // Check if any badminton division is live
  const isAnyBadmintonLive =
    Boolean(menConfig?.liveMatch?.isLive || womenConfig?.liveMatch?.isLive || mixedConfig?.liveMatch?.isLive);

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
        {isBadminton ? (
          /* Specialized 3-Row Live Hero Card for Badminton (동시 진행 3부문) */
          <section className="bg-white border border-gray-200 rounded-2xl p-3.5 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-1.5 font-extrabold text-xs text-slate-800">
                <span>🏸 체육관 배드민턴 동시 진행 현황</span>
              </div>
              {isAnyBadmintonLive ? (
                <a
                  href={getYoutubeLiveUrl('badminton')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-rose-50 text-rose-600 border border-rose-200 px-2 py-0.5 rounded-full"
                >
                  <Radio className="w-2.5 h-2.5 text-rose-500" />
                  <span>LIVE 중계</span>
                  <ChevronRight className="w-2.5 h-2.5 text-rose-500" />
                </a>
              ) : (
                <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                  체육관 진행
                </span>
              )}
            </div>

            {/* 3 Simultaneous Badminton Rows (남복, 여복, 혼복) */}
            <div className="space-y-2">
              {[
                { title: '남자 복식', tag: '남복', color: 'bg-blue-600', subMatch: menConfig?.liveMatch },
                { title: '여자 복식', tag: '여복', color: 'bg-rose-600', subMatch: womenConfig?.liveMatch },
                { title: '혼성 복식', tag: '혼복', color: 'bg-purple-600', subMatch: mixedConfig?.liveMatch },
              ].map((row, idx) => {
                const subM = row.subMatch;
                const t1 = subM ? SCHOOLS[subM.team1] : null;
                const t2 = subM ? SCHOOLS[subM.team2] : null;
                const isT1Lead = (subM?.score1 || 0) > (subM?.score2 || 0);
                const isT2Lead = (subM?.score2 || 0) > (subM?.score1 || 0);

                return (
                  <div
                    key={idx}
                    className={`p-2 rounded-xl border flex items-center justify-between gap-2 transition-all ${subM?.isLive
                      ? 'border-rose-300 bg-rose-50/40 ring-1 ring-rose-200'
                      : 'border-slate-100 bg-slate-50/60'
                      }`}
                  >
                    {/* Division Badge & Round */}
                    <div className="flex items-center gap-1.5 min-w-[90px]">
                      <span className={`text-[10px] font-extrabold text-white px-1.5 py-0.5 rounded ${row.color}`}>
                        {row.tag}
                      </span>
                      <span className="text-[11px] font-extrabold text-slate-700 truncate">
                        {subM?.round || '일정'}
                      </span>
                    </div>

                    {/* Teams & Score */}
                    <div className="flex items-center gap-2 flex-1 justify-center min-w-0">
                      <div className="flex items-center gap-1 min-w-0 justify-end flex-1">
                        {t1 && <span style={{ backgroundColor: t1.color }} className="w-1.5 h-3 rounded-xs shrink-0" />}
                        <span className={`text-xs font-extrabold truncate ${isT1Lead ? 'text-slate-900 font-black' : 'text-slate-600'}`}>
                          {subM?.team1 || '팀1'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 px-1 font-extrabold text-xs">
                        <span className={isT1Lead ? 'text-blue-600 font-black' : 'text-slate-800'}>
                          {subM?.score1 || 0}
                        </span>
                        <span className="text-slate-300">:</span>
                        <span className={isT2Lead ? 'text-blue-600 font-black' : 'text-slate-800'}>
                          {subM?.score2 || 0}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 min-w-0 justify-start flex-1">
                        <span className={`text-xs font-extrabold truncate ${isT2Lead ? 'text-slate-900 font-black' : 'text-slate-600'}`}>
                          {subM?.team2 || '팀2'}
                        </span>
                        {t2 && <span style={{ backgroundColor: t2.color }} className="w-1.5 h-3 rounded-xs shrink-0" />}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="min-w-[65px] text-right">
                      {subM?.isLive ? (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-black bg-rose-600 text-white px-1.5 py-0.5 rounded-full">
                          🔴 LIVE
                        </span>
                      ) : subM?.statusText === '종료' ? (
                        <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded-md">
                          종료
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-500">
                          {subM?.timeRangeText.split('-')[0]?.trim() || '예정'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ) : (
          /* Standard Single-Sport Scoreboard Hero Card */
          <section className="bg-white border border-gray-200 rounded-2xl p-3.5 shadow-2xs">
            <div className="relative overflow-hidden -mx-3.5 p-3.5">
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
                    <polygon points="0,0 48,0 60,100 0,100" fill={team1School.color} fillOpacity="0.22" />
                    <polygon points="48,0 72,0 84,100 60,100" fill={team1School.color} fillOpacity="0.10" />
                    <polygon points="72,0 86,0 98,100 84,100" fill={team1School.color} fillOpacity="0.03" />
                  </svg>
                </>
              )}

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
                    <polygon points="52,0 100,0 100,100 40,100" fill={team2School.color} fillOpacity="0.22" />
                    <polygon points="28,0 52,0 40,100 16,100" fill={team2School.color} fillOpacity="0.10" />
                    <polygon points="14,0 28,0 16,100 2,100" fill={team2School.color} fillOpacity="0.03" />
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
                        href={getYoutubeLiveUrl(liveMatch.id) || getYoutubeLiveUrl(sportKey)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] font-bold bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 px-2.5 py-0.5 rounded-full active:scale-95 transition-all shadow-2xs cursor-pointer"
                      >
                        <Radio className="w-3 h-3 text-rose-500" />
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
                    <span style={isTeam1Winning ? { color: team1School.color } : { color: '#0f172a' }}>
                      {liveMatch.score1}
                    </span>
                    <span className="text-gray-300 font-light">:</span>
                    <span style={isTeam2Winning ? { color: team2School.color } : { color: '#0f172a' }}>
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
        )}

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
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 select-none ${isActive
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

        {/* 4. Tab Content: Timeline */}
        {activeTab === 'timeline' && (
          <section className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-gray-600 px-1">
              <span>{config.name} 전체 경기 타임라인</span>
              <span className="text-[11px] font-medium text-gray-400">
                {isBadminton ? `총 ${badmintonTimelineSlots.length}개 라운드 (각 3경기)` : `총 ${config.schedule.length}경기`}
              </span>
            </div>

            {isBadminton ? (
              /* Badminton Multi-Division Synchronous Timeline */
              <div className="relative pl-7 space-y-3 pt-1">
                <div className="absolute left-2.5 top-4 bottom-4 w-0.5 bg-gray-200 -translate-x-1/2 z-0" />

                {badmintonTimelineSlots.map((slot, idx) => (
                  <div key={idx} className="relative">
                    {/* Timeline Node Circle */}
                    <div className="absolute -left-[18px] top-4 -translate-x-1/2 -translate-y-1/2 z-10">
                      {slot.isLive ? (
                        <div className="w-3.5 h-3.5 rounded-full bg-rose-600 ring-4 ring-rose-100 shadow-sm" />
                      ) : slot.isFinished ? (
                        <div className="w-2.5 h-2.5 rounded-full bg-gray-300 border border-white" />
                      ) : (
                        <div className="w-2.5 h-2.5 rounded-full bg-slate-700 border border-white" />
                      )}
                    </div>

                    {/* Synchronous Slot Card (Simultaneously hosting Men, Women, Mixed) */}
                    <div
                      className={`bg-white border rounded-2xl p-3 shadow-2xs transition-all ${slot.isLive
                        ? 'border-rose-500 ring-2 ring-rose-200 shadow-md'
                        : slot.isFinished
                          ? 'border-gray-200 bg-white'
                          : 'border-gray-200/90'
                        }`}
                    >
                      {/* Slot Header */}
                      <div className="flex items-center justify-between text-xs text-gray-500 border-b border-gray-100 pb-2 mb-2">
                        <div className="flex items-center gap-1.5 font-bold">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span className="font-black text-gray-900 text-xs">{slot.timeRangeText || '경기 시간'}</span>
                          <span className="text-[10px] text-gray-400 font-medium">· {slot.roundLabel}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {slot.isLive ? (
                            <a
                              href={getYoutubeLiveUrl('badminton')}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-0.5 text-[10px] font-extrabold bg-rose-50 text-rose-600 border border-rose-200 px-2 py-0.5 rounded-full"
                            >
                              <Radio className="w-2.5 h-2.5 text-rose-500" />
                              <span>LIVE 진행중</span>
                              <ChevronRight className="w-2.5 h-2.5 text-rose-500" />
                            </a>
                          ) : slot.isFinished ? (
                            <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                              종료
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                              예정
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Simultaneous Matches in this time slot */}
                      <div className="space-y-1.5">
                        {slot.matches.map((item, mIdx) => {
                          const m = item.match;
                          if (!m) return null;
                          const t1 = SCHOOLS[m.team1] || { color: '#64748b', shortName: m.team1 };
                          const t2 = SCHOOLS[m.team2] || { color: '#64748b', shortName: m.team2 };
                          const isT1Win = m.score1 > m.score2;
                          const isT2Win = m.score2 > m.score1;

                          return (
                            <div
                              key={mIdx}
                              className={`p-2 rounded-xl border flex items-center justify-between gap-2 ${m.isLive
                                ? 'border-rose-300 bg-rose-50/50 ring-1 ring-rose-200'
                                : 'border-slate-100 bg-slate-50/50'
                                }`}
                            >
                              <div className="flex items-center gap-1 shrink-0">
                                <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded border shrink-0 ${item.tagColor}`}>
                                  {item.tag}
                                </span>
                                <span className="text-[10px] font-bold text-slate-500 shrink-0">
                                  {m.round}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 flex-1 justify-center min-w-0">
                                <div className="flex items-center gap-1 min-w-0 justify-end flex-1">
                                  <span style={{ backgroundColor: t1.color }} className="w-1.5 h-3 rounded-xs shrink-0" />
                                  <span className={`text-xs font-bold truncate ${isT1Win ? 'text-slate-900 font-extrabold' : 'text-slate-600'}`}>
                                    {m.team1}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1 px-1 font-extrabold text-xs">
                                  <span className={isT1Win ? 'text-blue-600 font-black' : 'text-slate-800'}>
                                    {m.score1}
                                  </span>
                                  <span className="text-slate-300">-</span>
                                  <span className={isT2Win ? 'text-blue-600 font-black' : 'text-slate-800'}>
                                    {m.score2}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1 min-w-0 justify-start flex-1">
                                  <span className={`text-xs font-bold truncate ${isT2Win ? 'text-slate-900 font-extrabold' : 'text-slate-600'}`}>
                                    {m.team2}
                                  </span>
                                  <span style={{ backgroundColor: t2.color }} className="w-1.5 h-3 rounded-xs shrink-0" />
                                </div>
                              </div>

                              <div className="min-w-[45px] text-right">
                                {m.isLive ? (
                                  <span className="text-[9px] font-black text-rose-600">🔴 LIVE</span>
                                ) : m.statusText === '종료' ? (
                                  <span className="text-[10px] font-bold text-slate-400">종료</span>
                                ) : (
                                  <span className="text-[10px] font-bold text-slate-400">예정</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Venue Footer */}
                      <div className="flex items-center justify-end text-[10px] text-gray-400 pt-2 mt-1 border-t border-gray-50 font-medium">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5 text-gray-400" />
                          <span>{slot.venue}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Standard Single-Sport Vertical Timeline */
              <div className="relative pl-7 space-y-3 pt-1">
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
                      {/* Timeline Node Circle */}
                      <div className="absolute -left-[18px] top-4 -translate-x-1/2 -translate-y-1/2 z-10">
                        {item.isLive ? (
                          <div className="w-3.5 h-3.5 rounded-full bg-rose-600 ring-4 ring-rose-100 shadow-sm" />
                        ) : isFinished ? (
                          <div className="w-2.5 h-2.5 rounded-full bg-gray-300 border border-white" />
                        ) : (
                          <div className="w-2.5 h-2.5 rounded-full bg-slate-700 border border-white" />
                        )}
                      </div>

                      {/* Card Container */}
                      <div
                        className={`bg-white border rounded-2xl p-3 shadow-2xs transition-all ${item.isLive
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
                                href={getYoutubeLiveUrl(item.id) || getYoutubeLiveUrl(sportKey)}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-0.5 text-[10px] font-bold bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 px-2 py-0.5 rounded-full active:scale-95 transition-all cursor-pointer"
                              >
                                <Radio className="w-2.5 h-2.5 text-rose-500" />
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
                                <polygon points="0,0 48,0 60,100 0,100" fill={t1.color} fillOpacity="0.22" />
                                <polygon points="48,0 72,0 84,100 60,100" fill={t1.color} fillOpacity="0.10" />
                                <polygon points="72,0 86,0 98,100 84,100" fill={t1.color} fillOpacity="0.03" />
                              </svg>
                            </>
                          )}

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
                                <polygon points="52,0 100,0 100,100 40,100" fill={t2.color} fillOpacity="0.22" />
                                <polygon points="28,0 52,0 40,100 16,100" fill={t2.color} fillOpacity="0.10" />
                                <polygon points="14,0 28,0 16,100 2,100" fill={t2.color} fillOpacity="0.03" />
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
            )}
          </section>
        )}

        {/* 5. Tab Content: Dynamic Tournament Bracket */}
        {activeTab === 'bracket' && (
          <section className="space-y-6">
            {isBadminton ? (
              /* 3 Vertically Stacked Brackets for Badminton */
              <div className="space-y-8">
                {/* 1. Men's Doubles */}
                <div className="space-y-2">
                  <TournamentBracket
                    matches={menConfig?.schedule}
                    treeData={badmintonTrees.men || undefined}
                    sportName="배드민턴 남자복식"
                    sportKey="badminton_men"
                  />
                </div>

                {/* 2. Women's Doubles */}
                <div className="space-y-2">
                  <TournamentBracket
                    matches={womenConfig?.schedule}
                    treeData={badmintonTrees.women || undefined}
                    sportName="배드민턴 여자복식"
                    sportKey="badminton_women"
                  />
                </div>

                {/* 3. Mixed Doubles */}
                <div className="space-y-2">
                  <TournamentBracket
                    matches={mixedConfig?.schedule}
                    treeData={badmintonTrees.mixed || undefined}
                    sportName="배드민턴 혼성복식"
                    sportKey="badminton_mixed"
                  />
                </div>
              </div>
            ) : (
              /* Standard Single Tournament Bracket */
              <TournamentBracket
                matches={config.schedule}
                treeData={treeData || undefined}
                sportName={config.name}
                sportKey={(sportKey || 'soccer') as SportKey}
              />
            )}
          </section>
        )}
      </div>
    </div>
  );
};
