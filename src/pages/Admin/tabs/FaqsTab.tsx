import React, { useState } from 'react';
import { FAQItem } from '../../../types/stadium';
import {
  upsertSupabaseFAQ,
  deleteSupabaseFAQ,
  getSupabaseFAQs,
} from '../../../lib/supabase';
import { LinkifiedText } from '../../../components/LinkifiedText';
import { HelpCircle, Plus } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { BilingualField } from '../components/BilingualField';
import { finalizeBilingualText } from '../../../utils/autoTranslate';
import { getLocalizedValue, localizeFaqCategory } from '../../../utils/bilingual';

interface FaqsTabProps {
  faqs: FAQItem[];
  setFaqs: React.Dispatch<React.SetStateAction<FAQItem[]>>;
  isSaving: boolean;
  setIsSaving: (saving: boolean) => void;
  setSaveStatus: (msg: string | null) => void;
}

export const FaqsTab: React.FC<FaqsTabProps> = ({
  faqs,
  setFaqs,
  isSaving,
  setIsSaving,
  setSaveStatus,
}) => {
  const { language, t } = useLanguage();
  const [editingFaq, setEditingFaq] = useState<Partial<FAQItem>>({
    category: '일반',
    question: '',
    answer: '',
    displayOrder: 0,
  });

  const handleSaveFaq = async () => {
    if (!editingFaq.question || !editingFaq.answer) {
      alert(t('admin.faqs.reqAlert'));
      return;
    }

    setIsSaving(true);
    const [bCategory, bQuestion, bAnswer] = await Promise.all([
      finalizeBilingualText(editingFaq.category || '일반'),
      finalizeBilingualText(editingFaq.question),
      finalizeBilingualText(editingFaq.answer),
    ]);
    const itemToSave: FAQItem = {
      id: editingFaq.id,
      category: bCategory,
      question: bQuestion,
      answer: bAnswer,
      displayOrder: Number(editingFaq.displayOrder || 0),
    };

    const res = await upsertSupabaseFAQ(itemToSave);
    setIsSaving(false);

    if (res.success) {
      setSaveStatus(t('admin.savedSuccess'));
      const updated = await getSupabaseFAQs(true);
      setFaqs(updated);
      setEditingFaq({ category: '일반', question: '', answer: '', displayOrder: 0 });
    } else {
      setSaveStatus(t('admin.saveFailed', { error: res.error || '' }));
    }
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleDeleteFaq = async (id: number) => {
    if (!confirm(t('admin.confirmDelete'))) return;
    setIsSaving(true);
    const res = await deleteSupabaseFAQ(id);
    setIsSaving(false);
    if (res.success) {
      setSaveStatus(t('admin.deletedSuccess'));
      setFaqs((prev) => prev.filter((f) => f.id !== id));
      if (editingFaq.id === id) {
        setEditingFaq({ category: '일반', question: '', answer: '', displayOrder: 0 });
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
          <HelpCircle className="w-5 h-5 text-purple-600" />
          <span>{t('admin.faqs.title')}</span>
        </h2>
        <button
          onClick={() =>
            setEditingFaq({ category: '일반', question: '', answer: '', displayOrder: 0 })
          }
          className="px-3 py-1.5 bg-slate-900 text-white rounded text-xs font-bold flex items-center gap-1 hover:bg-slate-800"
        >
          <Plus className="w-4 h-4" />
          <span>{t('admin.faqs.newBtn')}</span>
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Form Side */}
        <div className="col-span-5 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
          <h3 className="font-extrabold text-xs text-slate-800 border-b border-slate-200 pb-2">
            {editingFaq.id ? t('admin.faqs.formEdit') : t('admin.faqs.formNew')}
          </h3>

          <div className="space-y-3 text-xs">
            <BilingualField
              label={t('admin.faqs.fieldCat')}
              compact
              value={editingFaq.category || ''}
              onChange={(val) => setEditingFaq({ ...editingFaq, category: val })}
              placeholderKo="예: 경기 안내, 관람 안내, 편의시설"
              inputClassName="w-full border border-gray-300 p-2 rounded text-xs font-bold bg-white"
            />

            <BilingualField
              label={t('admin.faqs.fieldQ')}
              required
              value={editingFaq.question || ''}
              onChange={(val) => setEditingFaq({ ...editingFaq, question: val })}
              placeholderKo="자주 묻는 질문 입력"
              inputClassName="w-full border border-gray-300 p-2 rounded text-xs font-bold bg-white"
            />

            <div>
              <BilingualField
                label={t('admin.faqs.fieldA')}
                required
                multiline
                rows={4}
                value={editingFaq.answer || ''}
                onChange={(val) => setEditingFaq({ ...editingFaq, answer: val })}
                placeholderKo="답변 내용을 입력해 주세요 (줄바꿈 및 하이퍼링크 지원)"
                inputClassName="w-full border border-gray-300 p-2 rounded text-xs leading-relaxed font-medium bg-white"
              />
              <p className="text-[10px] text-gray-500 mt-1">{t('admin.linkHint')}</p>
              {editingFaq.answer && (
                <div className="mt-2 p-2.5 bg-white border border-slate-200 rounded text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">
                  <span className="text-[10px] font-bold text-slate-400 block mb-1">
                    {t('admin.faqs.preview')}
                  </span>
                  <LinkifiedText text={getLocalizedValue(editingFaq.answer, language)} />
                </div>
              )}
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">
                {t('admin.faqs.fieldOrder')}
              </label>
              <input
                type="number"
                value={editingFaq.displayOrder || 0}
                onChange={(e) =>
                  setEditingFaq({
                    ...editingFaq,
                    displayOrder: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full border border-gray-300 p-2 rounded text-xs font-bold bg-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              {editingFaq.id && (
                <button
                  onClick={() => handleDeleteFaq(editingFaq.id!)}
                  className="px-3 py-1.5 bg-rose-100 text-rose-700 hover:bg-rose-200 rounded font-bold"
                >
                  {t('admin.delete')}
                </button>
              )}
              <button
                onClick={handleSaveFaq}
                disabled={isSaving}
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded font-bold shadow-2xs disabled:opacity-50"
              >
                {isSaving ? t('admin.saving') : t('admin.save')}
              </button>
            </div>
          </div>
        </div>

        {/* Table Side */}
        <div className="col-span-7 space-y-2">
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200">
                <tr>
                  <th className="p-2.5">{t('admin.faqs.fieldCat')}</th>
                  <th className="p-2.5">{t('admin.faqs.fieldQ')}</th>
                  <th className="p-2.5 text-right">{t('admin.manage')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {faqs.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-slate-400">
                      {t('admin.faqs.empty')}
                    </td>
                  </tr>
                ) : (
                  faqs.map((f) => (
                    <tr key={f.id} className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold text-purple-700">
                        {getLocalizedValue(f.category, language, (s) =>
                          localizeFaqCategory(s, language)
                        )}
                      </td>
                      <td className="p-2.5 font-bold text-slate-900">
                        {getLocalizedValue(f.question, language)}
                      </td>
                      <td className="p-2.5 text-right">
                        <button
                          onClick={() => setEditingFaq(f)}
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
