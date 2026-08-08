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
  const el = document.getElementById('overview-recently-filled');
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
    'Saved — find it under “Just saved” on your Dashboard',
    {
      description:
        args?.description ||
        (count > 1
          ? `${count} fills are ready under Just saved — open a card or Review fields.`
          : 'Open the card from Just saved above Upload, or tap Review fields.'),
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
