import React, { useState } from 'react';
import { BoothItem } from '../../../types/stadium';
import {
  upsertSupabaseBooth,
  deleteSupabaseBooth,
  uploadImageToSupabase,
} from '../../../lib/supabase';
import { Store, Plus, Upload } from 'lucide-react';

interface BoothsTabProps {
  booths: BoothItem[];
  setBooths: React.Dispatch<React.SetStateAction<BoothItem[]>>;
  isSaving: boolean;
  setIsSaving: (saving: boolean) => void;
  setSaveStatus: (msg: string | null) => void;
}

export const BoothsTab: React.FC<BoothsTabProps> = ({
  booths,
  setBooths,
  isSaving,
  setIsSaving,
  setSaveStatus,
}) => {
  const [editingBooth, setEditingBooth] = useState<Partial<BoothItem>>({
    id: '',
    name: '',
    operator: '',
    location: '',
    category: 'experience',
    description: '',
    operatingHours: '10:00 ~ 18:00',
    icon: '🎪',
    isActive: true,
    displayOrder: 0,
  });

  const handleSaveBooth = async () => {
    if (!editingBooth.name) {
      alert('부스 이름을 입력해 주세요.');
      return;
    }
    const itemToSave: BoothItem = {
      id: editingBooth.id || `booth-${Date.now()}`,
      name: editingBooth.name,
      operator: editingBooth.operator || '',
      location: editingBooth.location || '',
      category: editingBooth.category || 'experience',
      description: editingBooth.description || '',
      operatingHours: editingBooth.operatingHours || '',
      icon: editingBooth.icon || '🎪',
      imageUrl: editingBooth.imageUrl || '',
      isActive: editingBooth.isActive ?? true,
      displayOrder: Number(editingBooth.displayOrder || 0),
    };

    setIsSaving(true);
    const res = await upsertSupabaseBooth(itemToSave);
    setIsSaving(false);

    if (res.success) {
      setSaveStatus(`부스 [${itemToSave.name}] 정보가 저장되었습니다.`);
      setBooths((prev) => {
        const idx = prev.findIndex((b) => b.id === itemToSave.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = itemToSave;
          return next;
        }
        return [...prev, itemToSave];
      });
      setEditingBooth({
        id: '',
        name: '',
        operator: '',
        location: '',
        category: 'experience',
        description: '',
        operatingHours: '10:00 ~ 18:00',
        icon: '🎪',
        isActive: true,
        displayOrder: 0,
      });
    } else {
      setSaveStatus(`부스 저장 실패: ${res.error}`);
    }
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleDeleteBooth = async (id: string) => {
    if (!confirm('정말 이 부스를 삭제하시겠습니까?')) return;
    setIsSaving(true);
    const res = await deleteSupabaseBooth(id);
    setIsSaving(false);
    if (res.success) {
      setSaveStatus('부스가 삭제되었습니다.');
      setBooths((prev) => prev.filter((b) => b.id !== id));
      if (editingBooth.id === id) {
        setEditingBooth({
          id: '',
          name: '',
          operator: '',
          location: '',
          category: 'experience',
          description: '',
          operatingHours: '',
          icon: '🎪',
          isActive: true,
          displayOrder: 0,
        });
      }
    } else {
      setSaveStatus(`삭제 실패: ${res.error}`);
    }
    setTimeout(() => setSaveStatus(null), 3000);
  };

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-b-xl shadow-2xs space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 pb-3">
        <div>
          <h2 className="font-extrabold text-base text-gray-900 flex items-center gap-2">
            <Store className="w-5 h-5 text-amber-500" />
            <span>🎪 부스 관리</span>
          </h2>
          <p className="text-xs text-gray-500 font-medium">
            행사장 내 동아리/체험 부스 정보를 추가 및 편집합니다.
          </p>
        </div>
        <button
          onClick={() =>
            setEditingBooth({
              id: '',
              name: '',
              operator: '',
              location: '',
              category: 'experience',
              description: '',
              operatingHours: '10:00 ~ 18:00',
              icon: '🎪',
              isActive: true,
              displayOrder: booths.length + 1,
            })
          }
          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>새 부스 등록</span>
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Form Side */}
        <div className="col-span-5 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <h3 className="font-extrabold text-sm text-slate-800 border-b border-slate-200 pb-2">
            {editingBooth.id ? '부스 정보 수정' : '새 부스 추가'}
          </h3>
          <div className="space-y-2 text-xs">
            <div>
              <label className="font-bold text-gray-700 block mb-1">부스 이름 *</label>
              <input
                type="text"
                value={editingBooth.name || ''}
                onChange={(e) => setEditingBooth({ ...editingBooth, name: e.target.value })}
                placeholder="예: AI 로봇 체험 부스"
                className="w-full border border-gray-300 p-2 rounded text-xs font-bold"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-bold text-gray-700 block mb-1">운영 주체</label>
                <input
                  type="text"
                  value={editingBooth.operator || ''}
                  onChange={(e) =>
                    setEditingBooth({ ...editingBooth, operator: e.target.value })
                  }
                  placeholder="예: POSTECH 로봇동아리"
                  className="w-full border border-gray-300 p-2 rounded text-xs"
                />
              </div>
              <div>
                <label className="font-bold text-gray-700 block mb-1">카테고리</label>
                <select
                  value={editingBooth.category || 'experience'}
                  onChange={(e) =>
                    setEditingBooth({ ...editingBooth, category: e.target.value })
                  }
                  className="w-full border border-gray-300 p-2 rounded text-xs font-bold"
                >
                  <option value="experience">체험 부스</option>
                  <option value="food">음식/식음</option>
                  <option value="event">이벤트</option>
                  <option value="promotion">홍보</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-bold text-gray-700 block mb-1">위치 정보</label>
                <input
                  type="text"
                  value={editingBooth.location || ''}
                  onChange={(e) =>
                    setEditingBooth({ ...editingBooth, location: e.target.value })
                  }
                  placeholder="예: 학생회관 앞 광장"
                  className="w-full border border-gray-300 p-2 rounded text-xs"
                />
              </div>
              <div>
                <label className="font-bold text-gray-700 block mb-1">운영 시간</label>
                <input
                  type="text"
                  value={editingBooth.operatingHours || ''}
                  onChange={(e) =>
                    setEditingBooth({ ...editingBooth, operatingHours: e.target.value })
                  }
                  placeholder="10:00 ~ 18:00"
                  className="w-full border border-gray-300 p-2 rounded text-xs"
                />
              </div>
            </div>
            <div>
              <label className="font-bold text-gray-700 block mb-1">아이콘 이모지</label>
              <input
                type="text"
                value={editingBooth.icon || '🎪'}
                onChange={(e) => setEditingBooth({ ...editingBooth, icon: e.target.value })}
                className="w-20 border border-gray-300 p-2 rounded text-xs text-center font-bold"
              />
            </div>
            <div>
              <label className="font-bold text-gray-700 block mb-1">
                이미지 업로드 (Supabase Storage)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editingBooth.imageUrl || ''}
                  onChange={(e) =>
                    setEditingBooth({ ...editingBooth, imageUrl: e.target.value })
                  }
                  placeholder="이미지 URL 또는 직접 업로드"
                  className="flex-1 border border-gray-300 p-2 rounded text-xs"
                />
                <label className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0">
                  <Upload className="w-3.5 h-3.5" />
                  <span>업로드</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setIsSaving(true);
                      const res = await uploadImageToSupabase(file, 'images');
                      setIsSaving(false);
                      if (res.url) {
                        setEditingBooth((prev) => ({ ...prev, imageUrl: res.url }));
                        setSaveStatus('이미지가 Supabase Storage에 업로드되었습니다!');
                        setTimeout(() => setSaveStatus(null), 3000);
                      } else {
                        alert(`업로드 실패: ${res.error || '버킷 설정을 확인해주세요.'}`);
                      }
                    }}
                  />
                </label>
              </div>
            </div>
            <div>
              <label className="font-bold text-gray-700 block mb-1">부스 설명</label>
              <textarea
                rows={3}
                value={editingBooth.description || ''}
                onChange={(e) =>
                  setEditingBooth({ ...editingBooth, description: e.target.value })
                }
                placeholder="부스 상세 설명 및 진행 프로그램"
                className="w-full border border-gray-300 p-2 rounded text-xs"
              />
            </div>
            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-700">
                <input
                  type="checkbox"
                  checked={editingBooth.isActive ?? true}
                  onChange={(e) =>
                    setEditingBooth({ ...editingBooth, isActive: e.target.checked })
                  }
                />
                <span>공개 표시 여부</span>
              </label>
              <div className="flex items-center gap-2">
                {editingBooth.id && (
                  <button
                    onClick={() => handleDeleteBooth(editingBooth.id!)}
                    className="px-3 py-1.5 bg-rose-100 text-rose-700 hover:bg-rose-200 rounded font-bold"
                  >
                    삭제
                  </button>
                )}
                <button
                  onClick={handleSaveBooth}
                  disabled={isSaving}
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold shadow-2xs"
                >
                  저장하기
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Table Side */}
        <div className="col-span-7 space-y-2">
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200">
                <tr>
                  <th className="p-2.5">이모지/이름</th>
                  <th className="p-2.5">운영주체</th>
                  <th className="p-2.5">위치</th>
                  <th className="p-2.5">상태</th>
                  <th className="p-2.5 text-right">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {booths.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">
                      등록된 부스가 없습니다.
                    </td>
                  </tr>
                ) : (
                  booths.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold text-slate-900 flex items-center gap-2">
                        <span>{b.icon}</span>
                        <span>{b.name}</span>
                      </td>
                      <td className="p-2.5 text-slate-600">{b.operator || '-'}</td>
                      <td className="p-2.5 text-slate-600">{b.location || '-'}</td>
                      <td className="p-2.5">
                        {b.isActive ? (
                          <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold text-[10px]">
                            공개
                          </span>
                        ) : (
                          <span className="text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-bold text-[10px]">
                            숨김
                          </span>
                        )}
                      </td>
                      <td className="p-2.5 text-right">
                        <button
                          onClick={() => setEditingBooth(b)}
                          className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded font-bold text-[11px]"
                        >
                          편집
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
