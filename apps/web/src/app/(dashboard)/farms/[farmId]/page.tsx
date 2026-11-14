import type * as React from 'react';

import { ParcelWorkspaceView } from '../../../../components/dashboard/parcel-workspace-view';
import {
  CASE_STUDY_PROFILES,
  getCaseStudyByFarmId,
} from '../../../../features/cases/case-study-data';

export default async function FarmParcelWorkspacePage({
  params,
}: {
  readonly params: Promise<{ farmId: string }>;
}): Promise<React.JSX.Element> {
  const { farmId } = await params;
  const profile =
    getCaseStudyByFarmId(farmId) ?? CASE_STUDY_PROFILES[0]!;

  return <ParcelWorkspaceView profile={profile} />;
}
