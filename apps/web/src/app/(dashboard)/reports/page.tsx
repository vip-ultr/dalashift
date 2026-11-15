'use client';

import * as React from 'react';

import { PrintableFieldSheet } from '../../../components/dashboard/printable-field-sheet';
import { CASE_STUDY_PROFILES, getCaseStudyBySlug } from '../../../features/cases/case-study-data';

export default function ReportsHubPage(): React.JSX.Element {
  const [selectedSlug, setSelectedSlug] = React.useState<string>(
    CASE_STUDY_PROFILES[0]?.slug ?? 'bello-yusuf-maitama',
  );

  const profile = getCaseStudyBySlug(selectedSlug) ?? CASE_STUDY_PROFILES[0]!;

  return (
    <PrintableFieldSheet
      profile={profile}
      allProfiles={CASE_STUDY_PROFILES}
      onSelectProfile={setSelectedSlug}
    />
  );
}
