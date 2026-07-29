import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SCHOOLS } from '../config/stadiumConfig';
import { useRealtimeSchedule } from '../hooks/useRealtimeSchedule';
import { ArrowLeft, Clock, MapPin, Trophy, Calendar } from 'lucide-react';

export const SportDetail: React.FC = () => {
  const { sportKey } = useParams<{ sportKey: string }>();
  const navigate = useNavigate();
  const { sportsConfig, timeString } = useRealtimeSchedule();

  const config = sportKey ? sportsConfig[sportKey] : null;

  if (!config) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500 font-bold">존재하지 않는 종목입니다.</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 px-4 py-2 bg-postech text-white rounded-lg text-sm font-bold"
        >
          홈으로 돌아가기
        </button>
      </div>
    );
  }

  const liveMatch = config.liveMatch;
  const winningSchool = liveMatch.winningTeam ? SCHOOLS[liveMatch.winningTeam] : null;

  const liveTeam1School = SCHOOLS[liveMatch.team1];
  const liveTeam2School = SCHOOLS[liveMatch.team2];
  const isLiveTeam1Winning = liveMatch.score1 > liveMatch.score2;
  const isLiveTeam2Winning = liveMatch.score2 > liveMatch.score1;

  const liveScore1Style: React.CSSProperties = isLiveTeam1Winning && liveTeam1School
    ? { color: liveTeam1School.color }
    : { color: '#111827' };

  const liveScore2Style: React.CSSProperties = isLiveTeam2Winning && liveTeam2School
    ? { color: liveTeam2School.color }
    : { color: '#111827' };

  const bgStyle: React.CSSProperties = winningSchool
    ? { backgroundColor: winningSchool.bgLight, borderColor: winningSchool.color }
    : { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' };

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Top Header Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="touch-target p-2 rounded-lg border border-gray-200 bg-white text-gray-800 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xl">{config.icon}</span>
            <h1 className="font-extrabold text-lg text-gray-900">{config.name} 경기 일정</h1>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[11px] font-bold text-gray-600 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-md">
          <Clock className="w-3 h-3 text-postech" />
          <span>{timeString}</span>
        </div>
      </div>

      {/* Live Banner: Only active when liveMatch.isLive is TRUE. Hidden during break time or when finished */}
      {liveMatch.isLive && (
        <section
          style={bgStyle}
          className="border rounded-xl p-4 flex flex-col justify-between shadow-2xs relative overflow-hidden animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between border-b border-black/10 pb-2 mb-3">
            <div className="flex items-center gap-2 font-bold text-gray-900 text-sm">
              <Trophy className="w-4 h-4 text-amber-600 animate-bounce" />
              <span>현재 라이브</span>
            </div>
            <span className="text-[10px] font-bold bg-postech text-white px-2 py-0.5 rounded-md uppercase tracking-wider animate-pulse">
              LIVE
            </span>
          </div>

          {/* Live Score Display */}
          <div className="flex items-center justify-between py-2">
            {/* Team 1 */}
            <div className="flex flex-col items-center flex-1">
              <span className="font-black text-base text-gray-900">{liveMatch.team1}</span>
            </div>

            {/* Score Box */}
            <div className="px-3.5 py-1 rounded-lg bg-white border border-gray-300 text-xl font-black shadow-2xs flex items-center gap-1.5">
              <span style={liveScore1Style}>{liveMatch.score1}</span>
              <span className="text-gray-400 font-bold">:</span>
              <span style={liveScore2Style}>{liveMatch.score2}</span>
            </div>

            {/* Team 2 */}
            <div className="flex flex-col items-center flex-1">
              <span className="font-black text-base text-gray-900">{liveMatch.team2}</span>
            </div>
          </div>

          {liveMatch.subtitle && (
            <div className="text-center text-xs font-semibold text-gray-700 bg-white/90 border border-gray-200 rounded-md py-1 px-2 my-1">
              📌 {liveMatch.subtitle}
            </div>
          )}

          {/* Details Footer */}
          <div className="flex items-center justify-between text-xs font-semibold text-gray-700 border-t border-black/10 pt-2 mt-2">
            <div className="flex items-center gap-1.5 font-bold">
              <Clock className="w-3.5 h-3.5 text-postech" />
              <span>{liveMatch.statusText}</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-postech" />
              <span>{liveMatch.venue}</span>
            </div>
          </div>
        </section>
      )}

      {/* Full Schedule List (Vertically Scrollable Timeline) */}
      <section className="space-y-3 pt-1">
        <div className="flex items-center justify-between font-bold text-gray-900 text-sm px-1">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-postech" />
            <h2>전체 경기 타임라인</h2>
          </div>
        </div>

        <div className="space-y-2.5">
          {config.schedule.map((item) => {
            const isItemLive = item.isLive;
            const isItemUpcoming = !item.isLive && (item.countdownText !== undefined || item.statusText.includes('예정') || item.startTimeObj.getTime() > Date.now());
            const isItemFinished = !isItemLive && !isItemUpcoming;
            const itemSchool = item.winningTeam ? SCHOOLS[item.winningTeam] : null;

            const itemTeam1School = SCHOOLS[item.team1];
            const itemTeam2School = SCHOOLS[item.team2];
            const isItemTeam1Winning = item.score1 > item.score2;
            const isItemTeam2Winning = item.score2 > item.score1;

            const itemScore1Style: React.CSSProperties = isItemTeam1Winning && itemTeam1School
              ? { color: itemTeam1School.color }
              : { color: '#111827' };

            const itemScore2Style: React.CSSProperties = isItemTeam2Winning && itemTeam2School
              ? { color: itemTeam2School.color }
              : { color: '#111827' };

            // Background & Border styling logic:
            const itemBgStyle: React.CSSProperties = isItemUpcoming
              ? { background: 'linear-gradient(135deg, #f9fafb 0%, #e5e7eb 100%)', borderColor: '#d1d5db' }
              : itemSchool
              ? { backgroundColor: itemSchool.bgLight, borderColor: itemSchool.color }
              : { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' };

            return (
              <div
                key={item.id}
                style={itemBgStyle}
                className={`border-2 rounded-xl p-3 flex flex-col gap-2 transition-colors shadow-2xs ${
                  isItemLive ? 'ring-2 ring-rose-400' : ''
                }`}
              >
                {/* Time & Round Header */}
                <div className="flex items-center justify-between text-xs font-semibold text-gray-600 border-b border-black/10 pb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-900 font-extrabold">{item.timeRangeText}</span>
                    <div className="flex items-center justify-between text-[11px] font-medium text-gray-700">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-postech shrink-0" />
                        <span className="flex items-center font-semibold leading-none">
                          {item.venue}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isItemLive && (
                      <span className="bg-postech text-white px-2 py-0.5 rounded text-[10px] font-black uppercase animate-pulse">
                        LIVE
                      </span>
                    )}
                    {isItemUpcoming && (
                      <span className="bg-gray-300 border border-gray-400 text-gray-800 px-1.5 py-0.5 rounded text-[10px] font-extrabold">
                        시작전
                      </span>
                    )}
                    {isItemFinished && (
                      <span className="bg-gray-800 text-white px-2 py-0.5 rounded text-[10px] font-extrabold">
                        종료
                      </span>
                    )}
                    <span className="bg-white/80 border border-gray-300 text-gray-800 px-2 py-0.5 rounded-md text-[11px] font-bold">
                      {item.round}
                    </span>
                  </div>
                </div>

                {/* Score Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-black text-sm text-gray-900 w-1/3 justify-start">
                    <span>{item.team1}</span>
                  </div>

                  <div className="font-black text-base px-3.5 py-0.5 rounded-md bg-white border border-gray-300 shadow-2xs flex items-center gap-1">
                    <span style={itemScore1Style}>{item.score1}</span>
                    <span className="text-gray-400 font-bold">-</span>
                    <span style={itemScore2Style}>{item.score2}</span>
                  </div>

                  <div className="flex items-center gap-2 font-black text-sm text-gray-900 w-1/3 justify-end">
                    <span>{item.team2}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
