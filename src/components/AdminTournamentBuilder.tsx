import React, { useState, useMemo } from 'react';
import { SportKey, SCHOOLS } from '../config/stadiumConfig';
import {
  TournamentTreeData,
  TournamentLeafNode,
  TournamentGameNode,
  computeTournamentTreeLayout,
  propagateTournamentTreeWinners,
  createPhoto1Preset,
  createPhoto2Preset,
  create4TeamPreset,
} from '../types/tournamentTree';
import {
  Plus,
  Trash2,
  Trophy,
  Layers,
  Sparkles,
  RefreshCw,
  Radio,
  CheckCircle2,
} from 'lucide-react';

interface AdminTournamentCanvasProps {
  sportKey: SportKey;
  treeData: TournamentTreeData;
  onChange: (newTree: TournamentTreeData) => void;
  onSave?: () => void;
  isSaving?: boolean;
  selectedMatchRound?: string | null;
  onSelectGame?: (game: TournamentGameNode | null) => void;
  selectedNodeId?: string | null;
  onSelectNode?: (nodeId: string | null) => void;
}

export const AdminTournamentBuilder: React.FC<AdminTournamentCanvasProps> = ({
  sportKey,
  treeData,
  onChange,
  onSave,
  isSaving,
  selectedMatchRound,
  onSelectGame,
  selectedNodeId,
  onSelectNode,
}) => {
  // Selected nodes for pairing (up to 2 nodes selected)
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  // Node currently highlighted
  const [localActiveNodeId, setLocalActiveNodeId] = useState<string | null>(null);
  const activeNodeId = selectedNodeId !== undefined ? selectedNodeId : localActiveNodeId;
  const setActiveNodeId = (id: string | null) => {
    setLocalActiveNodeId(id);
    if (onSelectNode) onSelectNode(id);
  };

  const effectiveTree = useMemo(() => {
    return propagateTournamentTreeWinners(treeData);
  }, [treeData]);

  const nodes = effectiveTree.nodes || {};
  const allNodeList = Object.values(nodes);

  // Compute Layout & SVG Orthogonal Connecting Lines
  const { nodesWithPos, svgLines, totalWidth, totalHeight } = useMemo(() => {
    return computeTournamentTreeLayout(effectiveTree, {
      cardWidth: 90,
      cardHeight: 42,
      teamPillWidth: 90,
      teamPillHeight: 24,
      colGap: 4,
      levelHeight: 60,
      paddingX: 6,
      paddingY: 18,
    });
  }, [effectiveTree]);

  // Leaf teams sorted by column index
  const leafTeams = useMemo(() => {
    return allNodeList
      .filter((n): n is TournamentLeafNode => n.type === 'team')
      .sort((a, b) => a.colIndex - b.colIndex);
  }, [allNodeList]);

  // Handle clicking a node on the visual canvas
  const handleNodeClick = (nodeId: string) => {
    setActiveNodeId(nodeId);
    const clickedNode = nodes[nodeId];
    if (clickedNode && clickedNode.type === 'game' && onSelectGame) {
      onSelectGame(clickedNode as TournamentGameNode);
    }

    // Toggle multi-selection for game creation (up to 2 nodes)
    setSelectedNodeIds((prev) => {
      if (prev.includes(nodeId)) {
        return prev.filter((id) => id !== nodeId);
      }
      if (prev.length >= 2) {
        return [prev[1], nodeId];
      }
      return [...prev, nodeId];
    });
  };

  // Add a new Team Leaf Node on the baseline (Row 1)
  const handleAddTeamNode = () => {
    const nextCol = leafTeams.length;
    const defaultSchools = ['POSTECH', 'KAIST', 'GIST', 'UNIST', 'DGIST', 'KENTECH'];
    const assignedSchool = defaultSchools[nextCol % defaultSchools.length] || `팀 ${nextCol + 1}`;

    const newId = `${sportKey}-team-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newTeamNode: TournamentLeafNode = {
      id: newId,
      type: 'team',
      teamName: assignedSchool,
      colIndex: nextCol,
      level: 0,
    };

    const newNodes = { ...nodes, [newId]: newTeamNode };
    onChange({ ...treeData, nodes: newNodes });
    setActiveNodeId(newId);
  };

  // Create a Game Node by merging the 2 selected nodes
  const handleCreateGameFromSelection = () => {
    if (selectedNodeIds.length !== 2) return;

    const n1 = nodes[selectedNodeIds[0]];
    const n2 = nodes[selectedNodeIds[1]];
    if (!n1 || !n2) return;

    // Determine left child and right child based on column or level
    const [c1, c2] = n1.level <= n2.level ? [n1, n2] : [n2, n1];
    const newLevel = Math.max(c1.level, c2.level) + 1;

    const team1Label = c1.type === 'team' ? c1.teamName : `${c1.roundName} 승자`;
    const team2Label = c2.type === 'team' ? c2.teamName : `${c2.roundName} 승자`;

    const gameCount = allNodeList.filter((n) => n.type === 'game').length + 1;
    const roundNameDefault =
      newLevel >= 3 ? '결선' : newLevel === 2 ? `본선 ${gameCount}경기` : `예선 ${gameCount}경기`;

    const newGameId = `${sportKey}-game-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newGameNode: TournamentGameNode = {
      id: newGameId,
      type: 'game',
      roundName: roundNameDefault,
      child1Id: c1.id,
      child2Id: c2.id,
      team1: team1Label,
      team2: team2Label,
      score1: 0,
      score2: 0,
      startHour: 10 + (gameCount - 1) * 2,
      startMinute: 0,
      endHour: 11 + (gameCount - 1) * 2,
      endMinute: 30,
      venue: '체육관',
      level: newLevel,
    };

    const newNodes = { ...nodes, [newGameId]: newGameNode };
    onChange({ ...treeData, nodes: newNodes });
    setSelectedNodeIds([]);
    setActiveNodeId(newGameId);
    if (onSelectGame) onSelectGame(newGameNode);
  };

  // Delete selected node and cascade disconnect
  const handleDeleteActiveNode = () => {
    if (!activeNodeId) return;
    const targetId = activeNodeId;
    const updated = { ...nodes };
    delete updated[targetId];

    // Remove references or dependent games
    Object.keys(updated).forEach((k) => {
      const n = updated[k];
      if (n.type === 'game' && (n.child1Id === targetId || n.child2Id === targetId)) {
        delete updated[k];
      }
    });

    onChange({ ...treeData, nodes: updated });
    setActiveNodeId(null);
    setSelectedNodeIds((prev) => prev.filter((id) => id !== targetId));
    if (onSelectGame) onSelectGame(null);
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3 flex flex-col justify-between">
      {/* Top Presets & Controls Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-200 pb-2.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>프리셋:</span>
          </span>
          <button
            onClick={() => {
              if (confirm('사진 1 (5개교 비대칭) 템플릿을 불러오시겠습니까?')) {
                onChange(createPhoto1Preset(sportKey));
                setSelectedNodeIds([]);
                setActiveNodeId(null);
              }
            }}
            className="px-2 py-1 bg-white hover:bg-slate-100 text-amber-800 border border-slate-200 rounded text-[11px] font-bold transition-colors shadow-2xs"
          >
            ⚾ 5개교 비대칭
          </button>
          <button
            onClick={() => {
              if (confirm('사진 2 (6개교 정석) 템플릿을 불러오시겠습니까?')) {
                onChange(createPhoto2Preset(sportKey));
                setSelectedNodeIds([]);
                setActiveNodeId(null);
              }
            }}
            className="px-2 py-1 bg-white hover:bg-slate-100 text-sky-800 border border-slate-200 rounded text-[11px] font-bold transition-colors shadow-2xs"
          >
            🏸 6개교 래더
          </button>
          <button
            onClick={() => {
              if (confirm('4개교 준결승 토너먼트 템플릿을 불러오시겠습니까?')) {
                onChange(create4TeamPreset(sportKey));
                setSelectedNodeIds([]);
                setActiveNodeId(null);
              }
            }}
            className="px-2 py-1 bg-white hover:bg-slate-100 text-emerald-800 border border-slate-200 rounded text-[11px] font-bold transition-colors shadow-2xs"
          >
            🏆 4개교
          </button>
          <button
            onClick={() => {
              if (confirm('모든 대진표 노드를 초기화하시겠습니까?')) {
                onChange({ sportKey, nodes: {} });
                setSelectedNodeIds([]);
                setActiveNodeId(null);
              }
            }}
            className="px-2 py-1 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded text-[11px] font-bold transition-colors shadow-2xs flex items-center gap-0.5"
          >
            <RefreshCw className="w-2.5 h-2.5" />
            <span>초기화</span>
          </button>
        </div>

        {onSave && (
          <button
            onClick={onSave}
            disabled={isSaving}
            className="px-3 py-1.5 bg-postech hover:bg-postech-dark text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs transition-all active:scale-95"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isSaving ? '저장 중...' : '대진표 전체 저장'}</span>
          </button>
        )}
      </div>

      {/* Canvas Viewport */}
      <div className="overflow-x-auto overflow-y-auto no-scrollbar min-h-[380px] bg-white border border-slate-200/80 rounded-xl p-3 relative flex items-center justify-center">
        {allNodeList.length === 0 ? (
          /* Empty Initial State */
          <div className="text-center py-10 space-y-2.5">
            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">등록된 대진표 노드가 없습니다</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                상단 프리셋을 선택하거나 아래 버튼으로 1행 팀 노드를 추가하세요.
              </p>
            </div>
            <button
              onClick={handleAddTeamNode}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1 shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ 1행 팀 노드 추가</span>
            </button>
          </div>
        ) : (
          /* Populated Canvas with Dynamic SVG Lines and Node Boxes */
          <div
            style={{ width: totalWidth, height: totalHeight }}
            className="relative select-none my-auto"
          >
            {/* SVG Inverted-U Connectors */}
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

            {/* Render Nodes with Exact Computed Positions */}
            {nodesWithPos.map(({ node, x, y, width, height }) => {
              const isSelected = selectedNodeIds.includes(node.id);
              const isActive = activeNodeId === node.id;
              const isMatchHighlighted =
                node.type === 'game' &&
                selectedMatchRound &&
                (node as TournamentGameNode).roundName === selectedMatchRound;

              if (node.type === 'team') {
                const school = SCHOOLS[node.teamName] || {
                  color: '#475569',
                  shortName: node.teamName,
                };
                return (
                  <div
                    key={node.id}
                    onClick={() => handleNodeClick(node.id)}
                    style={{ left: x, top: y, width, height }}
                    className={`absolute z-10 rounded-md flex items-center justify-between px-1.5 shadow-2xs cursor-pointer transition-all border ${isSelected
                      ? 'ring-2 ring-postech border-postech bg-rose-50'
                      : isActive
                        ? 'ring-2 ring-slate-500 border-slate-700 bg-white'
                        : 'border-slate-300 bg-white hover:border-slate-400'
                      }`}
                  >
                    <div className="flex items-center gap-1 min-w-0">
                      <div
                        style={{ backgroundColor: school.color }}
                        className="w-1.5 h-3 rounded-xs shrink-0"
                      />
                      <span className="text-[10px] font-black text-slate-900 truncate">
                        {school.shortName || node.teamName}
                      </span>
                    </div>
                    <span className="text-[8px] font-bold text-slate-400">1행</span>
                  </div>
                );
              }

              // Game Node Card Box
              const game = node as TournamentGameNode;
              const t1 = SCHOOLS[game.team1] || { color: '#64748b', shortName: game.team1 };
              const t2 = SCHOOLS[game.team2] || { color: '#64748b', shortName: game.team2 };
              const isT1Win = game.score1 > game.score2;
              const isT2Win = game.score2 > game.score1;
              const isLive = game.status === 'live' || (game.status === undefined && game.isLive);
              const isAfter = game.status === 'after';

              return (
                <div
                  key={game.id}
                  onClick={() => handleNodeClick(game.id)}
                  style={{ left: x, top: y, width, height }}
                  className={`absolute z-10 rounded-md flex flex-col justify-between overflow-hidden shadow-2xs cursor-pointer transition-all border ${isMatchHighlighted
                      ? 'ring-2 ring-amber-500 border-amber-500 bg-amber-50/40'
                      : isSelected
                        ? 'ring-2 ring-postech border-postech bg-rose-50'
                        : isActive
                          ? 'ring-2 ring-slate-600 border-slate-800 bg-white'
                          : isLive
                            ? 'border-rose-500 ring-1 ring-rose-200 bg-white'
                            : isAfter
                              ? 'border-slate-300 bg-slate-50/70'
                              : 'border-slate-300 bg-white hover:border-slate-400'
                    }`}
                >
                  {/* Top Header Label in Card */}
                  <div className="bg-slate-100/90 border-b border-slate-200/80 px-1 py-0 flex items-center justify-between text-[8px] font-bold text-slate-600 leading-tight">
                    <span className="truncate">{game.roundName}</span>
                    {isLive ? (
                      <span className="text-rose-600 flex items-center gap-0.5 text-[7.5px] font-black">
                        <Radio className="w-1.5 h-1.5" /> LIVE
                      </span>
                    ) : isAfter ? (
                      <span className="text-emerald-700 text-[7.5px] font-bold">
                        종료
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[7.5px]">
                        {String(game.startHour).padStart(2, '0')}:
                        {String(game.startMinute).padStart(2, '0')}
                      </span>
                    )}
                  </div>

                  {/* Team 1 Row */}
                  <div
                    className={`flex items-center justify-between px-1 py-0 h-1/2 border-b border-slate-100 ${isAfter && isT1Win ? 'font-bold text-slate-900 bg-slate-100/80' : isAfter && isT2Win ? 'text-slate-400 opacity-60' : 'text-slate-700'
                      }`}
                  >
                    <div className="flex items-center gap-1 min-w-0">
                      <div
                        style={{ backgroundColor: t1.color }}
                        className="w-1 h-2.5 rounded-xs shrink-0"
                      />
                      <span className="text-[10px] truncate">{t1.shortName || game.team1}</span>
                    </div>
                    <span className="text-[10px] font-black text-slate-800 shrink-0">
                      {game.score1}
                    </span>
                  </div>

                  {/* Team 2 Row */}
                  <div
                    className={`flex items-center justify-between px-1 py-0 h-1/2 ${isAfter && isT2Win ? 'font-bold text-slate-900 bg-slate-100/80' : isAfter && isT1Win ? 'text-slate-400 opacity-60' : 'text-slate-700'
                      }`}
                  >
                    <div className="flex items-center gap-1 min-w-0">
                      <div
                        style={{ backgroundColor: t2.color }}
                        className="w-1 h-2.5 rounded-xs shrink-0"
                      />
                      <span className="text-[10px] truncate">{t2.shortName || game.team2}</span>
                    </div>
                    <span className="text-[10px] font-black text-slate-800 shrink-0">
                      {game.score2}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Action Bar of Canvas */}
      <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-200">
        <div className="flex items-center gap-2">
          <button
            onClick={handleAddTeamNode}
            className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-postech" />
            <span>팀 노드 추가 (1행)</span>
          </button>

          {activeNodeId && (
            <button
              onClick={handleDeleteActiveNode}
              className="px-2.5 py-1.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>선택 노드 삭제</span>
            </button>
          )}
        </div>

        {/* Merge Selected Nodes Button */}
        {selectedNodeIds.length === 2 && (
          <button
            onClick={handleCreateGameFromSelection}
            className="px-3.5 py-1.5 bg-postech hover:bg-postech-dark text-white rounded-lg text-xs font-extrabold flex items-center gap-1.5 shadow-md animate-bounce transition-all"
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>
              선택한 2개 노드로 윗행 경기 생성 (Level{' '}
              {Math.max(
                nodes[selectedNodeIds[0]]?.level || 0,
                nodes[selectedNodeIds[1]]?.level || 0
              ) + 1}
              )
            </span>
          </button>
        )}

        {selectedNodeIds.length === 1 && (
          <span className="text-[11px] text-slate-500 font-bold">
            * 짝지을 상대 노드를 1개 더 클릭하세요.
          </span>
        )}
      </div>
    </div>
  );
};
