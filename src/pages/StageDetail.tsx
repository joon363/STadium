import React from 'react';
import { SCHOOLS } from '../config/stadiumConfig';
import { useRealtimeSchedule } from '../hooks/useRealtimeSchedule';
import { useSchool } from '../context/SchoolContext';
import { Clock, MapPin, Music, Radio, Calendar, Sparkles, Filter } from 'lucide-react';

export const StageDetail: React.FC = () => {
  const { stageConfig, stageSchedule, timeString, now } = useRealtimeSchedule();
  const { selectedSchool, setSelectedSchool } = useSchool();

  const activeSchoolObj = selectedSchool !== 'ALL' ? SCHOOLS[selectedSchool] : null;
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

  // Filter stage performances based on selected school
  const filteredSchedule = stageSchedule.filter((item) => {
    if (selectedSchool !== 'ALL' && item.school !== selectedSchool) {
      return false;
    }
    return true;
  });

  return (
    <div className="flex flex-col gap-2.5 p-3 text-gray-900 pb-6">
      {/* School Filter Active Banner (If selected) */}
      {activeSchoolObj && (
        <div
          style={{ backgroundColor: activeSchoolObj.bgLight, borderColor: activeSchoolObj.color }}
          className="border rounded-xl p-2.5 flex items-center justify-between shadow-2xs"
        >
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4" style={{ color: activeSchoolObj.color }} />
            <span className="text-xs font-bold text-gray-900">
              <strong style={{ color: activeSchoolObj.color }}>{activeSchoolObj.shortName}</strong> 공연 일정 필터링 적용 중
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

      {/* Main Live / Featured Stage Banner (Clean White Theme) */}
      <section className="bg-white text-gray-900 rounded-xl p-3 border border-gray-200/90 shadow-2xs relative overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-2 text-xs">
          <div className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-postech" />
            {stageConfig.isLive ? (
              <span className="font-bold text-rose-600 uppercase tracking-wider">
                LIVE
              </span>
            ) : (
              <span className="font-bold text-gray-600">
                공연 대기중
              </span>
            )}
          </div>
          <span className="font-bold text-postech">
            {stageConfig.statusText}
          </span>
        </div>

        {/* Performance details */}
        <div className="flex items-center gap-2">
          <span
            style={{ backgroundColor: currentSchool.color }}
            className="text-white text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0"
          >
            {currentSchool.shortName}
          </span>

          <span className="font-bold text-sm text-gray-900 truncate">
            {stageConfig.clubName}
          </span>

          <span className="text-[9px] font-bold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200 shrink-0">
            {stageConfig.genre}
          </span>
        </div>
      </section>

      {/* Full Stage Timetable List */}
      <section className="space-y-2 pt-0.5">
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

        {filteredSchedule.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-6 text-center text-gray-500">
            <p className="text-xs font-bold">선택하신 학교의 공연 일정이 없습니다.</p>
            <button
              onClick={() => setSelectedSchool('ALL')}
              className="mt-2 text-xs text-postech font-bold underline"
            >
              전체 공연 보기
            </button>
          </div>
        ) : (
          <div className="space-y-1.5">
            {filteredSchedule.map((item, idx) => {
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
                  className={`bg-white border rounded-xl p-3 flex flex-col gap-1.5 shadow-2xs transition-all ${isLive ? 'border-purple-400 ring-1 ring-purple-100' : 'border-gray-200'
                    }`}
                >
                  {/* Time & Badge Row */}
                  <div className="flex items-center justify-between border-b border-gray-100 pb-1.5 text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        style={{ backgroundColor: schoolObj.color }}
                        className="text-white text-[10px] font-bold px-1.5 py-0.2 rounded"
                      >
                        {schoolObj.shortName}
                      </span>

                      <h3 className="font-bold text-xs text-gray-900">{item.clubName}</h3>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isLive && (
                        <span className="text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200 px-2 py-0.2 rounded-full">
                          LIVE
                        </span>
                      )}
                      <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-1.5 py-0.2 rounded">
                        {item.genre}
                      </span>
                    </div>
                  </div>

                  {/* Song List */}
                  <div className="space-y-0.5 pt-0.5">
                    {itemSongList.length > 0 ? (
                      itemSongList.map((song, songIdx) => (
                        <p
                          key={songIdx}
                          className="text-xs text-gray-700 font-medium flex items-center gap-1.5 leading-snug"
                        >
                          <Music className="w-3 h-3 text-postech shrink-0" />
                          <span>{song}</span>
                        </p>
                      ))
                    ) : (
                      <p className="text-xs text-gray-700 font-medium flex items-center gap-1">
                        <Music className="w-3 h-3 text-postech shrink-0" />
                        <span>{item.songTitle}</span>
                      </p>
                    )}
                  </div>

                  {/* Footer Time */}
                  <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1 border-t border-gray-50 font-bold">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span>{timeRangeText}</span>
                    </div>
                    <span className="text-gray-400">
                      {isFinished ? '공연 종료' : isLive ? '진행중' : '공연 예정'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
