import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import HomePage from '../src/app/page';

/**
 * Smoke test for the landing page route.
 *
 * Verifies that the redesigned page renders the DalaShift brand and its
 * content-led, plain-language hero and how-it-works steps. The old decorative
 * eyebrow label and icon-card principles were deliberately removed.
 */
describe('landing page route', () => {
  it('renders DalaShift branding and the plain-language hero', () => {
    const markup = renderToStaticMarkup(<HomePage />);

    expect(markup).toContain('DalaShift');
    expect(markup).toContain('Know when your field is ready.');
    expect(markup).toContain('satellite data and local knowledge');
  });

  it('shows the three how-it-works steps as a simple list', () => {
    const markup = renderToStaticMarkup(<HomePage />);

    expect(markup).toContain('How it works');
    expect(markup).toContain('1. Add your farm');
    expect(markup).toContain('2. Add a field');
    expect(markup).toContain('3. Get advice');
  });

  it('does not render the removed decorative eyebrow and icon-card labels', () => {
    const markup = renderToStaticMarkup(<HomePage />);

    expect(markup).not.toContain('Precision Agricultural Intelligence');
    expect(markup).not.toContain('Resolution Honesty');
  });
});
