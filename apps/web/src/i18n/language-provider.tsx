'use client';

import * as React from 'react';

import { messages } from '@dalashift/shared/i18n';

export type PreferredLanguage = 'en' | 'ha';

export interface LanguageContextValue {
  language: PreferredLanguage;
  setLanguage: (l: PreferredLanguage) => void;
  t: (id: string, vars?: Record<string, string | number>) => string;
  ready: boolean;
}

const STORAGE_KEY = 'dalashift-language';

const LanguageContext = React.createContext<LanguageContextValue | null>(null);

function isPreferredLanguage(value: unknown): value is PreferredLanguage {
  return value === 'en' || value === 'ha';
}

/**
 * Turn a missing message id into readable text so a raw key never leaks into
 * the interface. "reports.noPdf" becomes "Reports no Pdf".
 */
function humanize(id: string): string {
  const spaced = id.replace(/[._]/g, ' ').trim();
  if (!spaced) return id;
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function translate(
  id: string,
  language: PreferredLanguage,
  vars?: Record<string, string | number>,
): string {
  const entry = messages[id];
  const template = entry ? (language === 'ha' ? entry.ha : entry.en) : humanize(id);
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (whole, key: string) => {
    const value = vars[key];
    return value === undefined ? whole : String(value);
  });
}

/**
 * Safe fallback for callers rendered before the provider is available, for
 * example a component mounted in isolation by a test. English is always the
 * default and `ready` is true so such callers never wait on the network.
 */
const fallbackLanguage: LanguageContextValue = {
  language: 'en',
  setLanguage: () => undefined,
  t: (id, vars) => translate(id, 'en', vars),
  ready: true,
};

/**
 * One global source of truth for interface language. Initialises from
 * localStorage so signed-out users keep their choice, then reads the profile
 * so a signed-in preference wins. Rendering never blocks on the network.
 */
export function LanguageProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [language, setLanguageState] = React.useState<PreferredLanguage>('en');
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    let active = true;

    const resolve = async () => {
      let initial: PreferredLanguage = 'en';
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (isPreferredLanguage(stored)) initial = stored;
      } catch {
        // Storage can be unavailable; keep the English default.
      }
      if (active) {
        setLanguageState(initial);
        document.documentElement.lang = initial;
      }

      try {
        const response = await fetch('/api/profile', { cache: 'no-store' });
        if (response.ok) {
          const payload: unknown = await response.json();
          if (
            typeof payload === 'object' &&
            payload !== null &&
            'profile' in payload &&
            typeof payload.profile === 'object' &&
            payload.profile !== null &&
            'preferred_language' in payload.profile
          ) {
            const saved = (payload.profile as { preferred_language?: unknown }).preferred_language;
            if (isPreferredLanguage(saved)) {
              if (active) {
                setLanguageState(saved);
                document.documentElement.lang = saved;
              }
              try {
                window.localStorage.setItem(STORAGE_KEY, saved);
              } catch {
                // Ignore storage write failures.
              }
            }
          }
        }
      } catch {
        // Signed out or offline: the localStorage choice remains in force.
      } finally {
        if (active) setReady(true);
      }
    };

    void resolve();
    return () => {
      active = false;
    };
  }, []);

  const setLanguage = React.useCallback((next: PreferredLanguage) => {
    setLanguageState(next);
    document.documentElement.lang = next;
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Ignore storage write failures.
    }
    void fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preferredLanguage: next }),
    }).catch(() => {
      // A 401 (signed out) or a network error is expected; localStorage still wins.
    });
  }, []);

  const t = React.useCallback(
    (id: string, vars?: Record<string, string | number>) => translate(id, language, vars),
    [language],
  );

  const value = React.useMemo<LanguageContextValue>(
    () => ({ language, setLanguage, t, ready }),
    [language, setLanguage, t, ready],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

/** Read the global language state. Falls back safely outside the provider. */
export function useLanguage(): LanguageContextValue {
  return React.useContext(LanguageContext) ?? fallbackLanguage;
}
