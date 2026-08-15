import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getRealtimeSportsConfig,
  getRealtimeStageConfig,
  calculateOverallStandings,
  SportConfig,
  EvaluatedStagePerformance,
  RawScheduledMatch,
  StageItem,
  STAGE_TIMETABLE,
  SchoolStanding,
} from '../config/stadiumConfig';
import {
  getSupabaseMatches,
  getSupabaseStagePerformances,
  getSupabaseYoutubeLiveUrl,
  subscribeToRealtimeTables,
} from '../lib/supabase';
import { useSchool } from '../context/SchoolContext';

export interface UseRealtimeScheduleResult {
  now: Date;
  sportsConfig: Record<string, SportConfig>;
  stageConfig: EvaluatedStagePerformance;
  stageSchedule: StageItem[];
  overallStandings: SchoolStanding[];
  youtubeLiveUrl: string;
  timeString: string;
  isSupabaseLoaded: boolean;
  refreshFromSupabase: () => Promise<void>;
}

const RealtimeScheduleContext = createContext<UseRealtimeScheduleResult | null>(null);

export const RealtimeScheduleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [now, setNow] = useState<Date>(new Date());
  const [supabaseMatches, setSupabaseMatches] = useState<RawScheduledMatch[] | null>(null);
  const [supabaseStage, setSupabaseStage] = useState<StageItem[] | null>(null);
  const [youtubeLiveUrl, setYoutubeLiveUrl] = useState<string>(
    'https://www.youtube.com/@stadium_official'
  );
  const [isSupabaseLoaded, setIsSupabaseLoaded] = useState<boolean>(false);

  const { selectedSchool } = useSchool();

  const loadSupabaseData = useCallback(async (forceRefresh = false) => {
    try {
      const [matches, stage, ytUrl] = await Promise.all([
        getSupabaseMatches(forceRefresh),
        getSupabaseStagePerformances(forceRefresh),
        getSupabaseYoutubeLiveUrl(forceRefresh),
      ]);

      if (matches && matches.length > 0) {
        setSupabaseMatches(matches);
      }
      if (stage && stage.length > 0) {
        setSupabaseStage(stage);
      }
      if (ytUrl) {
        setYoutubeLiveUrl(ytUrl);
      }
      setIsSupabaseLoaded(true);
    } catch (e) {
      console.warn('Could not load Supabase data:', e);
    }
  }, []);

  useEffect(() => {
    // 1. Initial cached load (0ms from memory/localStorage)
    loadSupabaseData(false);

    // 2. Single Global 1-second ticker for clock
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    // 3. Supabase Realtime WebSocket Subscription (Zero Polling, Instant Push)
    const unsubscribe = subscribeToRealtimeTables(
      ['matches', 'stage_timetable', 'admin_settings'],
      () => {
        loadSupabaseData(true);
      }
    );

    // 4. Fallback background sync (relaxed to 60s instead of 10s spam)
    const syncTimer = setInterval(() => {
      loadSupabaseData(false);
    }, 60000);

    // 5. Refresh when user returns to window / tab
    const handleFocus = () => {
      loadSupabaseData(false);
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(timer);
      clearInterval(syncTimer);
      unsubscribe();
      window.removeEventListener('focus', handleFocus);
    };
  }, [loadSupabaseData]);

  const sportsConfig = getRealtimeSportsConfig(now, supabaseMatches, selectedSchool);
  const stageConfig = getRealtimeStageConfig(now, supabaseStage);
  const stageSchedule = supabaseStage || STAGE_TIMETABLE;
  const overallStandings = calculateOverallStandings(supabaseMatches, now);

  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const timeString = `${hours}:${minutes}:${seconds}`;

  const value: UseRealtimeScheduleResult = {
    now,
    sportsConfig,
    stageConfig,
    stageSchedule,
    overallStandings,
    youtubeLiveUrl,
    timeString,
    isSupabaseLoaded,
    refreshFromSupabase: () => loadSupabaseData(true),
  };

  return (
    <RealtimeScheduleContext.Provider value={value}>{children}</RealtimeScheduleContext.Provider>
  );
};

export function useRealtimeSchedule(): UseRealtimeScheduleResult {
  const context = useContext(RealtimeScheduleContext);
  if (!context) {
    // Fallback if rendered outside provider
    const now = new Date();
    const sportsConfig = getRealtimeSportsConfig(now, null, 'ALL');
    const stageConfig = getRealtimeStageConfig(now, null);
    const overallStandings = calculateOverallStandings(null, now);
    return {
      now,
      sportsConfig,
      stageConfig,
      stageSchedule: STAGE_TIMETABLE,
      overallStandings,
      youtubeLiveUrl: 'https://www.youtube.com/@stadium_official',
      timeString: now.toTimeString().split(' ')[0],
      isSupabaseLoaded: false,
      refreshFromSupabase: async () => {},
    };
  }
  return context;
}
