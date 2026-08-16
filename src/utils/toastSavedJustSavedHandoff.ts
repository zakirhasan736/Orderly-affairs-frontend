/**
 * Shared toast after Accept / overview approve — points users at Just saved.
 */

import { toast } from 'sonner';
import {
  listAllNewFills,
  listUnseenNewFills,
  type NewFillMarker,
} from '@/utils/newFillMarkers';

export function newestNewFillMarker(): NewFillMarker | null {
  return listUnseenNewFills()[0] || listAllNewFills()[0] || null;
}

export function scrollToJustSavedHub() {
  if (typeof document === 'undefined') return;
  const el =
    document.querySelector('[data-tour="tour-new-data-hub"]') ||
    document.querySelector('.owner-dashboard-item');
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

type SavedHandoffToastArgs = {
  savedCount?: number;
  /** Prefer deep-link when the inbox can navigate; else scroll to hub. */
  onOpenMarker?: (marker: NewFillMarker) => void;
  description?: string;
};

export function toastSavedJustSavedHandoff(args?: SavedHandoffToastArgs) {
  const count = args?.savedCount ?? 1;
  toast.success(
    'Saved — find it under Review these first in the sidebar',
    {
      description:
        args?.description ||
        (count > 1
          ? `${count} fills are ready in the left sidebar — open the section to review.`
          : 'Open the highlighted section in the left sidebar, or tap Review fields on the section page.'),
      action: {
        label: 'Open',
        onClick: () => {
          const marker = newestNewFillMarker();
          if (marker && args?.onOpenMarker) {
            args.onOpenMarker(marker);
            return;
          }
          if (marker) {
            scrollToJustSavedHub();
            return;
          }
          scrollToJustSavedHub();
        },
      },
    },
  );
}
