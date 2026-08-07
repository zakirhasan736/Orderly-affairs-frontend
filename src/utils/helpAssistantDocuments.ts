/**
 * Locate uploaded / noted vault documents for the help assistant.
 */

import { VAULT_NAVIGATION } from '@/utils/vaultNavigation';
import { listAiUploadHistory } from '@/utils/aiUploadHistory';

function asPlain(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value).trim();
  }
  if (typeof value === 'object' && value !== null && 'text' in value) {
    return asPlain((value as { text?: unknown }).text);
  }
  return '';
}

export type VaultDocumentHit = {
  sectionId: string;
  sectionTitle: string;
  subsection?: string;
  fieldKey: string;
  label: string;
  locationNote: string;
  fileNames: string[];
  source: 'field' | 'upload_history' | 'catalog_empty';
  score: number;
};

type DocumentCatalogEntry = {
  sectionId: string;
  subsection?: string;
  fieldKey: string;
  label: string;
  synonyms: string[];
};

/** Known document homes — especially Section 20A identity / vital records. */
export const VAULT_DOCUMENT_CATALOG: DocumentCatalogEntry[] = [
  {
    sectionId: '20',
    subsection: '20A',
    fieldKey: 'birth_certificate',
    label: 'Birth Certificate',
    synonyms: ['birth certificate', 'birth cert'],
  },
  {
    sectionId: '20',
    subsection: '20A',
    fieldKey: 'social_security_card',
    label: 'Social Security Card',
    synonyms: [
      'social security card',
      'ssn card',
      'social security',
      'ss card',
    ],
  },
  {
    sectionId: '20',
    subsection: '20A',
    fieldKey: 'passport',
    label: 'Passport',
    synonyms: ['passport', 'passports'],
  },
  {
    sectionId: '20',
    subsection: '20A',
    fieldKey: 'drivers_license',
    label: "Driver's License",
    synonyms: [
      "driver's license",
      'drivers license',
      'driver license',
      'driving license',
      'state id',
      'state identification',
    ],
  },
  {
    sectionId: '20',
    subsection: '20A',
    fieldKey: 'marriage_certificate',
    label: 'Marriage Certificate',
    synonyms: [
      'marriage certificate',
      'marriage cert',
      'wedding certificate',
      'marriage license',
      'marriage licences',
      'marriage licenses',
    ],
  },
  {
    sectionId: '20',
    subsection: '20A',
    fieldKey: 'divorce_decree',
    label: 'Divorce Decree',
    synonyms: [
      'divorce decree',
      'divorce papers',
      'divorce certificate',
      'legal separation',
    ],
  },
  {
    sectionId: '20',
    subsection: '20A',
    fieldKey: 'name_change_documents',
    label: 'Name Change Documents',
    synonyms: ['name change', 'name change documents', 'name change papers'],
  },
  {
    sectionId: '20',
    subsection: '20A',
    fieldKey: 'naturalization_certificate',
    label: 'Naturalization Certificate',
    synonyms: [
      'naturalization certificate',
      'citizenship certificate',
      'naturalization',
    ],
  },
  {
    sectionId: '20',
    subsection: '20A',
    fieldKey: 'immigration_documents',
    label: 'Immigration Documents',
    synonyms: [
      'green card',
      'permanent resident',
      'permanent resident card',
      'immigration documents',
      'visa',
    ],
  },
  {
    sectionId: '20',
    subsection: '20A',
    fieldKey: 'children_birth_certificates',
    label: "Children's Birth Certificates",
    synonyms: [
      "children's birth certificates",
      'child birth certificate',
      'kids birth certificate',
    ],
  },
  {
    sectionId: '20',
    subsection: '20A',
    fieldKey: 'will_location',
    label: 'Will',
    synonyms: [
      'last will',
      'my will',
      'will and testament',
      'living will',
      'where is my will',
    ],
  },
];

function sectionTitle(sectionId: string): string {
  return (
    VAULT_NAVIGATION.find(item => item.id === sectionId)?.title ||
    `Section ${sectionId}`
  );
}

function humanizeKey(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, ch => ch.toUpperCase())
    .trim();
}

