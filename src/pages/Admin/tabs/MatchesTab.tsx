import React, { useState } from 'react';
import {
  RawScheduledMatch,
  SportKey,
  SCHOOLS,
} from '../../../types/stadium';
import {
  TournamentTreeData,
  TournamentNode,
  TournamentLeafNode,
  TournamentGameNode,
  convertTreeToMatches,
  propagateTournamentTreeWinners,
} from '../../../types/tournamentTree';
import { AdminTournamentBuilder } from '../../../components/AdminTournamentBuilder';
import {
  updateSupabaseMatch,
  deleteSupabaseMatch,
  updateSupabaseTournamentTree,
} from '../../../lib/supabase';
import { Trophy, Clock, Plus, Save, Trash2, Radio } from 'lucide-react';

interface MatchesTabProps {
  matches: RawScheduledMatch[];
  setMatches: React.Dispatch<React.SetStateAction<RawScheduledMatch[]>>;
  tournamentTrees: Record<string, TournamentTreeData>;
  setTournamentTrees: React.Dispatch<React.SetStateAction<Record<string, TournamentTreeData>>>;
  isSaving: boolean;
  setIsSaving: (saving: boolean) => void;
  setSaveStatus: (msg: string | null) => void;
}

const SPORT_OPTIONS: { key: SportKey; name: string; icon: string }[] = [
  { key: 'soccer', name: '축구', icon: '⚽' },
  { key: 'baseball', name: '야구', icon: '⚾' },
  { key: 'lol', name: 'LoL', icon: '🎮' },
  { key: 'badminton_men', name: '배드민턴 (남복)', icon: '🏸' },
  { key: 'badminton_women', name: '배드민턴 (여복)', icon: '🏸' },
  { key: 'badminton_mixed', name: '배드민턴 (혼복)', icon: '🏸' },
  { key: 'basketball', name: '농구', icon: '🏀' },
];

