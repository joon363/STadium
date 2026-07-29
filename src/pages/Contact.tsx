import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CONTACT_CONFIG } from '../config/stadiumConfig';
import { ArrowLeft, Phone, MessageCircle, Instagram, Youtube, UserCheck, ShieldAlert } from 'lucide-react';

export const Contact: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header Row */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="touch-target p-2 rounded-lg border border-gray-200 bg-white text-gray-800 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="font-extrabold text-lg text-gray-900">비상 및 운영 문의</h1>
          <p className="text-xs text-gray-500 font-medium">행사 당일 담당자 및 공식 소통 채널</p>
        </div>
      </div>

      {/* Quick External Links (Open Chat, Instagram, YouTube) */}
      <section className="space-y-2">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider px-1">
          공식 소통 & SNS 채널
        </h2>

        <div className="grid grid-cols-1 gap-2">
          {/* Kakao Open Chat Button */}
          <a
            href={CONTACT_CONFIG.links.kakaoOpenChat}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-amber-400 hover:bg-amber-300 text-amber-950 rounded-xl p-3.5 flex items-center justify-between shadow-2xs transition-colors touch-target font-extrabold text-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-950/10 flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-amber-950" />
              </div>
              <div>
                <div>STadium 2026 실시간 카카오톡 오픈채팅방</div>
                <div className="text-[11px] font-semibold text-amber-900">당일 현장 빠른 질의응답</div>
              </div>
            </div>
            <span className="text-xs font-bold bg-amber-950 text-white px-3 py-1 rounded-md">
              입장
            </span>
          </a>

          {/* Instagram & YouTube */}
          <div className="grid grid-cols-2 gap-2">
            <a
              href={CONTACT_CONFIG.links.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl p-3 flex items-center justify-between shadow-2xs transition-colors touch-target font-bold text-xs"
            >
              <div className="flex items-center gap-2">
                <Instagram className="w-4 h-4" />
                <span>공식 인스타그램</span>
              </div>
            </a>

            <a
              href={CONTACT_CONFIG.links.youtube}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-red-700 hover:bg-red-800 text-white rounded-xl p-3 flex items-center justify-between shadow-2xs transition-colors touch-target font-bold text-xs"
            >
              <div className="flex items-center gap-2">
                <Youtube className="w-4 h-4" />
                <span>유튜브 중계</span>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* General Leader Contacts */}
      <section className="space-y-2 pt-1">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider px-1">
          <ShieldAlert className="w-4 h-4 text-postech" />
          <span>총괄 담당자 (비상 핫라인)</span>
        </div>

        <div className="space-y-2">
          {CONTACT_CONFIG.generalLeaders.map((leader, i) => (
            <div
              key={i}
              className="bg-rose-50/60 border border-rose-200 rounded-xl p-3.5 flex items-center justify-between shadow-2xs"
            >
              <div>
                <div className="text-xs font-bold text-rose-700">{leader.role}</div>
                <div className="font-black text-sm text-gray-900">{leader.name}</div>
                <div className="text-[11px] font-medium text-gray-500">{leader.dept}</div>
              </div>

              <a
                href={`tel:${leader.phone}`}
                className="touch-target px-3 py-2 bg-postech hover:bg-postech-dark text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>전화걸기</span>
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Department Leads */}
      <section className="space-y-2 pt-1">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider px-1">
          <UserCheck className="w-4 h-4 text-blue-600" />
          <span>부서별 담당자 연락처</span>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {CONTACT_CONFIG.deptLeads.map((item, i) => (
            <div
              key={i}
              className="bg-white border border-gray-200 rounded-xl p-3 flex items-center justify-between shadow-2xs"
            >
              <div>
                <div className="text-[11px] font-bold text-gray-500">{item.role}</div>
                <div className="font-bold text-sm text-gray-900">{item.name}</div>
              </div>

              <a
                href={`tel:${item.phone}`}
                className="touch-target px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-blue-600" />
                <span>{item.phone}</span>
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Safety Notice Footer */}
      <div className="bg-gray-100 border border-gray-200 rounded-xl p-3 text-center text-xs text-gray-600 mt-1">
        응급 상황 발생 시 POSTECH 구급본부(054-279-0119) 또는 119로 신고해 주시기 바랍니다.
      </div>
    </div>
  );
};
