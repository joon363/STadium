import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SCHOOLS } from '../config/stadiumConfig';
import { useRealtimeSchedule } from '../hooks/useRealtimeSchedule';
import { LeaderboardSection } from '../components/LeaderboardSection';
import {
  ArrowLeft,
  Clock,
  MapPin,
  Radio
} from 'lucide-react';

export const SportDetail: React.FC = () => {
  const { sportKey } = useParams<{ sportKey: string }>();
  const navigate = useNavigate();
  const { sportsConfig, overallStandings } = useRealtimeSchedule();

  const [activeTab, setActiveTab] = useState<'timeline' | 'standings'>('timeline');

  const config = sportKey ? sportsConfig[sportKey] : null;

  if (!config) {
    return (
      <div className="p-8 text-center bg-white min-h-screen flex flex-col items-center justify-center">
        <p className="text-gray-600 font-bold mb-4">존재하지 않는 종목입니다.</p>
        <button
          onClick={() => navigate('/')}
          className="px-5 py-2.5 bg-postech text-white rounded-xl text-sm font-black shadow-xs"
        >
          홈으로 돌아가기
        </button>
      </div>
    );
  }

  const liveMatch = config.liveMatch;
  const team1School = SCHOOLS[liveMatch.team1] || { color: '#64748b', bgLight: '#f1f5f9', logoText: liveMatch.team1.slice(0, 1), shortName: liveMatch.team1 };
  const team2School = SCHOOLS[liveMatch.team2] || { color: '#64748b', bgLight: '#f1f5f9', logoText: liveMatch.team2.slice(0, 1), shortName: liveMatch.team2 };

  const isTeam1Winning = liveMatch.score1 > liveMatch.score2;
  const isTeam2Winning = liveMatch.score2 > liveMatch.score1;

  return (
    <div className="flex flex-col min-h-full bg-slate-50 text-gray-900 pb-10">
      {/* 1. Top Detail Header Bar */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-2xs relative">
        <button
          onClick={() => navigate('/')}
          className="p-2 -ml-2 rounded-xl text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors touch-target z-10"
          aria-label="뒤로가기"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5 font-black text-base text-gray-900 pointer-events-none">
          <span>{config.icon}</span>
          <span>{config.name} 경기</span>
        </div>

        {/* Right placeholder to keep layout balanced */}
        <div className="w-9" />
      </div>

      <div className="p-3 space-y-3">
        {/* 2. Match Scoreboard Hero Card */}
        <section className="bg-white border border-gray-200 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            {/* Team 1 */}
            <div className="flex flex-col items-center flex-1 min-w-0">
              <div
                style={{ backgroundColor: team1School.color }}
                className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-white text-xl shadow-md border-2 border-white mb-2"
              >
                {team1School.logoText}
              </div>
              <span className={`text-sm text-center truncate w-full ${isTeam1Winning ? 'font-black text-gray-900' : 'font-bold text-gray-700'}`}>
                {liveMatch.team1}
              </span>
            </div>

            {/* Score & Status Center */}
            <div className="flex flex-col items-center justify-center px-4">
              <div className="mb-1">
                {liveMatch.isLive ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black bg-rose-50 text-rose-600 border border-rose-200 px-2.5 py-0.5 rounded-full">
                    <Radio className="w-3 h-3" />
                    LIVE · {liveMatch.statusText}
                  </span>
                ) : (
                  <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full">
                    {liveMatch.statusText}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 text-3xl font-black tracking-tight my-0.5">
                <span style={isTeam1Winning ? { color: team1School.color } : { color: '#0f172a' }}>
                  {liveMatch.score1}
                </span>
                <span className="text-gray-300 font-light">:</span>
                <span style={isTeam2Winning ? { color: team2School.color } : { color: '#0f172a' }}>
                  {liveMatch.score2}
                </span>
              </div>

              <div className="flex items-center gap-1 text-[11px] font-semibold text-gray-500 mt-1">
                <MapPin className="w-3 h-3 text-gray-400" />
                <span>{liveMatch.venue}</span>
              </div>
            </div>

            {/* Team 2 */}
            <div className="flex flex-col items-center flex-1 min-w-0">
              <div
                style={{ backgroundColor: team2School.color }}
                className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-white text-xl shadow-md border-2 border-white mb-2"
              >
                {team2School.logoText}
              </div>
              <span className={`text-sm text-center truncate w-full ${isTeam2Winning ? 'font-black text-gray-900' : 'font-bold text-gray-700'}`}>
                {liveMatch.team2}
              </span>
            </div>
          </div>
        </section>

        {/* 3. Segmented Control Tabs */}
        <section className="bg-white border border-gray-200 rounded-xl p-1 shadow-2xs flex items-center">
          {[
            { key: 'timeline', label: '타임라인' },
            { key: 'standings', label: '종합 순위' },
          ].map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all text-center select-none ${
                  isActive
                    ? 'bg-postech text-white shadow-xs font-black'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </section>

        {/* 4. Tab Content: Timeline */}
        {activeTab === 'timeline' && (
          <section className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-gray-600 px-1">
              <span>{config.name} 전체 경기 일정</span>
              <span>총 {config.schedule.length}경기</span>
            </div>

            <div className="space-y-2">
              {config.schedule.map((item) => {
                const t1 = SCHOOLS[item.team1] || { color: '#64748b', logoText: item.team1.slice(0, 1) };
                const t2 = SCHOOLS[item.team2] || { color: '#64748b', logoText: item.team2.slice(0, 1) };
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
                          <span className="text-[10px] font-black bg-rose-50 text-rose-600 border border-rose-200 px-2 py-0.5 rounded-full">
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

                    <div className="flex items-center justify-between py-1">
                      {/* Team 1 */}
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div
                          style={{ backgroundColor: t1.color }}
                          className="w-7 h-7 rounded-full flex items-center justify-center font-black text-white text-[11px] shrink-0"
                        >
                          {t1.logoText}
                        </div>
                        <span className={`text-xs truncate ${isT1Win ? 'font-black text-gray-900' : 'font-semibold text-gray-700'}`}>
                          {item.team1}
                        </span>
                      </div>

                      {/* Score */}
                      <div className="flex flex-col items-center px-3 min-w-[70px]">
                        <div className="text-base font-black flex items-center gap-1.5">
                          <span style={isT1Win ? { color: t1.color } : { color: '#0f172a' }}>{item.score1}</span>
                          <span className="text-gray-300">-</span>
                          <span style={isT2Win ? { color: t2.color } : { color: '#0f172a' }}>{item.score2}</span>
                        </div>
                      </div>

                      {/* Team 2 */}
                      <div className="flex items-center gap-2 flex-1 justify-end min-w-0 text-right">
                        <span className={`text-xs truncate ${isT2Win ? 'font-black text-gray-900' : 'font-semibold text-gray-700'}`}>
                          {item.team2}
                        </span>
                        <div
                          style={{ backgroundColor: t2.color }}
                          className="w-7 h-7 rounded-full flex items-center justify-center font-black text-white text-[11px] shrink-0"
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

        {/* 5. Tab Content: Standings (Using Original LeaderboardSection) */}
        {activeTab === 'standings' && (
          <section className="space-y-2">
            <LeaderboardSection standings={overallStandings} />
          </section>
        )}
      </div>
    </div>
  );
};
