import React, { useState, useMemo } from 'react';
import { SportKey, SCHOOLS } from '../config/stadiumConfig';
import {
  TournamentTreeData,
  TournamentNode,
  TournamentLeafNode,
  TournamentGameNode,
  computeTournamentTreeLayout,
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
  Clock,
  Radio,
  CheckCircle2,
} from 'lucide-react';

interface AdminTournamentBuilderProps {
  sportKey: SportKey;
  treeData: TournamentTreeData;
  onChange: (newTree: TournamentTreeData) => void;
  onSave?: () => void;
  isSaving?: boolean;
}

export const AdminTournamentBuilder: React.FC<AdminTournamentBuilderProps> = ({
  sportKey,
  treeData,
  onChange,
  onSave,
  isSaving,
}) => {
  // Selected nodes for pairing (up to 2 nodes selected)
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  // Node currently being inspected/edited in the side inspector
  const [inspectingNodeId, setInspectingNodeId] = useState<string | null>(null);

  const nodes = treeData.nodes || {};
  const allNodeList = Object.values(nodes);

  // Compute Layout & SVG Orthogonal Connecting Lines
  const { nodesWithPos, svgLines, totalWidth, totalHeight } = useMemo(() => {
    return computeTournamentTreeLayout(treeData, {
      cardWidth: 170,
      cardHeight: 60,
      teamPillWidth: 104,
      teamPillHeight: 34,
      colGap: 36,
      levelHeight: 96,
      paddingX: 32,
      paddingY: 36,
    });
  }, [treeData]);

  // Leaf teams sorted by column index
  const leafTeams = useMemo(() => {
    return allNodeList
      .filter((n): n is TournamentLeafNode => n.type === 'team')
      .sort((a, b) => a.colIndex - b.colIndex);
  }, [allNodeList]);

  // Handle clicking a node on the visual canvas
  const handleNodeClick = (nodeId: string) => {
    setInspectingNodeId(nodeId);

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

    const newId = `team-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newTeamNode: TournamentLeafNode = {
      id: newId,
      type: 'team',
      teamName: assignedSchool,
      colIndex: nextCol,
      level: 0,
    };

    const newNodes = { ...nodes, [newId]: newTeamNode };
    onChange({ ...treeData, nodes: newNodes });
    setInspectingNodeId(newId);
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
      newLevel >= 3 ? '결승전' : newLevel === 2 ? `본선 ${gameCount}경기` : `예선 ${gameCount}경기`;

    const newGameId = `game-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
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
    setInspectingNodeId(newGameId);
  };

  // Delete a node and cascade disconnect
  const handleDeleteNode = (nodeId: string) => {
    const updated = { ...nodes };
    delete updated[nodeId];

    // Remove references or dependent games
    Object.keys(updated).forEach((k) => {
      const n = updated[k];
      if (n.type === 'game' && (n.child1Id === nodeId || n.child2Id === nodeId)) {
        delete updated[k];
      }
    });

    onChange({ ...treeData, nodes: updated });
    if (inspectingNodeId === nodeId) setInspectingNodeId(null);
    setSelectedNodeIds((prev) => prev.filter((id) => id !== nodeId));
  };

  // Update field of inspecting node
  const handleUpdateInspectingNode = (field: string, value: any) => {
    if (!inspectingNodeId || !nodes[inspectingNodeId]) return;
    const current = nodes[inspectingNodeId];
    const updated = { ...current, [field]: value };
    onChange({
      ...treeData,
      nodes: { ...nodes, [inspectingNodeId]: updated as TournamentNode },
    });
  };

  // Selected Inspecting Node
  const inspectingNode = inspectingNodeId ? nodes[inspectingNodeId] : null;

  return (
    <div className="space-y-4">
      {/* Top Presets & Action Toolbar */}
      <div className="bg-slate-900 text-white rounded-xl p-4 shadow-sm flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>대진표 프리셋 템플릿:</span>
          </span>
          <button
            onClick={() => {
              if (confirm('사진 1 (5개교 비대칭 토너먼트) 템플릿을 불러오시겠습니까?')) {
                onChange(createPhoto1Preset(sportKey));
                setSelectedNodeIds([]);
                setInspectingNodeId(null);
              }
            }}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded-lg text-xs font-bold transition-colors"
          >
            ⚾ 5개교 비대칭 (사진 1)
          </button>
          <button
            onClick={() => {
              if (confirm('사진 2 (6개교 정석 토너먼트) 템플릿을 불러오시겠습니까?')) {
                onChange(createPhoto2Preset(sportKey));
                setSelectedNodeIds([]);
                setInspectingNodeId(null);
              }
            }}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 rounded-lg text-xs font-bold transition-colors"
          >
            🏸 6개교 래더 (사진 2)
          </button>
          <button
            onClick={() => {
              if (confirm('4개교 준결승 토너먼트 템플릿을 불러오시겠습니까?')) {
                onChange(create4TeamPreset(sportKey));
                setSelectedNodeIds([]);
                setInspectingNodeId(null);
              }
            }}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 rounded-lg text-xs font-bold transition-colors"
          >
            🏆 4개교 토너먼트
          </button>
          <button
            onClick={() => {
              if (confirm('모든 노드를 초기화하고 새로 구성하시겠습니까?')) {
                onChange({ sportKey, nodes: {} });
                setSelectedNodeIds([]);
                setInspectingNodeId(null);
              }
            }}
            className="px-2.5 py-1.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span>초기화</span>
          </button>
        </div>

        {onSave && (
          <button
            onClick={onSave}
            disabled={isSaving}
            className="px-4 py-2 bg-postech hover:bg-postech-dark text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isSaving ? '저장 중...' : '토너먼트 대진표 전체 저장'}</span>
          </button>
        )}
      </div>

      {/* Main Builder Grid: Visual Canvas (Left/Top) + Inspector Edit Table (Right/Bottom) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Visual Interactive Canvas (7 cols on desktop) */}
        <div className="lg:col-span-8 bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-200 pb-2.5">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-postech" />
              <h3 className="font-extrabold text-sm text-slate-800">
                인터랙티브 토너먼트 트리 캔버스
              </h3>
            </div>
            <div className="text-[11px] text-slate-500 font-medium flex items-center gap-2">
              <span>* 2개 노드를 클릭 선택하여 윗행 경기를 생성하세요.</span>
            </div>
          </div>

          {/* Canvas Viewport */}
          <div className="overflow-x-auto overflow-y-auto no-scrollbar min-h-[340px] bg-white border border-slate-200/80 rounded-xl p-4 relative flex items-center justify-center">
            {allNodeList.length === 0 ? (
              /* Empty Initial State: + Button */
              <div className="text-center py-12 space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
                  <Plus className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">
                    등록된 토너먼트 노드가 없습니다
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    아래 버튼을 눌러 1행에 참가 팀들을 추가하거나 상단 템플릿을 불러오세요.
                  </p>
                </div>
                <button
                  onClick={handleAddTeamNode}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Plus className="w-4 h-4" />
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
                  const isInspected = inspectingNodeId === node.id;

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
                        className={`absolute z-10 rounded-lg flex items-center justify-between px-2.5 shadow-xs cursor-pointer transition-all border ${
                          isSelected
                            ? 'ring-2 ring-postech border-postech bg-rose-50'
                            : isInspected
                              ? 'ring-2 ring-slate-400 border-slate-700 bg-white'
                              : 'border-slate-300 bg-white hover:border-slate-400'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div
                            style={{ backgroundColor: school.color }}
                            className="w-2 h-4 rounded-xs shrink-0"
                          />
                          <span className="text-xs font-black text-slate-900 truncate">
                            {school.shortName || node.teamName}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">1행</span>
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
                    <div
                      key={game.id}
                      onClick={() => handleNodeClick(game.id)}
                      style={{ left: x, top: y, width, height }}
                      className={`absolute z-10 rounded-lg flex flex-col justify-between overflow-hidden shadow-xs cursor-pointer transition-all border ${
                        isSelected
                          ? 'ring-2 ring-postech border-postech bg-rose-50'
                          : isInspected
                            ? 'ring-2 ring-slate-600 border-slate-800 bg-white'
                            : game.isLive
                              ? 'border-rose-500 ring-1 ring-rose-200 bg-white'
                              : 'border-slate-300 bg-white hover:border-slate-400'
                      }`}
                    >
                      {/* Top Header Label in Card */}
                      <div className="bg-slate-100/90 border-b border-slate-200/80 px-2 py-0.5 flex items-center justify-between text-[9px] font-bold text-slate-600">
                        <span>{game.roundName}</span>
                        {game.isLive && (
                          <span className="text-rose-600 flex items-center gap-0.5">
                            <Radio className="w-2 h-2 animate-pulse" /> LIVE
                          </span>
                        )}
                      </div>

                      {/* Team 1 Row */}
                      <div
                        className={`flex items-center justify-between px-2 py-0.5 h-1/2 border-b border-slate-100 ${
                          isT1Win ? 'font-bold text-slate-900' : 'text-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-1 min-w-0">
                          <div
                            style={{ backgroundColor: t1.color }}
                            className="w-1.5 h-3 rounded-xs shrink-0"
                          />
                          <span className="text-[11px] truncate">{t1.shortName || game.team1}</span>
                        </div>
                        <span className="text-[11px] font-black text-slate-800">{game.score1}</span>
                      </div>

                      {/* Team 2 Row */}
                      <div
                        className={`flex items-center justify-between px-2 py-0.5 h-1/2 ${
                          isT2Win ? 'font-bold text-slate-900' : 'text-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-1 min-w-0">
                          <div
                            style={{ backgroundColor: t2.color }}
                            className="w-1.5 h-3 rounded-xs shrink-0"
                          />
                          <span className="text-[11px] truncate">{t2.shortName || game.team2}</span>
                        </div>
                        <span className="text-[11px] font-black text-slate-800">{game.score2}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bottom Action Bar of Canvas */}
          <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-200">
            <button
              onClick={handleAddTeamNode}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-postech" />
              <span>+ 우측에 팀 노드 추가 (1행)</span>
            </button>

            {/* Merge Selected Nodes Button */}
            {selectedNodeIds.length === 2 && (
              <button
                onClick={handleCreateGameFromSelection}
                className="px-4 py-1.5 bg-postech hover:bg-postech-dark text-white rounded-lg text-xs font-extrabold flex items-center gap-1.5 shadow-md animate-bounce transition-all"
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
              <span className="text-xs text-slate-500 font-bold">
                * 만날 상대 노드를 1개 더 클릭하세요.
              </span>
            )}
          </div>
        </div>

        {/* Right Inspector & Node Editor Panel (4 cols on desktop) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h4 className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>노드 속성 편집 (인스펙터)</span>
            </h4>
            {inspectingNode && (
              <button
                onClick={() => handleDeleteNode(inspectingNode.id)}
                className="text-rose-600 hover:bg-rose-50 p-1 rounded text-[11px] font-bold flex items-center gap-1"
                title="노드 삭제"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>삭제</span>
              </button>
            )}
          </div>

          {!inspectingNode ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <p className="text-xs font-bold">좌측 캔버스에서 노드를 선택하세요.</p>
              <p className="text-[11px]">학교명, 스코어, 시간, 장소를 실시간 수정할 수 있습니다.</p>
            </div>
          ) : inspectingNode.type === 'team' ? (
            /* Team Node Inspector */
            <div className="space-y-3">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase">
                  1행 팀 노드
                </span>
                <div className="mt-1 flex items-center gap-2">
                  <div
                    style={{
                      backgroundColor: SCHOOLS[inspectingNode.teamName]?.color || '#64748b',
                    }}
                    className="w-3 h-6 rounded-xs"
                  />
                  <span className="font-black text-sm text-slate-900">
                    {inspectingNode.teamName}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">학교 변경:</label>
                <select
                  value={inspectingNode.teamName}
                  onChange={(e) => handleUpdateInspectingNode('teamName', e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-postech"
                >
                  {Object.keys(SCHOOLS).map((sKey) => (
                    <option key={sKey} value={sKey}>
                      {sKey} ({SCHOOLS[sKey].name})
                    </option>
                  ))}
                  <option value="기타">기타 / 사용자 정의</option>
                </select>
              </div>
            </div>
          ) : (
            /* Game Node Inspector */
            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase">
                    Level {inspectingNode.level} 경기 노드
                  </span>
                  <p className="font-black text-sm text-slate-900 mt-0.5">
                    {(inspectingNode as TournamentGameNode).roundName}
                  </p>
                </div>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean((inspectingNode as TournamentGameNode).isLive)}
                    onChange={(e) => handleUpdateInspectingNode('isLive', e.target.checked)}
                    className="w-3.5 h-3.5 accent-rose-600 rounded"
                  />
                  <span className="text-xs font-extrabold text-rose-600">LIVE</span>
                </label>
              </div>

              {/* Round Name */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">라운드 명칭:</label>
                <input
                  type="text"
                  value={(inspectingNode as TournamentGameNode).roundName}
                  onChange={(e) => handleUpdateInspectingNode('roundName', e.target.value)}
                  placeholder="예: 예선 1경기, 준결승전, 결승전"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-postech"
                />
              </div>

              {/* Teams & Score */}
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">팀 1:</label>
                  <input
                    type="text"
                    value={(inspectingNode as TournamentGameNode).team1}
                    onChange={(e) => handleUpdateInspectingNode('team1', e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-bold"
                  />
                  <div className="mt-1 flex items-center gap-1">
                    <span className="text-[10px] text-slate-500">스코어:</span>
                    <input
                      type="number"
                      value={(inspectingNode as TournamentGameNode).score1}
                      onChange={(e) =>
                        handleUpdateInspectingNode('score1', parseInt(e.target.value) || 0)
                      }
                      className="w-14 bg-white border border-slate-300 rounded px-1.5 py-0.5 text-xs font-black text-center"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">팀 2:</label>
                  <input
                    type="text"
                    value={(inspectingNode as TournamentGameNode).team2}
                    onChange={(e) => handleUpdateInspectingNode('team2', e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-bold"
                  />
                  <div className="mt-1 flex items-center gap-1">
                    <span className="text-[10px] text-slate-500">스코어:</span>
                    <input
                      type="number"
                      value={(inspectingNode as TournamentGameNode).score2}
                      onChange={(e) =>
                        handleUpdateInspectingNode('score2', parseInt(e.target.value) || 0)
                      }
                      className="w-14 bg-white border border-slate-300 rounded px-1.5 py-0.5 text-xs font-black text-center"
                    />
                  </div>
                </div>
              </div>

              {/* Time & Venue */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-500" />
                  <span>경기 시각 (시작 ~ 종료):</span>
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={(inspectingNode as TournamentGameNode).startHour}
                    onChange={(e) =>
                      handleUpdateInspectingNode('startHour', parseInt(e.target.value) || 0)
                    }
                    className="w-12 bg-white border border-slate-300 rounded px-1.5 py-1 text-xs font-bold text-center"
                  />
                  <span>:</span>
                  <input
                    type="number"
                    value={(inspectingNode as TournamentGameNode).startMinute}
                    onChange={(e) =>
                      handleUpdateInspectingNode('startMinute', parseInt(e.target.value) || 0)
                    }
                    className="w-12 bg-white border border-slate-300 rounded px-1.5 py-1 text-xs font-bold text-center"
                  />
                  <span>~</span>
                  <input
                    type="number"
                    value={(inspectingNode as TournamentGameNode).endHour}
                    onChange={(e) =>
                      handleUpdateInspectingNode('endHour', parseInt(e.target.value) || 0)
                    }
                    className="w-12 bg-white border border-slate-300 rounded px-1.5 py-1 text-xs font-bold text-center"
                  />
                  <span>:</span>
                  <input
                    type="number"
                    value={(inspectingNode as TournamentGameNode).endMinute}
                    onChange={(e) =>
                      handleUpdateInspectingNode('endMinute', parseInt(e.target.value) || 0)
                    }
                    className="w-12 bg-white border border-slate-300 rounded px-1.5 py-1 text-xs font-bold text-center"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  경기 장소:
                </label>
                <input
                  type="text"
                  value={(inspectingNode as TournamentGameNode).venue}
                  onChange={(e) => handleUpdateInspectingNode('venue', e.target.value)}
                  placeholder="예: 대운동장, 포항야구장, 체육관"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
