import type * as React from 'react';

import { PrintableFieldSheet } from '../../../../../components/dashboard/printable-field-sheet';
import {
  CASE_STUDY_PROFILES,
  getCaseStudyByFarmId,
} from '../../../../../features/cases/case-study-data';

export default async function FarmReportPage({
  params,
}: {
  readonly params: Promise<{ farmId: string }>;
}): Promise<React.JSX.Element> {
  const { farmId } = await params;
  const profile =
    getCaseStudyByFarmId(farmId) ?? CASE_STUDY_PROFILES[0]!;

  return <PrintableFieldSheet profile={profile} />;
}
