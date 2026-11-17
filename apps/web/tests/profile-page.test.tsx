import { cleanup, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import ProfileSettingsPage from '../src/app/(dashboard)/profile/page';

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

const fetchMock = vi.fn<typeof fetch>();

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function profileResponse(preferredLanguage: string | null, role = 'farmer'): Response {
  return jsonResponse({ profile: { preferred_language: preferredLanguage, role } });
}

describe('profile preferences page', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('shows the global language switcher and the coordinate redaction notice', async () => {
    fetchMock.mockResolvedValueOnce(profileResponse('ha'));

    render(<ProfileSettingsPage />);

    // The manual save flow was replaced by the shared LanguageSwitcher.
    expect(screen.getByRole('tablist', { name: 'Interface language' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'EN' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'HA' })).toBeInTheDocument();
    expect(await screen.findByText(/Exact GPS coordinates are always omitted/)).toBeInTheDocument();
    expect(screen.getByText('Always Redacted')).toBeInTheDocument();
  });

  it('does not present a successful profile state when loading requires authentication', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: 'Authentication required.' }, 401));

    render(<ProfileSettingsPage />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Authentication required.');
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login');
  });

  it('surfaces a profile load failure safely', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: 'Unable to load profile.' }, 500));

    render(<ProfileSettingsPage />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load profile.');
  });
});
