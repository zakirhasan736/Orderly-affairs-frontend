/**
 * After a first AI fill pass, find catalog fields that are still empty and
 * request a focused second extract for those keys only.
 */

import { unwrapAiAutofillPatch } from '@/utils/aiPatchNormalizer';
import type { FieldDefinition } from '@/types/formTypes';
import {
  DEPENDENT_EDUCATION_MUST_FILL_KEYS,
  IDENTITY_MUST_FILL_KEYS,
} from '@/utils/identityDocumentFields';

function isEmptyValue(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) {
    if (value.length === 0) return true;
    return value.every(item => isEmptyValue(item));
  }
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if ('text' in record || 'files' in record) {
      const text = typeof record.text === 'string' ? record.text.trim() : '';
      const files = Array.isArray(record.files) ? record.files : [];
      return !text && files.length === 0;
    }
    return Object.values(record).every(isEmptyValue);
  }
  return false;
}

/** Collect empty leaf keys under a patch / form object (dot paths flattened to last key). */
export function collectEmptyFieldKeys(
  target: unknown,
  candidateKeys: string[],
): string[] {
  const patch = unwrapAiAutofillPatch(target) || target;
  if (!patch || typeof patch !== 'object') {
    return [...candidateKeys];
  }

  const found = new Map<string, unknown>();

  const walk = (node: unknown) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    Object.entries(node as Record<string, unknown>).forEach(([key, value]) => {
      if (candidateKeys.includes(key)) {
        const prev = found.get(key);
        // Prefer a non-empty value if any card/object already filled this key.
        if (prev === undefined || isEmptyValue(prev)) {
          found.set(key, value);
        }
      }
      walk(value);
    });
  };

  walk(patch);

  return candidateKeys.filter(key => {
    if (!found.has(key)) return true;
    return isEmptyValue(found.get(key));
  });
}

/**
 * For identity cards: empty must-fill keys across identity_documents items.
 */
export function collectEmptyIdentityCardKeys(target: unknown): string[] {
  const patch = unwrapAiAutofillPatch(target) || target;
  if (!patch || typeof patch !== 'object') {
    return [...IDENTITY_MUST_FILL_KEYS];
  }

  const cards: Record<string, unknown>[] = [];
  const walk = (node: unknown) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      node.forEach(item => {
        if (item && typeof item === 'object' && !Array.isArray(item)) {
          const row = item as Record<string, unknown>;
          if (
            'document_type' in row ||
            'full_legal_name' in row ||
            'document_number' in row ||
            'assigned_to' in row
          ) {
            cards.push(row);
          }
        }
        walk(item);
      });
      return;
    }
    Object.entries(node as Record<string, unknown>).forEach(([key, value]) => {
      if (key === 'identity_documents' && Array.isArray(value)) {
        value.forEach(item => {
          if (item && typeof item === 'object') {
            cards.push(item as Record<string, unknown>);
          }
        });
      }
      walk(value);
    });
  };
  walk(patch);

  if (cards.length === 0) {
    // First pass may have put values on vital_info only — still ask for card keys.
    return collectEmptyFieldKeys(patch, [...IDENTITY_MUST_FILL_KEYS]);
  }

  const empty = new Set<string>();
  for (const card of cards) {
    for (const key of IDENTITY_MUST_FILL_KEYS) {
      if (key === 'assigned_to_name') {
        const assigned = String(card.assigned_to || '').trim();
        if (!assigned || assigned === 'Self') continue;
      }
      if (isEmptyValue(card[key])) empty.add(key);
    }
  }
  return [...empty];
}

export function mergePatchesFillEmptyOnly(
  primary: unknown,
  gap: unknown,
): Record<string, unknown> {
  const base = {
    ...((unwrapAiAutofillPatch(primary) ||
      (primary && typeof primary === 'object' ? primary : {})) as Record<
      string,
      unknown
    >),
  };
  const incoming = (unwrapAiAutofillPatch(gap) ||
    (gap && typeof gap === 'object' ? gap : {})) as Record<string, unknown>;

  const mergeNode = (
    current: unknown,
    next: unknown,
  ): unknown => {
    if (next === null || next === undefined || next === '') return current;
    if (Array.isArray(next)) {
      if (!Array.isArray(current) || current.length === 0) return next;
      const max = Math.max(current.length, next.length);
      const out: unknown[] = [];
      for (let i = 0; i < max; i += 1) {
        const curItem = current[i];
        const nextItem = next[i];
        if (!nextItem) {
          out.push(curItem);
        } else if (!curItem) {
          out.push(nextItem);
        } else if (
          typeof curItem === 'object' &&
          typeof nextItem === 'object' &&
          !Array.isArray(curItem) &&
          !Array.isArray(nextItem)
        ) {
          out.push(
            mergeNode(curItem, nextItem) as Record<string, unknown>,
          );
        } else {
          out.push(isEmptyValue(curItem) ? nextItem : curItem);
        }
      }
      return out;
    }
    if (typeof next === 'object' && !Array.isArray(next)) {
      const curObj =
        current && typeof current === 'object' && !Array.isArray(current)
          ? { ...(current as Record<string, unknown>) }
          : {};
      Object.entries(next as Record<string, unknown>).forEach(([key, value]) => {
        if (isEmptyValue(curObj[key])) {
          curObj[key] = mergeNode(curObj[key], value);
        } else if (
          curObj[key] &&
          typeof curObj[key] === 'object' &&
          value &&
          typeof value === 'object'
        ) {
          curObj[key] = mergeNode(curObj[key], value);
        }
      });
      return curObj;
    }
    return isEmptyValue(current) ? next : current;
  };

  return mergeNode(base, incoming) as Record<string, unknown>;
}

export function catalogKeysForGapPass(
  fields: Array<
    Pick<FieldDefinition, 'key' | 'type'> | { key: string; type?: string }
  >,
): string[] {
  return fields
    .map(f => f.key)
    .filter(
      key =>
        Boolean(key) &&
        !key.endsWith('_instructions') &&
        !key.endsWith('_header'),
    );
}

/**
 * Prefer client must-fill keys for identity / education targets so the second
 * AI pass focuses on fields stakeholders expect on the document record.
 */
export function resolveGapCandidateKeys(args: {
  sectionId: string;
  fieldCatalog: Array<{ key: string }>;
  primaryResult: unknown;
}): string[] {
  const catalogKeys = catalogKeysForGapPass(args.fieldCatalog);

  if (args.sectionId === '1' || args.sectionId === '20') {
    const identityEmpty = collectEmptyIdentityCardKeys(args.primaryResult);
    const catalogEmpty = collectEmptyFieldKeys(
      args.primaryResult,
      catalogKeys,
    );
    const ordered = [
      ...identityEmpty,
      ...catalogEmpty.filter(key => !identityEmpty.includes(key)),
    ];
    if (identityEmpty.length > 0) {
      return ordered.slice(0, Math.max(identityEmpty.length, 24));
    }
    return catalogEmpty.slice(0, 24);
  }

  if (args.sectionId === '17') {
    const educationKeys = [...DEPENDENT_EDUCATION_MUST_FILL_KEYS];
    const educationEmpty = collectEmptyFieldKeys(
      args.primaryResult,
      educationKeys,
    );
    const catalogEmpty = collectEmptyFieldKeys(
      args.primaryResult,
      catalogKeys,
    );
    return [
      ...educationEmpty,
      ...catalogEmpty.filter(key => !educationEmpty.includes(key)),
    ].slice(0, 24);
  }

  return collectEmptyFieldKeys(args.primaryResult, catalogKeys).slice(0, 32);
}
