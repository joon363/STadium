import React, { useState } from 'react';
import {
  RawScheduledMatch,
  SportKey,
} from '../../../types/stadium';
import {
  TournamentTreeData,
  createPhoto1Preset,
  createPhoto2Preset,
  convertTreeToMatches,
} from '../../../types/tournamentTree';
import { AdminTournamentBuilder } from '../../../components/AdminTournamentBuilder';
import {
  updateSupabaseMatch,
  updateSupabaseTournamentTree,
} from '../../../lib/supabase';
import { Trophy, Layers, Clock, Plus, Save, Trash2 } from 'lucide-react';

interface MatchesTabProps {
  matches: RawScheduledMatch[];
  setMatches: React.Dispatch<React.SetStateAction<RawScheduledMatch[]>>;
  tournamentTrees: Record<string, TournamentTreeData>;
  setTournamentTrees: React.Dispatch<React.SetStateAction<Record<string, TournamentTreeData>>>;
  isSaving: boolean;
  setIsSaving: (saving: boolean) => void;
  setSaveStatus: (msg: string | null) => void;
}

export const MatchesTab: React.FC<MatchesTabProps> = ({
  matches,
  setMatches,
  tournamentTrees,
  setTournamentTrees,
  isSaving,
  setIsSaving,
  setSaveStatus,
}) => {
  const [matchesSubView, setMatchesSubView] = useState<'builder' | 'table'>('builder');
  const [selectedSportFilter, setSelectedSportFilter] = useState<string>('soccer');

  const handleSaveTournamentTree = async (sKey: SportKey) => {
    setIsSaving(true);
    const currentTree = tournamentTrees[sKey] || createPhoto2Preset(sKey);
    const ok = await updateSupabaseTournamentTree(sKey, currentTree);

    const sportNames: Record<string, { name: string; icon: string }> = {
      soccer: { name: '축구', icon: '⚽' },
      baseball: { name: '야구', icon: '⚾' },
      lol: { name: 'LoL', icon: '🎮' },
      badminton: { name: '배드민턴', icon: '🏸' },
      basketball: { name: '농구', icon: '🏀' },
    };
    const sInfo = sportNames[sKey] || { name: '스포츠', icon: '🏆' };
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
    value: string | number
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

  const handleSaveAllMatches = async () => {
    setIsSaving(true);
    let successCount = 0;
    for (const match of matches) {
      const ok = await updateSupabaseMatch(match);
      if (ok) successCount++;
    }
    setIsSaving(false);
    setSaveStatus(`총 ${successCount}개의 경기 정보가 동기화되었습니다.`);
    setTimeout(() => setSaveStatus(null), 3000);
  };

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-b-xl shadow-2xs space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-extrabold text-base text-gray-900 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <span>운동경기 스코어 & 인터랙티브 토너먼트 대진표 관리</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            1행 팀 노드를 추가하고 2개 노드를 선택하여 윗행 경기를 생성하면 실시간 꺾은선
            대진표가 완성됩니다.
          </p>
        </div>

        {/* View Switcher Tabs: Builder vs Table */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setMatchesSubView('builder')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all ${
              matchesSubView === 'builder'
                ? 'bg-white text-postech shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>⚡ 노드 대진표 빌더</span>
          </button>
          <button
            onClick={() => setMatchesSubView('table')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all ${
              matchesSubView === 'table'
                ? 'bg-white text-postech shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>📋 경기 일정 테이블 목록</span>
          </button>
        </div>
      </div>

      {/* Sport Filter Chips */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-slate-700 mr-1">종목 선택:</span>
          {[
            { key: 'soccer', label: '⚽ 축구' },
            { key: 'baseball', label: '⚾ 야구' },
            { key: 'lol', label: '🎮 LoL' },
            { key: 'badminton', label: '🏸 배드민턴' },
            { key: 'basketball', label: '🏀 농구' },
            ...(matchesSubView === 'table' ? [{ key: 'ALL', label: '전체보기' }] : []),
          ].map((s) => (
            <button
              key={s.key}
              onClick={() => setSelectedSportFilter(s.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs ${
                selectedSportFilter === s.key
                  ? 'bg-postech text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mode 1: Interactive Node-Based Tournament Builder */}
      {matchesSubView === 'builder' && (
        <AdminTournamentBuilder
          sportKey={
            selectedSportFilter === 'ALL' ? 'soccer' : (selectedSportFilter as SportKey)
          }
          treeData={
            tournamentTrees[selectedSportFilter === 'ALL' ? 'soccer' : selectedSportFilter] ||
            (selectedSportFilter === 'baseball'
              ? createPhoto1Preset('baseball')
              : createPhoto2Preset(
                  (selectedSportFilter === 'ALL' ? 'soccer' : selectedSportFilter) as SportKey
                ))
          }
          onChange={(newTree) => {
            const targetKey = selectedSportFilter === 'ALL' ? 'soccer' : selectedSportFilter;
            setTournamentTrees((prev) => ({
              ...prev,
              [targetKey]: newTree,
            }));
          }}
          onSave={() =>
            handleSaveTournamentTree(
              (selectedSportFilter === 'ALL' ? 'soccer' : selectedSportFilter) as SportKey
            )
          }
          isSaving={isSaving}
        />
      )}

      {/* Mode 2: Traditional Matches Table */}
      {matchesSubView === 'table' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 font-bold">
              * 전체 경기 스코어 및 시작/종료 시간을 일괄 편집할 수 있습니다.
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const newMatch: RawScheduledMatch = {
                    id: `match-${Date.now()}`,
                    sportKey: (selectedSportFilter === 'ALL'
                      ? 'soccer'
                      : selectedSportFilter) as SportKey,
                    sportName:
                      selectedSportFilter === 'soccer'
                        ? '축구'
                        : selectedSportFilter === 'baseball'
                          ? '야구'
                          : selectedSportFilter === 'lol'
                            ? 'LoL'
                            : selectedSportFilter === 'badminton'
                              ? '배드민턴'
                              : selectedSportFilter === 'basketball'
                                ? '농구'
                                : '축구',
                    icon:
                      selectedSportFilter === 'baseball'
                        ? '⚾'
                        : selectedSportFilter === 'lol'
                          ? '🎮'
                          : selectedSportFilter === 'badminton'
                            ? '🏸'
                            : selectedSportFilter === 'basketball'
                              ? '🏀'
                              : '⚽',
                    team1: 'POSTECH',
                    team2: 'KAIST',
                    startHour: 14,
                    startMinute: 0,
                    endHour: 15,
                    endMinute: 30,
                    venue: '대운동장',
                    round: '준결승 1경기',
                    score1Final: 0,
                    score2Final: 0,
                  };
                  setMatches((prev) => [...prev, newMatch]);
                }}
                className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>+ 경기 추가</span>
              </button>
              <button
                onClick={handleSaveAllMatches}
                disabled={isSaving}
                className="px-4 py-2 bg-postech hover:bg-postech-dark text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>전체 경기 변경사항 저장</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-100 font-bold text-gray-700 border-b border-gray-200">
                <tr>
                  <th className="p-3">종목</th>
                  <th className="p-3">라운드</th>
                  <th className="p-3">팀1 vs 팀2</th>
                  <th className="p-3">최종/현재 스코어</th>
                  <th className="p-3">시작~종료 시각</th>
                  <th className="p-3">경기 장소</th>
                  <th className="p-3 text-right">작업</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 font-medium">
                {matches
                  .filter(
                    (m) => selectedSportFilter === 'ALL' || m.sportKey === selectedSportFilter
                  )
                  .map((item) => {
                    const idx = matches.findIndex((m) => m.id === item.id);
                    return (
                      <tr key={item.id} className="hover:bg-gray-50/80">
                        <td className="p-3 font-bold text-gray-900">
                          {item.icon} {item.sportName}
                        </td>

                        <td className="p-3">
                          <input
                            type="text"
                            value={item.round}
                            onChange={(e) => handleMatchChange(idx, 'round', e.target.value)}
                            className="bg-white border border-gray-300 rounded px-2 py-1 text-xs w-28 font-bold"
                          />
                        </td>

                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={item.team1}
                              onChange={(e) =>
                                handleMatchChange(idx, 'team1', e.target.value)
                              }
                              className="bg-white border border-gray-300 rounded px-2 py-1 text-xs w-20 font-bold"
                            />
                            <span className="text-gray-400 font-bold">vs</span>
                            <input
                              type="text"
                              value={item.team2}
                              onChange={(e) =>
                                handleMatchChange(idx, 'team2', e.target.value)
                              }
                              className="bg-white border border-gray-300 rounded px-2 py-1 text-xs w-20 font-bold"
                            />
                          </div>
                        </td>

                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={item.score1Final}
                              onChange={(e) =>
                                handleMatchChange(
                                  idx,
                                  'score1Final',
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className="bg-white border border-gray-300 rounded px-2 py-1 text-xs w-12 text-center font-bold"
                            />
                            <span className="text-gray-400 font-bold">:</span>
                            <input
                              type="number"
                              value={item.score2Final}
                              onChange={(e) =>
                                handleMatchChange(
                                  idx,
                                  'score2Final',
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className="bg-white border border-gray-300 rounded px-2 py-1 text-xs w-12 text-center font-bold"
                            />
                          </div>
                        </td>

                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={item.startHour}
                              onChange={(e) =>
                                handleMatchChange(
                                  idx,
                                  'startHour',
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className="bg-white border border-gray-300 rounded px-1.5 py-1 text-xs w-10 text-center font-bold"
                            />
                            <span>:</span>
                            <input
                              type="number"
                              value={item.startMinute}
                              onChange={(e) =>
                                handleMatchChange(
                                  idx,
                                  'startMinute',
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className="bg-white border border-gray-300 rounded px-1.5 py-1 text-xs w-10 text-center font-bold"
                            />
                            <span>~</span>
                            <input
                              type="number"
                              value={item.endHour}
                              onChange={(e) =>
                                handleMatchChange(
                                  idx,
                                  'endHour',
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className="bg-white border border-gray-300 rounded px-1.5 py-1 text-xs w-10 text-center font-bold"
                            />
                            <span>:</span>
                            <input
                              type="number"
                              value={item.endMinute}
                              onChange={(e) =>
                                handleMatchChange(
                                  idx,
                                  'endMinute',
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className="bg-white border border-gray-300 rounded px-1.5 py-1 text-xs w-10 text-center font-bold"
                            />
                          </div>
                        </td>

                        <td className="p-3">
                          <input
                            type="text"
                            value={item.venue}
                            onChange={(e) => handleMatchChange(idx, 'venue', e.target.value)}
                            className="bg-white border border-gray-300 rounded px-2 py-1 text-xs w-28"
                          />
                        </td>

                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleSaveMatch(item)}
                              disabled={isSaving}
                              className="px-2.5 py-1 bg-slate-900 text-white rounded text-[11px] font-bold hover:bg-slate-800 transition-colors"
                            >
                              저장
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('정말 이 경기를 삭제하시겠습니까?')) {
                                  setMatches((prev) => prev.filter((m) => m.id !== item.id));
                                }
                              }}
                              className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                              title="경기 삭제"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
