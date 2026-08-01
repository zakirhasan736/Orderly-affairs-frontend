import type { DetectedAiFact } from '@/utils/aiDashboardPatchCache';

/**
 * Build a readable AI summary for the inbox review screen.
 * Prefer the model summary; enrich thin ones with extracted facts.
 */
export function buildAiUploadReviewSummary(args: {
  summary?: string | null;
  fileName?: string | null;
  sectionLabel?: string | null;
  facts?: DetectedAiFact[] | null;
}): string {
  const modelSummary = String(args.summary || '').trim();
  const facts = (args.facts || []).filter(
    fact => String(fact.value || '').trim() && String(fact.label || '').trim(),
  );
  const sectionLabel = String(args.sectionLabel || '').trim();
  const fileName = String(args.fileName || '').trim();

  const isThin =
    !modelSummary ||
    modelSummary.length < 60 ||
    /^(could not|unknown|document|uploaded)/i.test(modelSummary);

  if (modelSummary && !isThin) {
    return modelSummary;
  }

  if (facts.length > 0) {
    const highlights = facts
      .slice(0, 8)
      .map(fact => `${fact.label}: ${String(fact.value).trim()}`)
      .join('; ');

    const lead = modelSummary
      ? modelSummary.replace(/\.\s*$/, '')
      : fileName
        ? `This upload (${fileName})`
        : 'This upload';

    const place = sectionLabel
      ? ` It appears useful for ${sectionLabel}.`
      : '';

    return `${lead}. Key details found: ${highlights}.${place}`.replace(
      /\.\./g,
      '.',
    );
  }

  if (modelSummary) return modelSummary;

  if (fileName && sectionLabel) {
    return `AI read “${fileName}” and matched it to ${sectionLabel}. Open the fields below to confirm what was filled, then Accept.`;
  }

  if (fileName) {
    return `AI finished reading “${fileName}”. Review the details below, then Accept if everything looks right.`;
  }

  return 'AI finished reading this document. Review the filled fields below, then Accept.';
}
