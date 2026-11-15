import type * as React from 'react';

import { ParcelWorkspaceView } from '../../../../components/dashboard/parcel-workspace-view';
import { RegisteredFarmWorkspace } from '../../../../components/dashboard/registered-farm-workspace';
import { getCaseStudyByFarmId } from '../../../../features/cases/case-study-data';

export default async function FarmParcelWorkspacePage({
  params,
}: {
  readonly params: Promise<{ farmId: string }>;
}): Promise<React.JSX.Element> {
  const { farmId } = await params;
  const profile = getCaseStudyByFarmId(farmId);

  return profile ? (
    <ParcelWorkspaceView profile={profile} />
  ) : (
    <RegisteredFarmWorkspace farmId={farmId} />
  );
}
