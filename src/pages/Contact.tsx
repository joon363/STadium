import React, { useState, useEffect, useMemo } from 'react';
import { CONTACT_CONFIG } from '../config/stadiumConfig';
import { getSupabaseNotices, getSupabaseFAQs, NoticeItem, FAQItem } from '../lib/supabase';
import {
  Bell,
  Phone,
  MessageCircle,
  Instagram,
  Youtube,
  UserCheck,
  ShieldAlert,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Pin,
  Calendar,
  Loader2,
} from 'lucide-react';

export const Contact: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'notice' | 'contact' | 'faq'>('notice');

  // Dynamic DB States
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // FAQ Category Filter State
  const [selectedFaqCategory, setSelectedFaqCategory] = useState<string>('ALL');

  // Expanded card IDs
  const [expandedNoticeId, setExpandedNoticeId] = useState<number | null>(null);
  const [expandedFaqId, setExpandedFaqId] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      const [fetchedNotices, fetchedFaqs] = await Promise.all([
        getSupabaseNotices(),
        getSupabaseFAQs(),
      ]);
      if (isMounted) {
        setNotices(fetchedNotices);
        setFaqs(fetchedFaqs);
        setLoading(false);
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Extract unique FAQ categories
  const faqCategories = useMemo(() => {
    const cats = Array.from(new Set(faqs.map((f) => f.category || '일반'))).filter(Boolean);
    return cats;
  }, [faqs]);

  // Filtered FAQs
  const filteredFaqs = faqs.filter((f) => {
    if (selectedFaqCategory !== 'ALL' && f.category !== selectedFaqCategory) {
      return false;
    }
    return true;
  });

  return (
    <div className="flex flex-col gap-2.5 p-3 pb-8 select-none text-gray-900">
      {/* Top 3 Main Navigation Tabs (공지사항 / 연락처 / FAQ) */}
      <div className="flex items-center bg-gray-200/80 p-1 rounded-xl shadow-2xs">
        <button
          onClick={() => setActiveTab('notice')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${activeTab === 'notice'
              ? 'bg-white text-slate-900 shadow-xs font-extrabold'
              : 'text-gray-600 hover:text-gray-900'
            }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>공지사항</span>
        </button>

        <button
          onClick={() => setActiveTab('contact')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${activeTab === 'contact'
              ? 'bg-white text-slate-900 shadow-xs font-extrabold'
              : 'text-gray-600 hover:text-gray-900'
            }`}
        >
          <Phone className="w-3.5 h-3.5" />
          <span>연락처</span>
        </button>

        <button
          onClick={() => setActiveTab('faq')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${activeTab === 'faq'
              ? 'bg-white text-slate-900 shadow-xs font-extrabold'
              : 'text-gray-600 hover:text-gray-900'
            }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>FAQ</span>
        </button>
      </div>

      {/* ================= TAB 1: 공지사항 (Notices) ================= */}
      {activeTab === 'notice' && (
        <div className="space-y-2">
          {loading ? (
            <div className="bg-white border border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center gap-2 text-xs font-bold text-gray-400">
              <Loader2 className="w-6 h-6 text-postech animate-spin" />
              <span>공지사항을 불러오는 중...</span>
            </div>
          ) : notices.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-6 text-center text-xs font-bold text-gray-500">
              등록된 공지사항이 없습니다.
            </div>
          ) : (
            <div className="space-y-2">
              {notices.map((notice) => {
                const isExpanded = expandedNoticeId === notice.id;
                const formattedDate = notice.createdAt
                  ? new Date(notice.createdAt).toLocaleDateString('ko-KR', {
                    month: 'long',
                    day: 'numeric',
                  })
                  : '';

                return (
                  <div
                    key={notice.id}
                    onClick={() => setExpandedNoticeId(isExpanded ? null : notice.id || null)}
                    className={`bg-white border rounded-xl px-3 py-2.5 shadow-2xs cursor-pointer transition-all ${notice.isPinned
                        ? 'border-rose-300 bg-gradient-to-r from-rose-50/40 via-white to-white'
                        : 'border-gray-200/90 hover:border-gray-300'
                      }`}
                  >
                    {/* Notice Card Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {notice.isPinned && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold bg-rose-600 text-white px-1.5 py-0.2 rounded-md">
                              <Pin className="w-2.5 h-2.5" />
                              <span>필독</span>
                            </span>
                          )}
                          <h3 className="font-bold text-xs text-gray-900 leading-snug">
                            {notice.title}
                          </h3>
                        </div>

                        {formattedDate && (
                          <div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            <span>{formattedDate}</span>
                          </div>
                        )}
                      </div>

                      <div className="text-gray-400 p-0.5 shrink-0">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </div>

                    {/* Expandable Notice Content */}
                    {isExpanded && (
                      <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-700 font-medium leading-relaxed whitespace-pre-wrap animate-in fade-in duration-150">
                        {notice.content}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: 연락처 (Contacts) ================= */}
      {activeTab === 'contact' && (
        <div className="space-y-3">
          {/* Quick External Links (Open Chat, Instagram, YouTube) */}
          <section>
            <div className="grid grid-cols-3 gap-2">
              <a
                href={CONTACT_CONFIG.links.kakaoOpenChat}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-amber-400 hover:bg-amber-300 text-amber-950 rounded-xl px-2 py-2 flex flex-col items-center justify-center text-center shadow-2xs transition-colors touch-target font-bold text-xs min-h-[52px]"
              >
                <MessageCircle className="w-4 h-4 mb-0.5 text-amber-950 shrink-0" />
                <span className="leading-tight text-[11px]">카카오톡</span>
              </a>

              <a
                href={CONTACT_CONFIG.links.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl px-2 py-2 flex flex-col items-center justify-center text-center shadow-2xs transition-colors touch-target font-bold text-xs min-h-[52px]"
              >
                <Instagram className="w-4 h-4 mb-0.5 shrink-0" />
                <span className="leading-tight text-[11px]">인스타그램</span>
              </a>

              <a
                href={CONTACT_CONFIG.links.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-red-600 hover:bg-red-700 text-white rounded-xl px-2 py-2 flex flex-col items-center justify-center text-center shadow-2xs transition-colors touch-target font-bold text-xs min-h-[52px]"
              >
                <Youtube className="w-4 h-4 mb-0.5 shrink-0" />
                <span className="leading-tight text-[11px]">유튜브 중계</span>
              </a>
            </div>
          </section>

          {/* General Leader Contacts */}
          <section className="space-y-1.5 pt-0.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider px-1">
              <ShieldAlert className="w-3.5 h-3.5 text-postech" />
              <span>총괄 담당자</span>
            </div>

            <div className="grid grid-cols-1 gap-1.5">
              {CONTACT_CONFIG.generalLeaders.map((leader, i) => (
                <div
                  key={i}
                  className="bg-white border border-gray-200 rounded-xl px-3 py-2 flex items-center justify-between shadow-2xs"
                >
                  <div>
                    <div className="text-[10px] font-bold text-postech">{leader.role}</div>
                    <div className="font-bold text-xs text-gray-900">{leader.name}</div>
                  </div>

                  <a
                    href={`tel:${leader.phone}`}
                    className="touch-target px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-postech" />
                    <span>{leader.phone}</span>
                  </a>
                </div>
              ))}
            </div>
          </section>

          {/* Department Leads */}
          <section className="space-y-1.5 pt-0.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider px-1">
              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>부서별 담당자 연락처</span>
            </div>

            <div className="grid grid-cols-1 gap-1.5">
              {CONTACT_CONFIG.deptLeads.map((item, i) => (
                <div
                  key={i}
                  className="bg-white border border-gray-200 rounded-xl px-3 py-2 flex items-center justify-between shadow-2xs"
                >
                  <div>
                    <div className="text-[10px] font-bold text-gray-500">{item.role}</div>
                    <div className="font-bold text-xs text-gray-900">{item.name}</div>
                  </div>

                  <a
                    href={`tel:${item.phone}`}
                    className="touch-target px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-blue-600" />
                    <span>{item.phone}</span>
                  </a>
                </div>
              ))}
            </div>
          </section>

          {/* Safety Notice Footer */}
          <div className="bg-gray-100 border border-gray-200 rounded-xl p-2.5 text-center text-[11px] text-gray-600 font-medium mt-1">
            응급 상황 발생 시 POSTECH 구급본부(054-279-0119) 또는 119로 신고해 주시기 바랍니다.
          </div>
        </div>
      )}

      {/* ================= TAB 3: FAQ (Frequently Asked Questions) ================= */}
      {activeTab === 'faq' && (
        <div className="space-y-2">
          {/* FAQ Category Filter Pills */}
          {faqCategories.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              <button
                onClick={() => setSelectedFaqCategory('ALL')}
                className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 transition-colors shadow-2xs ${selectedFaqCategory === 'ALL'
                    ? 'bg-slate-900 text-white font-extrabold'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
              >
                전체
              </button>
              {faqCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedFaqCategory(cat)}
                  className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 transition-colors shadow-2xs ${selectedFaqCategory === cat
                      ? 'bg-slate-900 text-white font-extrabold'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {filteredFaqs.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-6 text-center text-xs text-gray-400 font-bold">
              등록된 FAQ가 없습니다.
            </div>
          ) : (
            <div className="space-y-1.5">
              {filteredFaqs.map((faq) => {
                const isExpanded = expandedFaqId === faq.id;
                return (
                  <div
                    key={faq.id}
                    onClick={() => setExpandedFaqId(isExpanded ? null : faq.id || null)}
                    className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 shadow-2xs cursor-pointer hover:border-gray-300 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <span className="font-extrabold text-slate-800 text-sm shrink-0">Q.</span>
                        <h4 className="font-bold text-xs text-gray-900 leading-snug pt-0.5">
                          {faq.question}
                        </h4>
                      </div>

                      <div className="text-gray-400 p-0.5 shrink-0">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-700 font-medium leading-relaxed flex items-start gap-2 animate-in fade-in duration-150">
                        <span className="font-extrabold text-postech text-sm shrink-0">A.</span>
                        <p className="flex-1 whitespace-pre-wrap pt-0.5">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
