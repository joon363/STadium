import React, { useState } from 'react';
import { FoodTruckItem } from '../../../types/stadium';
import {
  upsertSupabaseFoodTruck,
  deleteSupabaseFoodTruck,
} from '../../../lib/supabase';
import { Truck, Plus } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { BilingualField } from '../components/BilingualField';
import { finalizeBilingualText } from '../../../utils/autoTranslate';
import { getLocalizedValue } from '../../../utils/bilingual';

interface FoodTrucksTabProps {
  foodTrucks: FoodTruckItem[];
  setFoodTrucks: React.Dispatch<React.SetStateAction<FoodTruckItem[]>>;
  isSaving: boolean;
  setIsSaving: (saving: boolean) => void;
  setSaveStatus: (msg: string | null) => void;
}

const DEFAULT_LOCATION = '기계동 잔디밭 푸드트럭존 ||| Mechanical Engineering Lawn Food Truck Zone';

export const FoodTrucksTab: React.FC<FoodTrucksTabProps> = ({
  foodTrucks,
  setFoodTrucks,
  isSaving,
  setIsSaving,
  setSaveStatus,
}) => {
  const { language, t } = useLanguage();
  const [editingFoodTruck, setEditingFoodTruck] = useState<Partial<FoodTruckItem>>({
    id: '',
    name: '',
    menuSummary: '',
    location: DEFAULT_LOCATION,
    operatingHours: '11:00 ~ 21:00',
    icon: '🚚',
    isActive: true,
    displayOrder: 0,
  });

  const handleSaveFoodTruck = async () => {
    if (!editingFoodTruck.name) {
      alert(t('admin.foodtrucks.reqAlert'));
      return;
    }

    setIsSaving(true);
    const [bName, bMenu, bLocation, bHours] = await Promise.all([
      finalizeBilingualText(editingFoodTruck.name),
      finalizeBilingualText(editingFoodTruck.menuSummary || ''),
      finalizeBilingualText(editingFoodTruck.location || ''),
      finalizeBilingualText(editingFoodTruck.operatingHours || ''),
    ]);

    const itemToSave: FoodTruckItem = {
      id: editingFoodTruck.id || `ft-${Date.now()}`,
      name: bName,
      menuSummary: bMenu,
      location: bLocation,
      operatingHours: bHours,
      icon: editingFoodTruck.icon || '🚚',
      imageUrl: editingFoodTruck.imageUrl || '',
      isActive: editingFoodTruck.isActive ?? true,
      displayOrder: Number(editingFoodTruck.displayOrder || 0),
    };

    const res = await upsertSupabaseFoodTruck(itemToSave);
    setIsSaving(false);

    if (res.success) {
      setSaveStatus(t('admin.savedSuccess'));
      setFoodTrucks((prev) => {
        const idx = prev.findIndex((item) => item.id === itemToSave.id);
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
        location: DEFAULT_LOCATION,
        operatingHours: '11:00 ~ 21:00',
        icon: '🚚',
        isActive: true,
        displayOrder: 0,
      });
    } else {
      setSaveStatus(t('admin.saveFailed', { error: res.error || '' }));
    }
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleDeleteFoodTruck = async (id: string) => {
    if (!confirm(t('admin.confirmDelete'))) return;
    setIsSaving(true);
    const res = await deleteSupabaseFoodTruck(id);
    setIsSaving(false);
    if (res.success) {
      setSaveStatus(t('admin.deletedSuccess'));
      setFoodTrucks((prev) => prev.filter((item) => item.id !== id));
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
      setSaveStatus(t('admin.deleteFailed', { error: res.error || '' }));
    }
    setTimeout(() => setSaveStatus(null), 3000);
  };

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-b-xl shadow-2xs space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 pb-3">
        <div>
          <h2 className="font-extrabold text-base text-gray-900 flex items-center gap-2">
            <Truck className="w-5 h-5 text-orange-500" />
            <span>{t('admin.foodtrucks.title')}</span>
          </h2>
          <p className="text-xs text-gray-500 font-medium">{t('admin.foodtrucks.desc')}</p>
        </div>
        <button
          onClick={() =>
            setEditingFoodTruck({
              id: '',
              name: '',
              menuSummary: '',
              location: DEFAULT_LOCATION,
              operatingHours: '11:00 ~ 21:00',
              icon: '🚚',
              isActive: true,
              displayOrder: foodTrucks.length + 1,
            })
          }
          className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>{t('admin.foodtrucks.newBtn')}</span>
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Form Side */}
        <div className="col-span-5 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <h3 className="font-extrabold text-sm text-slate-800 border-b border-slate-200 pb-2">
            {editingFoodTruck.id
              ? t('admin.foodtrucks.formEdit')
              : t('admin.foodtrucks.formNew')}
          </h3>
          <div className="space-y-2.5 text-xs">
            <BilingualField
              label={t('admin.foodtrucks.fieldName')}
              required
              compact
              value={editingFoodTruck.name || ''}
              onChange={(val) => setEditingFoodTruck({ ...editingFoodTruck, name: val })}
              placeholderKo="예: 츄러스 & 스테이크 트럭"
              inputClassName="w-full border border-gray-300 p-2 rounded text-xs font-bold bg-white"
            />
            <BilingualField
              label={t('admin.foodtrucks.fieldLoc')}
              compact
              value={editingFoodTruck.location || ''}
              onChange={(val) => setEditingFoodTruck({ ...editingFoodTruck, location: val })}
              placeholderKo="예: 기계동 잔디밭"
              inputClassName="w-full border border-gray-300 p-2 rounded text-xs bg-white"
            />
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <BilingualField
                  label={t('admin.foodtrucks.fieldHours')}
                  compact
                  value={editingFoodTruck.operatingHours || ''}
                  onChange={(val) =>
                    setEditingFoodTruck({ ...editingFoodTruck, operatingHours: val })
                  }
                  placeholderKo="11:00 ~ 21:00"
                  inputClassName="w-full border border-gray-300 p-2 rounded text-xs bg-white"
                />
              </div>
              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  {t('admin.booths.fieldIcon')}
                </label>
                <input
                  type="text"
                  value={editingFoodTruck.icon || '🚚'}
                  onChange={(e) =>
                    setEditingFoodTruck({ ...editingFoodTruck, icon: e.target.value })
                  }
                  className="w-full border border-gray-300 p-2 rounded text-xs text-center font-bold bg-white mt-4"
                />
              </div>
            </div>
            <BilingualField
              label={t('admin.foodtrucks.fieldMenu')}
              multiline
              rows={3}
              value={editingFoodTruck.menuSummary || ''}
              onChange={(val) =>
                setEditingFoodTruck({ ...editingFoodTruck, menuSummary: val })
              }
              placeholderKo="예: 큐브스테이크 9,000원, 수제 츄러스 4,000원, 에이드 3,500원"
              inputClassName="w-full border border-gray-300 p-2 rounded text-xs bg-white"
            />
            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-700">
                <input
                  type="checkbox"
                  checked={editingFoodTruck.isActive ?? true}
                  onChange={(e) =>
                    setEditingFoodTruck({ ...editingFoodTruck, isActive: e.target.checked })
                  }
                />
                <span>{t('admin.visibleToggle')}</span>
              </label>
              <div className="flex items-center gap-2">
                {editingFoodTruck.id && (
                  <button
                    onClick={() => handleDeleteFoodTruck(editingFoodTruck.id!)}
                    className="px-3 py-1.5 bg-rose-100 text-rose-700 hover:bg-rose-200 rounded font-bold"
                  >
                    {t('admin.delete')}
                  </button>
                )}
                <button
                  onClick={handleSaveFoodTruck}
                  disabled={isSaving}
                  className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded font-bold shadow-2xs disabled:opacity-50"
                >
                  {isSaving ? t('admin.saving') : t('admin.save')}
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
                  <th className="p-2.5">{t('admin.foodtrucks.fieldName')}</th>
                  <th className="p-2.5">{t('admin.foodtrucks.fieldMenu')}</th>
                  <th className="p-2.5">{t('admin.status')}</th>
                  <th className="p-2.5 text-right">{t('admin.manage')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {foodTrucks.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-400">
                      {t('admin.foodtrucks.empty')}
                    </td>
                  </tr>
                ) : (
                  foodTrucks.map((truck) => (
                    <tr key={truck.id} className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold text-slate-900 flex items-center gap-2">
                        <span>{truck.icon}</span>
                        <span>{getLocalizedValue(truck.name, language)}</span>
                      </td>
                      <td className="p-2.5 text-slate-600 truncate max-w-[200px]">
                        {getLocalizedValue(truck.menuSummary, language) || '-'}
                      </td>
                      <td className="p-2.5">
                        {truck.isActive ? (
                          <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold text-[10px]">
                            {t('admin.public')}
                          </span>
                        ) : (
                          <span className="text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-bold text-[10px]">
                            {t('admin.hidden')}
                          </span>
                        )}
                      </td>
                      <td className="p-2.5 text-right">
                        <button
                          onClick={() => setEditingFoodTruck(truck)}
                          className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded font-bold text-[11px]"
                        >
                          {t('admin.edit')}
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
