import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import HomePage from '../src/app/page';

/**
 * Smoke test for the landing page route.
 *
 * Verifies that the page renders core branding, Tofa LGA field validation context,
 * and the resolution honesty principles.
 */
describe('landing page route', () => {
  it('renders DalaShift branding and field intelligence context', () => {
    const markup = renderToStaticMarkup(<HomePage />);

    expect(markup).toContain('DalaShift');
    expect(markup).toContain('Precision Agricultural Intelligence');
  });

  it('surfaces resolution honesty and moisture trigger principles', () => {
    const markup = renderToStaticMarkup(<HomePage />);

    expect(markup).toContain('Resolution Honesty');
    expect(markup).toContain('Moisture Triggers');
  });
});
