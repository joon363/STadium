import React, { useState, useEffect } from 'react';
import { StageItem, SCHOOLS } from '../../../types/stadium';
import {
  saveAllSupabaseStagePerformances,
  getSupabaseStageDelay,
  updateSupabaseStageDelay,
} from '../../../lib/supabase';
import { Clock, Plus, Trash2, RotateCcw, Save } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { BilingualField } from '../components/BilingualField';
import { finalizeBilingualText } from '../../../utils/autoTranslate';
import {
  encodeBilingual,
  getLocalizedValue,
  localizeStageCategory,
  parseBilingual,
} from '../../../utils/bilingual';

const STAGE_CATEGORIES = ['밴드', '어쿠스틱', '보컬', '댄스', '힙합', '응원단', '마술'] as const;

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
  const { language, t } = useLanguage();
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
          ? t('admin.stage.delaySavedZero')
          : t('admin.stage.delaySavedVal', {
              val: delayMinutes > 0 ? `+${delayMinutes}` : String(delayMinutes),
            })
      );
    } else {
      setSaveStatus(t('admin.stage.delaySaveFail'));
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
    const defaultCatKo = parseBilingual(lastItem?.category).ko || '밴드';

    const newItem: StageItem = {
      school: lastItem ? lastItem.school : 'POSTECH',
      clubName: '',
      category: encodeBilingual(defaultCatKo, localizeStageCategory(defaultCatKo, 'en')),
      genre: '',
      songTitle: '',
      startHour: newStartH,
      startMinute: newStartM,
      endHour: newEndH,
      endMinute: newEndM,
    };

    setStageItems((prev) => [...prev, newItem]);
    setSaveStatus(t('admin.stage.addedRow'));
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleSaveAllStages = async () => {
    setIsSaving(true);
    try {
      const bilingualItems = await Promise.all(
        stageItems.map(async (item) => {
          const catKo = parseBilingual(item.category).ko || '밴드';
          const catEn = parseBilingual(item.category).en || localizeStageCategory(catKo, 'en');
          const [clubName, genre, songTitle] = await Promise.all([
            finalizeBilingualText(item.clubName),
            finalizeBilingualText(item.genre || ''),
            finalizeBilingualText(item.songTitle || ''),
          ]);
          return {
            ...item,
            clubName,
            category: encodeBilingual(catKo, catEn),
            genre,
            songTitle,
          };
        })
      );
      setStageItems(bilingualItems);
      const ok = await saveAllSupabaseStagePerformances(bilingualItems);
      if (ok) {
        setSaveStatus(t('admin.stage.savedAll', { count: bilingualItems.length }));
      } else {
        setSaveStatus(t('admin.stage.saveAllFail'));
      }
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  const handleDeleteStage = (index: number) => {
    const target = stageItems[index];
    const clubLabel =
      getLocalizedValue(target.clubName, language) ||
      getLocalizedValue(target.category, language, (ko) => localizeStageCategory(ko, language));
    const confirmed = window.confirm(
      t('admin.stage.confirmDelete', {
        school: target.school,
        club: clubLabel,
      })
    );
    if (!confirmed) return;

    setStageItems((prev) => prev.filter((_, i) => i !== index));
    setSaveStatus(t('admin.stage.deletedRow'));
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
              <span>{t('admin.stage.delayTitle')}</span>
              {delayMinutes !== 0 && (
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    delayMinutes > 0
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {delayMinutes > 0
                    ? t('admin.stage.delayPlus', { min: delayMinutes })
                    : t('admin.stage.delayMinus', { min: delayMinutes })}
                </span>
              )}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">{t('admin.stage.delayDesc')}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <div className="flex items-center gap-1 bg-white border border-gray-300 rounded-lg p-1">
            <button
              onClick={() => setDelayMinutes((prev) => prev - 5)}
              className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs font-bold text-gray-700"
              title="-5"
            >
              -5
            </button>
            <button
              onClick={() => setDelayMinutes((prev) => prev - 1)}
              className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs font-bold text-gray-700"
              title="-1"
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
              <span className="text-xs text-gray-500 font-bold">{t('admin.stage.minUnit')}</span>
            </div>
            <button
              onClick={() => setDelayMinutes((prev) => prev + 1)}
              className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs font-bold text-gray-700"
              title="+1"
            >
              +1
            </button>
            <button
              onClick={() => setDelayMinutes((prev) => prev + 5)}
              className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs font-bold text-gray-700"
              title="+5"
            >
              +5
            </button>
            {delayMinutes !== 0 && (
              <button
                onClick={() => setDelayMinutes(0)}
                className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-700"
                title={t('admin.stage.delayResetTitle')}
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
            <span>{isSavingDelay ? t('admin.saving') : t('admin.stage.delaySave')}</span>
          </button>
        </div>
      </div>

      {/* 2. Stage Performances Table Section Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h2 className="font-extrabold text-base text-gray-900">{t('admin.stage.tableTitle')}</h2>
          <p className="text-[11px] text-indigo-600 font-semibold mt-0.5">
            {t('admin.autoTranslateNotice')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-bold hidden sm:inline mr-1">
            {t('admin.stage.count', { count: stageItems.length })}
          </span>
          <button
            onClick={handleAddNewStage}
            className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 rounded-lg text-xs font-bold shadow-2xs transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 text-gray-600" />
            <span>{t('admin.stage.addNew')}</span>
          </button>
          <button
            onClick={handleSaveAllStages}
            disabled={isSaving}
            className="flex items-center gap-1 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-xs transition-all active:scale-95 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? t('admin.stage.savingAll') : t('admin.stage.saveAll')}</span>
          </button>
        </div>
      </div>

      {/* 3. Stage Performances Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-100 font-bold text-gray-700 border-b border-gray-200">
            <tr>
              <th className="p-3">{t('admin.stage.colSchool')}</th>
              <th className="p-3 min-w-[230px]">{t('admin.stage.colClub')}</th>
              <th className="p-3">{t('admin.stage.colCat')}</th>
              <th className="p-3 min-w-[200px]">{t('admin.stage.colGenre')}</th>
              <th className="p-3">{t('admin.stage.colTime')}</th>
              <th className="p-3 min-w-[280px]">{t('admin.stage.colSong')}</th>
              <th className="p-3 text-center w-16">{t('admin.stage.colDelete')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 font-medium">
            {stageItems.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-xs text-gray-400 font-bold">
                  {t('admin.stage.empty')}
                </td>
              </tr>
            ) : (
              stageItems.map((item, idx) => {
                const catKo = parseBilingual(item.category).ko || '밴드';
                return (
                  <tr key={idx} className="hover:bg-gray-50/80 align-top">
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

                    <td className="p-2.5">
                      <BilingualField
                        compact
                        value={item.clubName}
                        onChange={(val) => handleStageChange(idx, 'clubName', val)}
                        placeholderKo={t('admin.stage.phClubKo')}
                        inputClassName="w-full bg-white border border-gray-300 rounded px-2 py-1 text-xs font-bold"
                      />
                    </td>

                    <td className="p-3">
                      <select
                        value={catKo}
                        onChange={(e) =>
                          handleStageChange(
                            idx,
                            'category',
                            encodeBilingual(
                              e.target.value,
                              localizeStageCategory(e.target.value, 'en')
                            )
                          )
                        }
                        className="bg-white border border-gray-300 rounded px-2 py-1 text-xs font-bold text-purple-700"
                      >
                        {STAGE_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {localizeStageCategory(cat, language)}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="p-2.5">
                      <BilingualField
                        compact
                        value={item.genre || ''}
                        onChange={(val) => handleStageChange(idx, 'genre', val)}
                        placeholderKo={t('admin.stage.phGenreKo')}
                        inputClassName="w-full bg-white border border-gray-300 rounded px-2 py-1 text-xs"
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
                          className="bg-white border border-gray-300 rounded px-1 py-1 text-xs w-12 text-center font-bold"
                        />
                        <span className="font-bold text-gray-400">:</span>
                        <input
                          type="number"
                          value={item.startMinute}
                          onChange={(e) =>
                            handleStageChange(idx, 'startMinute', parseInt(e.target.value) || 0)
                          }
                          className="bg-white border border-gray-300 rounded px-1 py-1 text-xs w-12 text-center font-bold"
                        />
                        <span className="font-bold text-gray-400">~</span>
                        <input
                          type="number"
                          value={item.endHour}
                          onChange={(e) =>
                            handleStageChange(idx, 'endHour', parseInt(e.target.value) || 0)
                          }
                          className="bg-white border border-gray-300 rounded px-1 py-1 text-xs w-12 text-center font-bold"
                        />
                        <span className="font-bold text-gray-400">:</span>
                        <input
                          type="number"
                          value={item.endMinute}
                          onChange={(e) =>
                            handleStageChange(idx, 'endMinute', parseInt(e.target.value) || 0)
                          }
                          className="bg-white border border-gray-300 rounded px-1 py-1 text-xs w-12 text-center font-bold"
                        />
                      </div>
                    </td>

                    <td className="p-2.5">
                      <BilingualField
                        compact
                        multiline
                        rows={2}
                        value={item.songTitle || ''}
                        onChange={(val) => handleStageChange(idx, 'songTitle', val)}
                        placeholderKo={t('admin.stage.phSongKo')}
                        inputClassName="w-full bg-white border border-gray-300 rounded px-2 py-1 text-xs font-medium leading-normal resize-y"
                      />
                    </td>

                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleDeleteStage(idx)}
                        className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                        title={t('admin.stage.deleteTitle')}
                      >
                        <Trash2 className="w-4 h-4 mx-auto" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 4. Bottom Action Bar */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <span className="text-xs text-gray-400 font-bold">
          {t('admin.stage.countRegistered', { count: stageItems.length })}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleAddNewStage}
            className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 rounded-lg text-xs font-bold shadow-2xs transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 text-gray-600" />
            <span>{t('admin.stage.addNew')}</span>
          </button>
          <button
            onClick={handleSaveAllStages}
            disabled={isSaving}
            className="flex items-center gap-1 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-xs transition-all active:scale-95 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? t('admin.stage.savingAll') : t('admin.stage.saveAll')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

