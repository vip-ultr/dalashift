import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

  it('loads the saved language and persists a changed preference', async () => {
    fetchMock
      .mockResolvedValueOnce(profileResponse('ha'))
      .mockResolvedValueOnce(profileResponse('en'));

    render(<ProfileSettingsPage />);

    expect(
      await screen.findByText('This preference is saved to your profile.'),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: 'English Only' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save language preference' }));

    expect(
      await screen.findByText('Language preference saved to your profile.'),
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preferredLanguage: 'en' }),
    });
  });

  it('requires an explicit language choice when no supported preference is saved', async () => {
    fetchMock.mockResolvedValueOnce(profileResponse(null));

    render(<ProfileSettingsPage />);

    expect(await screen.findByRole('tab', { name: 'Not set' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Save language preference' })).toBeDisabled();

    await userEvent.click(screen.getByRole('tab', { name: 'English Only' }));

    expect(screen.getByRole('button', { name: 'Save language preference' })).toBeEnabled();
  });

  it('asks the user to replace an unsupported saved language without selecting English for them', async () => {
    fetchMock.mockResolvedValueOnce(profileResponse('fr'));

    render(<ProfileSettingsPage />);

    expect(await screen.findByRole('tab', { name: 'Not set' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(
      screen.getByText(
        'The saved language is not supported here. Choose a language to replace it.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save language preference' })).toBeDisabled();
  });

  it('does not present a successful profile state when loading requires authentication', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: 'Authentication required.' }, 401));

    render(<ProfileSettingsPage />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Authentication required.');
    expect(
      screen.getByRole('link', { name: 'Sign in to manage profile preferences' }),
    ).toHaveAttribute('href', '/login');
    expect(screen.getByRole('button', { name: 'Save language preference' })).toBeDisabled();
    expect(
      screen.queryByText('Language preference saved to your profile.'),
    ).not.toBeInTheDocument();
  });

  it('reports an unauthenticated save instead of showing success', async () => {
    fetchMock
      .mockResolvedValueOnce(profileResponse('ha'))
      .mockResolvedValueOnce(jsonResponse({ error: 'Authentication required.' }, 401));

    render(<ProfileSettingsPage />);
    await screen.findByText('This preference is saved to your profile.');

    await userEvent.click(screen.getByRole('tab', { name: 'English Only' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save language preference' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Authentication required.');
    expect(
      screen.queryByText('Language preference saved to your profile.'),
    ).not.toBeInTheDocument();
  });
});
