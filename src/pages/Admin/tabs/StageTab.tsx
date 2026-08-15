import React from 'react';
import { StageItem, SCHOOLS } from '../../../types/stadium';
import { updateSupabaseStagePerformance } from '../../../lib/supabase';

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

  const handleSaveStage = async (index: number, item: StageItem) => {
    setIsSaving(true);
    const ok = await updateSupabaseStagePerformance(index, item);
    setIsSaving(false);
    if (ok) {
      setSaveStatus(`[${item.school} - ${item.clubName}] 공연 정보가 저장되었습니다.`);
    } else {
      setSaveStatus('공연 정보 저장 실패');
    }
    setTimeout(() => setSaveStatus(null), 3000);
  };

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-b-xl shadow-2xs space-y-4">
      <h2 className="font-extrabold text-base text-gray-900">
        체육관 메인 문화공연 타임라인 설정
      </h2>

      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-100 font-bold text-gray-700 border-b border-gray-200">
            <tr>
              <th className="p-3">학교</th>
              <th className="p-3">동아리명</th>
              <th className="p-3">구분 (필수)</th>
              <th className="p-3">장르 (선택)</th>
              <th className="p-3">곡명 / 세트리스트</th>
              <th className="p-3">공연 시각 (시작~종료)</th>
              <th className="p-3 text-right">작업</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 font-medium">
            {stageItems.map((item, idx) => (
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
                    <option value="댄스">댄스</option>
                    <option value="힙합">힙합</option>
                    <option value="응원단">응원단</option>
                    <option value="기타">기타</option>
                  </select>
                </td>

                <td className="p-3">
                  <input
                    type="text"
                    value={item.genre || ''}
                    onChange={(e) => handleStageChange(idx, 'genre', e.target.value)}
                    placeholder="예: 모던락, K-POP"
                    className="bg-white border border-gray-300 rounded px-2 py-1 text-xs w-28"
                  />
                </td>

                <td className="p-3">
                  <textarea
                    rows={2}
                    value={item.songTitle}
                    onChange={(e) => handleStageChange(idx, 'songTitle', e.target.value)}
                    placeholder="엔터(Enter)로 여러 곡 입력 가능"
                    className="bg-white border border-gray-300 rounded px-2 py-1 text-xs w-56 font-medium leading-normal resize-y"
                  />
                </td>

                <td className="p-3">
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={item.startHour}
                      onChange={(e) =>
                        handleStageChange(idx, 'startHour', parseInt(e.target.value) || 0)
                      }
                      className="bg-white border border-gray-300 rounded px-1.5 py-1 text-xs w-10 text-center font-bold"
                    />
                    <span>:</span>
                    <input
                      type="number"
                      value={item.startMinute}
                      onChange={(e) =>
                        handleStageChange(idx, 'startMinute', parseInt(e.target.value) || 0)
                      }
                      className="bg-white border border-gray-300 rounded px-1.5 py-1 text-xs w-10 text-center font-bold"
                    />
                    <span>~</span>
                    <input
                      type="number"
                      value={item.endHour}
                      onChange={(e) =>
                        handleStageChange(idx, 'endHour', parseInt(e.target.value) || 0)
                      }
                      className="bg-white border border-gray-300 rounded px-1.5 py-1 text-xs w-10 text-center font-bold"
                    />
                    <span>:</span>
                    <input
                      type="number"
                      value={item.endMinute}
                      onChange={(e) =>
                        handleStageChange(idx, 'endMinute', parseInt(e.target.value) || 0)
                      }
                      className="bg-white border border-gray-300 rounded px-1.5 py-1 text-xs w-10 text-center font-bold"
                    />
                  </div>
                </td>

                <td className="p-3 text-right">
                  <button
                    onClick={() => handleSaveStage(idx, item)}
                    disabled={isSaving}
                    className="px-2.5 py-1 bg-slate-900 text-white rounded text-[11px] font-bold hover:bg-slate-800 transition-colors"
                  >
                    저장
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
