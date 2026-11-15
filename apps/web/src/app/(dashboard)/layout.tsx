import type { ReactNode } from 'react';

import { ParcelSidebarDrawer } from '../../components/layout/parcel-sidebar-drawer';
import { WorkspaceRail } from '../../components/layout/workspace-rail';

export default function DashboardLayout({
  children,
}: {
  readonly children: ReactNode;
}): React.JSX.Element {
  return (
    <div className="flex min-h-screen bg-[#fafafa] text-[#111827]">
      <WorkspaceRail />
      <ParcelSidebarDrawer />
      <div className="flex min-w-0 flex-1 flex-col pt-14 lg:pt-0">
        {children}
      </div>
    </div>
  );
}
