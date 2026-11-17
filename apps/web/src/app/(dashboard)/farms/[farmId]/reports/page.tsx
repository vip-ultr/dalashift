import type * as React from 'react';

import { RegisteredFarmReport } from '../../../../../components/dashboard/registered-farm-report';

export default async function FarmReportPage({
  params,
}: {
  readonly params: Promise<{ farmId: string }>;
}): Promise<React.JSX.Element> {
  const { farmId } = await params;

  return <RegisteredFarmReport farmId={farmId} />;
}
