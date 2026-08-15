import React, { useState } from 'react';
import { SCHOOLS, STAGE_CATEGORIES, StageItem } from '../config/stadiumConfig';
import { useRealtimeSchedule } from '../hooks/useRealtimeSchedule';
import { useSchool } from '../context/SchoolContext';
import { Clock, MapPin, Radio, Calendar, Filter, Layers, X, Sparkles, Disc, Info } from 'lucide-react';

export const StageDetail: React.FC = () => {
  const { stageConfig, stageSchedule, now } = useRealtimeSchedule();
  const { selectedSchool, setSelectedSchool } = useSchool();
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedSetlist, setSelectedSetlist] = useState<StageItem | null>(null);

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

  // Filter stage performances based on selected school & selected category
  const filteredSchedule = stageSchedule.filter((item) => {
    if (selectedSchool !== 'ALL' && item.school !== selectedSchool) {
      return false;
    }
    if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
      return false;
    }
    return true;
  });

  return (
    <div className="flex flex-col gap-2.5 p-3 text-gray-900 pb-8">
      {/* Category Filter Pills (구분: 전체 | 밴드 | 댄스 | 힙합 | 응원단 | 기타) */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        <div className="flex items-center gap-1 text-[11px] font-bold text-gray-500 shrink-0 mr-1">
          <Layers className="w-3.5 h-3.5 text-slate-700" />
          <span>구분</span>
        </div>
        <button
          onClick={() => setSelectedCategory('ALL')}
          className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 transition-colors shadow-2xs ${selectedCategory === 'ALL'
            ? 'bg-slate-900 text-white'
            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
        >
          전체
        </button>
        {STAGE_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 transition-colors shadow-2xs ${selectedCategory === cat
              ? 'bg-slate-900 text-white font-extrabold'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
          >
            {cat}
          </button>
        ))}
      </div>

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

      {/* Main Live / Featured Stage Banner (Always at top) */}
      <section className="bg-white text-gray-900 rounded-xl p-3 border border-gray-200/90 shadow-2xs relative overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-2 text-xs">
          <div className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-rose-600" />
            {stageConfig.isLive ? (
              <span className="font-bold text-rose-600 uppercase tracking-wider">
                LIVE NOW
              </span>
            ) : (
              <span className="font-bold text-gray-600">
                공연 대기중
              </span>
            )}
          </div>
          <span className="font-bold text-slate-800">
            {stageConfig.statusText}
          </span>
        </div>

        {/* Performance details */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            style={{ backgroundColor: currentSchool.color }}
            className="text-white text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0"
          >
            {currentSchool.shortName}
          </span>

          <span className="font-bold text-sm text-gray-900 truncate">
            {stageConfig.clubName}
          </span>

          {/* Category Chip */}
          <span className="text-[9px] font-bold bg-slate-100 text-slate-800 border border-slate-200 px-1.5 py-0.5 rounded shrink-0">
            {stageConfig.category}
          </span>

          {/* Optional Genre Chip */}
          {stageConfig.genre && (
            <span className="text-[9px] font-bold bg-gray-50 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200 shrink-0">
              {stageConfig.genre}
            </span>
          )}
        </div>
      </section>

      {/* Full Stage Timetable List (Perfectly Aligned Connected Timeline Nodes) */}
      <section className="space-y-2 pt-0.5">
        <div className="flex items-center justify-between font-bold text-gray-900 text-xs px-1">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-700" />
            <h2>전체 공연 타임라인</h2>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-gray-500 font-medium">
            <MapPin className="w-3 h-3 text-slate-600" />
            <span>POSTECH 체육관 실내무대</span>
          </div>
        </div>

        {filteredSchedule.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-6 text-center text-gray-500">
            <p className="text-xs font-bold">선택하신 조건의 공연 일정이 없습니다.</p>
            <button
              onClick={() => {
                setSelectedSchool('ALL');
                setSelectedCategory('ALL');
              }}
              className="mt-2 text-xs text-slate-800 font-bold underline"
            >
              전체 공연 보기
            </button>
          </div>
        ) : (
          <div className="relative pl-7 space-y-3">
            {/* Continuous Vertical Timeline Connecting Line (Exact 10px from container left) */}
            <div className="absolute left-2.5 top-4 bottom-4 w-0.5 bg-gray-200 -translate-x-1/2 z-0" />

            {filteredSchedule.map((item, idx) => {
              const schoolObj = SCHOOLS[item.school] || SCHOOLS.POSTECH;

              const start = new Date(now);
              start.setHours(item.startHour, item.startMinute, 0, 0);
              const end = new Date(now);
              end.setHours(item.endHour, item.endMinute, 0, 0);

              const isLive = nowMs >= start.getTime() && nowMs <= end.getTime();
              const isFinished = nowMs > end.getTime();

              const timeRangeText = `${String(item.startHour).padStart(2, '0')}:${String(
                item.startMinute
              ).padStart(2, '0')} - ${String(item.endHour).padStart(2, '0')}:${String(
                item.endMinute
              ).padStart(2, '0')}`;

              return (
                <div key={idx} className="relative">
                  {/* Timeline Node Circle - Perfectly Centered on the line (-left-[18px] from content) */}
                  <div className="absolute -left-[18px] top-4 -translate-x-1/2 -translate-y-1/2 z-10">
                    {isLive ? (
                      <div className="w-3.5 h-3.5 rounded-full bg-rose-600 ring-4 ring-rose-100 shadow-sm" />
                    ) : isFinished ? (
                      <div className="w-2.5 h-2.5 rounded-full bg-gray-300 border border-white" />
                    ) : (
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-700 border border-white" />
                    )}
                  </div>

                  {/* Card Container with Modern Angled Sliced Fade Accent */}
                  <div
                    className={`relative overflow-hidden bg-white border rounded-xl p-3 flex flex-col gap-1.5 transition-all ${
                      isFinished
                        ? 'opacity-60 grayscale border-gray-200 bg-slate-50/70'
                        : isLive
                        ? 'border-rose-300 shadow-xs ring-1 ring-rose-200/50'
                        : 'border-gray-200/90 shadow-2xs hover:border-gray-300'
                    }`}
                  >
                    {/* Left Vertical School Solid Edge Accent */}
                    <div
                      className="absolute top-0 left-0 w-1 h-full pointer-events-none z-0"
                      style={{ backgroundColor: isFinished ? '#cbd5e1' : schoolObj.color }}
                    />

                    {/* Geometric Flat Diagonal Solid Slices Backdrop on Right */}
                    {!isFinished && (
                      <svg
                        className="absolute top-0 right-0 h-full w-28 pointer-events-none z-0"
                        preserveAspectRatio="none"
                        viewBox="0 0 100 100"
                      >
                        {/* Step 1: Rightmost wide solid color block */}
                        <polygon points="52,0 100,0 100,100 40,100" fill={schoolObj.color} fillOpacity="0.75" />

                        {/* Step 2: Second medium flat solid slice */}
                        <polygon points="28,0 52,0 40,100 16,100" fill={schoolObj.color} fillOpacity="0.38" />

                        {/* Step 3: Third shortest flat solid slice extending left */}
                        <polygon points="14,0 28,0 16,100 2,100" fill={schoolObj.color} fillOpacity="0.12" />
                      </svg>
                    )}

                    {/* Header Row: School name & Club + Chips */}
                    <div className="relative z-10 flex items-center justify-between border-b border-gray-100/80 pb-1.5 text-xs">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-bold text-xs text-gray-900 truncate">
                          <strong style={{ color: isFinished ? '#64748b' : schoolObj.color }} className="mr-1">
                            [{schoolObj.shortName}]
                          </strong>
                          {item.clubName}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {isLive && (
                          <span className="text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200 px-1.5 py-0.2 rounded-full mr-0.5">
                            LIVE
                          </span>
                        )}

                        {/* Category Chip */}
                        <span className="text-[9px] font-bold bg-slate-100 text-slate-800 border border-slate-200/90 px-1.5 py-0.2 rounded">
                          {item.category}
                        </span>

                        {/* Optional Genre Chip */}
                        {item.genre && (
                          <span className="text-[9px] font-bold bg-gray-50 text-gray-600 px-1.5 py-0.2 rounded border border-gray-200">
                            {item.genre}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Footer Time & Setlist Button */}
                    <div className="relative z-10 flex items-center justify-between text-[10px] text-gray-500 pt-0.5 font-bold">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span>{timeRangeText}</span>
                      </div>

                      {/* Gray Setlist Button with Info icon */}
                      <button
                        onClick={() => setSelectedSetlist(item)}
                        className="text-[10px] font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors"
                      >
                        <Info className="w-3 h-3 text-gray-500" />
                        <span>세트리스트</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Setlist Modal Tooltip Sheet */}
      {selectedSetlist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-sm rounded-2xl p-4 shadow-2xl space-y-3 relative border border-gray-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <div className="flex items-center gap-2">
                <Disc className="w-4 h-4 text-slate-800" />
                <h3 className="font-extrabold text-sm text-gray-900">
                  [{SCHOOLS[selectedSetlist.school]?.shortName}] {selectedSetlist.clubName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedSetlist(null)}
                className="p-1 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200 px-2 py-0.5 rounded-md">
                구분: {selectedSetlist.category}
              </span>
              {selectedSetlist.genre && (
                <span className="text-[10px] font-bold bg-gray-50 text-gray-600 px-2 py-0.5 rounded-md border border-gray-200">
                  장르: {selectedSetlist.genre}
                </span>
              )}
            </div>

            {/* Songs List */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-1.5">
              <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <span>세트리스트</span>
              </div>
              {parseSongList(selectedSetlist.songTitle).map((song, songIdx) => (
                <p key={songIdx} className="text-xs text-gray-800 font-bold flex items-center gap-2 leading-relaxed">
                  <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-800 text-[10px] flex items-center justify-center font-black shrink-0">
                    {songIdx + 1}
                  </span>
                  <span>{song}</span>
                </p>
              ))}
            </div>

            {/* Close Button */}
            <button
              onClick={() => setSelectedSetlist(null)}
              className="w-full py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
