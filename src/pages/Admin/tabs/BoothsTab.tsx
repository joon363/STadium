import React, { useState } from 'react';
import { BoothItem } from '../../../types/stadium';
import {
  upsertSupabaseBooth,
  deleteSupabaseBooth,
  uploadImageToSupabase,
} from '../../../lib/supabase';
import { Store, Plus, Upload } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { BilingualField } from '../components/BilingualField';
import { finalizeBilingualText } from '../../../utils/autoTranslate';
import { getLocalizedValue, localizeVenueName } from '../../../utils/bilingual';

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
  const { language, t } = useLanguage();
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
      alert(t('admin.booths.reqAlert'));
      return;
    }

    setIsSaving(true);
    const [bName, bOperator, bLocation, bDescription, bHours] = await Promise.all([
      finalizeBilingualText(editingBooth.name),
      finalizeBilingualText(editingBooth.operator || ''),
      finalizeBilingualText(editingBooth.location || ''),
      finalizeBilingualText(editingBooth.description || ''),
      finalizeBilingualText(editingBooth.operatingHours || ''),
    ]);

    const itemToSave: BoothItem = {
      id: editingBooth.id || `booth-${Date.now()}`,
      name: bName,
      operator: bOperator,
      location: bLocation,
      category: editingBooth.category || 'experience',
      description: bDescription,
      operatingHours: bHours,
      icon: editingBooth.icon || '🎪',
      imageUrl: editingBooth.imageUrl || '',
      isActive: editingBooth.isActive ?? true,
      displayOrder: Number(editingBooth.displayOrder || 0),
    };

    const res = await upsertSupabaseBooth(itemToSave);
    setIsSaving(false);

    if (res.success) {
      setSaveStatus(t('admin.savedSuccess'));
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
      setSaveStatus(t('admin.saveFailed', { error: res.error || '' }));
    }
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleDeleteBooth = async (id: string) => {
    if (!confirm(t('admin.confirmDelete'))) return;
    setIsSaving(true);
    const res = await deleteSupabaseBooth(id);
    setIsSaving(false);
    if (res.success) {
      setSaveStatus(t('admin.deletedSuccess'));
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
      setSaveStatus(t('admin.deleteFailed', { error: res.error || '' }));
    }
    setTimeout(() => setSaveStatus(null), 3000);
  };

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-b-xl shadow-2xs space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 pb-3">
        <div>
          <h2 className="font-extrabold text-base text-gray-900 flex items-center gap-2">
            <Store className="w-5 h-5 text-amber-500" />
            <span>{t('admin.booths.title')}</span>
          </h2>
          <p className="text-xs text-gray-500 font-medium">{t('admin.booths.desc')}</p>
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
          <span>{t('admin.booths.newBtn')}</span>
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Form Side */}
        <div className="col-span-5 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <h3 className="font-extrabold text-sm text-slate-800 border-b border-slate-200 pb-2">
            {editingBooth.id ? t('admin.booths.formEdit') : t('admin.booths.formNew')}
          </h3>
          <div className="space-y-2.5 text-xs">
            <BilingualField
              label={t('admin.booths.fieldName')}
              required
              compact
              value={editingBooth.name || ''}
              onChange={(val) => setEditingBooth({ ...editingBooth, name: val })}
              placeholderKo="예: AI 로봇 체험 부스"
              inputClassName="w-full border border-gray-300 p-2 rounded text-xs font-bold bg-white"
            />
            <BilingualField
              label={t('admin.booths.fieldOp')}
              compact
              value={editingBooth.operator || ''}
              onChange={(val) => setEditingBooth({ ...editingBooth, operator: val })}
              placeholderKo="예: POSTECH 로봇동아리"
              inputClassName="w-full border border-gray-300 p-2 rounded text-xs bg-white"
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  {t('admin.booths.fieldCat')}
                </label>
                <select
                  value={editingBooth.category || 'experience'}
                  onChange={(e) =>
                    setEditingBooth({ ...editingBooth, category: e.target.value })
                  }
                  className="w-full border border-gray-300 p-2 rounded text-xs font-bold bg-white"
                >
                  <option value="experience">{t('booth.catExperience')}</option>
                  <option value="food">{t('booth.catFood')}</option>
                  <option value="event">{t('booth.catEvent')}</option>
                  <option value="promotion">{t('booth.catPromotion')}</option>
                </select>
              </div>
              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  {t('admin.booths.fieldIcon')}
                </label>
                <input
                  type="text"
                  value={editingBooth.icon || '🎪'}
                  onChange={(e) => setEditingBooth({ ...editingBooth, icon: e.target.value })}
                  className="w-full border border-gray-300 p-2 rounded text-xs text-center font-bold bg-white"
                />
              </div>
            </div>
            <BilingualField
              label={t('admin.booths.fieldLoc')}
              compact
              value={editingBooth.location || ''}
              onChange={(val) => setEditingBooth({ ...editingBooth, location: val })}
              placeholderKo="예: 학생회관 앞 광장"
              inputClassName="w-full border border-gray-300 p-2 rounded text-xs bg-white"
            />
            <BilingualField
              label={t('admin.booths.fieldHours')}
              compact
              value={editingBooth.operatingHours || ''}
              onChange={(val) => setEditingBooth({ ...editingBooth, operatingHours: val })}
              placeholderKo="10:00 ~ 18:00"
              inputClassName="w-full border border-gray-300 p-2 rounded text-xs bg-white"
            />
            <div>
              <label className="font-bold text-gray-700 block mb-1">
                {t('admin.booths.fieldImg')}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editingBooth.imageUrl || ''}
                  onChange={(e) =>
                    setEditingBooth({ ...editingBooth, imageUrl: e.target.value })
                  }
                  placeholder="https://..."
                  className="flex-1 border border-gray-300 p-2 rounded text-xs bg-white"
                />
                <label className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{t('admin.upload')}</span>
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
                        setSaveStatus(t('admin.uploadDone'));
                        setTimeout(() => setSaveStatus(null), 3000);
                      } else {
                        alert(t('admin.uploadFail', { error: res.error || '' }));
                      }
                    }}
                  />
                </label>
              </div>
            </div>
            <BilingualField
              label={t('admin.booths.fieldDesc')}
              multiline
              rows={3}
              value={editingBooth.description || ''}
              onChange={(val) => setEditingBooth({ ...editingBooth, description: val })}
              placeholderKo="부스 상세 설명 및 진행 프로그램"
              inputClassName="w-full border border-gray-300 p-2 rounded text-xs bg-white"
            />
            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-700">
                <input
                  type="checkbox"
                  checked={editingBooth.isActive ?? true}
                  onChange={(e) =>
                    setEditingBooth({ ...editingBooth, isActive: e.target.checked })
                  }
                />
                <span>{t('admin.visibleToggle')}</span>
              </label>
              <div className="flex items-center gap-2">
                {editingBooth.id && (
                  <button
                    onClick={() => handleDeleteBooth(editingBooth.id!)}
                    className="px-3 py-1.5 bg-rose-100 text-rose-700 hover:bg-rose-200 rounded font-bold"
                  >
                    {t('admin.delete')}
                  </button>
                )}
                <button
                  onClick={handleSaveBooth}
                  disabled={isSaving}
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold shadow-2xs disabled:opacity-50"
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
                  <th className="p-2.5">{t('admin.booths.fieldName')}</th>
                  <th className="p-2.5">{t('admin.booths.fieldOp')}</th>
                  <th className="p-2.5">{t('admin.booths.fieldLoc')}</th>
                  <th className="p-2.5">{t('admin.status')}</th>
                  <th className="p-2.5 text-right">{t('admin.manage')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {booths.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">
                      {t('admin.booths.empty')}
                    </td>
                  </tr>
                ) : (
                  booths.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold text-slate-900 flex items-center gap-2">
                        <span>{b.icon}</span>
                        <span>{getLocalizedValue(b.name, language)}</span>
                      </td>
                      <td className="p-2.5 text-slate-600">
                        {getLocalizedValue(b.operator, language) || '-'}
                      </td>
                      <td className="p-2.5 text-slate-600">
                        {getLocalizedValue(b.location, language, (s) =>
                          localizeVenueName(s, language)
                        ) || '-'}
                      </td>
                      <td className="p-2.5">
                        {b.isActive ? (
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
                          onClick={() => setEditingBooth(b)}
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
