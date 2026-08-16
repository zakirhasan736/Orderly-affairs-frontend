import { describe, expect, it } from 'vitest';

import type { SpotlightRect } from '@/onboarding/components/SpotlightOverlay';
import { getTooltipStyle } from '@/onboarding/utils/tooltipPlacement';

const targetRect: SpotlightRect = {
  top: 240,
  left: 24,
  width: 340,
  height: 180,
  right: 364,
  bottom: 420,
};

describe('getTooltipStyle', () => {
  it('uses an in-viewport sheet on mobile screens', () => {
    const style = getTooltipStyle(targetRect, 'auto', {
      viewport: { width: 390, height: 700 },
    });

    expect(style.left).toBe('max(1rem, env(safe-area-inset-left))');
    expect(style.right).toBe('max(1rem, env(safe-area-inset-right))');
    expect(style.width).toBe('auto');
    expect(style.maxWidth).toBe('none');
    expect(style.transform).toBe('none');
  });

  it('keeps forced beside placement in bounds on desktop', () => {
    const style = getTooltipStyle(targetRect, 'beside', {
      viewport: { width: 720, height: 700 },
    });

    expect(style.left).toBeLessThanOrEqual(720 - 400 - 16);
    expect(style.width).toBe(400);
    expect(style.right).toBe('auto');
  });

  it('keeps below placement away from the viewport bottom', () => {
    const style = getTooltipStyle(
      { ...targetRect, top: 560, bottom: 640 },
      'below',
      { viewport: { width: 900, height: 700 } },
    );

    expect(style.top).toBeLessThanOrEqual(700 - 260 - 16);
    expect(style.bottom).toBe('auto');
  });
});
