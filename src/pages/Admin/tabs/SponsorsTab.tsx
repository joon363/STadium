import React, { useState } from 'react';
import { SponsorItem } from '../../../types/stadium';
import {
  upsertSupabaseSponsor,
  deleteSupabaseSponsor,
  uploadImageToSupabase,
} from '../../../lib/supabase';
import { Building2, Plus, Upload } from 'lucide-react';

interface SponsorsTabProps {
  sponsors: SponsorItem[];
  setSponsors: React.Dispatch<React.SetStateAction<SponsorItem[]>>;
  isSaving: boolean;
  setIsSaving: (saving: boolean) => void;
  setSaveStatus: (msg: string | null) => void;
}

export const SponsorsTab: React.FC<SponsorsTabProps> = ({
  sponsors,
  setSponsors,
  isSaving,
  setIsSaving,
  setSaveStatus,
}) => {
  const [editingSponsor, setEditingSponsor] = useState<Partial<SponsorItem>>({
    id: '',
    name: '',
    tier: 'gold',
    logoUrl: '',
    description: '',
    websiteUrl: '',
    isActive: true,
    displayOrder: 0,
  });

  const handleSaveSponsor = async () => {
    if (!editingSponsor.name) {
      alert('후원 기업명을 입력해 주세요.');
      return;
    }
    const itemToSave: SponsorItem = {
      id: editingSponsor.id || `sp-${Date.now()}`,
      name: editingSponsor.name,
      tier: editingSponsor.tier || 'gold',
      logoUrl: editingSponsor.logoUrl || '',
      description: editingSponsor.description || '',
      websiteUrl: editingSponsor.websiteUrl || '',
      isActive: editingSponsor.isActive ?? true,
      displayOrder: Number(editingSponsor.displayOrder || 0),
    };

    setIsSaving(true);
    const res = await upsertSupabaseSponsor(itemToSave);
    setIsSaving(false);

    if (res.success) {
      setSaveStatus(`후원 기업 [${itemToSave.name}] 정보가 저장되었습니다.`);
      setSponsors((prev) => {
        const idx = prev.findIndex((s) => s.id === itemToSave.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = itemToSave;
          return next;
        }
        return [...prev, itemToSave];
      });
      setEditingSponsor({
        id: '',
        name: '',
        tier: 'gold',
        logoUrl: '',
        description: '',
        websiteUrl: '',
        isActive: true,
        displayOrder: 0,
      });
    } else {
      setSaveStatus(`후원 기업 저장 실패: ${res.error}`);
    }
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleDeleteSponsor = async (id: string) => {
    if (!confirm('정말 이 후원 기업을 삭제하시겠습니까?')) return;
    setIsSaving(true);
    const res = await deleteSupabaseSponsor(id);
    setIsSaving(false);
    if (res.success) {
      setSaveStatus('후원 기업이 삭제되었습니다.');
      setSponsors((prev) => prev.filter((s) => s.id !== id));
      if (editingSponsor.id === id) {
        setEditingSponsor({
          id: '',
          name: '',
          tier: 'gold',
          logoUrl: '',
          description: '',
          websiteUrl: '',
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
            <Building2 className="w-5 h-5 text-blue-500" />
            <span>🏢 후원 기업 관리</span>
          </h2>
          <p className="text-xs text-gray-500 font-medium">
            STadium 행사 후원 기업 및 로고/등급 목록을 추가/편집합니다.
          </p>
        </div>
        <button
          onClick={() =>
            setEditingSponsor({
              id: '',
              name: '',
              tier: 'gold',
              logoUrl: '',
              description: '',
              websiteUrl: '',
              isActive: true,
              displayOrder: sponsors.length + 1,
            })
          }
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>새 후원기업 등록</span>
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Form Side */}
        <div className="col-span-5 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <h3 className="font-extrabold text-sm text-slate-800 border-b border-slate-200 pb-2">
            {editingSponsor.id ? '후원기업 정보 수정' : '새 후원기업 추가'}
          </h3>
          <div className="space-y-2 text-xs">
            <div>
              <label className="font-bold text-gray-700 block mb-1">기업명 *</label>
              <input
                type="text"
                value={editingSponsor.name || ''}
                onChange={(e) =>
                  setEditingSponsor({ ...editingSponsor, name: e.target.value })
                }
                placeholder="예: 포스코 (POSCO)"
                className="w-full border border-gray-300 p-2 rounded text-xs font-bold"
              />
            </div>
            <div>
              <label className="font-bold text-gray-700 block mb-1">후원 등급</label>
              <select
                value={editingSponsor.tier || 'gold'}
                onChange={(e) =>
                  setEditingSponsor({ ...editingSponsor, tier: e.target.value })
                }
                className="w-full border border-gray-300 p-2 rounded text-xs font-bold"
              >
                <option value="main">👑 메인 후원사 (Main)</option>
                <option value="platinum">💎 플래티넘 (Platinum)</option>
                <option value="gold">🥇 골드 (Gold)</option>
                <option value="silver">🥈 실버 (Silver)</option>
                <option value="bronze">🥉 브론즈 (Bronze)</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-gray-700 block mb-1">
                로고 이미지 (Supabase Storage)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editingSponsor.logoUrl || ''}
                  onChange={(e) =>
                    setEditingSponsor({ ...editingSponsor, logoUrl: e.target.value })
                  }
                  placeholder="https://example.com/logo.png"
                  className="flex-1 border border-gray-300 p-2 rounded text-xs"
                />
                <label className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0">
                  <Upload className="w-3.5 h-3.5" />
                  <span>업로드</span>
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
                        setEditingSponsor((prev) => ({ ...prev, logoUrl: res.url }));
                        setSaveStatus('로고 이미지가 Supabase Storage에 업로드되었습니다!');
                        setTimeout(() => setSaveStatus(null), 3000);
                      } else {
                        alert(`업로드 실패: ${res.error || '버킷 설정을 확인해주세요.'}`);
                      }
                    }}
                  />
                </label>
              </div>
            </div>
            <div>
              <label className="font-bold text-gray-700 block mb-1">공식 웹사이트 URL</label>
              <input
                type="text"
                value={editingSponsor.websiteUrl || ''}
                onChange={(e) =>
                  setEditingSponsor({ ...editingSponsor, websiteUrl: e.target.value })
                }
                placeholder="https://posco.com"
                className="w-full border border-gray-300 p-2 rounded text-xs"
              />
            </div>
            <div>
              <label className="font-bold text-gray-700 block mb-1">기업/후원 소개</label>
              <textarea
                rows={3}
                value={editingSponsor.description || ''}
                onChange={(e) =>
                  setEditingSponsor({ ...editingSponsor, description: e.target.value })
                }
                placeholder="후원 기업 간단 소개 및 응원 메시지"
                className="w-full border border-gray-300 p-2 rounded text-xs"
              />
            </div>
            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-700">
                <input
                  type="checkbox"
                  checked={editingSponsor.isActive ?? true}
                  onChange={(e) =>
                    setEditingSponsor({ ...editingSponsor, isActive: e.target.checked })
                  }
                />
                <span>공개 표시 여부</span>
              </label>
              <div className="flex items-center gap-2">
                {editingSponsor.id && (
                  <button
                    onClick={() => handleDeleteSponsor(editingSponsor.id!)}
                    className="px-3 py-1.5 bg-rose-100 text-rose-700 hover:bg-rose-200 rounded font-bold"
                  >
                    삭제
                  </button>
                )}
                <button
                  onClick={handleSaveSponsor}
                  disabled={isSaving}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold shadow-2xs"
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
                  <th className="p-2.5">기업명</th>
                  <th className="p-2.5">후원 등급</th>
                  <th className="p-2.5">상태</th>
                  <th className="p-2.5 text-right">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {sponsors.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-400">
                      등록된 후원 기업이 없습니다.
                    </td>
                  </tr>
                ) : (
                  sponsors.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold text-slate-900">{s.name}</td>
                      <td className="p-2.5 font-bold text-amber-600 uppercase text-[11px]">
                        {s.tier}
                      </td>
                      <td className="p-2.5">
                        {s.isActive ? (
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
                          onClick={() => setEditingSponsor(s)}
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
