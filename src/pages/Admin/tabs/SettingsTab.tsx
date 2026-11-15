import React, { useState, useEffect } from 'react';
import {
  getSupabaseYoutubeLiveList,
  upsertSupabaseYoutubeLive,
  isSupabaseConfigured,
  YouTubeLiveItem,
} from '../../../lib/supabase';
import { Youtube, ExternalLink, Database, KeyRound, Save, Check } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { getLocalizedValue } from '../../../utils/bilingual';

interface SettingsTabProps {
  youtubeLiveUrl: string;
  setYoutubeLiveUrl: (url: string) => void;
  isSaving: boolean;
  setIsSaving: (saving: boolean) => void;
  setSaveStatus: (msg: string | null) => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ setSaveStatus }) => {
  const { language, t } = useLanguage();
  const [liveList, setLiveList] = useState<YouTubeLiveItem[]>([]);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savedKey, setSavedKey] = useState<string | null>(null);

  useEffect(() => {
    getSupabaseYoutubeLiveList(true).then((list) => {
      setLiveList(list);
    });
  }, []);

  const handleUrlChange = (sportKey: string, newUrl: string) => {
    setLiveList((prev) =>
      prev.map((item) => (item.sportKey === sportKey ? { ...item, url: newUrl } : item))
    );
  };

  const handleSaveItem = async (item: YouTubeLiveItem) => {
    setSavingKey(item.sportKey);
    const ok = await upsertSupabaseYoutubeLive(item);
    setSavingKey(null);
    if (ok) {
      setSavedKey(item.sportKey);
      setSaveStatus(
        t('admin.settings.itemSaved', { name: getLocalizedValue(item.name, language) })
      );
      setTimeout(() => {
        setSavedKey(null);
        setSaveStatus(null);
      }, 3000);
    } else {
      setSaveStatus(t('admin.settings.itemSaveFail'));
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  const [savingAll, setSavingAll] = useState<boolean>(false);

  const handleSaveAll = async () => {
    setSavingAll(true);
    try {
      let allOk = true;
      for (const item of liveList) {
        const ok = await upsertSupabaseYoutubeLive(item);
        if (!ok) allOk = false;
      }
      setSaveStatus(allOk ? t('admin.settings.allSaved') : t('admin.settings.itemSaveFail'));
    } finally {
      setSavingAll(false);
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-b-xl shadow-2xs space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-extrabold text-base text-gray-900">{t('admin.settings.title')}</h2>
        <button
          onClick={handleSaveAll}
          disabled={savingAll}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{savingAll ? t('admin.saving') : t('admin.settings.saveAll')}</span>
        </button>
      </div>

      {/* Sport-by-Sport YouTube Live Stream Manager */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2 font-extrabold text-sm text-gray-900">
            <Youtube className="w-5 h-5 text-red-600" />
            <span>{t('admin.settings.liveCardTitle')}</span>
          </div>
          <span className="text-[11px] font-bold bg-rose-50 text-rose-700 px-2 py-0.5 rounded border border-rose-200">
            {t('admin.settings.liveSupportBadge')}
          </span>
        </div>

        <p className="text-xs text-gray-600 font-medium leading-relaxed">
          {t('admin.settings.liveDesc')}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
          {liveList.map((item) => (
            <div
              key={item.sportKey}
              className="bg-slate-50/70 border border-gray-200 rounded-xl p-3.5 space-y-2 hover:border-gray-300 transition-all shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-xs text-gray-900">
                  <span className="text-sm">{item.icon}</span>
                  <span>{getLocalizedValue(item.name, language)}</span>
                  {item.sportKey === 'main' && (
                    <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-black">
                      {t('admin.settings.mainBadge')}
                    </span>
                  )}
                </div>

                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-bold text-red-600 hover:text-red-700 flex items-center gap-0.5 bg-white border border-red-200 px-2 py-0.5 rounded transition-colors"
                  >
                    <span>{t('admin.settings.checkLink')}</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={item.url}
                  onChange={(e) => handleUrlChange(item.sportKey, e.target.value)}
                  placeholder={t('admin.settings.urlPlaceholder')}
                  className="flex-1 bg-white border border-gray-300 px-2.5 py-1.5 rounded-lg text-xs font-medium focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                />
                <button
                  onClick={() => handleSaveItem(item)}
                  disabled={savingKey === item.sportKey}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shrink-0 transition-colors shadow-2xs ${
                    savedKey === item.sportKey
                      ? 'bg-emerald-600 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {savedKey === item.sportKey ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>{t('admin.settings.savedBtn')}</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>
                        {savingKey === item.sportKey ? '...' : t('admin.settings.saveBtn')}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Supabase Status Banner */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
        <div className="flex items-center gap-2 font-bold text-sm text-gray-900">
          <Database className="w-4 h-4 text-postech" />
          <span>{t('admin.settings.dbTitle')}</span>
        </div>
        <div className="text-xs text-gray-600 space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-bold">{t('admin.settings.dbStatusLabel')}</span>
            {isSupabaseConfigured() ? (
              <span className="text-emerald-600 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                {t('admin.settings.dbConnected')}
              </span>
            ) : (
              <span className="text-amber-600 font-bold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                {t('admin.settings.dbLocal')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Admin Password Information & Environment Variable Guide */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
          <div className="flex items-center gap-2 font-bold text-sm text-gray-900">
            <KeyRound className="w-4 h-4 text-postech" />
            <span>{t('admin.settings.pwTitle')}</span>
          </div>
          <span className="text-[11px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
            {t('admin.settings.pwBadge')}
          </span>
        </div>

        <p className="text-xs text-gray-600 leading-relaxed">{t('admin.settings.pwDesc')}</p>

        <div className="bg-slate-50 border border-gray-200 rounded-lg p-3 text-xs space-y-1.5 text-gray-600">
          <p className="font-bold text-gray-800">{t('admin.settings.pwHowTo')}</p>
          <ol className="list-decimal list-inside space-y-0.5 text-gray-600 pl-1">
            <li>{t('admin.settings.pwStep1')}</li>
            <li>{t('admin.settings.pwStep2')}</li>
            <li>{t('admin.settings.pwStep3')}</li>
          </ol>
        </div>
      </div>
    </div>
  );
};
