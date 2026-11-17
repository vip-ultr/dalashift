'use client';

import { useLanguage, type PreferredLanguage } from '../i18n/language-provider';

export type { PreferredLanguage } from '../i18n/language-provider';

/**
 * Backwards-compatible view over the global language provider. Existing
 * callers only need the current language and a loading flag; `loading` is the
 * inverse of the provider's `ready` state. New code should use `useLanguage`.
 */
export function usePreferredLanguage(): {
  readonly language: PreferredLanguage;
  readonly loading: boolean;
} {
  const { language, ready } = useLanguage();
  return { language, loading: !ready };
}
