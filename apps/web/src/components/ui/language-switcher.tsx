'use client';

import type * as React from 'react';

import { useLanguage, type PreferredLanguage } from '../../i18n/language-provider';
import { cn } from '../../lib/utilities/cn';
import { SegmentedControl } from './segmented-control';

/**
 * Single EN/HA switcher shared by every chrome surface. Reads and writes the
 * global LanguageProvider, so the choice applies everywhere immediately.
 * `compact` fits icon rails and tight header rows.
 */
export function LanguageSwitcher({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}): React.JSX.Element {
  const { language, setLanguage, t } = useLanguage();

  return (
    <SegmentedControl<PreferredLanguage>
      ariaLabel={t('nav.interfaceLanguage')}
      size={compact ? 'sm' : 'md'}
      value={language}
      onValueChange={setLanguage}
      options={[
        { value: 'en', label: 'EN' },
        { value: 'ha', label: 'HA' },
      ]}
      className={cn(compact && 'w-auto', className)}
    />
  );
}
