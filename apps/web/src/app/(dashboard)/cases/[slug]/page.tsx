import { notFound } from 'next/navigation';
import type * as React from 'react';

import { ParcelWorkspaceView } from '../../../../components/dashboard/parcel-workspace-view';
import {
  CASE_STUDY_PROFILES,
  getCaseStudyBySlug,
} from '../../../../features/cases/case-study-data';

export function generateStaticParams(): Array<{ slug: string }> {
  return CASE_STUDY_PROFILES.map((cs) => ({ slug: cs.slug }));
}

export default async function CaseStudyDetailPage({
  params,
}: {
  readonly params: Promise<{ slug: string }>;
}): Promise<React.JSX.Element> {
  const { slug } = await params;
  const profile = getCaseStudyBySlug(slug);

  if (!profile) {
    notFound();
  }

  return <ParcelWorkspaceView profile={profile} isCaseStudy />;
}
