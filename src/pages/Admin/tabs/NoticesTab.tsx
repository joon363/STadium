import React, { useState } from 'react';
import { NoticeItem } from '../../../types/stadium';
import {
  upsertSupabaseNotice,
  deleteSupabaseNotice,
  getSupabaseNotices,
} from '../../../lib/supabase';
import { LinkifiedText } from '../../../components/LinkifiedText';
import { Bell, Plus } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { BilingualField } from '../components/BilingualField';
import { finalizeBilingualText } from '../../../utils/autoTranslate';
import { getLocalizedValue } from '../../../utils/bilingual';

interface NoticesTabProps {
  notices: NoticeItem[];
  setNotices: React.Dispatch<React.SetStateAction<NoticeItem[]>>;
  isSaving: boolean;
  setIsSaving: (saving: boolean) => void;
  setSaveStatus: (msg: string | null) => void;
}

export const NoticesTab: React.FC<NoticesTabProps> = ({
  notices,
  setNotices,
  isSaving,
  setIsSaving,
  setSaveStatus,
}) => {
  const { language, t } = useLanguage();
  const [editingNotice, setEditingNotice] = useState<Partial<NoticeItem>>({
    title: '',
    content: '',
    isPinned: false,
  });

  const handleSaveNotice = async () => {
    if (!editingNotice.title || !editingNotice.content) {
      alert(t('admin.notices.reqAlert'));
      return;
    }

    setIsSaving(true);
    const [bilingualTitle, bilingualContent] = await Promise.all([
      finalizeBilingualText(editingNotice.title),
      finalizeBilingualText(editingNotice.content),
    ]);
    const itemToSave: NoticeItem = {
      id: editingNotice.id,
      title: bilingualTitle,
      content: bilingualContent,
      isPinned: editingNotice.isPinned ?? false,
    };

    const res = await upsertSupabaseNotice(itemToSave);
    setIsSaving(false);

    if (res.success) {
      setSaveStatus(t('admin.savedSuccess'));
      const updated = await getSupabaseNotices(true);
      setNotices(updated);
      setEditingNotice({ title: '', content: '', isPinned: false });
    } else {
      setSaveStatus(t('admin.saveFailed', { error: res.error || '' }));
    }
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleDeleteNotice = async (id: number) => {
    if (!confirm(t('admin.confirmDelete'))) return;
    setIsSaving(true);
    const res = await deleteSupabaseNotice(id);
    setIsSaving(false);
    if (res.success) {
      setSaveStatus(t('admin.deletedSuccess'));
      setNotices((prev) => prev.filter((n) => n.id !== id));
      if (editingNotice.id === id) {
        setEditingNotice({ title: '', content: '', isPinned: false });
      }
    } else {
      setSaveStatus(t('admin.deleteFailed', { error: res.error || '' }));
    }
    setTimeout(() => setSaveStatus(null), 3000);
  };

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-b-xl shadow-2xs space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-extrabold text-base text-gray-900 flex items-center gap-2">
          <Bell className="w-5 h-5 text-rose-600" />
          <span>{t('admin.notices.title')}</span>
        </h2>
        <button
          onClick={() => setEditingNotice({ title: '', content: '', isPinned: false })}
          className="px-3 py-1.5 bg-slate-900 text-white rounded text-xs font-bold flex items-center gap-1 hover:bg-slate-800"
        >
          <Plus className="w-4 h-4" />
          <span>{t('admin.notices.newBtn')}</span>
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Form Side */}
        <div className="col-span-5 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
          <h3 className="font-extrabold text-xs text-slate-800 border-b border-slate-200 pb-2">
            {editingNotice.id ? t('admin.notices.formEdit') : t('admin.notices.formNew')}
          </h3>

          <div className="space-y-3 text-xs">
            <BilingualField
              label={t('admin.notices.fieldTitle')}
              required
              value={editingNotice.title || ''}
              onChange={(val) => setEditingNotice({ ...editingNotice, title: val })}
              placeholderKo="공지 제목 입력"
              inputClassName="w-full border border-gray-300 p-2 rounded text-xs font-bold bg-white"
            />

            <div>
              <BilingualField
                label={t('admin.notices.fieldContent')}
                required
                multiline
                rows={4}
                value={editingNotice.content || ''}
                onChange={(val) => setEditingNotice({ ...editingNotice, content: val })}
                placeholderKo="상세 공지 내용을 입력하세요 (줄바꿈 및 하이퍼링크 지원)"
                inputClassName="w-full border border-gray-300 p-2 rounded text-xs leading-relaxed font-medium bg-white"
              />
              <p className="text-[10px] text-gray-500 mt-1">{t('admin.linkHint')}</p>
              {editingNotice.content && (
                <div className="mt-2 p-2.5 bg-white border border-slate-200 rounded text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">
                  <span className="text-[10px] font-bold text-slate-400 block mb-1">
                    {t('admin.notices.preview')}
                  </span>
                  <LinkifiedText text={getLocalizedValue(editingNotice.content, language)} />
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-700">
                <input
                  type="checkbox"
                  checked={editingNotice.isPinned ?? false}
                  onChange={(e) =>
                    setEditingNotice({ ...editingNotice, isPinned: e.target.checked })
                  }
                />
                <span>{t('admin.notices.pinLabel')}</span>
              </label>

              <div className="flex items-center gap-2">
                {editingNotice.id && (
                  <button
                    onClick={() => handleDeleteNotice(editingNotice.id!)}
                    className="px-3 py-1.5 bg-rose-100 text-rose-700 hover:bg-rose-200 rounded font-bold"
                  >
                    {t('admin.delete')}
                  </button>
                )}
                <button
                  onClick={handleSaveNotice}
                  disabled={isSaving}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold shadow-2xs disabled:opacity-50"
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
                  <th className="p-2.5">{t('admin.notices.colPin')}</th>
                  <th className="p-2.5">{t('admin.notices.colTitle')}</th>
                  <th className="p-2.5 text-right">{t('admin.manage')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {notices.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-slate-400">
                      {t('admin.notices.empty')}
                    </td>
                  </tr>
                ) : (
                  notices.map((n) => (
                    <tr key={n.id} className="hover:bg-slate-50">
                      <td className="p-2.5">
                        {n.isPinned ? (
                          <span className="text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded font-bold text-[10px]">
                            📌 {t('contact.pinned')}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">-</span>
                        )}
                      </td>
                      <td className="p-2.5 font-bold text-slate-900">
                        {getLocalizedValue(n.title, language)}
                      </td>
                      <td className="p-2.5 text-right">
                        <button
                          onClick={() => setEditingNotice(n)}
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
