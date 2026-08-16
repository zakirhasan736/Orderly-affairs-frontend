import type { CSSProperties } from 'react';

import type { SpotlightRect } from '@/onboarding/components/SpotlightOverlay';
import type { OwnerTourStep } from '@/onboarding/config/ownerTour';

type TooltipPlacement = OwnerTourStep['tooltipPlacement'];

type TooltipViewport = {
  left?: number;
  top?: number;
  width: number;
  height: number;
};

type TooltipStyleOptions = {
  viewport?: TooltipViewport;
};

const EDGE_GAP = 16;
const TARGET_GAP = 16;
const MOBILE_BREAKPOINT = 640;
const DESKTOP_TIP_WIDTH = 400;
const DESKTOP_TIP_HEIGHT = 260;
const MIN_DESKTOP_TIP_WIDTH = 280;

function getViewportBounds(viewport?: TooltipViewport): Required<TooltipViewport> {
  if (viewport) {
    return {
      left: viewport.left ?? 0,
      top: viewport.top ?? 0,
      width: viewport.width,
      height: viewport.height,
    };
  }

  if (typeof window === 'undefined') {
    return { left: 0, top: 0, width: 1280, height: 800 };
  }

  const visualViewport = window.visualViewport;

  return {
    left: visualViewport?.offsetLeft ?? 0,
    top: visualViewport?.offsetTop ?? 0,
    width: visualViewport?.width ?? window.innerWidth,
    height: visualViewport?.height ?? window.innerHeight,
  };
}

/** Place the card near the spotlight target while keeping it inside the viewport. */
export function getTooltipStyle(
  rect: SpotlightRect,
  placement: TooltipPlacement = 'auto',
  options: TooltipStyleOptions = {},
): CSSProperties {
  const viewport = getViewportBounds(options.viewport);

  if (viewport.width < MOBILE_BREAKPOINT) {
    return {
      left: 'max(1rem, env(safe-area-inset-left))',
      right: 'max(1rem, env(safe-area-inset-right))',
      bottom: 'max(1rem, env(safe-area-inset-bottom))',
      top: 'auto',
      width: 'auto',
      maxWidth: 'none',
      maxHeight:
        'min(62dvh, calc(100dvh - 2rem - env(safe-area-inset-bottom)))',
      overflowY: 'auto',
      transform: 'none',
    };
  }

  const viewportRight = viewport.left + viewport.width;
  const viewportBottom = viewport.top + viewport.height;
  const spaceRight = viewportRight - rect.right - TARGET_GAP;
  const spaceLeft = rect.left - viewport.left - TARGET_GAP;
  const spaceBelow = viewportBottom - rect.bottom - TARGET_GAP;
  const width = Math.min(
    DESKTOP_TIP_WIDTH,
    Math.max(
      MIN_DESKTOP_TIP_WIDTH,
      Math.min(viewport.width - EDGE_GAP * 2, DESKTOP_TIP_WIDTH),
    ),
  );
  const maxLeft = viewportRight - width - EDGE_GAP;
  const maxTop = viewportBottom - DESKTOP_TIP_HEIGHT - EDGE_GAP;

  const clampTop = (top: number) =>
    Math.max(viewport.top + EDGE_GAP, Math.min(top, maxTop));
  const clampLeft = (left: number) =>
    Math.max(viewport.left + EDGE_GAP, Math.min(left, maxLeft));

  const besideRight = (): CSSProperties => ({
    left: clampLeft(rect.right + TARGET_GAP),
    top: clampTop(rect.top),
    width,
    maxWidth: width,
    transform: 'none',
    bottom: 'auto',
    right: 'auto',
  });

  const belowTarget = (): CSSProperties => ({
    left: clampLeft(rect.right - width),
    top: clampTop(rect.bottom + TARGET_GAP),
    width,
    maxWidth: width,
    transform: 'none',
    bottom: 'auto',
    right: 'auto',
  });

  if (placement === 'beside') return besideRight();
  if (placement === 'below') return belowTarget();

  // Left-rail targets (sidebar): sit to the right.
  if (rect.left < viewportRight * 0.42 && spaceRight >= Math.min(width, 280)) {
    return besideRight();
  }

  // Top / right targets (header % bar): sit below, aligned toward the target.
  if (rect.top < viewportBottom * 0.35 && spaceBelow >= 160) {
    return belowTarget();
  }

  // Right-side targets with room on the left: sit to the left.
  if (spaceLeft >= Math.min(width, 300)) {
    return {
      left: clampLeft(rect.left - width - TARGET_GAP),
      top: clampTop(rect.top),
      width,
      maxWidth: width,
      transform: 'none',
      bottom: 'auto',
      right: 'auto',
    };
  }

  return {
    left: '50%',
    bottom: 'max(1rem, env(safe-area-inset-bottom))',
    top: 'auto',
    width: 'calc(100% - 2rem)',
    maxWidth: '28rem',
    transform: 'translateX(-50%)',
    right: 'auto',
  };
}