function fileNameFromUnknown(file: unknown): string {
  if (!file || typeof file !== 'object') return '';
  const rec = file as Record<string, unknown>;
  for (const key of [
    'name',
    'fileName',
    'file_name',
    'original_filename',
    'originalFilename',
    'filename',
  ]) {
    const value = rec[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

export function extractUploadMeta(value: unknown): {
  text: string;
  fileNames: string[];
} {
  if (value == null) return { text: '', fileNames: [] };
  if (typeof value === 'string' || typeof value === 'number') {
    return { text: String(value).trim(), fileNames: [] };
  }
  if (typeof value !== 'object') return { text: '', fileNames: [] };
  const rec = value as Record<string, unknown>;
  const files = Array.isArray(rec.files) ? rec.files : [];
  const fileNames = files
    .map(fileNameFromUnknown)
    .filter(Boolean) as string[];
  const text = asPlain(rec.text ?? '');
  return { text, fileNames };
}

function queryTokens(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/[^\w\s'-]/g, ' ')
    .split(/\s+/)
    .map(token => token.trim())
    .filter(
      token =>
        token.length >= 3 &&
        !['the', 'and', 'for', 'my', 'our', 'your', 'where', 'find', 'have', 'got', 'did', 'put', 'file', 'doc', 'docs'].includes(
          token,
        ),
    );
}

function scorePhraseMatch(query: string, phrase: string): number {
  const q = query.toLowerCase();
  const p = phrase.toLowerCase().trim();
  if (!p) return 0;
  const escaped = p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  if (p.includes(' ')) {
    if (q.includes(p)) return 100 + p.length;
    const tokens = p.split(/\s+/).filter(Boolean);
    if (!tokens.length) return 0;
    const hitCount = tokens.filter(token => {
      if (token.length < 3) return q.includes(token);
      const tokenEscaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(`\\b${tokenEscaped}\\b`, 'i').test(q);
    }).length;
    if (hitCount === tokens.length && tokens.length > 1) return 80 + p.length;
    if (hitCount >= Math.ceil(tokens.length * 0.66) && tokens.length > 1) {
      return 40 + hitCount * 5;
    }
    return 0;
  }

  // Single-token phrases: avoid matching everyday words like "will" in
  // "what will happen".
  const ambiguous = new Set([
    'will',
    'card',
    'file',
    'title',
    'home',
    'deed',
    'paper',
    'papers',
  ]);
  if (ambiguous.has(p)) {
    if (
      !new RegExp(`\\b(my|our|the|a)\\s+${escaped}\\b`, 'i').test(q) &&
      !new RegExp(
        `\\b${escaped}\\s+(certificate|document|documents|papers|decree|card|deed)\\b`,
        'i',
      ).test(q)
    ) {
      return 0;
    }
    return 90 + p.length;
  }

  if (new RegExp(`\\b${escaped}\\b`, 'i').test(q)) return 70 + p.length;
  return 0;
}

function readFieldValue(
  formData: Record<string, unknown> | undefined,
  sectionId: string,
  subsection: string | undefined,
  fieldKey: string,
): unknown {
  if (!formData) return undefined;
  const section = formData[sectionId];
  if (!section || typeof section !== 'object') return undefined;
  const data = section as Record<string, unknown>;
  if (subsection && data[subsection] && typeof data[subsection] === 'object') {
    const bucket = data[subsection] as Record<string, unknown>;
    if (!Array.isArray(bucket)) return bucket[fieldKey];
  }
  // Flat / alternate shapes
  if (fieldKey in data) return data[fieldKey];
  for (const bucket of Object.values(data)) {
    if (!bucket || typeof bucket !== 'object') continue;
    if (Array.isArray(bucket)) {
      for (const item of bucket) {
        if (item && typeof item === 'object' && fieldKey in item) {
          return (item as Record<string, unknown>)[fieldKey];
        }
      }
    } else if (fieldKey in bucket) {
      return (bucket as Record<string, unknown>)[fieldKey];
    }
  }
  return undefined;
}

function matchCatalogEntries(query: string): Array<
  DocumentCatalogEntry & { score: number }
> {
  return VAULT_DOCUMENT_CATALOG.map(entry => {
    const best = Math.max(
      0,
      ...entry.synonyms.map(synonym => scorePhraseMatch(query, synonym)),
      scorePhraseMatch(query, entry.label),
      scorePhraseMatch(query, entry.fieldKey.replace(/_/g, ' ')),
    );
    return { ...entry, score: best };
  })
    .filter(entry => entry.score > 0)
    .sort((a, b) => b.score - a.score);
}

function walkUploadFields(
  formData: Record<string, unknown> | undefined,
  query: string,
): VaultDocumentHit[] {
  if (!formData) return [];
  const tokens = queryTokens(query);
  const hits: VaultDocumentHit[] = [];

  const visitField = (
    sectionId: string,
    subsection: string | undefined,
    fieldKey: string,
    value: unknown,
  ) => {
    if (
      /instruction|header|overview|_deleted/i.test(fieldKey) ||
      fieldKey.startsWith('_')
    ) {
      return;
    }
    const meta = extractUploadMeta(value);
    const hasContent = Boolean(meta.text || meta.fileNames.length);
    if (!hasContent) return;

    const label = humanizeKey(fieldKey);
    const haystack = [
      fieldKey.replace(/_/g, ' '),
      label,
      meta.text,
      ...meta.fileNames,
    ]
      .join(' ')
      .toLowerCase();

    let score = 0;
    for (const token of tokens) {
      if (haystack.includes(token)) score += 12;
    }
    for (const name of meta.fileNames) {
      score += scorePhraseMatch(query, name) / 4;
    }
    score += scorePhraseMatch(query, fieldKey.replace(/_/g, ' ')) / 2;
    if (score < 18) return;

    hits.push({
      sectionId,
      sectionTitle: sectionTitle(sectionId),
      subsection,
      fieldKey,
      label,
      locationNote: meta.text,
      fileNames: meta.fileNames,
      source: 'field',
      score,
    });
  };

  Object.entries(formData).forEach(([sectionId, raw]) => {
    if (!/^\d+$/.test(sectionId) || !raw || typeof raw !== 'object') return;
    const data = raw as Record<string, unknown>;
    Object.entries(data).forEach(([bucketKey, bucket]) => {
      if (Array.isArray(bucket)) {
        bucket.forEach(item => {
          if (!item || typeof item !== 'object') return;
          Object.entries(item as Record<string, unknown>).forEach(
            ([fieldKey, value]) => {
              visitField(sectionId, bucketKey, fieldKey, value);
            },
          );
        });
      } else if (bucket && typeof bucket === 'object') {
        Object.entries(bucket as Record<string, unknown>).forEach(
          ([fieldKey, value]) => {
            visitField(sectionId, bucketKey, fieldKey, value);
          },
        );
      } else {
        visitField(sectionId, undefined, bucketKey, bucket);
      }
    });
  });

  return hits;
}

function walkOtherLegalDocs(
  formData: Record<string, unknown> | undefined,
  query: string,
): VaultDocumentHit[] {
  if (!formData) return [];
  const section = formData['20'];
  if (!section || typeof section !== 'object') return [];
  const other = (section as Record<string, unknown>)['20C'];
  if (!Array.isArray(other)) return [];
  const hits: VaultDocumentHit[] = [];
  other.forEach((item, index) => {
    if (!item || typeof item !== 'object') return;
    const row = item as Record<string, unknown>;
    const docType = asPlain(row.document_type) || `Other document #${index + 1}`;
    const location = asPlain(row.document_location);
    const upload = extractUploadMeta(row.document_upload);
    const haystack = [docType, location, ...upload.fileNames].join(' ');
    const score = scorePhraseMatch(query, haystack) || scorePhraseMatch(query, docType);
    if (score < 40 && !queryTokens(query).some(t => haystack.toLowerCase().includes(t))) {
      return;
    }
    if (!upload.fileNames.length && !location && !asPlain(row.document_type)) {
      return;
    }
    hits.push({
      sectionId: '20',
      sectionTitle: sectionTitle('20'),
      subsection: '20C',
      fieldKey: 'document_upload',
      label: docType,
      locationNote: location,
      fileNames: upload.fileNames,
      source: 'field',
      score: Math.max(score, 50),
    });
  });
  return hits;
}

function walkUploadHistory(query: string): VaultDocumentHit[] {
  if (typeof window === 'undefined') return [];
  try {
    const history = listAiUploadHistory();
    return history
      .map(item => {
        const score = Math.max(
          scorePhraseMatch(query, item.fileName),
          ...queryTokens(query).map(token =>
            item.fileName.toLowerCase().includes(token) ? 25 : 0,
          ),
        );
        if (score < 25) return null;
        const sectionId =
          item.sectionIds?.[0] || item.sectionId || '20';
        return {
          sectionId: String(sectionId),
          sectionTitle: sectionTitle(String(sectionId)),
          fieldKey: 'ai_upload',
          label: item.fileName,
          locationNote: 'Found in your recent vault uploads',
          fileNames: [item.fileName],
          source: 'upload_history' as const,
          score,
        };
      })
      .filter(Boolean) as VaultDocumentHit[];
  } catch {
    return [];
  }
}

export function isLocateDocumentIntent(text: string): boolean {
  const lower = text.toLowerCase().trim();
  if (!lower) return false;

  const locateVerb =
    /\b(where(?:'s| is)|find|locate|look(?:ing)? for|do i have|have i(?:\s+\w+){0,3}\s+(?:uploaded|saved|stored|got|got a)|is there|show me my|get my|which section.{0,24}(put|upload|store|keep)|where did i)\b/.test(
      lower,
    );

  const catalogHit = matchCatalogEntries(lower).some(entry => entry.score >= 40);
  const docNoun =
    /\b(certificate|cert|license|licence|passport|will|deed|decree|ssn|social security|green card|title|registration|statement|policy|card|document|paperwork|papers|pdf|file|upload)\b/.test(
      lower,
    );

  if (locateVerb && (catalogHit || docNoun)) return true;
  // “my marriage certificate” without an explicit where/find still means locate.
  if (catalogHit && /\b(my|our|the)\b/.test(lower)) return true;
  return false;
}

export function collectVaultDocumentHits(
  query: string,
  formData?: Record<string, unknown>,
): VaultDocumentHit[] {
  const lower = query.toLowerCase().trim();
  const byKey = new Map<string, VaultDocumentHit>();

  const push = (hit: VaultDocumentHit) => {
    const key = `${hit.sectionId}:${hit.subsection || ''}:${hit.fieldKey}:${hit.label}`;
    const existing = byKey.get(key);
    if (!existing || hit.score > existing.score) byKey.set(key, hit);
  };

  for (const entry of matchCatalogEntries(lower)) {
    const value = readFieldValue(
      formData,
      entry.sectionId,
      entry.subsection,
      entry.fieldKey,
    );
    const meta = extractUploadMeta(value);
    const hasContent = Boolean(meta.text || meta.fileNames.length);
    push({
      sectionId: entry.sectionId,
      sectionTitle: sectionTitle(entry.sectionId),
      subsection: entry.subsection,
      fieldKey: entry.fieldKey,
      label: entry.label,
      locationNote: meta.text,
      fileNames: meta.fileNames,
      source: hasContent ? 'field' : 'catalog_empty',
      score: entry.score + (hasContent ? 40 : 0),
    });
  }

  walkUploadFields(formData, lower).forEach(push);
  walkOtherLegalDocs(formData, lower).forEach(push);
  walkUploadHistory(lower).forEach(push);

  return [...byKey.values()].sort((a, b) => b.score - a.score);
}

export function formatDocumentLocateReply(hits: VaultDocumentHit[]): {
  text: string;
  primarySectionId: string;
  primaryLabel: string;
  found: boolean;
} {
  const foundHits = hits.filter(
    hit =>
      hit.source !== 'catalog_empty' &&
      (hit.fileNames.length > 0 || hit.locationNote),
  );
  const emptyHints = hits.filter(hit => hit.source === 'catalog_empty');

  if (foundHits.length) {
    const top = foundHits[0];
    const lines = foundHits.slice(0, 4).map(hit => {
      const path = [
        hit.sectionTitle,
        hit.subsection ? hit.subsection : null,
        hit.label,
      ]
        .filter(Boolean)
        .join(' → ');
      const bits: string[] = [`• ${path}`];
      if (hit.fileNames.length) {
        hit.fileNames.slice(0, 3).forEach(name => {
          bits.push(`  ${name}`);
        });
      }
      if (hit.locationNote) {
        bits.push(`  Note: ${hit.locationNote}`);
      }
      return bits.join('\n');
    });
    return {
      found: true,
      primarySectionId: top.sectionId,
      primaryLabel: top.sectionTitle,
      text: `I found this in your vault:\n\n${lines.join('\n\n')}\n\nI can open that section so you can view or update the file.`,
    };
  }

  const hint = emptyHints[0] || hits[0];
  if (hint) {
    return {
      found: false,
      primarySectionId: hint.sectionId,
      primaryLabel: hint.sectionTitle,
      text: `I don’t see your ${hint.label.toLowerCase()} attached or noted in the vault yet.\n\nIt usually lives in ${hint.sectionTitle}${
        hint.subsection ? ` → ${hint.subsection}` : ''
      } → ${hint.label}.\n\nI can open that section, or you can upload the file and I’ll place it there.`,
    };
  }

  return {
    found: false,
    primarySectionId: '20',
    primaryLabel: sectionTitle('20'),
    text:
      'I couldn’t match that to a saved document yet.\n\nMany certificates and IDs live in Legal Documents & Records. Tell me the document name again, open Legal Documents, or upload the file and I’ll help place it.',
  };
}
