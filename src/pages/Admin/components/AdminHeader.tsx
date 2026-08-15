import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  RefreshCw,
  Trophy,
  Music,
  MapPin,
  Store,
  Truck,
  Building2,
  Bell,
  HelpCircle,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';
import { AdminTab } from '../types';

interface AdminHeaderProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  onRefresh: () => void;
  isLoading: boolean;
  saveStatus: string | null;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  activeTab,
  setActiveTab,
  onRefresh,
  isLoading,
  saveStatus,
}) => {
  const navigate = useNavigate();

  const tabs: Array<{ id: AdminTab; label: string; icon: React.ReactNode }> = [
    { id: 'matches', label: '운동경기 스코어 & 일정', icon: <Trophy className="w-4 h-4" /> },
    { id: 'stage', label: '대강당 문화공연', icon: <Music className="w-4 h-4" /> },
    { id: 'map', label: '📍 장소 & 도로 편집', icon: <MapPin className="w-4 h-4" /> },
    { id: 'booths', label: '🎪 부스 관리', icon: <Store className="w-4 h-4 text-amber-500" /> },
    { id: 'foodtrucks', label: '🚚 푸드트럭 관리', icon: <Truck className="w-4 h-4 text-orange-500" /> },
    { id: 'sponsors', label: '🏢 후원 기업 관리', icon: <Building2 className="w-4 h-4 text-blue-500" /> },
    { id: 'notices', label: '📢 공지사항 관리', icon: <Bell className="w-4 h-4 text-rose-600" /> },
    { id: 'faqs', label: '❓ FAQ 관리', icon: <HelpCircle className="w-4 h-4 text-purple-600" /> },
    { id: 'settings', label: '관리자 설정 & Supabase', icon: <KeyRound className="w-4 h-4" /> },
  ];

  return (
    <>
      {/* Top Header Bar */}
      <header className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-postech text-white flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-tight">
              2026 STadium 통합 관리자 시스템
            </h1>
            <p className="text-[11px] text-slate-400">16:9 PC 최적화 웹 대시보드</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {saveStatus && (
            <div className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 animate-fade-in font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{saveStatus}</span>
            </div>
          )}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>새로고침</span>
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors"
          >
            사용자 웹으로 이동
          </button>
        </div>
      </header>

      {/* Navigation Tab Bar */}
      <div className="flex items-center gap-2 border-b border-gray-200 bg-white px-4 pt-2 rounded-t-xl shadow-2xs overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 rounded-t-lg font-bold text-xs flex items-center gap-2 transition-colors border-b-2 shrink-0 ${
              activeTab === tab.id
                ? 'bg-white text-postech border-postech shadow-2xs'
                : 'text-gray-600 hover:bg-gray-100 border-transparent'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
    </>
  );
};
