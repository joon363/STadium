import React, { useState } from 'react';
import { SchoolStanding } from '../config/stadiumConfig';
import { Award, ChevronDown, ChevronUp } from 'lucide-react';

interface LeaderboardSectionProps {
  standings: SchoolStanding[];
}

export const LeaderboardSection: React.FC<LeaderboardSectionProps> = ({ standings }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

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

  return (
    <section className="space-y-1.5 select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <Award className="w-4 h-4 text-amber-500" />
          <h2 className="font-black text-sm text-gray-900 tracking-tight">종합 순위표</h2>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-0.5 text-xs text-gray-500 hover:text-gray-900 font-bold transition-colors"
        >
          <span>{isExpanded ? '간략히' : '종목별 상세'}</span>
          {isExpanded ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Standings List */}
      <div className="space-y-1.5">
        {standings.map((item) => {
          const maxPoints = 30; // 5 sports * 6pt max
          const percent = Math.min(100, Math.round((item.totalPoints / maxPoints) * 100));

          // Linear gradient to fill the block background proportionally based on points!
          const itemStyle: React.CSSProperties = {
            background: `linear-gradient(to right, ${item.bgLight} ${percent}%, #ffffff ${percent}%)`,
            borderColor: item.color,
          };

          return (
            <div
              key={item.schoolId}
              style={itemStyle}
              className="border rounded-lg px-2.5 py-1.5 flex flex-col gap-1 transition-all shadow-2xs overflow-hidden"
            >
              {/* Row: Rank, Badge, Name, Total Points */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-4 flex items-center justify-center shrink-0">
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

                <div className="flex items-center gap-1 bg-white/90 border border-gray-200 px-2 py-0.5 rounded shadow-2xs">
                  <Award className="w-3 h-3 text-amber-600" />
                  <span className="font-bold text-xs text-gray-900">{item.totalPoints}</span>
                  <span className="text-[9px] text-gray-500 font-bold">pt</span>
                </div>
              </div>

              {/* Collapsible Per-Sport Breakdown */}
              {isExpanded && (
                <div className="grid grid-cols-5 gap-1 pt-1 border-t border-black/10 text-[10px] font-bold text-gray-700">
                  {Object.values(item.breakdown).map((sp) => (
                    <div
                      key={sp.sportKey}
                      className="bg-white/90 border border-gray-200 rounded px-1 py-0.5 text-center flex flex-col items-center"
                    >
                      <span className="text-[9px] text-gray-500 font-medium leading-none">
                        {sp.sportName}
                      </span>
                      <span className="text-gray-900 font-bold text-[10px] leading-tight">
                        {sp.rank}위 ({sp.points}p)
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
