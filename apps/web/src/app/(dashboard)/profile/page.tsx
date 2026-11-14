'use client';

import {
  CheckCircle2,
  Lock,
  ShieldCheck,
  UserCircle2,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';

import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { SegmentedControl } from '../../../components/ui/segmented-control';

export default function ProfileSettingsPage(): React.JSX.Element {
  const [role, setRole] = React.useState<'farmer' | 'adviser'>('adviser');
  const [defaultLanguage, setDefaultLanguage] = React.useState<'ha' | 'en'>('ha');
  const [shareGpsInReports, setShareGpsInReports] = React.useState<'redacted'>(
    'redacted',
  );

  return (
    <div className="min-h-screen bg-[#f6f4ef] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="rounded-[12px] border border-[#e5e7eb] bg-white p-6 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ebfaef] text-[#00b159]">
              <UserCircle2 className="h-7 w-7" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-xl font-bold text-[#111315]">
                  Farmer &amp; Extension Adviser Preferences
                </h1>
                <Badge variant="Strong">Tofa LGA Field Session</Badge>
              </div>
              <p className="text-xs text-[#6b7280]">
                Configure default display terminology, role view, and privacy
                settings for farm advisory sessions.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-5 border-t border-[#e5e7eb] pt-5">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <div className="text-sm font-semibold text-[#111315]">
                  Default Workspace Perspective
                </div>
                <p className="text-xs text-[#6b7280]">
                  Extension Officer (Malamin Gona) view surfaces ruleset IDs and
                  full observation provenance tables by default.
                </p>
              </div>
              <SegmentedControl
                size="sm"
                ariaLabel="Default workspace perspective"
                value={role}
                onValueChange={setRole}
                options={[
                  { value: 'farmer', label: 'Smallholder Farmer' },
                  { value: 'adviser', label: 'Extension Adviser' },
                ]}
              />
            </div>

            <div className="flex flex-col justify-between gap-3 border-t border-[#f3f4f6] pt-4 sm:flex-row sm:items-center">
              <div>
                <div className="text-sm font-semibold text-[#111315]">
                  Local Hausa Crop Terminology (D-08)
                </div>
                <p className="text-xs text-[#6b7280]">
                  Display local Hausa crop names (Dawa, Gero, Wake, Farar wake,
                  Waken soya, Gyada, Masara) alongside English names.
                </p>
              </div>
              <SegmentedControl
                size="sm"
                ariaLabel="Local Hausa crop terminology"
                value={defaultLanguage}
                onValueChange={setDefaultLanguage}
                options={[
                  { value: 'ha', label: 'English + Hausa' },
                  { value: 'en', label: 'English Only' },
                ]}
              />
            </div>

            <div className="flex flex-col justify-between gap-3 border-t border-[#f3f4f6] pt-4 sm:flex-row sm:items-center">
              <div>
                <div className="flex items-center gap-1.5 text-sm font-semibold text-[#111315]">
                  <Lock className="h-4 w-4 text-[#00b159]" aria-hidden="true" />
                  <span>Coordinate Redaction in Printable Reports (D-12)</span>
                </div>
                <p className="text-xs text-[#6b7280]">
                  Exact GPS coordinates are always omitted from printable and
                  shareable field sheets to protect farmer privacy.
                </p>
              </div>
              <SegmentedControl
                size="sm"
                ariaLabel="Coordinate privacy policy"
                value={shareGpsInReports}
                onValueChange={setShareGpsInReports}
                options={[{ value: 'redacted', label: 'Always Redacted' }]}
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#e5e7eb] pt-4">
            <span className="inline-flex items-center gap-1.5 text-xs text-[#0b4f2f]">
              <CheckCircle2 className="h-4 w-4 text-[#00b159]" aria-hidden="true" />
              <span>Preferences active for current workspace session</span>
            </span>
            <div className="flex items-center gap-2">
              <Link href="/cases">
                <Button variant="secondary" size="sm">
                  <span>Open Case Studies</span>
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="sm">
                  <span>Switch Account</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
