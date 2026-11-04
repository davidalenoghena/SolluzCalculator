import { useEffect, useState } from 'react';

/**
 * useState that persists to sessionStorage (cleared when the tab closes).
 * Used for calculator progress only – customer contact details are never persisted.
 */
export function useSessionState<T>(key: string, initial: T | (() => T), validate?: (v: unknown) => v is T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = sessionStorage.getItem(key);
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        if (!validate || validate(parsed)) return parsed as T;
      }
    } catch {
      /* ignore corrupted session data */
    }
    return typeof initial === 'function' ? (initial as () => T)() : initial;
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage full or unavailable – state still works in memory */
    }
  }, [key, value]);

  return [value, setValue] as const;
}

export const CALC_SESSION_KEYS = {
  appliances: 'solluz_calc_appliances',
  requirements: 'solluz_calc_requirements',
  selection: 'solluz_calc_selection',
  step: 'solluz_calc_step',
} as const;
