import React, { useState } from 'react';
import { SponsorItem } from '../../../types/stadium';
import {
  upsertSupabaseSponsor,
  uploadImageToSupabase,
} from '../../../lib/supabase';
import { DEFAULT_FIXED_SPONSORS } from '../../../services/sponsorsService';
import { Building2, Upload, ExternalLink, RefreshCw } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { BilingualField } from '../components/BilingualField';
import { finalizeBilingualText } from '../../../utils/autoTranslate';
import { getLocalizedValue } from '../../../utils/bilingual';

interface SponsorsTabProps {
  sponsors: SponsorItem[];
  setSponsors: React.Dispatch<React.SetStateAction<SponsorItem[]>>;
  isSaving: boolean;
  setIsSaving: (saving: boolean) => void;
  setSaveStatus: (msg: string | null) => void;
}

const PRESET_LOGOS = [
  { label: 'PLASPEAU', value: '/sponsors/1plaspeau.png' },
  { label: 'Penta Security', value: '/sponsors/2penta.png' },
  { label: 'Neuromeka', value: '/sponsors/3neuromeka.png' },
  { label: 'BGN', value: '/sponsors/4eye.png' },
];

export const SponsorsTab: React.FC<SponsorsTabProps> = ({
  sponsors,
  setSponsors,
  isSaving,
  setIsSaving,
  setSaveStatus,
}) => {
  const { language, t } = useLanguage();
  // Ensure the 4 fixed sponsors exist based on DEFAULT_FIXED_SPONSORS
  const fixedList: SponsorItem[] = DEFAULT_FIXED_SPONSORS.map((def, idx) => {
    const existing = sponsors.find((s) => s.id === def.id || s.displayOrder === idx + 1);
    return existing ? { ...def, ...existing } : def;
  });

  const [selectedId, setSelectedId] = useState<string>(fixedList[0]?.id || 'sp-1');

  const currentSponsor: SponsorItem =
    fixedList.find((s) => s.id === selectedId) || fixedList[0];

  const handleUpdateCurrent = (updates: Partial<SponsorItem>) => {
    setSponsors((prev) => {
      const idx = prev.findIndex((s) => s.id === currentSponsor.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], ...updates };
        return next;
      }
      return [...prev, { ...currentSponsor, ...updates }];
    });
  };

  const handleSaveSponsor = async () => {
    if (!currentSponsor.name.trim()) {
      alert(t('admin.sponsors.reqAlert'));
      return;
    }

    setIsSaving(true);
    const [bName, bDesc] = await Promise.all([
      finalizeBilingualText(currentSponsor.name),
      finalizeBilingualText(currentSponsor.description),
    ]);
    const itemToSave: SponsorItem = {
      ...currentSponsor,
      name: bName,
      description: bDesc,
    };

    const res = await upsertSupabaseSponsor(itemToSave);
    setIsSaving(false);

    if (res.success) {
      handleUpdateCurrent({ name: bName, description: bDesc });
      setSaveStatus(t('admin.savedSuccess'));
    } else {
      setSaveStatus(t('admin.saveFailed', { error: res.error || '' }));
    }
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleResetToDefault = (defId: string) => {
    const def = DEFAULT_FIXED_SPONSORS.find((s) => s.id === defId);
    if (!def) return;
    if (!confirm(t('admin.sponsors.confirmReset', { name: getLocalizedValue(def.name, language) }))) {
      return;
    }
    handleUpdateCurrent(def);
  };

  const displaySponsorName = getLocalizedValue(currentSponsor.name, language);
  const displaySponsorDesc = getLocalizedValue(currentSponsor.description, language);

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-b-xl shadow-2xs space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 pb-3">
        <div>
          <h2 className="font-extrabold text-base text-gray-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-500" />
            <span>{t('admin.sponsors.title')}</span>
          </h2>
          <p className="text-xs text-gray-500 font-medium mt-0.5">{t('admin.sponsors.desc')}</p>
        </div>
      </div>

      {/* 4 Fixed Sponsor Selection Tabs */}
      <div className="grid grid-cols-4 gap-2">
        {fixedList.map((sp, idx) => {
          const isSelected = sp.id === currentSponsor.id;
          const localizedSpName = getLocalizedValue(sp.name, language);
          return (
            <button
              key={sp.id}
              onClick={() => setSelectedId(sp.id)}
              className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                isSelected
                  ? 'border-blue-500 bg-blue-50/70 shadow-xs ring-2 ring-blue-100'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 p-1 flex items-center justify-center shrink-0">
                {sp.logoUrl ? (
                  <img
                    src={sp.logoUrl}
                    alt={localizedSpName}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="font-bold text-xs text-gray-400">#{idx + 1}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-blue-600 uppercase">
                    {t('admin.sponsors.slotLabel', { index: idx + 1 })}
                  </span>
                  {!sp.isActive && (
                    <span className="text-[9px] bg-gray-200 text-gray-600 px-1 rounded font-bold">
                      {t('admin.hidden')}
                    </span>
                  )}
                </div>
                <h4 className="font-extrabold text-xs text-gray-900 truncate">{localizedSpName}</h4>
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-12 gap-6 pt-2">
        {/* Edit Form */}
        <div className="col-span-7 bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h3 className="font-extrabold text-sm text-slate-800">
              {t('admin.sponsors.editHeading', { name: displaySponsorName })}
            </h3>
            <button
              type="button"
              onClick={() => handleResetToDefault(currentSponsor.id)}
              className="text-[11px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>{t('admin.sponsors.resetDefault')}</span>
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <BilingualField
              label={t('admin.sponsors.fieldName')}
              required
              compact
              value={currentSponsor.name || ''}
              onChange={(val) => handleUpdateCurrent({ name: val })}
              placeholderKo="예: 플라스뽀 (PLASPEAU)"
              inputClassName="w-full border border-gray-300 p-2.5 rounded-lg text-xs font-bold bg-white"
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  {t('admin.sponsors.fieldTier')}
                </label>
                <select
                  value={currentSponsor.tier || 'main'}
                  onChange={(e) => handleUpdateCurrent({ tier: e.target.value })}
                  className="w-full border border-gray-300 p-2.5 rounded-lg text-xs font-bold bg-white"
                >
                  <option value="main">👑 {t('sponsors.tierMain')}</option>
                  <option value="platinum">💎 {t('sponsors.tierPlatinum')}</option>
                  <option value="gold">🥇 {t('sponsors.tierGold')}</option>
                  <option value="silver">🥈 {t('sponsors.tierSilver')}</option>
                  <option value="bronze">🥉 {t('sponsors.tierBronze')}</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  {t('admin.sponsors.fieldOrder')}
                </label>
                <input
                  type="number"
                  value={currentSponsor.displayOrder || 1}
                  onChange={(e) =>
                    handleUpdateCurrent({ displayOrder: parseInt(e.target.value) || 1 })
                  }
                  className="w-full border border-gray-300 p-2.5 rounded-lg text-xs font-bold bg-white"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">
                {t('admin.sponsors.fieldLogo')}
              </label>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={currentSponsor.logoUrl || ''}
                    onChange={(e) => handleUpdateCurrent({ logoUrl: e.target.value })}
                    placeholder="/sponsors/1plaspeau.png"
                    className="flex-1 border border-gray-300 p-2 rounded-lg text-xs bg-white font-mono"
                  />
                  <label className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{t('admin.sponsors.newFile')}</span>
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
                          handleUpdateCurrent({ logoUrl: res.url });
                          setSaveStatus(t('admin.uploadDone'));
                          setTimeout(() => setSaveStatus(null), 3000);
                        } else {
                          alert(t('admin.uploadFail', { error: res.error || '' }));
                        }
                      }}
                    />
                  </label>
                </div>

                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-[10px] text-gray-500 font-bold">
                    {t('admin.sponsors.quickSelect')}
                  </span>
                  {PRESET_LOGOS.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => handleUpdateCurrent({ logoUrl: preset.value })}
                      className="text-[10px] bg-slate-200 hover:bg-slate-300 text-slate-800 px-1.5 py-0.5 rounded font-medium"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">
                {t('admin.sponsors.fieldUrl')}
              </label>
              <input
                type="text"
                value={currentSponsor.websiteUrl || ''}
                onChange={(e) => handleUpdateCurrent({ websiteUrl: e.target.value })}
                placeholder="https://..."
                className="w-full border border-gray-300 p-2.5 rounded-lg text-xs bg-white font-mono"
              />
            </div>

            <BilingualField
              label={t('admin.sponsors.fieldDesc')}
              multiline
              rows={4}
              value={currentSponsor.description || ''}
              onChange={(val) => handleUpdateCurrent({ description: val })}
              placeholderKo="후원 기업 소개 및 행사 참여/부스 안내글"
              inputClassName="w-full border border-gray-300 p-2.5 rounded-lg text-xs bg-white leading-relaxed"
            />

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-700">
                <input
                  type="checkbox"
                  checked={currentSponsor.isActive ?? true}
                  onChange={(e) => handleUpdateCurrent({ isActive: e.target.checked })}
                />
                <span>{t('admin.visibleToggle')}</span>
              </label>

              <button
                type="button"
                onClick={handleSaveSponsor}
                disabled={isSaving}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-2xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <span>{isSaving ? t('admin.saving') : t('admin.sponsors.saveBtn')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Live Preview Side */}
        <div className="col-span-5 space-y-3">
          <div className="border border-slate-200 rounded-2xl p-4 bg-white shadow-2xs space-y-3">
            <h4 className="font-extrabold text-xs text-slate-800 border-b border-gray-100 pb-2">
              {t('admin.sponsors.previewHeading')}
            </h4>

            <div className="bg-white border border-gray-200 rounded-2xl p-3 space-y-2 shadow-2xs">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {currentSponsor.logoUrl ? (
                    <img
                      src={currentSponsor.logoUrl}
                      alt={displaySponsorName}
                      className="w-10 h-10 object-contain rounded-xl bg-gray-50 border border-gray-200 p-1 shrink-0 shadow-2xs"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-base font-extrabold text-gray-700 shrink-0">
                      {displaySponsorName.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-xs text-gray-900 truncate leading-snug">
                      {displaySponsorName}
                    </h3>
                  </div>
                </div>

                {currentSponsor.websiteUrl && (
                  <a
                    href={currentSponsor.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 transition-colors shrink-0 flex items-center gap-1 text-[10px] font-bold border border-gray-200"
                  >
                    <span>{t('common.visit')}</span>
                    <ExternalLink className="w-3 h-3 text-gray-600" />
                  </a>
                )}
              </div>

              {displaySponsorDesc && (
                <p className="text-xs text-gray-700 leading-relaxed font-medium bg-gray-50 p-2.5 rounded-xl border border-gray-200/80 whitespace-pre-wrap">
                  {displaySponsorDesc}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
