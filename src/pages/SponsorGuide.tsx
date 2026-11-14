import React, { useEffect, useState } from 'react';
import { ExternalLink, Info, Loader2 } from 'lucide-react';
import { getSupabaseSponsors, SponsorItem } from '../lib/supabase';
import { useLanguage } from '../context/LanguageContext';
import { getLocalizedValue } from '../utils/bilingual';

export const SponsorGuide: React.FC = () => {
  const [sponsors, setSponsors] = useState<SponsorItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { language, t } = useLanguage();

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

  return (
    <div className="p-3 space-y-4 select-none text-gray-900 pb-8">
      {/* Content Area (No top banner header / No global header) */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-2.5 text-gray-400 text-xs font-bold bg-white border border-gray-200 rounded-2xl shadow-2xs">
          <Loader2 className="w-6 h-6 text-postech animate-spin" />
          <span>{t('sponsors.loading')}</span>
        </div>
      ) : activeSponsors.length === 0 ? (
        <div className="py-12 text-center space-y-2 bg-white border border-gray-200 rounded-2xl p-6 shadow-2xs">
          <Info className="w-8 h-8 text-gray-400 mx-auto" />
          <p className="text-sm font-bold text-gray-700">{t('sponsors.empty')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(tierMap).map(([tierKey, list]) => {
            if (list.length === 0) return null;

            return (
              <div key={tierKey} className="space-y-2">
                <div className="grid grid-cols-1 gap-2">
                  {list.map((sponsor) => {
                    const sponsorName = getLocalizedValue(sponsor.name, language);
                    const sponsorDesc = getLocalizedValue(sponsor.description, language);
                    return (
                      <div
                        key={sponsor.id}
                        className="bg-white border border-gray-200/90 rounded-2xl p-3 space-y-2 shadow-2xs hover:border-gray-300 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            {sponsor.logoUrl ? (
                              <img
                                src={sponsor.logoUrl}
                                alt={sponsorName}
                                className="w-10 h-10 object-contain rounded-xl bg-gray-50 border border-gray-200 p-1 shrink-0 shadow-2xs"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-base font-extrabold text-gray-700 shrink-0">
                                {sponsorName.charAt(0)}
                              </div>
                            )}
                            <div className="min-w-0">
                              <h3 className="font-extrabold text-xs text-gray-900 truncate leading-snug">
                                {sponsorName}
                              </h3>
                            </div>
                          </div>

                          {sponsor.websiteUrl && (
                            <a
                              href={sponsor.websiteUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 transition-colors shrink-0 flex items-center gap-1 text-[10px] font-bold border border-gray-200"
                              title={t('sponsors.visit')}
                            >
                              <span>{t('common.visit')}</span>
                              <ExternalLink className="w-3 h-3 text-gray-600" />
                            </a>
                          )}
                        </div>

                        {sponsorDesc && (
                          <p className="text-xs text-gray-700 leading-relaxed font-medium bg-gray-50 p-2.5 rounded-xl border border-gray-200/80 whitespace-pre-wrap">
                            {sponsorDesc}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
