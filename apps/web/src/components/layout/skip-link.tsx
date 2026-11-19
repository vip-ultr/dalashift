'use client';

import { useLanguage } from '../../i18n/language-provider';

/**
 * Accessibility shortcut rendered as the first element inside the body. It is
 * a client component so the label follows the global EN/HA switch like every
 * other piece of interface chrome. The provider renders English on the server
 * and during the first client render, so the swap cannot cause a hydration
 * mismatch.
 */
export function SkipLink(): React.JSX.Element {
  const { t } = useLanguage();

  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-surface-card focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-brand-primary focus:shadow-md"
    >
      {t('nav.skipToMain')}
    </a>
  );
}
