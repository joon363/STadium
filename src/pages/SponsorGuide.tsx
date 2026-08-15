import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, ExternalLink, Award, Info } from 'lucide-react';
import { getSupabaseSponsors, SponsorItem } from '../lib/supabase';

export const SponsorGuide: React.FC = () => {
  const navigate = useNavigate();
  const [sponsors, setSponsors] = useState<SponsorItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    getSupabaseSponsors().then((data) => {
      setSponsors(data);
      setLoading(false);
    });
  }, []);

  const activeSponsors = sponsors.filter((s) => s.isActive);

  // Group sponsors by tier
  const tierMap: Record<string, SponsorItem[]> = {
    main: activeSponsors.filter((s) => s.tier === 'main'),
    platinum: activeSponsors.filter((s) => s.tier === 'platinum'),
    gold: activeSponsors.filter((s) => s.tier === 'gold'),
    silver: activeSponsors.filter((s) => s.tier === 'silver'),
    bronze: activeSponsors.filter((s) => s.tier === 'bronze'),
    other: activeSponsors.filter(
      (s) => !['main', 'platinum', 'gold', 'silver', 'bronze'].includes(s.tier)
    ),
  };

  const tierLabels: Record<string, { label: string; color: string; badge: string }> = {
    main: { label: '메인 후원사', color: 'border-amber-500/50 bg-amber-500/10 text-amber-300', badge: '👑 Main Sponsor' },
    platinum: { label: '플래티넘 후원사', color: 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300', badge: '💎 Platinum' },
    gold: { label: '골드 후원사', color: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-300', badge: '🥇 Gold' },
    silver: { label: '실버 후원사', color: 'border-slate-400/50 bg-slate-400/10 text-slate-300', badge: '🥈 Silver' },
    bronze: { label: '브론즈 후원사', color: 'border-orange-500/50 bg-orange-500/10 text-orange-300', badge: '🥉 Bronze' },
    other: { label: '협찬 및 파트너', color: 'border-slate-700 bg-slate-800/50 text-slate-300', badge: '🤝 Partner' },
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 space-y-5 pb-12 select-none">
      {/* Header Bar */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
        <button
          onClick={() => navigate('/')}
          className="touch-target p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white active:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-extrabold text-base flex items-center gap-2 text-white">
            <Building2 className="w-5 h-5 text-blue-500" />
            <span>후원 기업 안내</span>
          </h1>
          <p className="text-xs text-slate-400">2026 STadium을 후원해주신 고마운 파트너 기업 목록</p>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs">
          Supabase 데이터 불러오는 중...
        </div>
      ) : activeSponsors.length === 0 ? (
        <div className="py-16 text-center space-y-2 bg-slate-900/50 border border-slate-800 rounded-xl p-6">
          <Info className="w-8 h-8 text-slate-500 mx-auto" />
          <p className="text-sm font-bold text-slate-300">등록된 후원 기업 정보가 없습니다.</p>
          <p className="text-xs text-slate-500">관리자 페이지에서 후원 기업 정보를 등록해주세요.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(tierMap).map(([tierKey, list]) => {
            if (list.length === 0) return null;
            const meta = tierLabels[tierKey] || tierLabels.other;

            return (
              <div key={tierKey} className="space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-1.5">
                  <Award className="w-4 h-4 text-amber-400" />
                  <h2 className="font-extrabold text-sm text-slate-200">{meta.label}</h2>
                  <span className="text-[10px] font-bold text-slate-500 ml-auto">
                    {list.length}개 기업
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {list.map((sponsor) => (
                    <div
                      key={sponsor.id}
                      className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 shadow-md hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {sponsor.logoUrl ? (
                            <img
                              src={sponsor.logoUrl}
                              alt={sponsor.name}
                              className="w-10 h-10 object-contain rounded-lg bg-white p-1"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-lg font-black text-slate-400">
                              {sponsor.name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <h3 className="font-extrabold text-base text-white">{sponsor.name}</h3>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md border inline-block mt-0.5 ${meta.color}`}
                            >
                              {meta.badge}
                            </span>
                          </div>
                        </div>

                        {sponsor.websiteUrl && (
                          <a
                            href={sponsor.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                            title="공식 홈페이지 방문"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>

                      {sponsor.description && (
                        <p className="text-xs text-slate-300 leading-relaxed font-medium bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                          {sponsor.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