export const MatchesTab: React.FC<MatchesTabProps> = ({
  matches,
  setMatches,
  tournamentTrees,
  setTournamentTrees,
  isSaving,
  setIsSaving,
  setSaveStatus,
}) => {
  const [selectedSportKey, setSelectedSportKey] = useState<SportKey>('soccer');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const currentSportInfo =
    SPORT_OPTIONS.find((s) => s.key === selectedSportKey) || SPORT_OPTIONS[0];

  const currentTree: TournamentTreeData = React.useMemo(() => {
    const raw = tournamentTrees[selectedSportKey] || { sportKey: selectedSportKey, nodes: {} };
    return propagateTournamentTreeWinners(raw);
  }, [tournamentTrees, selectedSportKey]);

  const nodes = currentTree.nodes || {};
  const allNodeList = Object.values(nodes);

  // Group nodes: Team nodes (level 0) & Game nodes (level >= 1)
  const teamNodes = allNodeList
    .filter((n) => n.type === 'team')
    .sort((a: any, b: any) => (a.colIndex || 0) - (b.colIndex || 0));

  const gameNodes = allNodeList
    .filter((n) => n.type === 'game')
    .sort((a: any, b: any) => (a.level || 1) - (b.level || 1));

  const handleSaveTournamentTree = async (sKey: SportKey) => {
    setIsSaving(true);
    const targetTree = tournamentTrees[sKey] || { sportKey: sKey, nodes: {} };
    const ok = await updateSupabaseTournamentTree(sKey, targetTree);

    const sInfo = SPORT_OPTIONS.find((s) => s.key === sKey) || {
      key: sKey,
      name: '스포츠',
      icon: '🏆',
    };
    const updatedSportMatches = convertTreeToMatches(targetTree, sInfo.name, sInfo.icon);

    for (const m of updatedSportMatches) {
      await updateSupabaseMatch(m);
    }

    setMatches((prev) => [...prev.filter((m) => m.sportKey !== sKey), ...updatedSportMatches]);
    setIsSaving(false);
    if (ok) {
      setSaveStatus(`[${sInfo.name}] 토너먼트 대진표가 성공적으로 저장되었습니다.`);
    } else {
      setSaveStatus('대진표 저장 실패');
    }
    setTimeout(() => setSaveStatus(null), 3500);
  };

  // Determine active status of a game node (prioritizing manual status, fallback to time / live)
  const getGameNodeStatus = (game: TournamentGameNode): 'before' | 'live' | 'after' => {
    if (game.status) return game.status;
    if (game.isLive) return 'live';
    const now = new Date();
    const nowMs = now.getHours() * 60 + now.getMinutes();
    const endMs = game.endHour * 60 + game.endMinute;
    const startMs = game.startHour * 60 + game.startMinute;
    if (nowMs > endMs) return 'after';
    if (nowMs >= startMs && nowMs <= endMs) return 'live';
    return 'before';
  };

  // Helper to check if a child node is a game (has dependent game)
  const getChildGame = (childId: string): TournamentGameNode | null => {
    const node = nodes[childId];
    if (node && node.type === 'game') return node;
    return null;
  };

  // Helper to compute winner name of a node
  const getNodeWinnerName = (nodeId: string, currentNodes: Record<string, TournamentNode>): string | null => {
    const node = currentNodes[nodeId];
    if (!node) return null;
    if (node.type === 'team') return node.teamName;
    const st = node.status || (node.isLive ? 'live' : 'before');
    if (st === 'after' && node.score1 !== node.score2) {
      return node.score1 > node.score2 ? node.team1 : node.team2;
    }
    return null;
  };

  // Update a team node's school name in treeData
  const handleTeamNodeSchoolChange = (nodeId: string, newSchoolName: string) => {
    const targetNode = nodes[nodeId];
    if (!targetNode || targetNode.type !== 'team') return;

    const updatedNode = { ...targetNode, teamName: newSchoolName };
    const rawNodes = { ...nodes, [nodeId]: updatedNode };
    const rawTree = { ...currentTree, nodes: rawNodes };
    const newTree = propagateTournamentTreeWinners(rawTree);

    setTournamentTrees((prev) => ({ ...prev, [selectedSportKey]: newTree }));
  };

  // Update a game node's field in treeData and sync matches state
  const handleGameNodeChange = (
    nodeId: string,
    field: keyof TournamentGameNode,
    value: any
  ) => {
    const targetNode = nodes[nodeId];
    if (!targetNode || targetNode.type !== 'game') return;

    let updatedNode = { ...targetNode, [field]: value };

    // Synchronize isLive and status
    if (field === 'status') {
      if (value === 'live') {
        updatedNode.isLive = true;
      } else {
        updatedNode.isLive = false;
      }
    } else if (field === 'isLive') {
      updatedNode.status = value ? 'live' : 'before';
    }

    const rawNodes = { ...nodes, [nodeId]: updatedNode };
    const rawTree = { ...currentTree, nodes: rawNodes };
    const newTree = propagateTournamentTreeWinners(rawTree);

    setTournamentTrees((prev) => ({ ...prev, [selectedSportKey]: newTree }));

    // Also update match in flat matches state if it exists
    setMatches((prev) => {
      const idx = prev.findIndex((m) => m.id === nodeId || m.round === targetNode.roundName);
      if (idx !== -1) {
        const next = [...prev];
        const m = { ...next[idx] };
        if (field === 'roundName') m.round = value;
        if (field === 'team1') m.team1 = value;
        if (field === 'team2') m.team2 = value;
        if (field === 'score1') m.score1Final = value;
        if (field === 'score2') m.score2Final = value;
        if (field === 'startHour') m.startHour = value;
        if (field === 'startMinute') m.startMinute = value;
        if (field === 'endHour') m.endHour = value;
        if (field === 'endMinute') m.endMinute = value;
        if (field === 'venue') m.venue = value;
        if (field === 'isLive') m.isLive = value;
        if (field === 'status') {
          m.isLive = value === 'live';
        }
        next[idx] = m;
        return next;
      }
      return prev;
    });
  };

  // Delete node
  const handleDeleteNode = (nodeId: string) => {
    if (!confirm('정말 이 노드를 삭제하시겠습니까? 연결된 상위 게임도 함께 삭제됩니다.')) return;
    const updated = { ...nodes };
    delete updated[nodeId];

    Object.keys(updated).forEach((k) => {
      const n = updated[k];
      if (n.type === 'game' && (n.child1Id === nodeId || n.child2Id === nodeId)) {
        delete updated[k];
      }
    });

    const newTree = { ...currentTree, nodes: updated };
    setTournamentTrees((prev) => ({ ...prev, [selectedSportKey]: newTree }));
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
  };

  const SCHOOL_OPTIONS = Object.keys(SCHOOLS);

  return (
    <div className="p-5 bg-white border border-gray-200 rounded-b-xl shadow-2xs space-y-4 w-full">
      {/* Header & Sport Selector Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3 border-b border-gray-200 pb-3 w-full">
        <div>
          <h2 className="font-extrabold text-base text-gray-900 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <span>종목별 토너먼트 대진표 & 노드 목록 관리</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            좌측 트리 캔버스 또는 우측 노드 목록에서 팀/경기를 클릭하여 학교 드롭다운 및 스코어/시간을 편집할 수 있습니다.
          </p>
        </div>

        {/* Sport Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 flex-wrap">
          {SPORT_OPTIONS.map((s) => (
            <button
              key={s.key}
              onClick={() => {
                setSelectedSportKey(s.key);
                setSelectedNodeId(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all ${selectedSportKey === s.key
                ? 'bg-postech text-white shadow-xs'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
            >
              <span>{s.icon}</span>
              <span>{s.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Unified 2-Column Grid: Left Canvas (50%) + Right Node List Table (50%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Visual Tournament Tree Canvas */}
        <div className="lg:col-span-6">
          <AdminTournamentBuilder
            sportKey={selectedSportKey}
            treeData={currentTree}
            onChange={(newTree) => {
              setTournamentTrees((prev) => ({
                ...prev,
                [selectedSportKey]: newTree,
              }));
            }}
            onSave={() => handleSaveTournamentTree(selectedSportKey)}
            isSaving={isSaving}
            selectedNodeId={selectedNodeId}
            onSelectNode={(nodeId) => setSelectedNodeId(nodeId)}
            onSelectGame={(game) => setSelectedNodeId(game ? game.id : null)}
          />
        </div>

        {/* Right Column: Node List (노드 목록) */}
        <div className="lg:col-span-6 bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3 flex flex-col justify-between">
          {/* Table Header & Controls */}
          <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-200 pb-2.5">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-postech" />
              <h3 className="font-extrabold text-sm text-slate-800">
                {currentSportInfo.icon} {currentSportInfo.name} 노드 목록 (총 {allNodeList.length}개 노드)
              </h3>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleSaveTournamentTree(selectedSportKey)}
                disabled={isSaving}
                className="px-3 py-1.5 bg-postech hover:bg-postech-dark text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                <span>대진표 전체 저장</span>
              </button>
            </div>
          </div>

          {/* Node List Container */}
          <div className="overflow-x-auto overflow-y-auto max-h-[500px] no-scrollbar space-y-4 pr-1">
            {allNodeList.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400 space-y-2">
                <p className="font-bold text-xs">등록된 대진표 노드가 없습니다.</p>
                <p className="text-[11px]">좌측 캔버스에서 프리셋을 선택하거나 [+ 팀 노드 추가] 버튼을 눌러주세요.</p>
              </div>
            ) : (
              <>
                {/* 1. 1행 팀 노드 목록 (Team Nodes) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-extrabold text-slate-700 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-slate-500" />
                      <span>1행 참가 팀 노드 ({teamNodes.length}팀)</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">* 클릭 시 학교 변경 가능</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {teamNodes.map((tNode: any, idx: number) => {
                      const isSelected = selectedNodeId === tNode.id;
                      const school = SCHOOLS[tNode.teamName];

                      return (
                        <div
                          key={tNode.id}
                          onClick={() => setSelectedNodeId(tNode.id)}
                          className={`p-2.5 bg-white border rounded-xl shadow-2xs transition-all cursor-pointer flex items-center justify-between gap-2 ${isSelected
                            ? 'ring-2 ring-postech border-postech bg-rose-50/50'
                            : 'border-slate-200 hover:border-slate-300'
                            }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[10px] font-black text-slate-400 w-4 shrink-0">
                              #{idx + 1}
                            </span>
                            <div className="flex items-center gap-1.5 min-w-0">
                              {school && (
                                <span
                                  style={{ backgroundColor: school.color }}
                                  className="w-2 h-4 rounded-xs shrink-0"
                                />
                              )}
                              {/* Team Dropdown */}
                              <select
                                value={tNode.teamName}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleTeamNodeSchoolChange(tNode.id, e.target.value);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs font-extrabold text-slate-900 focus:ring-1 focus:ring-postech focus:outline-hidden"
                              >
                                {SCHOOL_OPTIONS.map((sch) => (
                                  <option key={sch} value={sch}>
                                    {sch}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteNode(tNode.id);
                            }}
                            className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                            title="팀 노드 삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. 상위 경기 노드 목록 (Game Nodes) */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-extrabold text-slate-700 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span>경기 노드 목록 ({gameNodes.length}경기)</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">* 스코어/시간/장소 편집</span>
                  </div>

                  <div className="border border-slate-200 rounded-xl bg-white shadow-2xs overflow-x-auto w-full">
                    <table className="w-full text-left text-xs min-w-[680px]">
                      <thead className="bg-slate-100/90 text-slate-700 font-extrabold border-b border-slate-200 whitespace-nowrap">
                        <tr>
                          <th className="p-2.5 whitespace-nowrap">라운드명</th>
                          <th className="p-2.5 whitespace-nowrap">팀 1 vs 팀 2</th>
                          <th className="p-2.5 whitespace-nowrap">스코어</th>
                          <th className="p-2.5 whitespace-nowrap">시간</th>
                          <th className="p-2.5 whitespace-nowrap">장소</th>
                          <th className="p-2.5 whitespace-nowrap">진행 상태</th>
                          <th className="p-2.5 text-right whitespace-nowrap">삭제</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium whitespace-nowrap">
                        {gameNodes.map((gNode: any) => {
                          const isSelected = selectedNodeId === gNode.id;
                          const t1School = SCHOOLS[gNode.team1];
                          const t2School = SCHOOLS[gNode.team2];
                          const currentStatus = getGameNodeStatus(gNode);
                          const child1Game = getChildGame(gNode.child1Id);
                          const child2Game = getChildGame(gNode.child2Id);
                          const isT1Locked = Boolean(child1Game);
                          const isT2Locked = Boolean(child2Game);
                          const isTie = gNode.score1 === gNode.score2;

                          return (
                            <tr
                              key={gNode.id}
                              onClick={() => setSelectedNodeId(gNode.id)}
                              className={`transition-colors cursor-pointer ${isSelected
                                ? 'bg-amber-50/80 ring-1 ring-amber-300'
                                : 'hover:bg-slate-50'
                                }`}
                            >
                              {/* Round Name */}
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={gNode.roundName}
                                  onChange={(e) =>
                                    handleGameNodeChange(gNode.id, 'roundName', e.target.value)
                                  }
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-24 bg-slate-50 border border-slate-300 rounded px-1.5 py-1 text-xs font-bold text-slate-900"
                                />
                              </td>

                              {/* Teams with Dependency Lock */}
                              <td className="p-2">
                                <div className="flex items-center gap-1">
                                  <div className="flex items-center gap-0.5">
                                    {t1School && (
                                      <span
                                        style={{ backgroundColor: t1School.color }}
                                        className="w-1.5 h-3 rounded-xs shrink-0"
                                      />
                                    )}
                                    <input
                                      type="text"
                                      value={gNode.team1}
                                      disabled={isT1Locked}
                                      title={
                                        isT1Locked
                                          ? `하위 [${child1Game?.roundName}]의 승자가 자동으로 반영됩니다 (직접 수정 불가)`
                                          : undefined
                                      }
                                      onChange={(e) =>
                                        handleGameNodeChange(gNode.id, 'team1', e.target.value)
                                      }
                                      onClick={(e) => e.stopPropagation()}
                                      className={`w-20 rounded px-1.5 py-1 text-xs font-bold transition-colors ${isT1Locked
                                        ? 'bg-slate-100/90 text-slate-500 border border-slate-200 cursor-not-allowed italic'
                                        : 'bg-slate-50 border border-slate-300 text-slate-900'
                                        }`}
                                    />
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-bold">vs</span>
                                  <div className="flex items-center gap-0.5">
                                    {t2School && (
                                      <span
                                        style={{ backgroundColor: t2School.color }}
                                        className="w-1.5 h-3 rounded-xs shrink-0"
                                      />
                                    )}
                                    <input
                                      type="text"
                                      value={gNode.team2}
                                      disabled={isT2Locked}
                                      title={
                                        isT2Locked
                                          ? `하위 [${child2Game?.roundName}]의 승자가 자동으로 반영됩니다 (직접 수정 불가)`
                                          : undefined
                                      }
                                      onChange={(e) =>
                                        handleGameNodeChange(gNode.id, 'team2', e.target.value)
                                      }
                                      onClick={(e) => e.stopPropagation()}
                                      className={`w-20 rounded px-1.5 py-1 text-xs font-bold transition-colors ${isT2Locked
                                        ? 'bg-slate-100/90 text-slate-500 border border-slate-200 cursor-not-allowed italic'
                                        : 'bg-slate-50 border border-slate-300 text-slate-900'
                                        }`}
                                    />
                                  </div>
                                </div>
                              </td>

                              {/* Scores */}
                              <td className="p-2">
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    value={gNode.score1 ?? 0}
                                    onChange={(e) =>
                                      handleGameNodeChange(
                                        gNode.id,
                                        'score1',
                                        parseInt(e.target.value) || 0
                                      )
                                    }
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-10 bg-slate-50 border border-slate-300 rounded px-1 py-1 text-xs font-black text-center"
                                  />
                                  <span className="text-slate-400 font-bold">:</span>
                                  <input
                                    type="number"
                                    value={gNode.score2 ?? 0}
                                    onChange={(e) =>
                                      handleGameNodeChange(
                                        gNode.id,
                                        'score2',
                                        parseInt(e.target.value) || 0
                                      )
                                    }
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-10 bg-slate-50 border border-slate-300 rounded px-1 py-1 text-xs font-black text-center"
                                  />
                                </div>
                                {currentStatus === 'after' && isTie && (
                                  <span className="text-[9px] text-rose-500 font-extrabold block mt-0.5">
                                    ⚠️ 무승부 불가 (승자 필요)
                                  </span>
                                )}
                              </td>

                              {/* Time */}
                              <td className="p-2">
                                <div className="flex items-center gap-0.5 text-[11px]">
                                  <input
                                    type="number"
                                    value={gNode.startHour}
                                    onChange={(e) =>
                                      handleGameNodeChange(
                                        gNode.id,
                                        'startHour',
                                        parseInt(e.target.value) || 0
                                      )
                                    }
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-10 bg-slate-50 border border-slate-300 rounded px-1 py-0.5 text-center font-bold"
                                  />
                                  <span>:</span>
                                  <input
                                    type="number"
                                    value={gNode.startMinute}
                                    onChange={(e) =>
                                      handleGameNodeChange(
                                        gNode.id,
                                        'startMinute',
                                        parseInt(e.target.value) || 0
                                      )
                                    }
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-10 bg-slate-50 border border-slate-300 rounded px-1 py-0.5 text-center font-bold"
                                  />
                                  <span>~</span>
                                  <input
                                    type="number"
                                    value={gNode.endHour}
                                    onChange={(e) =>
                                      handleGameNodeChange(
                                        gNode.id,
                                        'endHour',
                                        parseInt(e.target.value) || 0
                                      )
                                    }
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-10 bg-slate-50 border border-slate-300 rounded px-1 py-0.5 text-center font-bold"
                                  />
                                  <span>:</span>
                                  <input
                                    type="number"
                                    value={gNode.endMinute}
                                    onChange={(e) =>
                                      handleGameNodeChange(
                                        gNode.id,
                                        'endMinute',
                                        parseInt(e.target.value) || 0
                                      )
                                    }
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-10 bg-slate-50 border border-slate-300 rounded px-1 py-0.5 text-center font-bold"
                                  />
                                </div>
                              </td>

                              {/* Venue */}
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={gNode.venue || ''}
                                  onChange={(e) =>
                                    handleGameNodeChange(gNode.id, 'venue', e.target.value)
                                  }
                                  onClick={(e) => e.stopPropagation()}
                                  placeholder="체육관"
                                  className="w-20 bg-slate-50 border border-slate-300 rounded px-1.5 py-1 text-xs"
                                />
                              </td>

                              {/* 3-State Match Status Selector */}
                              <td className="p-2">
                                <select
                                  value={currentStatus}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    handleGameNodeChange(gNode.id, 'status', e.target.value);
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  className={`rounded-lg px-2 py-1 text-[11px] font-extrabold border transition-all ${currentStatus === 'live'
                                    ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                                    : currentStatus === 'after'
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold'
                                      : 'bg-slate-100 text-slate-700 border-slate-300'
                                    }`}
                                >
                                  <option value="before">⏳ 경기 전</option>
                                  <option value="live">🔴 경기 중</option>
                                  <option value="after">🏁 경기 후 (종료)</option>
                                </select>
                              </td>

                              {/* Delete Action */}
                              <td className="p-2 text-right">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteNode(gNode.id);
                                  }}
                                  className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                                  title="경기 노드 삭제"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="text-[11px] text-slate-500 font-medium border-t border-slate-200 pt-2">
            💡 팀 노드는 드롭다운으로 학교를 변경할 수 있으며, 경기 노드는 라운드명/팀명/스코어/시간/장소를 자유롭게 편집할 수 있습니다.
          </div>
        </div>
      </div>
    </div>
  );
};
