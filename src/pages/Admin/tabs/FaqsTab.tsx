import React, { useState } from 'react';
import { FAQItem } from '../../../types/stadium';
import {
  upsertSupabaseFAQ,
  deleteSupabaseFAQ,
  getSupabaseFAQs,
} from '../../../lib/supabase';
import { HelpCircle, Plus } from 'lucide-react';

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
  const [editingFaq, setEditingFaq] = useState<Partial<FAQItem>>({
    category: '일반',
    question: '',
    answer: '',
    displayOrder: 0,
  });

  const handleSaveFaq = async () => {
    if (!editingFaq.question || !editingFaq.answer) {
      alert('FAQ 질문과 답변을 입력해 주세요.');
      return;
    }
    const itemToSave: FAQItem = {
      id: editingFaq.id,
      category: editingFaq.category || '일반',
      question: editingFaq.question,
      answer: editingFaq.answer,
      displayOrder: Number(editingFaq.displayOrder || 0),
    };

    setIsSaving(true);
    const res = await upsertSupabaseFAQ(itemToSave);
    setIsSaving(false);

    if (res.success) {
      setSaveStatus(`FAQ [${itemToSave.question}] 정보가 저장되었습니다.`);
      const updated = await getSupabaseFAQs(true);
      setFaqs(updated);
      setEditingFaq({ category: '일반', question: '', answer: '', displayOrder: 0 });
    } else {
      setSaveStatus(`FAQ 저장 실패: ${res.error}`);
    }
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleDeleteFaq = async (id: number) => {
    if (!confirm('정말 이 FAQ를 삭제하시겠습니까?')) return;
    setIsSaving(true);
    const res = await deleteSupabaseFAQ(id);
    setIsSaving(false);
    if (res.success) {
      setSaveStatus('FAQ가 삭제되었습니다.');
      setFaqs((prev) => prev.filter((f) => f.id !== id));
      if (editingFaq.id === id) {
        setEditingFaq({ category: '일반', question: '', answer: '', displayOrder: 0 });
      }
    } else {
      setSaveStatus(`삭제 실패: ${res.error}`);
    }
    setTimeout(() => setSaveStatus(null), 3000);
  };

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-b-xl shadow-2xs space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-extrabold text-base text-gray-900 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-purple-600" />
          <span>❓ FAQ 자주 묻는 질문 관리</span>
        </h2>
        <button
          onClick={() =>
            setEditingFaq({ category: '일반', question: '', answer: '', displayOrder: 0 })
          }
          className="px-3 py-1.5 bg-slate-900 text-white rounded text-xs font-bold flex items-center gap-1 hover:bg-slate-800"
        >
          <Plus className="w-4 h-4" />
          <span>새 FAQ 추가</span>
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Form Side */}
        <div className="col-span-5 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
          <h3 className="font-extrabold text-xs text-slate-800 border-b border-slate-200 pb-2">
            {editingFaq.id ? 'FAQ 수정' : '새 FAQ 추가'}
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-gray-700 block mb-1">카테고리</label>
              <input
                type="text"
                value={editingFaq.category || ''}
                onChange={(e) => setEditingFaq({ ...editingFaq, category: e.target.value })}
                placeholder="예: 경기 안내, 관람 안내, 편의시설"
                className="w-full border border-gray-300 p-2 rounded text-xs font-bold"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">질문 (Question) *</label>
              <input
                type="text"
                value={editingFaq.question || ''}
                onChange={(e) => setEditingFaq({ ...editingFaq, question: e.target.value })}
                placeholder="자주 묻는 질문 입력"
                className="w-full border border-gray-300 p-2 rounded text-xs font-bold"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">답변 (Answer) *</label>
              <textarea
                rows={5}
                value={editingFaq.answer || ''}
                onChange={(e) => setEditingFaq({ ...editingFaq, answer: e.target.value })}
                placeholder="답변 내용을 입력해 주세요"
                className="w-full border border-gray-300 p-2 rounded text-xs leading-relaxed font-medium"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">
                정렬 순서 (낮을수록 먼저 노출)
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
                className="w-full border border-gray-300 p-2 rounded text-xs font-bold"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              {editingFaq.id && (
                <button
                  onClick={() => handleDeleteFaq(editingFaq.id!)}
                  className="px-3 py-1.5 bg-rose-100 text-rose-700 hover:bg-rose-200 rounded font-bold"
                >
                  삭제
                </button>
              )}
              <button
                onClick={handleSaveFaq}
                disabled={isSaving}
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded font-bold shadow-2xs"
              >
                저장하기
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
                  <th className="p-2.5">카테고리</th>
                  <th className="p-2.5">질문</th>
                  <th className="p-2.5 text-right">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {faqs.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-slate-400">
                      등록된 FAQ가 없습니다.
                    </td>
                  </tr>
                ) : (
                  faqs.map((f) => (
                    <tr key={f.id} className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold text-purple-700">{f.category}</td>
                      <td className="p-2.5 font-bold text-slate-900">{f.question}</td>
                      <td className="p-2.5 text-right">
                        <button
                          onClick={() => setEditingFaq(f)}
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
