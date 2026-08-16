import React, { useState, useEffect } from 'react';
import {
  ContactItem,
  ContactLinkItem,
  getSupabaseContacts,
  upsertSupabaseContact,
  deleteSupabaseContact,
  getSupabaseContactLinks,
  upsertSupabaseContactLink,
} from '../../../lib/supabase';
import {
  Phone,
  ShieldAlert,
  UserCheck,
  Globe,
  Plus,
  Trash2,
  Save,
  MessageCircle,
  Instagram,
  Youtube,
  RefreshCw,
} from 'lucide-react';

interface ContactTabProps {
  setSaveStatus: (msg: string | null) => void;
}

export const ContactTab: React.FC<ContactTabProps> = ({ setSaveStatus }) => {
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [links, setLinks] = useState<ContactLinkItem[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadData = async (force = false) => {
    setIsLoading(true);
    const [fetchedContacts, fetchedLinks] = await Promise.all([
      getSupabaseContacts(force),
      getSupabaseContactLinks(force),
    ]);
    setContacts(fetchedContacts);
    setLinks(fetchedLinks);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData(true);
  }, []);

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      // 1. Save all links
      await Promise.all(links.map((link) => upsertSupabaseContactLink(link)));

      // 2. Save all contacts
      await Promise.all(
        contacts.map((contact, idx) =>
          upsertSupabaseContact({
            ...contact,
            displayOrder: idx + 1,
          })
        )
      );

      setSaveStatus('비상연락망 및 소셜 링크가 정규화 DB에 성공적으로 저장되었습니다.');
      await loadData(true);
    } catch (err) {
      console.error('Save error:', err);
      setSaveStatus('저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  // Link Handlers
  const handleLinkChange = (id: string, url: string) => {
    setLinks((prev) =>
      prev.map((l) => (l.id === id ? { ...l, url } : l))
    );
  };

  // Contact Handlers
  const handleAddContact = (category: 'general' | 'dept') => {
    const newContact: ContactItem = {
      category,
      role: category === 'general' ? '담당자' : 'TF 담당',
      name: '',
      phone: '010-',
      dept: category === 'general' ? '총괄' : '운영',
      displayOrder: contacts.filter((c) => c.category === category).length + 1,
    };
    setContacts((prev) => [...prev, newContact]);
  };

  const handleUpdateContact = (index: number, field: keyof ContactItem, value: string | number) => {
    setContacts((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleDeleteContact = async (index: number) => {
    const target = contacts[index];
    if (target.id) {
      setIsSaving(true);
      await deleteSupabaseContact(target.id);
      setIsSaving(false);
    }
    setContacts((prev) => prev.filter((_, i) => i !== index));
  };

  const generalContacts = contacts
    .map((c, originalIndex) => ({ ...c, originalIndex }))
    .filter((c) => c.category === 'general');

  const deptContacts = contacts
    .map((c, originalIndex) => ({ ...c, originalIndex }))
    .filter((c) => c.category === 'dept');

  const kakaoUrl = links.find((l) => l.id === 'kakao')?.url || '';
  const instaUrl = links.find((l) => l.id === 'instagram')?.url || '';
  const ytUrl = links.find((l) => l.id === 'youtube')?.url || '';

  if (isLoading) {
    return (
      <div className="p-8 text-center text-xs text-gray-500 font-bold flex items-center justify-center gap-2">
        <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
        <span>정규화된 비상연락망 정보를 불러오는 중...</span>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-b-xl shadow-2xs space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-extrabold text-base text-gray-900 flex items-center gap-2">
            <Phone className="w-5 h-5 text-emerald-600" />
            <span>비상연락망 & 소셜 링크 관리 (정규화 RDBMS)</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Supabase contacts & contact_links 테이블과 1:1 정규화 연동됩니다.
          </p>
        </div>

        <button
          onClick={handleSaveAll}
          disabled={isSaving}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs disabled:opacity-50"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{isSaving ? '저장 중...' : '전체 저장'}</span>
        </button>
      </div>

      {/* 1. Official Links */}
      <div className="bg-slate-50/70 border border-gray-200 rounded-xl p-4 space-y-3 shadow-2xs">
        <div className="flex items-center gap-2 font-bold text-xs text-gray-900 border-b border-gray-200 pb-2">
          <Globe className="w-4 h-4 text-indigo-600" />
          <span>공식 소셜 & 문의 링크 (contact_links)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-[11px] font-bold text-gray-700 flex items-center gap-1 mb-1">
              <MessageCircle className="w-3.5 h-3.5 text-amber-500" />
              <span>카카오톡 오픈채팅 URL</span>
            </label>
            <input
              type="url"
              value={kakaoUrl}
              onChange={(e) => handleLinkChange('kakao', e.target.value)}
              placeholder="https://open.kakao.com/o/..."
              className="w-full bg-white border border-gray-300 px-3 py-1.5 rounded-lg text-xs font-medium focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-700 flex items-center gap-1 mb-1">
              <Instagram className="w-3.5 h-3.5 text-rose-500" />
              <span>공식 인스타그램 URL</span>
            </label>
            <input
              type="url"
              value={instaUrl}
              onChange={(e) => handleLinkChange('instagram', e.target.value)}
              placeholder="https://instagram.com/..."
              className="w-full bg-white border border-gray-300 px-3 py-1.5 rounded-lg text-xs font-medium focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-700 flex items-center gap-1 mb-1">
              <Youtube className="w-3.5 h-3.5 text-red-600" />
              <span>공식 유튜브 URL</span>
            </label>
            <input
              type="url"
              value={ytUrl}
              onChange={(e) => handleLinkChange('youtube', e.target.value)}
              placeholder="https://youtube.com/@..."
              className="w-full bg-white border border-gray-300 px-3 py-1.5 rounded-lg text-xs font-medium focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* 2. General Leaders (총괄 담당자 - contacts WHERE category = 'general') */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
          <div className="flex items-center gap-2 font-bold text-xs text-gray-900">
            <ShieldAlert className="w-4 h-4 text-postech" />
            <span>총괄 담당자 목록 (category: general)</span>
          </div>

          <button
            onClick={() => handleAddContact('general')}
            className="flex items-center gap-1 px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-[11px] font-bold transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-postech" />
            <span>총괄 담당자 추가</span>
          </button>
        </div>

        <div className="space-y-2">
          {generalContacts.map((leader) => (
            <div
              key={leader.originalIndex}
              className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-lg border border-gray-200 items-center"
            >
              <div>
                <span className="text-[10px] text-gray-400 font-bold block mb-0.5">직책 / 역할</span>
                <input
                  type="text"
                  value={leader.role}
                  onChange={(e) => handleUpdateContact(leader.originalIndex, 'role', e.target.value)}
                  placeholder="예: 중앙집행위원장"
                  className="w-full bg-white border border-gray-300 px-2 py-1 rounded text-xs font-bold"
                />
              </div>

              <div>
                <span className="text-[10px] text-gray-400 font-bold block mb-0.5">성명</span>
                <input
                  type="text"
                  value={leader.name}
                  onChange={(e) => handleUpdateContact(leader.originalIndex, 'name', e.target.value)}
                  placeholder="이름"
                  className="w-full bg-white border border-gray-300 px-2 py-1 rounded text-xs font-medium"
                />
              </div>

              <div>
                <span className="text-[10px] text-gray-400 font-bold block mb-0.5">전화번호</span>
                <input
                  type="text"
                  value={leader.phone}
                  onChange={(e) => handleUpdateContact(leader.originalIndex, 'phone', e.target.value)}
                  placeholder="010-0000-0000"
                  className="w-full bg-white border border-gray-300 px-2 py-1 rounded text-xs font-medium"
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <span className="text-[10px] text-gray-400 font-bold block mb-0.5">소속 부서</span>
                  <input
                    type="text"
                    value={leader.dept}
                    onChange={(e) => handleUpdateContact(leader.originalIndex, 'dept', e.target.value)}
                    placeholder="예: 총괄"
                    className="w-full bg-white border border-gray-300 px-2 py-1 rounded text-xs font-medium"
                  />
                </div>
                <button
                  onClick={() => handleDeleteContact(leader.originalIndex)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors mt-3"
                  title="삭제"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Department Leads (부서별 담당자 - contacts WHERE category = 'dept') */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
          <div className="flex items-center gap-2 font-bold text-xs text-gray-900">
            <UserCheck className="w-4 h-4 text-blue-600" />
            <span>부서별 담당자 목록 (category: dept)</span>
          </div>

          <button
            onClick={() => handleAddContact('dept')}
            className="flex items-center gap-1 px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-[11px] font-bold transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-blue-600" />
            <span>부서 담당자 추가</span>
          </button>
        </div>

        <div className="space-y-2">
          {deptContacts.map((item) => (
            <div
              key={item.originalIndex}
              className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-lg border border-gray-200 items-center"
            >
              <div>
                <span className="text-[10px] text-gray-400 font-bold block mb-0.5">TF / 역할</span>
                <input
                  type="text"
                  value={item.role}
                  onChange={(e) => handleUpdateContact(item.originalIndex, 'role', e.target.value)}
                  placeholder="예: 경기운영 TF"
                  className="w-full bg-white border border-gray-300 px-2 py-1 rounded text-xs font-bold"
                />
              </div>

              <div>
                <span className="text-[10px] text-gray-400 font-bold block mb-0.5">성명</span>
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => handleUpdateContact(item.originalIndex, 'name', e.target.value)}
                  placeholder="이름"
                  className="w-full bg-white border border-gray-300 px-2 py-1 rounded text-xs font-medium"
                />
              </div>

              <div>
                <span className="text-[10px] text-gray-400 font-bold block mb-0.5">전화번호</span>
                <input
                  type="text"
                  value={item.phone}
                  onChange={(e) => handleUpdateContact(item.originalIndex, 'phone', e.target.value)}
                  placeholder="010-0000-0000"
                  className="w-full bg-white border border-gray-300 px-2 py-1 rounded text-xs font-medium"
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <span className="text-[10px] text-gray-400 font-bold block mb-0.5">부서 구분</span>
                  <input
                    type="text"
                    value={item.dept}
                    onChange={(e) => handleUpdateContact(item.originalIndex, 'dept', e.target.value)}
                    placeholder="예: 운영기획"
                    className="w-full bg-white border border-gray-300 px-2 py-1 rounded text-xs font-medium"
                  />
                </div>
                <button
                  onClick={() => handleDeleteContact(item.originalIndex)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors mt-3"
                  title="삭제"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
