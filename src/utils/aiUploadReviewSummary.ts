import type { DetectedAiFact } from '@/utils/aiDashboardPatchCache';

/**
 * Texas / other state ID backs print a roadside-assistance phone line.
 * Models often mislabel the whole image as a roadside assistance card —
 * rewrite when classic DL-back cues are present.
 */
export function correctRoadsideAssistanceIdSummary(
  summary: string,
  extraText = '',
): string {
  const text = `${summary} ${extraText}`.trim();
  if (!text) return summary;

  const mentionsRoadside = /\broadside\s*assistance\b/i.test(summary);
  const callsItRoadsideCard =
    /\broadside\s*assistance\s*card\b/i.test(summary) ||
    /\bthis\s+document\s+is\s+a\s+[^.]*roadside\s*assistance\b/i.test(summary);

  const looksLikeLicenseBack =
    /\b(driver'?s?\s*licen[cs]e|driving\s*licen[cs]e|state\s*id|photo\s*id|magnetic\s*stripe|class\s*:\s*[a-z0-9]|rest\s*:\s*|end\s*:\s*|pdf417|organ\s*donor)\b/i.test(
      text,
    ) ||
    (/\bdob\b|\bdate\s*of\s*birth\b/i.test(text) &&
      /\b(identification|barcode|class|license)\b/i.test(text));

  if (!mentionsRoadside) return summary;
  if (!callsItRoadsideCard && !looksLikeLicenseBack) return summary;
  if (
    /\b(driver'?s?\s*licen[cs]e|driving\s*licen[cs]e|state\s*id)\b/i.test(
      summary,
    ) &&
    !callsItRoadsideCard
  ) {
    return summary;
  }

  const dobMatch = text.match(
    /\b(?:DOB|date\s*of\s*birth)\s*[:#]?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b/i,
  );
  const dobBit = dobMatch ? ` Date of birth shown: ${dobMatch[1]}.` : '';

  return (
    'This is the back of a state driver’s license / photo ID ' +
    '(magnetic stripe, barcodes, class/restrictions).' +
    dobBit +
    ' The roadside assistance phone number printed on many state IDs is a help line on the license, not a separate roadside assistance card.'
  );
}

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
  const factBlob = facts
    .map(fact => `${fact.label}: ${String(fact.value).trim()}`)
    .join('; ');

  const correctedModel = correctRoadsideAssistanceIdSummary(
    modelSummary,
    `${fileName} ${sectionLabel} ${factBlob}`,
  );

  const isThin =
    !correctedModel ||
    correctedModel.length < 60 ||
    /^(could not|unknown|document|uploaded)/i.test(correctedModel);

  if (correctedModel && !isThin) {
    return correctedModel;
  }

  if (facts.length > 0) {
    const highlights = facts
      .slice(0, 8)
      .map(fact => `${fact.label}: ${String(fact.value).trim()}`)
      .join('; ');

    const lead = correctedModel
      ? correctedModel.replace(/\.\s*$/, '')
      : fileName
        ? `This upload (${fileName})`
        : 'This upload';

    const place = sectionLabel
      ? ` It appears useful for ${sectionLabel}.`
      : '';

    return correctRoadsideAssistanceIdSummary(
      `${lead}. Key details found: ${highlights}.${place}`.replace(/\.\./g, '.'),
      factBlob,
    );
  }

  if (correctedModel) return correctedModel;

  if (fileName && sectionLabel) {
    return `AI read “${fileName}” and matched it to ${sectionLabel}. Open the fields below to confirm what was filled, then Accept.`;
  }

  if (fileName) {
    return `AI finished reading “${fileName}”. Review the details below, then Accept if everything looks right.`;
  }

  return 'AI finished reading this document. Review the filled fields below, then Accept.';
}
