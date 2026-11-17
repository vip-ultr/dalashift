import type * as React from 'react';

import { RegisteredFarmWorkspace } from '../../../../components/dashboard/registered-farm-workspace';

export default async function FarmParcelWorkspacePage({
  params,
}: {
  readonly params: Promise<{ farmId: string }>;
}): Promise<React.JSX.Element> {
  const { farmId } = await params;

  return <RegisteredFarmWorkspace farmId={farmId} />;
}
