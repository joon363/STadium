import React, { useEffect, useState } from 'react';
import { ExternalLink, Award, Info, Loader2 } from 'lucide-react';
import { getSupabaseSponsors, SponsorItem } from '../lib/supabase';

export const SponsorGuide: React.FC = () => {
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
    main: {
      label: '메인 후원사',
      color: 'border-amber-300 bg-amber-50 text-amber-900 font-extrabold',
      badge: '👑 Main Sponsor',
    },
    platinum: {
      label: '플래티넘 후원사',
      color: 'border-cyan-300 bg-cyan-50 text-cyan-900 font-bold',
      badge: '💎 Platinum',
    },
    gold: {
      label: '골드 후원사',
      color: 'border-yellow-300 bg-yellow-50 text-yellow-900 font-bold',
      badge: '🥇 Gold',
    },
    silver: {
      label: '실버 후원사',
      color: 'border-slate-300 bg-slate-100 text-slate-800 font-bold',
      badge: '🥈 Silver',
    },
    bronze: {
      label: '브론즈 후원사',
      color: 'border-orange-300 bg-orange-50 text-orange-900 font-bold',
      badge: '🥉 Bronze',
    },
    other: {
      label: '협찬 및 파트너',
      color: 'border-gray-300 bg-gray-100 text-gray-800 font-bold',
      badge: '🤝 Partner',
    },
  };

  return (
    <div className="p-3 space-y-4 select-none text-gray-900 pb-8">
      {/* Content Area (No top banner header / No global header) */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-2.5 text-gray-400 text-xs font-bold bg-white border border-gray-200 rounded-2xl shadow-2xs">
          <Loader2 className="w-6 h-6 text-postech animate-spin" />
          <span>후원 기업 목록을 불러오는 중...</span>
        </div>
      ) : activeSponsors.length === 0 ? (
        <div className="py-12 text-center space-y-2 bg-white border border-gray-200 rounded-2xl p-6 shadow-2xs">
          <Info className="w-8 h-8 text-gray-400 mx-auto" />
          <p className="text-sm font-bold text-gray-700">등록된 후원 기업 정보가 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(tierMap).map(([tierKey, list]) => {
            if (list.length === 0) return null;
            const meta = tierLabels[tierKey] || tierLabels.other;

            return (
              <div key={tierKey} className="space-y-2">
                <div className="flex items-center justify-between px-1 border-b border-gray-200 pb-1">
                  <div className="flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-500" />
                    <h2 className="font-extrabold text-xs text-gray-800 tracking-wide">
                      {meta.label}
                    </h2>
                  </div>
                  <span className="text-[10px] font-bold text-gray-400">{list.length}개 기업</span>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {list.map((sponsor) => (
                    <div
                      key={sponsor.id}
                      className="bg-white border border-gray-200/90 rounded-2xl p-3 space-y-2 shadow-2xs hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {sponsor.logoUrl ? (
                            <img
                              src={sponsor.logoUrl}
                              alt={sponsor.name}
                              className="w-10 h-10 object-contain rounded-xl bg-gray-50 border border-gray-200 p-1 shrink-0 shadow-2xs"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-base font-extrabold text-gray-700 shrink-0">
                              {sponsor.name.charAt(0)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <h3 className="font-extrabold text-xs text-gray-900 truncate leading-snug">
                              {sponsor.name}
                            </h3>
                            <span
                              className={`text-[9px] px-2 py-0.2 rounded-md border inline-block mt-0.5 ${meta.color}`}
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
                            className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 transition-colors shrink-0 flex items-center gap-1 text-[10px] font-bold border border-gray-200"
                            title="공식 홈페이지 방문"
                          >
                            <span>방문</span>
                            <ExternalLink className="w-3 h-3 text-gray-600" />
                          </a>
                        )}
                      </div>

                      {sponsor.description && (
                        <p className="text-xs text-gray-700 leading-relaxed font-medium bg-gray-50 p-2.5 rounded-xl border border-gray-200/80">
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
