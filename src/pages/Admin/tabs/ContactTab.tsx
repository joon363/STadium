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
import { useLanguage } from '../../../context/LanguageContext';
import { BilingualField } from '../components/BilingualField';
import { finalizeBilingualText } from '../../../utils/autoTranslate';

interface ContactTabProps {
  setSaveStatus: (msg: string | null) => void;
}

export const ContactTab: React.FC<ContactTabProps> = ({ setSaveStatus }) => {
  const { t } = useLanguage();
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

      // 2. Auto-translate & save all contacts
      const finalizedContacts = await Promise.all(
        contacts.map(async (contact, idx) => {
          const [bRole, bName, bDept] = await Promise.all([
            finalizeBilingualText(contact.role),
            finalizeBilingualText(contact.name),
            finalizeBilingualText(contact.dept),
          ]);
          return {
            ...contact,
            role: bRole,
            name: bName,
            dept: bDept,
            displayOrder: idx + 1,
          };
        })
      );
      await Promise.all(finalizedContacts.map((c) => upsertSupabaseContact(c)));

      setSaveStatus(t('admin.contact.savedAll'));
      await loadData(true);
    } catch (err) {
      console.error('Save error:', err);
      setSaveStatus(t('admin.contact.saveErr'));
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
      role: category === 'general' ? '담당자 ||| Staff' : 'TF 담당 ||| TF Lead',
      name: '',
      phone: '010-',
      dept: category === 'general' ? '총괄 ||| General' : '운영 ||| Operations',
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
        <span>{t('admin.contact.loading')}</span>
      </div>
    );
  }

  const renderContactList = (list: typeof generalContacts, rolePlaceholder: string, deptPlaceholder: string) => (
    <div className="space-y-3">
      {list.map((person) => (
        <div
          key={person.originalIndex}
          className="bg-slate-50 p-3 rounded-xl border border-gray-200 space-y-2"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <BilingualField
              label={t('admin.contact.role')}
              compact
              value={person.role}
              onChange={(val) => handleUpdateContact(person.originalIndex, 'role', val)}
              placeholderKo={rolePlaceholder}
              inputClassName="w-full bg-white border border-gray-300 px-2 py-1.5 rounded text-xs font-bold"
            />
            <BilingualField
              label={t('admin.contact.name')}
              compact
              value={person.name}
              onChange={(val) => handleUpdateContact(person.originalIndex, 'name', val)}
              placeholderKo="이름"
              inputClassName="w-full bg-white border border-gray-300 px-2 py-1.5 rounded text-xs font-medium"
            />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-end">
            <div className="lg:col-span-5">
              <label className="text-[11px] text-gray-700 font-bold block mb-1">
                {t('admin.contact.phone')}
              </label>
              <input
                type="text"
                value={person.phone}
                onChange={(e) => handleUpdateContact(person.originalIndex, 'phone', e.target.value)}
                placeholder="010-0000-0000"
                className="w-full bg-white border border-gray-300 px-2 py-1.5 rounded text-xs font-medium"
              />
            </div>
            <div className="lg:col-span-6">
              <BilingualField
                label={t('admin.contact.dept')}
                compact
                value={person.dept}
                onChange={(val) => handleUpdateContact(person.originalIndex, 'dept', val)}
                placeholderKo={deptPlaceholder}
                inputClassName="w-full bg-white border border-gray-300 px-2 py-1.5 rounded text-xs font-medium"
              />
            </div>
            <div className="lg:col-span-1 flex justify-end">
              <button
                onClick={() => handleDeleteContact(person.originalIndex)}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                title={t('admin.delete')}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-b-xl shadow-2xs space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-extrabold text-base text-gray-900 flex items-center gap-2">
            <Phone className="w-5 h-5 text-emerald-600" />
            <span>{t('admin.contact.title')}</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">{t('admin.contact.desc')}</p>
        </div>

        <button
          onClick={handleSaveAll}
          disabled={isSaving}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs disabled:opacity-50"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{isSaving ? t('admin.saving') : t('admin.saveAll')}</span>
        </button>
      </div>

      {/* 1. Official Links */}
      <div className="bg-slate-50/70 border border-gray-200 rounded-xl p-4 space-y-3 shadow-2xs">
        <div className="flex items-center gap-2 font-bold text-xs text-gray-900 border-b border-gray-200 pb-2">
          <Globe className="w-4 h-4 text-indigo-600" />
          <span>{t('admin.contact.linksHeader')}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-[11px] font-bold text-gray-700 flex items-center gap-1 mb-1">
              <MessageCircle className="w-3.5 h-3.5 text-amber-500" />
              <span>{t('contact.kakao')} URL</span>
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
              <span>{t('contact.instagram')} URL</span>
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
              <span>{t('contact.youtube')} URL</span>
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

      {/* 2. General Leaders */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
          <div className="flex items-center gap-2 font-bold text-xs text-gray-900">
            <ShieldAlert className="w-4 h-4 text-postech" />
            <span>{t('admin.contact.generalHeader')}</span>
          </div>

          <button
            onClick={() => handleAddContact('general')}
            className="flex items-center gap-1 px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-[11px] font-bold transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-postech" />
            <span>{t('admin.contact.addGeneral')}</span>
          </button>
        </div>

        {renderContactList(generalContacts, '예: 중앙집행위원장', '예: 총괄')}
      </div>

      {/* 3. Department Leads */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
          <div className="flex items-center gap-2 font-bold text-xs text-gray-900">
            <UserCheck className="w-4 h-4 text-blue-600" />
            <span>{t('admin.contact.deptHeader')}</span>
          </div>

          <button
            onClick={() => handleAddContact('dept')}
            className="flex items-center gap-1 px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-[11px] font-bold transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-blue-600" />
            <span>{t('admin.contact.addDept')}</span>
          </button>
        </div>

        {renderContactList(deptContacts, '예: 경기운영 TF', '예: 운영기획')}
      </div>
    </div>
  );
};
