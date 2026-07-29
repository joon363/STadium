import { useState, useEffect, useCallback } from 'react';
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
} from '../lib/supabase';
import { useSchool } from '../context/SchoolContext';

export interface UseRealtimeScheduleResult {
  now: Date;
  sportsConfig: Record<string, SportConfig>;
  stageConfig: EvaluatedStagePerformance;
  stageSchedule: StageItem[];
  overallStandings: SchoolStanding[];
  timeString: string;
  isSupabaseLoaded: boolean;
  refreshFromSupabase: () => Promise<void>;
}

export function useRealtimeSchedule(): UseRealtimeScheduleResult {
  const [now, setNow] = useState<Date>(new Date());
  const [supabaseMatches, setSupabaseMatches] = useState<RawScheduledMatch[] | null>(null);
  const [supabaseStage, setSupabaseStage] = useState<StageItem[] | null>(null);
  const [isSupabaseLoaded, setIsSupabaseLoaded] = useState<boolean>(false);

  const { selectedSchool } = useSchool();

  const loadSupabaseData = useCallback(async () => {
    try {
      const [matches, stage] = await Promise.all([
        getSupabaseMatches(),
        getSupabaseStagePerformances(),
      ]);

      if (matches && matches.length > 0) {
        setSupabaseMatches(matches);
      }
      if (stage && stage.length > 0) {
        setSupabaseStage(stage);
      }
      setIsSupabaseLoaded(true);
    } catch (e) {
      console.warn('Could not load Supabase data:', e);
    }
  }, []);

  useEffect(() => {
    // Initial fetch on mount / refresh
    loadSupabaseData();

    // 1-second ticker for clock
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    // Periodically re-sync with Supabase every 10 seconds
    const syncTimer = setInterval(() => {
      loadSupabaseData();
    }, 10000);

    // Refresh when user returns to window / tab
    const handleFocus = () => {
      loadSupabaseData();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(timer);
      clearInterval(syncTimer);
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

  return {
    now,
    sportsConfig,
    stageConfig,
    stageSchedule,
    overallStandings,
    timeString,
    isSupabaseLoaded,
    refreshFromSupabase: loadSupabaseData,
  };
}
