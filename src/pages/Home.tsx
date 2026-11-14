import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MatchItem, SCHOOLS, SportConfig } from '../config/stadiumConfig';
import { useRealtimeSchedule } from '../hooks/useRealtimeSchedule';
import { useSchool } from '../context/SchoolContext';
import { useLanguage } from '../context/LanguageContext';
import { SportsGridCard } from '../components/SportsGridCard';
import { LeaderboardSection } from '../components/LeaderboardSection';
import { Music, ChevronRight, Filter, Radio, List, LayoutGrid, ArrowLeftRight } from 'lucide-react';

interface HomeMatchCardEntry {
  key: string;
  match: MatchItem;
  path: string;
}

const LIST_SPORT_ORDER = ['soccer', 'baseball', 'lol', 'basketball', 'badminton'] as const;

function buildListMatchItems(
  sportsConfig: Record<string, SportConfig>,
  selectedSchool: string
): HomeMatchCardEntry[] {
  const liveItems: HomeMatchCardEntry[] = [];
  const upcomingItems: HomeMatchCardEntry[] = [];
  const endedItems: HomeMatchCardEntry[] = [];

  for (const sportKey of LIST_SPORT_ORDER) {
    const cfg = sportsConfig[sportKey];
    if (!cfg) continue;

    const schedule = cfg.schedule || [];
    const schoolMatches =
      selectedSchool && selectedSchool !== 'ALL'
        ? schedule.filter((m) => m.team1 === selectedSchool || m.team2 === selectedSchool)
        : schedule;

    const activePool = schoolMatches.length > 0 ? schoolMatches : schedule;
    const liveMatches = activePool.filter((m) => m.isLive);

    if (liveMatches.length > 0) {
      for (const m of liveMatches) {
        liveItems.push({
          key: `${sportKey}-${m.id}`,
          match: m,
          path: cfg.path,
        });
      }
    } else if (cfg.liveMatch) {
      const targetBucket = cfg.liveMatch.isEnded ? endedItems : upcomingItems;
      targetBucket.push({
        key: `${sportKey}-${cfg.liveMatch.id}`,
        match: cfg.liveMatch,
        path: cfg.path,
      });
    }
  }

  return [...liveItems, ...upcomingItems, ...endedItems];
}

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { sportsConfig, stageConfig, overallStandings } = useRealtimeSchedule();
  const { selectedSchool, setSelectedSchool } = useSchool();
  const { t } = useLanguage();

  // View Mode: 'grid' (2x2) | 'list' (stacked full-width)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Gym Sport Switch: 'basketball' | 'badminton'
  const [gymSport, setGymSport] = useState<'basketball' | 'badminton'>('basketball');

  const stageSchool = SCHOOLS[stageConfig.school] || SCHOOLS.POSTECH;
  const activeSchoolObj = selectedSchool !== 'ALL' ? SCHOOLS[selectedSchool] : null;

  // Badminton match resolution across men, women, mixed
  const isAnyBadmintonLive =
    sportsConfig.badminton_men?.liveMatch?.isLive ||
    sportsConfig.badminton_women?.liveMatch?.isLive ||
    sportsConfig.badminton_mixed?.liveMatch?.isLive;

  const badmintonMatch = isAnyBadmintonLive
    ? (sportsConfig.badminton_men?.liveMatch?.isLive
      ? sportsConfig.badminton_men.liveMatch
      : sportsConfig.badminton_women?.liveMatch?.isLive
        ? sportsConfig.badminton_women.liveMatch
        : sportsConfig.badminton_mixed?.liveMatch || sportsConfig.badminton?.liveMatch)
    : sportsConfig.badminton?.liveMatch || sportsConfig.badminton_men?.liveMatch;

  const basketballMatch = sportsConfig.basketball?.liveMatch;

  // Selected 4th match and route
  const fourthMatch = gymSport === 'basketball' ? basketballMatch : badmintonMatch;
  const fourthPath = gymSport === 'basketball' ? '/basketball' : '/badminton';
  const fourthKey = gymSport === 'basketball' ? 'basketball' : 'badminton';

  // All 4 primary sports matches for 2x2 Grid (live cards sorted first)
  const gridMatchItems = useMemo(() => {
    const items = [
      { key: 'soccer', match: sportsConfig.soccer?.liveMatch, path: sportsConfig.soccer?.path || '/soccer' },
      { key: 'baseball', match: sportsConfig.baseball?.liveMatch, path: sportsConfig.baseball?.path || '/baseball' },
      { key: 'lol', match: sportsConfig.lol?.liveMatch, path: sportsConfig.lol?.path || '/lol' },
      { key: fourthKey, match: fourthMatch, path: fourthPath },
    ];
    return [...items].sort((a, b) => (a.match?.isLive ? 0 : 1) - (b.match?.isLive ? 0 : 1));
  }, [sportsConfig, fourthKey, fourthMatch, fourthPath]);

  // Expanded List View items: all simultaneous live matches on top, non-live sports below
  const listMatchItems = useMemo(
    () => buildListMatchItems(sportsConfig, selectedSchool),
    [sportsConfig, selectedSchool]
  );

  return (
    <div className="flex flex-col gap-5 p-3 text-gray-900">
      {/* School Filter Active Bar (If selected in top header) */}
      {activeSchoolObj && (
        <div
          style={{ backgroundColor: activeSchoolObj.bgLight, borderColor: activeSchoolObj.color }}
          className="border rounded-xl p-2.5 flex items-center justify-between shadow-2xs"
        >
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4" style={{ color: activeSchoolObj.color }} />
            <span className="text-xs font-bold text-gray-900">
              <strong style={{ color: activeSchoolObj.color }}>{activeSchoolObj.shortName}</strong>{' '}
              {t('home.filterNoticeTail')}
            </span>
          </div>
          <button
            onClick={() => setSelectedSchool('ALL')}
            className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/80 border text-gray-600 hover:text-gray-900"
          >
            {t('common.viewAll')}
          </button>
        </div>
      )}

      {/* 1. Live Matches Section (Grid or List View) */}
      <section className="space-y-2">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-2 gap-2">
            {gridMatchItems.map((item) => (
              <SportsGridCard key={item.key} match={item.match} path={item.path} layout="grid" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {listMatchItems.map((item) => (
              <SportsGridCard key={item.key} match={item.match} path={item.path} layout="horizontal" />
            ))}
          </div>
        )}

        {/* Action Buttons: List/Grid Toggle (+ Basketball/Badminton Swap in Grid View) */}
        <div className={`grid gap-2 pt-0.5 ${viewMode === 'grid' ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {/* Button 1: Grid <-> List Toggle */}
          <button
            onClick={() => setViewMode((prev) => (prev === 'grid' ? 'list' : 'grid'))}
            className="w-full py-2 px-3 bg-white hover:bg-gray-50 active:bg-gray-100 border border-gray-200/90 rounded-xl text-xs font-bold text-gray-700 flex items-center justify-center gap-1.5 shadow-2xs hover:shadow-xs transition-all select-none"
          >
            {viewMode === 'grid' ? (
              <>
                <List className="w-3.5 h-3.5 text-gray-500" />
                <span>{t('home.viewList')}</span>
              </>
            ) : (
              <>
                <LayoutGrid className="w-3.5 h-3.5 text-gray-500" />
                <span>{t('home.viewGrid')}</span>
              </>
            )}
          </button>

          {/* Button 2: Basketball <-> Badminton Sport Swap (Grid View 4th slot) */}
          {viewMode === 'grid' && (
            <button
              onClick={() => setGymSport((prev) => (prev === 'basketball' ? 'badminton' : 'basketball'))}
              className="w-full py-2 px-3 bg-white hover:bg-gray-50 active:bg-gray-100 border border-gray-200/90 rounded-xl text-xs font-bold text-gray-700 flex items-center justify-center gap-1.5 shadow-2xs hover:shadow-xs transition-all select-none"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-postech" />
              <span>{gymSport === 'basketball' ? t('home.swapToBadminton') : t('home.swapToBasketball')}</span>
            </button>
          )}
        </div>
      </section>

      {/* 2. Live Stage Performance Section */}
      <section className="space-y-1.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <Music className="w-4 h-4 text-postech" />
            <h2 className="font-extrabold text-sm text-gray-900 tracking-tight">{t('home.stageTitle')}</h2>
          </div>

          <div>
            {stageConfig.isLive ? (
              <span className="text-[10px] font-extrabold bg-rose-50 text-rose-600 border border-rose-200 px-2 py-0.5 rounded-full uppercase flex items-center gap-1 shadow-2xs">
                <Radio className="w-3 h-3 text-rose-500" />
                <span>{t('common.stageLive')}</span>
              </span>
            ) : (
              <span className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.2 rounded-full">
                {t('home.stageWaiting')}
              </span>
            )}
          </div>
        </div>

        {/* Card Box */}
        <div
          onClick={() => navigate('/stages')}
          className="bg-white text-gray-900 rounded-xl p-3 border border-gray-200/90 shadow-2xs relative overflow-hidden cursor-pointer hover:border-gray-300 transition-colors select-none active:scale-[0.99] flex items-center justify-between"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span style={{ color: stageSchool.color }} className="font-bold text-xs shrink-0">
                  {stageSchool.shortName}
                </span>
                <span className="font-extrabold text-xs text-gray-900 truncate">
                  {stageConfig.clubName}
                </span>
                <span className="text-[9px] font-bold bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.2 rounded shrink-0">
                  {stageConfig.category}
                </span>
                {stageConfig.genre && (
                  <span className="text-[9px] font-bold bg-gray-100 text-gray-600 px-1.5 py-0.2 rounded border border-gray-200 shrink-0">
                    {stageConfig.genre}
                  </span>
                )}
              </div>
            </div>
          </div>

          <ChevronRight className="w-4 h-4 text-gray-400 shrink-0 ml-2" />
        </div>
      </section>

      {/* 3. Overall Leaderboard Section */}
      <LeaderboardSection standings={overallStandings} />
    </div>
  );
};
