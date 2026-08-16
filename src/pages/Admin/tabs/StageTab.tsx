import React, { useState, useEffect } from 'react';
import { StageItem, SCHOOLS } from '../../../types/stadium';
import {
  saveAllSupabaseStagePerformances,
  getSupabaseStageDelay,
  updateSupabaseStageDelay,
} from '../../../lib/supabase';
import { Clock, Plus, Trash2, RotateCcw, Save } from 'lucide-react';

interface StageTabProps {
  stageItems: StageItem[];
  setStageItems: React.Dispatch<React.SetStateAction<StageItem[]>>;
  isSaving: boolean;
  setIsSaving: (saving: boolean) => void;
  setSaveStatus: (msg: string | null) => void;
}

export const StageTab: React.FC<StageTabProps> = ({
  stageItems,
  setStageItems,
  isSaving,
  setIsSaving,
  setSaveStatus,
}) => {
  const [delayMinutes, setDelayMinutes] = useState<number>(0);
  const [isSavingDelay, setIsSavingDelay] = useState<boolean>(false);

  useEffect(() => {
    getSupabaseStageDelay().then((d) => {
      setDelayMinutes(d);
    });
  }, []);

  const handleSaveDelay = async () => {
    setIsSavingDelay(true);
    const ok = await updateSupabaseStageDelay(delayMinutes);
    setIsSavingDelay(false);
    if (ok) {
      setSaveStatus(
        delayMinutes === 0
          ? '공연 딜레이가 0분(정시)으로 설정되었습니다.'
          : `공연 전체 딜레이가 ${delayMinutes > 0 ? `+${delayMinutes}` : delayMinutes}분으로 설정되었습니다.`
      );
    } else {
      setSaveStatus('딜레이 설정 저장 실패');
    }
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleStageChange = (
    index: number,
    field: keyof StageItem,
    value: string | number
  ) => {
    setStageItems((prev) => {
      const next = [...prev];
      if (next[index]) {
        next[index] = { ...next[index], [field]: value };
      }
      return next;
    });
  };

  const handleAddNewStage = () => {
    const lastItem = stageItems[stageItems.length - 1];
    const newStartH = lastItem ? lastItem.endHour : 18;
    const newStartM = lastItem ? lastItem.endMinute : 0;
    const totalEndMin = newStartH * 60 + newStartM + 30;
    const newEndH = Math.floor(totalEndMin / 60);
    const newEndM = totalEndMin % 60;

    const newItem: StageItem = {
      school: lastItem ? lastItem.school : 'POSTECH',
      clubName: '',
      category: lastItem?.category || '밴드',
      genre: '',
      songTitle: '',
      startHour: newStartH,
      startMinute: newStartM,
      endHour: newEndH,
      endMinute: newEndM,
    };

    setStageItems((prev) => [...prev, newItem]);
    setSaveStatus('새 공연 행이 추가되었습니다. 내용 작성 후 [전체 저장]을 눌러주세요.');
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleSaveAllStages = async () => {
    setIsSaving(true);
    const ok = await saveAllSupabaseStagePerformances(stageItems);
    setIsSaving(false);
    if (ok) {
      setSaveStatus(`총 ${stageItems.length}개의 문화공연 타임라인이 성공적으로 전체 저장되었습니다.`);
    } else {
      setSaveStatus('공연 타임라인 전체 저장 실패');
    }
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleDeleteStage = (index: number) => {
    const target = stageItems[index];
    const confirmed = window.confirm(
      `[${target.school} - ${target.clubName || '공연'}] 항목을 삭제하시겠습니까?\n\n(삭제 후 [전체 저장]을 눌러야 데이터베이스에 최종 반영됩니다)`
    );
    if (!confirmed) return;

    setStageItems((prev) => prev.filter((_, i) => i !== index));
    setSaveStatus('공연 항목이 삭제되었습니다. [전체 저장]을 눌러 데이터베이스에 저장해주세요.');
    setTimeout(() => setSaveStatus(null), 3000);
  };

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-b-xl shadow-2xs space-y-5">
      {/* 1. Global Stage Delay Controls */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-start gap-2.5">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0 mt-0.5">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-gray-900 flex items-center gap-1.5">
              <span>공연 전체 딜레이 일괄 적용</span>
              {delayMinutes !== 0 && (
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${delayMinutes > 0
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-blue-100 text-blue-800'
                    }`}
                >
                  {delayMinutes > 0 ? `+${delayMinutes}분 지연` : `${delayMinutes}분 앞당김`}
                </span>
              )}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              사용자 화면에 표시되는 모든 공연 시각(예: 14:00)을 입력한 분 단위만큼 자동으로 밀거나 당겨 표시합니다. (사용자 UI에는 딜레이 표시 없이 자연스럽게 반영됩니다)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <div className="flex items-center gap-1 bg-white border border-gray-300 rounded-lg p-1">
            <button
              onClick={() => setDelayMinutes((prev) => prev - 5)}
              className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs font-bold text-gray-700"
              title="-5분"
            >
              -5
            </button>
            <button
              onClick={() => setDelayMinutes((prev) => prev - 1)}
              className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs font-bold text-gray-700"
              title="-1분"
            >
              -1
            </button>
            <div className="flex items-center px-2">
              <input
                type="number"
                value={delayMinutes}
                onChange={(e) => setDelayMinutes(parseInt(e.target.value) || 0)}
                className="w-12 text-center text-xs font-black bg-transparent outline-none"
              />
              <span className="text-xs text-gray-500 font-bold">분</span>
            </div>
            <button
              onClick={() => setDelayMinutes((prev) => prev + 1)}
              className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs font-bold text-gray-700"
              title="+1분"
            >
              +1
            </button>
            <button
              onClick={() => setDelayMinutes((prev) => prev + 5)}
              className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs font-bold text-gray-700"
              title="+5분"
            >
              +5
            </button>
            {delayMinutes !== 0 && (
              <button
                onClick={() => setDelayMinutes(0)}
                className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-700"
                title="정시 리셋 (0분)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={handleSaveDelay}
            disabled={isSavingDelay}
            className="flex items-center gap-1 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSavingDelay ? '저장중...' : '딜레이 저장'}</span>
          </button>
        </div>
      </div>

      {/* 2. Stage Performances Table Section Header */}
      <div className="flex items-center justify-between pt-1">
        <h2 className="font-extrabold text-base text-gray-900">
          체육관 메인 문화공연 타임라인 설정
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-bold hidden sm:inline mr-1">
            총 {stageItems.length}개 공연
          </span>
          <button
            onClick={handleAddNewStage}
            className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 rounded-lg text-xs font-bold shadow-2xs transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 text-gray-600" />
            <span>신규 추가</span>
          </button>
          <button
            onClick={handleSaveAllStages}
            disabled={isSaving}
            className="flex items-center gap-1 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-xs transition-all active:scale-95 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? '전체 저장 중...' : '전체 저장'}</span>
          </button>
        </div>
      </div>

      {/* 3. Stage Performances Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-100 font-bold text-gray-700 border-b border-gray-200">
            <tr>
              <th className="p-3">학교</th>
              <th className="p-3">동아리명 (선택)</th>
              <th className="p-3">구분</th>
              <th className="p-3">장르 (선택)</th>
              <th className="p-3">공연 시각 (시작~종료)</th>
              <th className="p-3">곡명 / 세트리스트 (선택)</th>
              <th className="p-3 text-center w-16">삭제</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 font-medium">
            {stageItems.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-xs text-gray-400 font-bold">
                  등록된 문화공연 일정이 없습니다. 우측 상단의 [신규 추가] 버튼을 눌러 새 공연을 등록하세요.
                </td>
              </tr>
            ) : (
              stageItems.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50/80">
                  <td className="p-3">
                    <select
                      value={item.school}
                      onChange={(e) => handleStageChange(idx, 'school', e.target.value)}
                      className="bg-white border border-gray-300 rounded px-2 py-1 text-xs font-bold"
                    >
                      {Object.keys(SCHOOLS).map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td className="p-3">
                    <input
                      type="text"
                      value={item.clubName}
                      onChange={(e) => handleStageChange(idx, 'clubName', e.target.value)}
                      placeholder="동아리명 (선택)"
                      className="bg-white border border-gray-300 rounded px-2 py-1 text-xs w-36 font-bold"
                    />
                  </td>

                  <td className="p-3">
                    <select
                      value={item.category || '기타'}
                      onChange={(e) => handleStageChange(idx, 'category', e.target.value)}
                      className="bg-white border border-gray-300 rounded px-2 py-1 text-xs font-bold text-purple-700"
                    >
                      <option value="밴드">밴드</option>
                      <option value="어쿠스틱">어쿠스틱</option>
                      <option value="보컬">보컬</option>
                      <option value="댄스">댄스</option>
                      <option value="힙합">힙합</option>
                      <option value="응원단">응원단</option>
                      <option value="마술">마술</option>
                    </select>
                  </td>

                  <td className="p-3">
                    <input
                      type="text"
                      value={item.genre || ''}
                      onChange={(e) => handleStageChange(idx, 'genre', e.target.value)}
                      placeholder="예: 모던락, K-POP (선택)"
                      className="bg-white border border-gray-300 rounded px-2 py-1 text-xs w-28"
                    />
                  </td>

                  <td className="p-3">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        value={item.startHour}
                        onChange={(e) =>
                          handleStageChange(idx, 'startHour', parseInt(e.target.value) || 0)
                        }
                        className="bg-white border border-gray-300 rounded px-1.5 py-1 text-xs w-14 text-center font-bold"
                      />
                      <span className="font-bold text-gray-400">:</span>
                      <input
                        type="number"
                        value={item.startMinute}
                        onChange={(e) =>
                          handleStageChange(idx, 'startMinute', parseInt(e.target.value) || 0)
                        }
                        className="bg-white border border-gray-300 rounded px-1.5 py-1 text-xs w-14 text-center font-bold"
                      />
                      <span className="font-bold text-gray-400">~</span>
                      <input
                        type="number"
                        value={item.endHour}
                        onChange={(e) =>
                          handleStageChange(idx, 'endHour', parseInt(e.target.value) || 0)
                        }
                        className="bg-white border border-gray-300 rounded px-1.5 py-1 text-xs w-14 text-center font-bold"
                      />
                      <span className="font-bold text-gray-400">:</span>
                      <input
                        type="number"
                        value={item.endMinute}
                        onChange={(e) =>
                          handleStageChange(idx, 'endMinute', parseInt(e.target.value) || 0)
                        }
                        className="bg-white border border-gray-300 rounded px-1.5 py-1 text-xs w-14 text-center font-bold"
                      />
                    </div>
                  </td>

                  <td className="p-3">
                    <textarea
                      rows={2}
                      value={item.songTitle}
                      onChange={(e) => handleStageChange(idx, 'songTitle', e.target.value)}
                      placeholder="엔터(Enter)로 여러 곡 입력 가능 (선택)"
                      className="bg-white border border-gray-300 rounded px-2 py-1 text-xs w-56 font-medium leading-normal resize-y"
                    />
                  </td>

                  <td className="p-3 text-center">
                    <button
                      onClick={() => handleDeleteStage(idx)}
                      className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                      title="공연 항목 삭제"
                    >
                      <Trash2 className="w-4 h-4 mx-auto" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 4. Bottom Action Bar */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <span className="text-xs text-gray-400 font-bold">
          총 {stageItems.length}개 공연 등록됨
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleAddNewStage}
            className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 rounded-lg text-xs font-bold shadow-2xs transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 text-gray-600" />
            <span>신규 추가</span>
          </button>
          <button
            onClick={handleSaveAllStages}
            disabled={isSaving}
            className="flex items-center gap-1 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-xs transition-all active:scale-95 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? '전체 저장 중...' : '전체 저장'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

