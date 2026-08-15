import React, { useState } from 'react';
import {
  RawScheduledMatch,
  SportKey,
  SCHOOLS,
} from '../../../types/stadium';
import {
  TournamentTreeData,
  TournamentGameNode,
  createPhoto1Preset,
  createPhoto2Preset,
  convertTreeToMatches,
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
  { key: 'badminton', name: '배드민턴', icon: '🏸' },
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
  const [highlightedRoundName, setHighlightedRoundName] = useState<string | null>(null);

  const currentSportInfo =
    SPORT_OPTIONS.find((s) => s.key === selectedSportKey) || SPORT_OPTIONS[0];

  const handleSaveTournamentTree = async (sKey: SportKey) => {
    setIsSaving(true);
    const currentTree = tournamentTrees[sKey] || createPhoto2Preset(sKey);
    const ok = await updateSupabaseTournamentTree(sKey, currentTree);

    const sInfo = SPORT_OPTIONS.find((s) => s.key === sKey) || {
      key: sKey,
      name: '스포츠',
      icon: '🏆',
    };
    const updatedSportMatches = convertTreeToMatches(currentTree, sInfo.name, sInfo.icon);

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

  const handleMatchChange = (
    index: number,
    field: keyof RawScheduledMatch,
    value: string | number | boolean
  ) => {
    setMatches((prev) => {
      const next = [...prev];
      if (next[index]) {
        next[index] = { ...next[index], [field]: value };
      }
      return next;
    });
  };

  const handleSaveMatch = async (match: RawScheduledMatch) => {
    setIsSaving(true);
    const ok = await updateSupabaseMatch(match);
    setIsSaving(false);
    if (ok) {
      setSaveStatus(`[${match.sportName} - ${match.round}] 경기 정보가 저장되었습니다.`);
    } else {
      setSaveStatus('경기 저장 실패');
    }
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleDeleteMatch = async (id: string) => {
    if (!confirm('정말 이 경기를 삭제하시겠습니까?')) return;
    setIsSaving(true);
    const res = await deleteSupabaseMatch(id);
    setIsSaving(false);
    if (res.success) {
      setMatches((prev) => prev.filter((m) => m.id !== id));
      setSaveStatus('경기가 삭제되었습니다.');
    } else {
      setSaveStatus(`삭제 실패: ${res.error}`);
    }
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleSaveAllSportMatches = async () => {
    setIsSaving(true);
    const targetMatches = matches.filter((m) => m.sportKey === selectedSportKey);
    let successCount = 0;
    for (const match of targetMatches) {
      const ok = await updateSupabaseMatch(match);
      if (ok) successCount++;
    }
    setIsSaving(false);
    setSaveStatus(
      `[${currentSportInfo.name}] 총 ${successCount}개 경기 정보가 저장되었습니다.`
    );
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleAddNewMatch = () => {
    const newMatch: RawScheduledMatch = {
      id: `match-${Date.now()}`,
      sportKey: selectedSportKey,
      sportName: currentSportInfo.name,
      icon: currentSportInfo.icon,
      team1: 'POSTECH',
      team2: 'KAIST',
      startHour: 14,
      startMinute: 0,
      endHour: 15,
      endMinute: 30,
      venue: '체육관',
      round: `경기 ${matches.filter((m) => m.sportKey === selectedSportKey).length + 1}`,
      score1Final: 0,
      score2Final: 0,
      isLive: false,
    };
    setMatches((prev) => [...prev, newMatch]);
  };

  const currentTree =
    tournamentTrees[selectedSportKey] ||
    (selectedSportKey === 'baseball'
      ? createPhoto1Preset('baseball')
      : createPhoto2Preset(selectedSportKey));

  const filteredMatches = matches.filter((m) => m.sportKey === selectedSportKey);

  return (
    <div className="p-5 bg-white border border-gray-200 rounded-b-xl shadow-2xs space-y-4">
      {/* Header & Sport Selector Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3 border-b border-gray-200 pb-3">
        <div>
          <h2 className="font-extrabold text-base text-gray-900 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <span>종목별 대진표 빌더 & 경기 스코어 관리</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            좌측 트리 캔버스에서 대진 구조를 편집하고, 우측 테이블에서 각 경기의 세부 스코어와
            시간/장소를 관리합니다.
          </p>
        </div>

        {/* Sport Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 flex-wrap">
          {SPORT_OPTIONS.map((s) => (
            <button
              key={s.key}
              onClick={() => {
                setSelectedSportKey(s.key);
                setHighlightedRoundName(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all ${
                selectedSportKey === s.key
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

      {/* Main Unified 2-Column Grid: Left Canvas (50%) + Right Matches Table (50%) */}
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
            selectedMatchRound={highlightedRoundName}
            onSelectGame={(game: TournamentGameNode | null) => {
              setHighlightedRoundName(game ? game.roundName : null);
            }}
          />
        </div>

        {/* Right Column: Match Schedule & Score Table List */}
        <div className="lg:col-span-6 bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3 flex flex-col justify-between">
          {/* Table Header & Controls */}
          <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-200 pb-2.5">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-postech" />
              <h3 className="font-extrabold text-sm text-slate-800">
                {currentSportInfo.icon} {currentSportInfo.name} 경기 일정 & 스코어 목록 (
                {filteredMatches.length}경기)
              </h3>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleAddNewMatch}
                className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>경기 추가</span>
              </button>
              <button
                onClick={handleSaveAllSportMatches}
                disabled={isSaving}
                className="px-3 py-1.5 bg-postech hover:bg-postech-dark text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                <span>일괄 저장</span>
              </button>
            </div>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto overflow-y-auto max-h-[460px] no-scrollbar border border-slate-200/80 rounded-xl bg-white shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/90 text-slate-700 font-extrabold border-b border-slate-200 sticky top-0 z-10">
                <tr>
                  <th className="p-2.5">라운드명</th>
                  <th className="p-2.5">팀 1 vs 팀 2</th>
                  <th className="p-2.5">스코어</th>
                  <th className="p-2.5">시간</th>
                  <th className="p-2.5">장소</th>
                  <th className="p-2.5">LIVE</th>
                  <th className="p-2.5 text-right">작업</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredMatches.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-10 text-center text-slate-400 space-y-2">
                      <p className="font-bold text-xs">등록된 경기 일정이 없습니다.</p>
                      <button
                        onClick={handleAddNewMatch}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold inline-flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>첫 경기 추가하기</span>
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredMatches.map((item) => {
                    const idx = matches.findIndex((m) => m.id === item.id);
                    const isHighlighted = highlightedRoundName === item.round;
                    const t1School = SCHOOLS[item.team1];
                    const t2School = SCHOOLS[item.team2];

                    return (
                      <tr
                        key={item.id}
                        onClick={() => setHighlightedRoundName(item.round)}
                        className={`transition-colors ${
                          isHighlighted ? 'bg-amber-50/70 ring-1 ring-amber-300' : 'hover:bg-slate-50'
                        }`}
                      >
                        {/* Round Name */}
                        <td className="p-2.5">
                          <input
                            type="text"
                            value={item.round}
                            onChange={(e) => handleMatchChange(idx, 'round', e.target.value)}
                            placeholder="예: 예선 1경기"
                            className="w-24 bg-white border border-slate-300 rounded px-1.5 py-1 text-xs font-bold text-slate-900"
                          />
                        </td>

                        {/* Teams */}
                        <td className="p-2.5">
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
                                value={item.team1}
                                onChange={(e) => handleMatchChange(idx, 'team1', e.target.value)}
                                className="w-16 bg-white border border-slate-300 rounded px-1 py-1 text-xs font-bold"
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
                                value={item.team2}
                                onChange={(e) => handleMatchChange(idx, 'team2', e.target.value)}
                                className="w-16 bg-white border border-slate-300 rounded px-1 py-1 text-xs font-bold"
                              />
                            </div>
                          </div>
                        </td>

                        {/* Scores */}
                        <td className="p-2.5">
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={item.score1Final ?? 0}
                              onChange={(e) =>
                                handleMatchChange(idx, 'score1Final', parseInt(e.target.value) || 0)
                              }
                              className="w-10 bg-white border border-slate-300 rounded px-1 py-1 text-xs font-black text-center"
                            />
                            <span className="text-slate-400 font-bold">:</span>
                            <input
                              type="number"
                              value={item.score2Final ?? 0}
                              onChange={(e) =>
                                handleMatchChange(idx, 'score2Final', parseInt(e.target.value) || 0)
                              }
                              className="w-10 bg-white border border-slate-300 rounded px-1 py-1 text-xs font-black text-center"
                            />
                          </div>
                        </td>

                        {/* Time */}
                        <td className="p-2.5">
                          <div className="flex items-center gap-0.5 text-[11px]">
                            <input
                              type="number"
                              value={item.startHour}
                              onChange={(e) =>
                                handleMatchChange(idx, 'startHour', parseInt(e.target.value) || 0)
                              }
                              className="w-8 bg-white border border-slate-300 rounded px-1 py-0.5 text-center font-bold"
                            />
                            <span>:</span>
                            <input
                              type="number"
                              value={item.startMinute}
                              onChange={(e) =>
                                handleMatchChange(idx, 'startMinute', parseInt(e.target.value) || 0)
                              }
                              className="w-8 bg-white border border-slate-300 rounded px-1 py-0.5 text-center font-bold"
                            />
                            <span>~</span>
                            <input
                              type="number"
                              value={item.endHour}
                              onChange={(e) =>
                                handleMatchChange(idx, 'endHour', parseInt(e.target.value) || 0)
                              }
                              className="w-8 bg-white border border-slate-300 rounded px-1 py-0.5 text-center font-bold"
                            />
                            <span>:</span>
                            <input
                              type="number"
                              value={item.endMinute}
                              onChange={(e) =>
                                handleMatchChange(idx, 'endMinute', parseInt(e.target.value) || 0)
                              }
                              className="w-8 bg-white border border-slate-300 rounded px-1 py-0.5 text-center font-bold"
                            />
                          </div>
                        </td>

                        {/* Venue */}
                        <td className="p-2.5">
                          <input
                            type="text"
                            value={item.venue}
                            onChange={(e) => handleMatchChange(idx, 'venue', e.target.value)}
                            placeholder="체육관"
                            className="w-20 bg-white border border-slate-300 rounded px-1.5 py-1 text-xs"
                          />
                        </td>

                        {/* LIVE Toggle */}
                        <td className="p-2.5">
                          <button
                            type="button"
                            onClick={() => handleMatchChange(idx, 'isLive', !item.isLive)}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold flex items-center gap-0.5 transition-all ${
                              item.isLive
                                ? 'bg-rose-600 text-white shadow-2xs animate-pulse'
                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            }`}
                          >
                            <Radio className="w-2.5 h-2.5" />
                            <span>LIVE</span>
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="p-2.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleSaveMatch(item)}
                              disabled={isSaving}
                              className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-[10px] font-bold transition-colors"
                            >
                              저장
                            </button>
                            <button
                              onClick={() => handleDeleteMatch(item.id)}
                              className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                              title="삭제"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="text-[11px] text-slate-500 font-medium">
            💡 대진표의 게임 노드를 클릭하면 해당 경기 행이 강조 표시되며, 테이블에서 스코어/시간/장소를
            직접 수정하고 저장할 수 있습니다.
          </div>
        </div>
      </div>
    </div>
  );
};
