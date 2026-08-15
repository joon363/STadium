import React, { useState } from 'react';
import { FoodTruckItem } from '../../../types/stadium';
import {
  upsertSupabaseFoodTruck,
  deleteSupabaseFoodTruck,
} from '../../../lib/supabase';
import { Truck, Plus } from 'lucide-react';

interface FoodTrucksTabProps {
  foodTrucks: FoodTruckItem[];
  setFoodTrucks: React.Dispatch<React.SetStateAction<FoodTruckItem[]>>;
  isSaving: boolean;
  setIsSaving: (saving: boolean) => void;
  setSaveStatus: (msg: string | null) => void;
}

export const FoodTrucksTab: React.FC<FoodTrucksTabProps> = ({
  foodTrucks,
  setFoodTrucks,
  isSaving,
  setIsSaving,
  setSaveStatus,
}) => {
  const [editingFoodTruck, setEditingFoodTruck] = useState<Partial<FoodTruckItem>>({
    id: '',
    name: '',
    menuSummary: '',
    location: '기계동 잔디밭 푸드트럭존',
    operatingHours: '11:00 ~ 21:00',
    icon: '🚚',
    isActive: true,
    displayOrder: 0,
  });

  const handleSaveFoodTruck = async () => {
    if (!editingFoodTruck.name) {
      alert('푸드트럭 이름을 입력해 주세요.');
      return;
    }
    const itemToSave: FoodTruckItem = {
      id: editingFoodTruck.id || `ft-${Date.now()}`,
      name: editingFoodTruck.name,
      menuSummary: editingFoodTruck.menuSummary || '',
      location: editingFoodTruck.location || '',
      operatingHours: editingFoodTruck.operatingHours || '',
      icon: editingFoodTruck.icon || '🚚',
      imageUrl: editingFoodTruck.imageUrl || '',
      isActive: editingFoodTruck.isActive ?? true,
      displayOrder: Number(editingFoodTruck.displayOrder || 0),
    };

    setIsSaving(true);
    const res = await upsertSupabaseFoodTruck(itemToSave);
    setIsSaving(false);

    if (res.success) {
      setSaveStatus(`푸드트럭 [${itemToSave.name}] 정보가 저장되었습니다.`);
      setFoodTrucks((prev) => {
        const idx = prev.findIndex((t) => t.id === itemToSave.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = itemToSave;
          return next;
        }
        return [...prev, itemToSave];
      });
      setEditingFoodTruck({
        id: '',
        name: '',
        menuSummary: '',
        location: '기계동 잔디밭 푸드트럭존',
        operatingHours: '11:00 ~ 21:00',
        icon: '🚚',
        isActive: true,
        displayOrder: 0,
      });
    } else {
      setSaveStatus(`푸드트럭 저장 실패: ${res.error}`);
    }
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleDeleteFoodTruck = async (id: string) => {
    if (!confirm('정말 이 푸드트럭을 삭제하시겠습니까?')) return;
    setIsSaving(true);
    const res = await deleteSupabaseFoodTruck(id);
    setIsSaving(false);
    if (res.success) {
      setSaveStatus('푸드트럭이 삭제되었습니다.');
      setFoodTrucks((prev) => prev.filter((t) => t.id !== id));
      if (editingFoodTruck.id === id) {
        setEditingFoodTruck({
          id: '',
          name: '',
          menuSummary: '',
          location: '',
          operatingHours: '',
          icon: '🚚',
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
            <Truck className="w-5 h-5 text-orange-500" />
            <span>🚚 푸드트럭 관리</span>
          </h2>
          <p className="text-xs text-gray-500 font-medium">
            행사장 푸드트럭 라인업 및 메뉴 정보를 추가/편집합니다.
          </p>
        </div>
        <button
          onClick={() =>
            setEditingFoodTruck({
              id: '',
              name: '',
              menuSummary: '',
              location: '기계동 잔디밭 푸드트럭존',
              operatingHours: '11:00 ~ 21:00',
              icon: '🚚',
              isActive: true,
              displayOrder: foodTrucks.length + 1,
            })
          }
          className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>새 푸드트럭 등록</span>
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Form Side */}
        <div className="col-span-5 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <h3 className="font-extrabold text-sm text-slate-800 border-b border-slate-200 pb-2">
            {editingFoodTruck.id ? '푸드트럭 정보 수정' : '새 푸드트럭 추가'}
          </h3>
          <div className="space-y-2 text-xs">
            <div>
              <label className="font-bold text-gray-700 block mb-1">푸드트럭 이름 *</label>
              <input
                type="text"
                value={editingFoodTruck.name || ''}
                onChange={(e) =>
                  setEditingFoodTruck({ ...editingFoodTruck, name: e.target.value })
                }
                placeholder="예: 츄러스 & 스테이크 트럭"
                className="w-full border border-gray-300 p-2 rounded text-xs font-bold"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-bold text-gray-700 block mb-1">위치 정보</label>
                <input
                  type="text"
                  value={editingFoodTruck.location || ''}
                  onChange={(e) =>
                    setEditingFoodTruck({ ...editingFoodTruck, location: e.target.value })
                  }
                  placeholder="예: 기계동 잔디밭"
                  className="w-full border border-gray-300 p-2 rounded text-xs"
                />
              </div>
              <div>
                <label className="font-bold text-gray-700 block mb-1">운영 시간</label>
                <input
                  type="text"
                  value={editingFoodTruck.operatingHours || ''}
                  onChange={(e) =>
                    setEditingFoodTruck({
                      ...editingFoodTruck,
                      operatingHours: e.target.value,
                    })
                  }
                  placeholder="11:00 ~ 21:00"
                  className="w-full border border-gray-300 p-2 rounded text-xs"
                />
              </div>
            </div>
            <div>
              <label className="font-bold text-gray-700 block mb-1">아이콘 이모지</label>
              <input
                type="text"
                value={editingFoodTruck.icon || '🚚'}
                onChange={(e) =>
                  setEditingFoodTruck({ ...editingFoodTruck, icon: e.target.value })
                }
                className="w-20 border border-gray-300 p-2 rounded text-xs text-center font-bold"
              />
            </div>
            <div>
              <label className="font-bold text-gray-700 block mb-1">대표 메뉴 요약</label>
              <textarea
                rows={3}
                value={editingFoodTruck.menuSummary || ''}
                onChange={(e) =>
                  setEditingFoodTruck({ ...editingFoodTruck, menuSummary: e.target.value })
                }
                placeholder="예: 큐브스테이크 9,000원, 수제 츄러스 4,000원, 에이드 3,500원"
                className="w-full border border-gray-300 p-2 rounded text-xs"
              />
            </div>
            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-700">
                <input
                  type="checkbox"
                  checked={editingFoodTruck.isActive ?? true}
                  onChange={(e) =>
                    setEditingFoodTruck({ ...editingFoodTruck, isActive: e.target.checked })
                  }
                />
                <span>공개 표시 여부</span>
              </label>
              <div className="flex items-center gap-2">
                {editingFoodTruck.id && (
                  <button
                    onClick={() => handleDeleteFoodTruck(editingFoodTruck.id!)}
                    className="px-3 py-1.5 bg-rose-100 text-rose-700 hover:bg-rose-200 rounded font-bold"
                  >
                    삭제
                  </button>
                )}
                <button
                  onClick={handleSaveFoodTruck}
                  disabled={isSaving}
                  className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded font-bold shadow-2xs"
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
                  <th className="p-2.5">이름</th>
                  <th className="p-2.5">대표 메뉴</th>
                  <th className="p-2.5">상태</th>
                  <th className="p-2.5 text-right">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {foodTrucks.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-400">
                      등록된 푸드트럭이 없습니다.
                    </td>
                  </tr>
                ) : (
                  foodTrucks.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold text-slate-900 flex items-center gap-2">
                        <span>{t.icon}</span>
                        <span>{t.name}</span>
                      </td>
                      <td className="p-2.5 text-slate-600 truncate max-w-[200px]">
                        {t.menuSummary || '-'}
                      </td>
                      <td className="p-2.5">
                        {t.isActive ? (
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
                          onClick={() => setEditingFoodTruck(t)}
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
