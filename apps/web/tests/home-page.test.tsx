import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import HomePage from '../src/app/page';

/**
 * Smoke test for the Phase 1 placeholder route.
 *
 * This is not a product test. It exists so the workspace has a working test
 * harness from the first commit, and so the placeholder page cannot silently
 * change its meaning (it declares the project is in Phase 1).
 */
describe('placeholder home route', () => {
  it('states that the project is in Phase 1', () => {
    const markup = renderToStaticMarkup(<HomePage />);

    expect(markup).toContain('Phase 1');
    expect(markup).toContain('DalaShift');
  });

  it('does not present itself as a finished product', () => {
    const markup = renderToStaticMarkup(<HomePage />);

    expect(markup.toLowerCase()).toContain('not yet implemented');
  });
});
