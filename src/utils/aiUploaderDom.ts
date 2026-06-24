import { AI_PENDING_ROUTED_HINT } from '@/utils/aiRoutingUi';

export { AI_PENDING_ROUTED_HINT };

export function aiUploadZoneDataAttr(highlightUpload: boolean) {
  return highlightUpload ? 'highlight' : undefined;
}

export const AI_UPLOAD_ZONE_HIGHLIGHT_CLASS =
  'border-indigo-400 bg-indigo-50/40 ring-2 ring-indigo-300 ring-offset-2';
