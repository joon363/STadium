import React, { useState } from 'react';
import { NoticeItem } from '../../../types/stadium';
import {
  upsertSupabaseNotice,
  deleteSupabaseNotice,
  getSupabaseNotices,
} from '../../../lib/supabase';
import { Bell, Plus } from 'lucide-react';

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
  const [editingNotice, setEditingNotice] = useState<Partial<NoticeItem>>({
    title: '',
    content: '',
    isPinned: false,
  });

  const handleSaveNotice = async () => {
    if (!editingNotice.title || !editingNotice.content) {
      alert('공지사항 제목과 내용을 입력해 주세요.');
      return;
    }
    const itemToSave: NoticeItem = {
      id: editingNotice.id,
      title: editingNotice.title,
      content: editingNotice.content,
      isPinned: editingNotice.isPinned ?? false,
    };

    setIsSaving(true);
    const res = await upsertSupabaseNotice(itemToSave);
    setIsSaving(false);

    if (res.success) {
      setSaveStatus(`공지사항 [${itemToSave.title}] 정보가 저장되었습니다.`);
      const updated = await getSupabaseNotices(true);
      setNotices(updated);
      setEditingNotice({ title: '', content: '', isPinned: false });
    } else {
      setSaveStatus(`공지사항 저장 실패: ${res.error}`);
    }
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleDeleteNotice = async (id: number) => {
    if (!confirm('정말 이 공지사항을 삭제하시겠습니까?')) return;
    setIsSaving(true);
    const res = await deleteSupabaseNotice(id);
    setIsSaving(false);
    if (res.success) {
      setSaveStatus('공지사항이 삭제되었습니다.');
      setNotices((prev) => prev.filter((n) => n.id !== id));
      if (editingNotice.id === id) {
        setEditingNotice({ title: '', content: '', isPinned: false });
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
          <Bell className="w-5 h-5 text-rose-600" />
          <span>📢 공지사항 등록 및 관리</span>
        </h2>
        <button
          onClick={() => setEditingNotice({ title: '', content: '', isPinned: false })}
          className="px-3 py-1.5 bg-slate-900 text-white rounded text-xs font-bold flex items-center gap-1 hover:bg-slate-800"
        >
          <Plus className="w-4 h-4" />
          <span>새 공지 작성</span>
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Form Side */}
        <div className="col-span-5 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
          <h3 className="font-extrabold text-xs text-slate-800 border-b border-slate-200 pb-2">
            {editingNotice.id ? '공지사항 수정' : '새 공지사항 작성'}
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-gray-700 block mb-1">공지 제목 *</label>
              <input
                type="text"
                value={editingNotice.title || ''}
                onChange={(e) =>
                  setEditingNotice({ ...editingNotice, title: e.target.value })
                }
                placeholder="공지 제목 입력"
                className="w-full border border-gray-300 p-2 rounded text-xs font-bold"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">공지 내용 *</label>
              <textarea
                rows={6}
                value={editingNotice.content || ''}
                onChange={(e) =>
                  setEditingNotice({ ...editingNotice, content: e.target.value })
                }
                placeholder="상세 공지 내용을 입력하세요 (줄바꿈 지원)"
                className="w-full border border-gray-300 p-2 rounded text-xs leading-relaxed font-medium"
              />
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
                <span>상단 필독(📌) 고정</span>
              </label>

              <div className="flex items-center gap-2">
                {editingNotice.id && (
                  <button
                    onClick={() => handleDeleteNotice(editingNotice.id!)}
                    className="px-3 py-1.5 bg-rose-100 text-rose-700 hover:bg-rose-200 rounded font-bold"
                  >
                    삭제
                  </button>
                )}
                <button
                  onClick={handleSaveNotice}
                  disabled={isSaving}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold shadow-2xs"
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
                  <th className="p-2.5">고정</th>
                  <th className="p-2.5">제목</th>
                  <th className="p-2.5 text-right">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {notices.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-slate-400">
                      등록된 공지사항이 없습니다.
                    </td>
                  </tr>
                ) : (
                  notices.map((n) => (
                    <tr key={n.id} className="hover:bg-slate-50">
                      <td className="p-2.5">
                        {n.isPinned ? (
                          <span className="text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded font-bold text-[10px]">
                            📌 필독
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">-</span>
                        )}
                      </td>
                      <td className="p-2.5 font-bold text-slate-900">{n.title}</td>
                      <td className="p-2.5 text-right">
                        <button
                          onClick={() => setEditingNotice(n)}
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
