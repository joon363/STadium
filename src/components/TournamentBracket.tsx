import React, { useMemo, useRef } from 'react';
import { MatchItem, SCHOOLS, SportKey } from '../config/stadiumConfig';
import { useRealtimeSchedule } from '../hooks/useRealtimeSchedule';
import {
  TournamentTreeData,
  TournamentGameNode,
  computeTournamentTreeLayout,
  createPhoto2Preset,
} from '../types/tournamentTree';
import { Radio, ChevronRight, Trophy } from 'lucide-react';

interface TournamentBracketProps {
  matches?: MatchItem[];
  treeData?: TournamentTreeData;
  sportName: string;
  sportKey?: SportKey;
  onMatchClick?: (match: any) => void;
}

export const TournamentBracket: React.FC<TournamentBracketProps> = ({
  matches,
  treeData,
  sportName,
  sportKey = 'soccer',
  onMatchClick,
}) => {
  const { youtubeLiveUrl } = useRealtimeSchedule();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Build or use provided tree data
  const effectiveTreeData: TournamentTreeData = useMemo(() => {
    if (treeData && Object.keys(treeData.nodes || {}).length > 0) {
      return treeData;
    }

    // If no custom tree saved yet, generate default 6-team standard tree preset
    return createPhoto2Preset(sportKey);
  }, [treeData, sportKey]);

  // Compute Layout & SVG Orthogonal Connecting Lines
  const { nodesWithPos, svgLines, totalWidth, totalHeight } = useMemo(() => {
    return computeTournamentTreeLayout(effectiveTreeData, {
      cardWidth: 170,
      cardHeight: 60,
      teamPillWidth: 100,
      teamPillHeight: 34,
      colGap: 36,
      levelHeight: 96,
      paddingX: 28,
      paddingY: 36,
    });
  }, [effectiveTreeData]);

  if (!effectiveTreeData || Object.keys(effectiveTreeData.nodes || {}).length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-500">
        <p className="text-xs font-bold">등록된 토너먼트 일정이 없습니다.</p>
      </div>
    );
  }

  const gameCount = Object.values(effectiveTreeData.nodes).filter((n) => n.type === 'game').length;

  return (
    <div className="space-y-3">
      {/* Clean Bracket Container */}
      <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-2xs">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-2.5 mb-2 text-xs font-bold text-gray-800">
          <div className="flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>{sportName} 토너먼트 대진표</span>
          </div>
          <span className="text-[11px] font-medium text-gray-400">총 {gameCount}경기</span>
        </div>

        {/* Scrollable Tree Canvas (Bottom to Top) */}
        <div
          ref={scrollContainerRef}
          className="overflow-x-auto no-scrollbar scroll-smooth relative"
        >
          <div
            style={{ width: totalWidth, height: totalHeight }}
            className="relative select-none mx-auto"
          >
            {/* SVG Inverted-U Connecting Lines Layer */}
            <svg
              className="absolute inset-0 pointer-events-none z-0"
              width={totalWidth}
              height={totalHeight}
            >
              {svgLines.map((line) => (
                <path
                  key={line.id}
                  d={line.path}
                  fill="none"
                  stroke={line.strokeColor}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}
            </svg>

            {/* Nodes Layer */}
            {nodesWithPos.map(({ node, x, y, width, height }) => {
              if (node.type === 'team') {
                const school = SCHOOLS[node.teamName] || {
                  color: '#475569',
                  shortName: node.teamName,
                };
                return (
                  <div
                    key={node.id}
                    style={{ left: x, top: y, width, height }}
                    className="absolute z-10 rounded-lg flex items-center justify-between px-2.5 shadow-xs border border-gray-300 bg-white"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div
                        style={{ backgroundColor: school.color }}
                        className="w-2 h-4 rounded-xs shrink-0"
                      />
                      <span className="text-xs font-black text-gray-900 truncate">
                        {school.shortName || node.teamName}
                      </span>
                    </div>
                  </div>
                );
              }

              // Game Node Card Box
              const game = node as TournamentGameNode;
              const t1 = SCHOOLS[game.team1] || { color: '#64748b', shortName: game.team1 };
              const t2 = SCHOOLS[game.team2] || { color: '#64748b', shortName: game.team2 };
              const isT1Win = game.score1 > game.score2;
              const isT2Win = game.score2 > game.score1;

              return (
                <React.Fragment key={game.id}>
                  {/* LIVE Badge Mounted Cleanly ABOVE the Box (No Clipping) */}
                  {game.isLive && (
                    <div
                      style={{
                        left: x,
                        top: y - 22,
                        width: width,
                      }}
                      className="absolute flex justify-center z-20 pointer-events-auto"
                    >
                      <a
                        href={youtubeLiveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-[9px] font-black bg-rose-600 hover:bg-rose-700 text-white px-2 py-0.5 rounded-full shadow-xs active:scale-95 transition-all cursor-pointer"
                      >
                        <Radio className="w-2.5 h-2.5 animate-pulse" />
                        <span>LIVE 중계 &gt;</span>
                        <ChevronRight className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  )}

                  {/* Match Card Box */}
                  <div
                    onClick={() => onMatchClick && onMatchClick(game)}
                    style={{
                      left: x,
                      top: y,
                      width,
                      height,
                    }}
                    className={`absolute z-10 bg-white border rounded-lg shadow-2xs flex flex-col justify-between overflow-hidden cursor-pointer transition-all hover:border-gray-400 ${
                      game.isLive ? 'border-rose-500 ring-2 ring-rose-100' : 'border-gray-300'
                    }`}
                  >
                    {/* Top Header Label in Card */}
                    <div className="bg-slate-50 border-b border-gray-100 px-2 py-0.5 flex items-center justify-between text-[9px] font-bold text-gray-500">
                      <span>{game.roundName}</span>
                      <span>
                        {String(game.startHour).padStart(2, '0')}:
                        {String(game.startMinute).padStart(2, '0')}
                      </span>
                    </div>

                    {/* Team 1 Row */}
                    <div
                      className={`flex items-center justify-between px-2 py-0.5 h-1/2 border-b border-gray-100 ${
                        isT1Win
                          ? 'bg-slate-50 font-bold text-gray-900'
                          : isT2Win
                            ? 'text-gray-400'
                            : 'text-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div
                          style={{ backgroundColor: t1.color }}
                          className="w-1.5 h-3.5 rounded-xs shrink-0"
                        />
                        <span className="text-[11px] font-bold truncate">
                          {t1.shortName || game.team1}
                        </span>
                      </div>
                      <span
                        style={isT1Win ? { color: t1.color } : undefined}
                        className={`text-xs font-black ${isT1Win ? 'font-black' : 'text-gray-500'}`}
                      >
                        {game.score1}
                      </span>
                    </div>

                    {/* Team 2 Row */}
                    <div
                      className={`flex items-center justify-between px-2 py-0.5 h-1/2 ${
                        isT2Win
                          ? 'bg-slate-50 font-bold text-gray-900'
                          : isT1Win
                            ? 'text-gray-400'
                            : 'text-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div
                          style={{ backgroundColor: t2.color }}
                          className="w-1.5 h-3.5 rounded-xs shrink-0"
                        />
                        <span className="text-[11px] font-bold truncate">
                          {t2.shortName || game.team2}
                        </span>
                      </div>
                      <span
                        style={isT2Win ? { color: t2.color } : undefined}
                        className={`text-xs font-black ${isT2Win ? 'font-black' : 'text-gray-500'}`}
                      >
                        {game.score2}
                      </span>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Bottom Direction Hint */}
        <div className="pt-2 mt-1 border-t border-gray-100 text-[10px] text-gray-400 flex items-center justify-between">
          <span>▲ 아래(예선)에서 위(결승)로 토너먼트가 진행됩니다.</span>
          <span>STadium Championship</span>
        </div>
      </div>
    </div>
  );
};
