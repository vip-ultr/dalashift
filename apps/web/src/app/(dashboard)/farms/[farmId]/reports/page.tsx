import type * as React from 'react';

import { PrintableFieldSheet } from '../../../../../components/dashboard/printable-field-sheet';
import { RegisteredFarmReport } from '../../../../../components/dashboard/registered-farm-report';
import { getCaseStudyByFarmId } from '../../../../../features/cases/case-study-data';

export default async function FarmReportPage({
  params,
}: {
  readonly params: Promise<{ farmId: string }>;
}): Promise<React.JSX.Element> {
  const { farmId } = await params;
  const profile = getCaseStudyByFarmId(farmId);

  return profile ? (
    <PrintableFieldSheet profile={profile} />
  ) : (
    <RegisteredFarmReport farmId={farmId} />
  );
}
