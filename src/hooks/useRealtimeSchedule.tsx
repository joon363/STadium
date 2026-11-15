import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  getRealtimeSportsConfig,
  getRealtimeStageConfig,
  calculateOverallStandings,
  SportConfig,
  EvaluatedStagePerformance,
  RawScheduledMatch,
  StageItem,
  SchoolStanding,
  YouTubeLiveItem,
} from '../config/stadiumConfig';
import { TournamentTreeData } from '../types/tournamentTree';
import {
  getSupabaseMatches,
  getSupabaseAllTournamentTrees,
  getSupabaseStagePerformances,
  getSupabaseYoutubeLiveList,
  getSupabaseStageDelay,
} from '../lib/supabase';
import { useSchool } from '../context/SchoolContext';
import { useLanguage } from '../context/LanguageContext';
import { resolveYoutubeLiveUrl } from '../services/youtubeLiveService';

export interface UseRealtimeScheduleResult {
  now: Date;
  sportsConfig: Record<string, SportConfig>;
  tournamentTrees: Record<string, TournamentTreeData>;
  stageConfig: EvaluatedStagePerformance;
  stageSchedule: StageItem[];
  stageDelayMinutes: number;
  overallStandings: SchoolStanding[];
  youtubeLiveUrl: string;
  youtubeLiveList: YouTubeLiveItem[];
  getYoutubeLiveUrl: (targetKey?: string, round?: string, fallbackSportKey?: string) => string;
  timeString: string;
  isSupabaseLoaded: boolean;
}

const RealtimeScheduleContext = createContext<UseRealtimeScheduleResult | null>(null);

export const RealtimeScheduleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [now, setNow] = useState<Date>(() => new Date());
  const [supabaseMatches, setSupabaseMatches] = useState<RawScheduledMatch[] | null>(null);
  const [tournamentTrees, setTournamentTrees] = useState<Record<string, TournamentTreeData>>({});
  const [supabaseStage, setSupabaseStage] = useState<StageItem[] | null>(null);
  const [stageDelayMinutes, setStageDelayMinutes] = useState<number>(0);
  const [youtubeLiveUrl, setYoutubeLiveUrl] = useState<string>(
    'https://www.youtube.com/@stadium_official'
  );
  const [youtubeLiveList, setYoutubeLiveList] = useState<YouTubeLiveItem[]>([]);
  const [isSupabaseLoaded, setIsSupabaseLoaded] = useState<boolean>(false);

  const { selectedSchool } = useSchool();
  const { language } = useLanguage();

  // Helper to dynamically resolve YouTube live URL for a given match, round, sport, or stage
  const getYoutubeLiveUrl = useCallback(
    (targetKey: string = 'main', round?: string, fallbackSportKey?: string): string => {
      return resolveYoutubeLiveUrl(
        youtubeLiveList,
        targetKey,
        round,
        fallbackSportKey,
        youtubeLiveUrl
      );
    },
    [youtubeLiveList, youtubeLiveUrl]
  );

  const loadAllInitialData = useCallback(async (forceRefresh = false) => {
    try {
      const [matches, trees, stage, ytList, delay] = await Promise.all([
        getSupabaseMatches(forceRefresh),
        getSupabaseAllTournamentTrees(forceRefresh),
        getSupabaseStagePerformances(forceRefresh),
        getSupabaseYoutubeLiveList(forceRefresh),
        getSupabaseStageDelay(forceRefresh),
      ]);

      if (matches && matches.length > 0) {
        setSupabaseMatches(matches);
      }
      if (trees && Object.keys(trees).length > 0) {
        setTournamentTrees(trees);
      }
      if (stage && stage.length > 0) {
        setSupabaseStage(stage);
      }
      if (ytList && ytList.length > 0) {
        setYoutubeLiveList(ytList);
        const mainItem = ytList.find((item) => item.sportKey === 'main');
        if (mainItem?.url) {
          setYoutubeLiveUrl(mainItem.url);
        }
      }
      if (delay !== undefined && delay !== null) {
        setStageDelayMinutes(delay);
      }
    } catch (e) {
      console.warn('Could not load initial schedule data:', e);
    } finally {
      setIsSupabaseLoaded(true);
    }
  }, []);

  useEffect(() => {
    // 1. Initial Load Only (No background polling, no window.focus refetch, no WebSocket auto-refetch)
    loadAllInitialData(false);

    // 2. Local clock ticker every 30 seconds for lightweight local time evaluation (zero network traffic)
    const timer = setInterval(() => {
      setNow(new Date());
    }, 30000);

    return () => {
      clearInterval(timer);
    };
  }, [loadAllInitialData]);

  // Derive schedule data with memoization
  const sportsConfig = useMemo(
    () => getRealtimeSportsConfig(now, supabaseMatches, selectedSchool, language),
    [now, supabaseMatches, selectedSchool, language]
  );

  const stageConfig = useMemo(
    () => getRealtimeStageConfig(now, supabaseStage, stageDelayMinutes, language),
    [now, supabaseStage, stageDelayMinutes, language]
  );

  const stageSchedule = useMemo(() => supabaseStage || [], [supabaseStage]);

  const overallStandings = useMemo(
    () => calculateOverallStandings(supabaseMatches, now, tournamentTrees, language),
    [supabaseMatches, now, tournamentTrees, language]
  );

  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const timeString = `${hours}:${minutes}:${seconds}`;

  const value: UseRealtimeScheduleResult = useMemo(
    () => ({
      now,
      sportsConfig,
      tournamentTrees,
      stageConfig,
      stageSchedule,
      stageDelayMinutes,
      overallStandings,
      youtubeLiveUrl,
      youtubeLiveList,
      getYoutubeLiveUrl,
      timeString,
      isSupabaseLoaded,
    }),
    [
      now,
      sportsConfig,
      tournamentTrees,
      stageConfig,
      stageSchedule,
      stageDelayMinutes,
      overallStandings,
      youtubeLiveUrl,
      youtubeLiveList,
      getYoutubeLiveUrl,
      timeString,
      isSupabaseLoaded,
    ]
  );

  return (
    <RealtimeScheduleContext.Provider value={value}>{children}</RealtimeScheduleContext.Provider>
  );
};

export function useRealtimeSchedule(): UseRealtimeScheduleResult {
  const context = useContext(RealtimeScheduleContext);
  if (!context) {
    const now = new Date();
    const sportsConfig = getRealtimeSportsConfig(now, null, 'ALL');
    const stageConfig = getRealtimeStageConfig(now, null, 0);
    const overallStandings = calculateOverallStandings(null, now, null);
    return {
      now,
      sportsConfig,
      tournamentTrees: {},
      stageConfig,
      stageSchedule: [],
      stageDelayMinutes: 0,
      overallStandings,
      youtubeLiveUrl: 'https://www.youtube.com/@stadium_official',
      youtubeLiveList: [],
      getYoutubeLiveUrl: () => 'https://www.youtube.com/@stadium_official',
      timeString: now.toTimeString().split(' ')[0],
      isSupabaseLoaded: false,
    };
  }
  return context;
}
