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
import {
  getSupabaseMatches,
  getSupabaseStagePerformances,
  getSupabaseYoutubeLiveUrl,
  getSupabaseYoutubeLiveList,
  getSupabaseStageDelay,
  getSupabaseNotices,
  getSupabaseBooths,
  subscribeToRealtimeTables,
} from '../lib/supabase';
import { useSchool } from '../context/SchoolContext';

export interface UseRealtimeScheduleResult {
  now: Date;
  sportsConfig: Record<string, SportConfig>;
  stageConfig: EvaluatedStagePerformance;
  stageSchedule: StageItem[];
  stageDelayMinutes: number;
  overallStandings: SchoolStanding[];
  youtubeLiveUrl: string;
  youtubeLiveList: YouTubeLiveItem[];
  getYoutubeLiveUrl: (targetKey?: string) => string;
  timeString: string;
  isSupabaseLoaded: boolean;
  refreshFromSupabase: () => Promise<void>;
}

const RealtimeScheduleContext = createContext<UseRealtimeScheduleResult | null>(null);

export const RealtimeScheduleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [now, setNow] = useState<Date>(() => new Date());
  const [supabaseMatches, setSupabaseMatches] = useState<RawScheduledMatch[] | null>(null);
  const [supabaseStage, setSupabaseStage] = useState<StageItem[] | null>(null);
  const [stageDelayMinutes, setStageDelayMinutes] = useState<number>(0);
  const [youtubeLiveUrl, setYoutubeLiveUrl] = useState<string>(
    'https://www.youtube.com/@stadium_official'
  );
  const [youtubeLiveList, setYoutubeLiveList] = useState<YouTubeLiveItem[]>([]);
  const [isSupabaseLoaded, setIsSupabaseLoaded] = useState<boolean>(false);

  const { selectedSchool } = useSchool();

  // Helper to dynamically resolve YouTube live URL for a given sport, match, or stage
  const getYoutubeLiveUrl = useCallback(
    (targetKey: string = 'main'): string => {
      const found = youtubeLiveList.find(
        (item) => item.sportKey === targetKey
      );
      if (found && found.url && found.isActive) {
        return found.url;
      }
      const main = youtubeLiveList.find((item) => item.sportKey === 'main');
      return main?.url || youtubeLiveUrl || 'https://www.youtube.com/@stadium_official';
    },
    [youtubeLiveList, youtubeLiveUrl]
  );

  // 1. High-Frequency Realtime Data Fetcher (Matches)
  const loadMatchesData = useCallback(async (forceRefresh = false) => {
    try {
      const matches = await getSupabaseMatches(forceRefresh);
      if (matches && matches.length > 0) {
        setSupabaseMatches(matches);
      }
    } catch (e) {
      console.warn('Could not load matches data:', e);
    }
  }, []);

  // 2. Long Polling Data Fetcher (Stage performances, admin settings, notices, booths, youtube_live - 1 min)
  const loadLongPollingData = useCallback(async (forceRefresh = false) => {
    try {
      const [stage, ytUrl, ytList, delay] = await Promise.all([
        getSupabaseStagePerformances(forceRefresh),
        getSupabaseYoutubeLiveUrl(forceRefresh),
        getSupabaseYoutubeLiveList(forceRefresh),
        getSupabaseStageDelay(forceRefresh),
        getSupabaseNotices(forceRefresh),
        getSupabaseBooths(forceRefresh),
      ]);

      if (stage && stage.length > 0) {
        setSupabaseStage(stage);
      }
      if (ytUrl) {
        setYoutubeLiveUrl(ytUrl);
      }
      if (ytList && ytList.length > 0) {
        setYoutubeLiveList(ytList);
      }
      if (delay !== undefined && delay !== null) {
        setStageDelayMinutes(delay);
      }
    } catch (e) {
      console.warn('Could not load long-polling data:', e);
    }
  }, []);

  const loadAllInitialData = useCallback(async (forceRefresh = false) => {
    await Promise.all([loadMatchesData(forceRefresh), loadLongPollingData(forceRefresh)]);
    setIsSupabaseLoaded(true);
  }, [loadMatchesData, loadLongPollingData]);

  useEffect(() => {
    // 1. Initial Load
    loadAllInitialData(true);

    // 2. Global 1-second Ticker for smooth time updates
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    // 3. Supabase Realtime WebSocket Subscription (matches & tournament_trees)
    const unsubscribe = subscribeToRealtimeTables(
      ['matches', 'tournament_trees'],
      (table) => {
        if (table === 'matches') {
          loadMatchesData(true);
        }
      }
    );

    // 4. Long Polling Interval (Every 60 Seconds / 1 Minute)
    const longPollingTimer = setInterval(() => {
      loadLongPollingData(true);
    }, 60000);

    // 5. On Window Focus: Refresh fresh data
    const handleFocus = () => {
      loadAllInitialData(true);
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(timer);
      clearInterval(longPollingTimer);
      unsubscribe();
      window.removeEventListener('focus', handleFocus);
    };
  }, [loadAllInitialData, loadMatchesData, loadLongPollingData]);

  // Derive schedule data with memoization
  const sportsConfig = useMemo(
    () => getRealtimeSportsConfig(now, supabaseMatches, selectedSchool),
    [now, supabaseMatches, selectedSchool]
  );

  const stageConfig = useMemo(
    () => getRealtimeStageConfig(now, supabaseStage, stageDelayMinutes),
    [now, supabaseStage, stageDelayMinutes]
  );

  const stageSchedule = useMemo(
    () => supabaseStage || [],
    [supabaseStage]
  );

  const overallStandings = useMemo(
    () => calculateOverallStandings(supabaseMatches, now),
    [supabaseMatches, now]
  );

  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const timeString = `${hours}:${minutes}:${seconds}`;

  const value: UseRealtimeScheduleResult = useMemo(
    () => ({
      now,
      sportsConfig,
      stageConfig,
      stageSchedule,
      stageDelayMinutes,
      overallStandings,
      youtubeLiveUrl,
      youtubeLiveList,
      getYoutubeLiveUrl,
      timeString,
      isSupabaseLoaded,
      refreshFromSupabase: () => loadAllInitialData(true),
    }),
    [
      now,
      sportsConfig,
      stageConfig,
      stageSchedule,
      stageDelayMinutes,
      overallStandings,
      youtubeLiveUrl,
      youtubeLiveList,
      getYoutubeLiveUrl,
      timeString,
      isSupabaseLoaded,
      loadAllInitialData,
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
    const overallStandings = calculateOverallStandings(null, now);
    return {
      now,
      sportsConfig,
      stageConfig,
      stageSchedule: [],
      stageDelayMinutes: 0,
      overallStandings,
      youtubeLiveUrl: 'https://www.youtube.com/@stadium_official',
      youtubeLiveList: [],
      getYoutubeLiveUrl: () => 'https://www.youtube.com/@stadium_official',
      timeString: now.toTimeString().split(' ')[0],
      isSupabaseLoaded: false,
      refreshFromSupabase: async () => {},
    };
  }
  return context;
}
