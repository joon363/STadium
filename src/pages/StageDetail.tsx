import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SCHOOLS } from '../config/stadiumConfig';
import { useRealtimeSchedule } from '../hooks/useRealtimeSchedule';
import { ArrowLeft, Clock, MapPin, Music, Radio, Calendar } from 'lucide-react';

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
            <span className="text-xl">🎤</span>
            <h1 className="font-extrabold text-lg text-gray-900">체육관 무대 공연 일정</h1>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[11px] font-bold text-gray-600 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-md">
          <Clock className="w-3 h-3 text-postech" />
          <span>{timeString}</span>
        </div>
      </div>

      {/* Main Live / Featured Stage Banner */}
      <section className="bg-slate-900 text-white rounded-xl p-4 border border-slate-800 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
            <h2 className="font-extrabold text-sm tracking-wide text-gray-100">
              Now Live
            </h2>
          </div>
          {stageConfig.isLive ? (
            <span className="text-[10px] font-bold bg-postech text-white px-2.5 py-0.5 rounded-md uppercase tracking-wider">
              STAGE LIVE
            </span>
          ) : (
            <span className="text-[10px] font-semibold bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-md">
              공연 대기
            </span>
          )}
        </div>

        {/* Performance details */}
        <div className="flex items-start gap-3">
          <div
            style={{ backgroundColor: currentSchool.color }}
            className="w-10 h-10 rounded-lg flex items-center justify-center font-black text-white text-base shrink-0 border border-white/20 shadow-xs"
          >
            {currentSchool.logoText}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-black text-base text-white truncate">
                {stageConfig.clubName}
              </span>
              <span className="text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-md shrink-0">
                {stageConfig.genre}
              </span>
            </div>

            {/* Multiline Song List Rows */}
            <div className="space-y-1 mt-1.5">
              {liveSongList.length > 0 ? (
                liveSongList.map((song, songIdx) => (
                  <p key={songIdx} className="text-xs text-slate-300 font-medium truncate flex items-center gap-1.5">
                    <Music className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>{song}</span>
                  </p>
                ))
              ) : (
                <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
                  <Music className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>{stageConfig.songTitle}</span>
                </p>
              )}
            </div>

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 text-[11px]">
              <span className="font-bold text-rose-400">⏱ {stageConfig.statusText}</span>
              <span className="font-semibold text-slate-400">{stageConfig.nextRemainingText}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Full Stage Timetable List (Fetched from Supabase / Dynamic) */}
      <section className="space-y-3 pt-1">
        <div className="flex items-center justify-between font-bold text-gray-900 text-sm px-1">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-postech" />
            <h2>전체 공연 타임라인</h2>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500 font-medium">
            <MapPin className="w-3 h-3 text-postech" />
            <span>POSTECH 체육관 실내무대</span>
          </div>
        </div>

        <div className="space-y-2.5">
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

            const itemBgStyle: React.CSSProperties = isUpcoming
              ? { background: 'linear-gradient(135deg, #f9fafb 0%, #e5e7eb 100%)', borderColor: '#d1d5db' }
              : isLive
              ? { backgroundColor: schoolObj.bgLight, borderColor: schoolObj.color }
              : { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' };

            const itemSongList = parseSongList(item.songTitle);

            return (
              <div
                key={idx}
                style={itemBgStyle}
                className={`border rounded-xl p-3.5 flex flex-col gap-2 transition-colors shadow-2xs ${
                  isLive ? 'ring-1 ring-postech/30' : ''
                }`}
              >
                {/* Time & Badge Row */}
                <div className="flex items-center justify-between border-b border-black/10 pb-1.5 text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      style={{ backgroundColor: schoolObj.color }}
                      className="text-white text-[10px] font-bold px-1.5 py-0.5 rounded"
                    >
                      {schoolObj.shortName}
                    </span>

                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-base text-gray-900">{item.clubName}</h3>
                    </div>
                    <span className="font-extrabold text-gray-900">{timeRangeText}</span>
                  </div>

                  <span className="text-[10px] font-semibold bg-white border border-gray-200 text-gray-700 px-2 py-0.5 rounded-md">
                    {item.genre}
                  </span>
                </div>

                {/* Multiline Song List: Dynamic Row Generation per Song */}
                <div className="space-y-1.5 pt-0.5">
                  {itemSongList.length > 0 ? (
                    itemSongList.map((song, songIdx) => (
                      <p
                        key={songIdx}
                        className="text-xs text-gray-800 font-semibold flex items-center gap-1.5 leading-snug"
                      >
                        <Music className="w-3.5 h-3.5 text-postech shrink-0" />
                        <span>{song}</span>
                      </p>
                    ))
                  ) : (
                    <p className="text-xs text-gray-800 font-semibold flex items-center gap-1.5">
                      <Music className="w-3.5 h-3.5 text-postech shrink-0" />
                      <span>{item.songTitle}</span>
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
