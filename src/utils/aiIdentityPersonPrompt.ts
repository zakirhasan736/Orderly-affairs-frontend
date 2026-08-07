/**
 * Promise-based queue for the "Whose ID is this?" dialog.
 * Overview batch and section autofill can await a choice without owning UI state.
 */

import type { IdentityPersonChoice } from '@/utils/aiIdentityDocument';

export type IdentityPersonPromptDetail = {
  fileName?: string | null;
  documentSummary?: string | null;
  personName?: string | null;
  documentLabel?: string | null;
  /** identity = DL/passport; insurance = health card */
  kind?: 'identity' | 'insurance';
};

type QueueItem = {
  detail: IdentityPersonPromptDetail;
  resolve: (choice: IdentityPersonChoice | null) => void;
};

type Listener = (active: IdentityPersonPromptDetail | null) => void;

let queue: QueueItem[] = [];
let active: QueueItem | null = null;
const listeners = new Set<Listener>();

function notify() {
  const detail = active?.detail ?? null;
  listeners.forEach(listener => {
    try {
      listener(detail);
    } catch {
      /* ignore */
    }
  });
}

function pump() {
  if (active || !queue.length) {
    notify();
    return;
  }
  active = queue.shift() || null;
  notify();
}

export function subscribeIdentityPersonPrompt(listener: Listener): () => void {
  listeners.add(listener);
  listener(active?.detail ?? null);
  return () => {
    listeners.delete(listener);
  };
}

export function getActiveIdentityPersonPrompt(): IdentityPersonPromptDetail | null {
  return active?.detail ?? null;
}

/**
 * Ask the user where an identity document belongs.
 * Resolves to the choice, or null if dismissed / cancelled.
 */
export function promptIdentityDocumentPerson(
  detail: IdentityPersonPromptDetail,
): Promise<IdentityPersonChoice | null> {
  if (typeof window === 'undefined') {
    return Promise.resolve('self');
  }

  return new Promise(resolve => {
    queue.push({ detail, resolve });
    pump();
  });
}

export function resolveIdentityPersonPrompt(
  choice: IdentityPersonChoice | null,
): void {
  if (!active) return;
  const current = active;
  active = null;
  current.resolve(choice);
  pump();
}
