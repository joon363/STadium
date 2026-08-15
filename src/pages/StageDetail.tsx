import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SCHOOLS } from '../config/stadiumConfig';
import { useRealtimeSchedule } from '../hooks/useRealtimeSchedule';
import { ArrowLeft, Clock, MapPin, Music, Radio, Calendar, Sparkles } from 'lucide-react';

export const StageDetail: React.FC = () => {
  const navigate = useNavigate();
  const { stageConfig, stageSchedule, timeString, now } = useRealtimeSchedule();

  const currentSchool = SCHOOLS[stageConfig.school] || SCHOOLS.POSTECH;
  const nowMs = now.getTime();

  // Helper to parse multiline song titles
  const parseSongList = (titleStr: string): string[] => {
    if (!titleStr) return [];
    return titleStr
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
  };

  const liveSongList = parseSongList(stageConfig.songTitle);

  return (
    <div className="flex flex-col gap-3 p-3 text-gray-900 pb-10">
      {/* Top Header Row */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 -mx-3 -mt-3 px-4 py-3 flex items-center justify-between shadow-2xs">
        <button
          onClick={() => navigate('/')}
          className="p-2 -ml-2 rounded-xl text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors touch-target"
          aria-label="뒤로가기"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-1.5 font-black text-base text-gray-900">
          <span>🎤</span>
          <span>체육관 무대 공연 일정</span>
        </div>

        <div className="flex items-center gap-1 text-[11px] font-bold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full">
          <Clock className="w-3 h-3 text-postech" />
          <span>{timeString}</span>
        </div>
      </div>

      {/* Main Live / Featured Stage Banner */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-4 border border-slate-700/80 shadow-md relative overflow-hidden mt-1">
        <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
          <div className="flex items-center gap-1.5">
            <Radio className="w-4 h-4 text-rose-400" />
            <h2 className="font-extrabold text-xs uppercase tracking-wider text-rose-300">
              Now On Stage
            </h2>
          </div>
          {stageConfig.isLive ? (
            <span className="text-[10px] font-black bg-rose-600 text-white px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              STAGE LIVE
            </span>
          ) : (
            <span className="text-[10px] font-semibold bg-slate-700 text-slate-300 px-2.5 py-0.5 rounded-full">
              공연 대기중
            </span>
          )}
        </div>

        {/* Performance details */}
        <div className="flex items-start gap-3">
          <div
            style={{ backgroundColor: currentSchool.color }}
            className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-lg shrink-0 border-2 border-white/20 shadow-md"
          >
            {currentSchool.logoText}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-black text-base text-white truncate">
                {stageConfig.clubName}
              </span>
              <span className="text-[10px] font-semibold bg-slate-700 text-slate-300 border border-slate-600 px-2 py-0.5 rounded-md shrink-0">
                {stageConfig.genre}
              </span>
            </div>

            {/* Multiline Song List Rows */}
            <div className="space-y-1 mt-2">
              {liveSongList.length > 0 ? (
                liveSongList.map((song, songIdx) => (
                  <p key={songIdx} className="text-xs text-slate-200 font-medium truncate flex items-center gap-1.5">
                    <Music className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>{song}</span>
                  </p>
                ))
              ) : (
                <p className="text-xs text-slate-200 font-medium flex items-center gap-1">
                  <Music className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>{stageConfig.songTitle}</span>
                </p>
              )}
            </div>

            <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/10 text-xs">
              <span className="font-extrabold text-rose-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {stageConfig.statusText}
              </span>
              <span className="font-semibold text-slate-300">{stageConfig.nextRemainingText}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Full Stage Timetable List */}
      <section className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between font-bold text-gray-900 text-xs px-1">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-postech" />
            <h2>전체 공연 타임라인</h2>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-gray-500 font-medium">
            <MapPin className="w-3 h-3 text-postech" />
            <span>POSTECH 체육관 실내무대</span>
          </div>
        </div>

        <div className="space-y-2">
          {stageSchedule.map((item, idx) => {
            const schoolObj = SCHOOLS[item.school] || SCHOOLS.POSTECH;

            const start = new Date(now);
            start.setHours(item.startHour, item.startMinute, 0, 0);
            const end = new Date(now);
            end.setHours(item.endHour, item.endMinute, 0, 0);

            const isLive = nowMs >= start.getTime() && nowMs <= end.getTime();
            const isFinished = nowMs > end.getTime();
            const isUpcoming = nowMs < start.getTime();

            const timeRangeText = `${String(item.startHour).padStart(2, '0')}:${String(
              item.startMinute
            ).padStart(2, '0')} - ${String(item.endHour).padStart(2, '0')}:${String(
              item.endMinute
            ).padStart(2, '0')}`;

            const itemSongList = parseSongList(item.songTitle);

            return (
              <div
                key={idx}
                className={`bg-white border rounded-2xl p-3.5 flex flex-col gap-2 shadow-2xs transition-all ${
                  isLive ? 'border-purple-400 ring-2 ring-purple-100' : 'border-gray-200'
                }`}
              >
                {/* Time & Badge Row */}
                <div className="flex items-center justify-between border-b border-gray-100 pb-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      style={{ backgroundColor: schoolObj.color }}
                      className="text-white text-[10px] font-black px-2 py-0.5 rounded-full"
                    >
                      {schoolObj.shortName}
                    </span>

                    <h3 className="font-black text-sm text-gray-900">{item.clubName}</h3>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isLive && (
                      <span className="text-[10px] font-black bg-rose-50 text-rose-600 border border-rose-200 px-2 py-0.5 rounded-full">
                        LIVE
                      </span>
                    )}
                    <span className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">
                      {item.genre}
                    </span>
                  </div>
                </div>

                {/* Song List */}
                <div className="space-y-1 pt-0.5">
                  {itemSongList.length > 0 ? (
                    itemSongList.map((song, songIdx) => (
                      <p
                        key={songIdx}
                        className="text-xs text-gray-700 font-medium flex items-center gap-1.5 leading-snug"
                      >
                        <Music className="w-3.5 h-3.5 text-postech shrink-0" />
                        <span>{song}</span>
                      </p>
                    ))
                  ) : (
                    <p className="text-xs text-gray-700 font-medium flex items-center gap-1">
                      <Music className="w-3.5 h-3.5 text-postech shrink-0" />
                      <span>{item.songTitle}</span>
                    </p>
                  )}
                </div>

                {/* Footer Time */}
                <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1.5 border-t border-gray-50 font-semibold">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span>{timeRangeText}</span>
                  </div>
                  <span className="text-gray-400 text-[10px]">
                    {isFinished ? '공연 종료' : isLive ? '진행중' : '공연 예정'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
