import { useState, useEffect } from 'react';

export interface UseLiveClockResult {
  now: Date;
  timeString: string;
  hours: string;
  minutes: string;
  seconds: string;
}

/**
 * High-frequency (1s) ticker hook isolated from global data state,
 * preventing cascade re-renders of the entire app on every second.
 */
export function useLiveClock(): UseLiveClockResult {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const timeString = `${hours}:${minutes}:${seconds}`;

  return { now, timeString, hours, minutes, seconds };
}
