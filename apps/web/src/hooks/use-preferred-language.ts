'use client';

import * as React from 'react';

export type PreferredLanguage = 'en' | 'ha';

/**
 * Read the language saved on the signed-in profile. Falls back to English
 * when the preference is missing, unsupported, or cannot be loaded. The saved
 * value is never replaced with a hardcoded default in the interface.
 */
export function usePreferredLanguage(): {
  readonly language: PreferredLanguage;
  readonly loading: boolean;
} {
  const [language, setLanguage] = React.useState<PreferredLanguage>('en');
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const response = await fetch('/api/profile', { cache: 'no-store' });
        if (!response.ok) return;
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
          if (saved === 'ha' || saved === 'en') {
            if (active) setLanguage(saved);
          }
        }
      } catch {
        // Keep the safe English fallback when the profile cannot be read.
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return { language, loading };
}
